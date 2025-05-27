import GARAGE from "../../../models/garage.js";
import PICKUP_OPTION from "../../../models/availability/pickupOption.js";
import ALLOWED_VEHICLE_MODELS from "../../../models/availability/allowedVehicleModels.js";
import CUSTOMER_EXCEPTIONS_FOR_PICKUP from "../../../models/availability/customerExceptionsForPickup.js";
import Logger from "../../../middleware/logger.js";
import {
    badRequestResponse,
    internalServerErrorResponse,
    notFoundResponse,
    successResponse,
} from "../../../middleware/responses.js";
import { carApiAuth, getPagination, sortingQuery } from "../../../utils/common.js";
import { cloneDeep } from "../../../lib/commonQueries.js";
import mongoose from "mongoose";
const logger = new Logger(
    "garage/calendarSettings/pickupOptionSettingsController.js"
);

const updatePickupOptionSettings = async (req, res) => {
    try {
        logger.log("[UPDATE PICKUP OPTION SETTINGS] Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage)
            return badRequestResponse(res, { message: "Garage not found" });
        await PICKUP_OPTION.updateOne(
            { garage_id: _id },
            { $set: { ...req.body } },
            { upsert: true }
        );
        return successResponse(res, {
            message: "Pickup option updated successfully",
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }
};

const getPickupOptionSettings = async (req, res) => {
    try {
        logger.log("[GET PICKUP OPTION SETTINGS] Api Called");
        const pickupOption = await PICKUP_OPTION.findOne({
            garage_id: req.user._id,
        }).select("-garage_id");
        const defaultPickupOption = {
            earliest_pickup_time: {
                value: "",
                type: "days",
            },
            is_enabled: false,
            max_pickup_per_day: 2,
            max_distance_from_garage: 10,
            allowed_vehicle_years: {
                start_year: 1950,
                end_year: new Date().getFullYear(),
            },
            pickup_timeslots: [],
            allowed_customer_types: "all",
        }
        return successResponse(res, {
            message: "Pickup option fetched successfully",
            payload: { pickupOption: pickupOption || defaultPickupOption },
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }
};

const updateAllowedVehicleModels = async (req, res) => {
    try {
        logger.log("[UPDATE ALLOWED VEHICLE MODELS] Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage)
            return badRequestResponse(res, { message: "Garage not found" });
        const existingVehicleModels = await ALLOWED_VEHICLE_MODELS.find({
            garage_id: req.user._id,
        })
            .select("_id")
            .lean();

        const incomingConditionIds = req.body.allowed_vehicle_models
            .map((condition) =>
                condition._id ? new mongoose.Types.ObjectId(condition._id) : null
            )
            .filter((id) => id !== null);

        const conditionsToDelete = existingVehicleModels
            .filter(
                (condition) =>
                    !incomingConditionIds.some((id) => id.equals(condition._id))
            )
            .map((condition) => condition._id);

        const bulkOperations = [];

        req.body.allowed_vehicle_models.forEach((colorCondition) => {
            const { _id, ...allowedVehicleModelsWithoutID } = colorCondition;
            bulkOperations.push({
                updateOne: {
                    filter: {
                        _id: _id
                            ? new mongoose.Types.ObjectId(_id)
                            : new mongoose.Types.ObjectId(),
                        garage_id: req.user._id,
                    },
                    update: { $set: { ...allowedVehicleModelsWithoutID } },
                    upsert: true,
                },
            });
        });

        conditionsToDelete.forEach((conditionId) => {
            bulkOperations.push({
                deleteOne: {
                    filter: {
                        _id: conditionId,
                        garage_id: req.user._id,
                    },
                },
            });
        });

        if (bulkOperations.length > 0) {
            await ALLOWED_VEHICLE_MODELS.bulkWrite(bulkOperations);
        }
        return successResponse(res, {
            message: "Allowed vehicle models updated successfully",
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }
};

const getAllowedVehicleModels = async (req, res) => {
    try {
        logger.log("[GET ALLOWED VEHICLE MODELS] Api Called");
        const { _id } = req.user;
        const allowedVehicleModels = await ALLOWED_VEHICLE_MODELS.aggregate([
            {
                $facet: {
                    allowedVehicleModels: [
                        { $match: { garage_id: _id } },
                        { ...sortingQuery(req?.query?.sortBy, req?.query?.sortOrder) },
                        ...getPagination(req?.query?.page, req?.query?.limit),
                        { $unset: ["garage_id"] },
                    ],
                    total: [{ $match: { garage_id: _id } }, { $count: "total" }],
                },
            },
        ]);
        return successResponse(res, {
            message: "Allowed vehicle models fetched successfully",
            payload: {
                allowedVehicleModels:
                    cloneDeep(allowedVehicleModels)?.[0]?.allowedVehicleModels ?? [],
                total: cloneDeep(allowedVehicleModels)?.[0]?.total?.[0]?.total ?? 0,
            },
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }
};

const addCustomerException = async (req, res) => {
    try {
        logger.log("[ADD CUSTOMER EXCEPTION] Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) {
            return badRequestResponse(res, {
                message: "Garage not found",
            });
        }
        // Check for existing exception
        const existingException = await CUSTOMER_EXCEPTIONS_FOR_PICKUP.findOne({
            garage_id: _id,
            phone: req.body.phone,
        });
        if (existingException) {
            return badRequestResponse(res, {
                message: "Customer exception already exists for this phone number",
            });
        }
        // Create new exception
        const newException = new CUSTOMER_EXCEPTIONS_FOR_PICKUP({
            garage_id: _id,
            ...req.body,
        });
        // Save to database
        await newException.save();
        logger.log(
            `[ADD CUSTOMER EXCEPTION] Created exception ID: ${newException._id}`
        );
        return successResponse(res, {
            message: "Customer exception added successfully",
        });
    } catch (error) {
        logger.error(`[ADD CUSTOMER EXCEPTION ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user._id,
        });
        return internalServerErrorResponse(res, {
            message: "Failed to add customer exception",
        });
    }
};

const getCustomerException = async (req, res) => {
    try {
        logger.log("[GET CUSTOMER EXCEPTION SETTINGS] Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const { phone } = req.body;
        const phoneFilter = phone
            ? {
                phone: {
                    $regex: phone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                    $options: "i",
                },
            }
            : {};

        // Aggregate pipeline for customer exceptions
        const customerExceptions = await CUSTOMER_EXCEPTIONS_FOR_PICKUP.aggregate([
            {
                $facet: {
                    exceptions: [
                        {
                            $match: {
                                garage_id: _id,
                                ...phoneFilter,
                            },
                        },
                        ...getPagination(req?.query?.page, req?.query?.limit),
                        { $unset: ["garage_id"] },
                    ],
                    total: [
                        {
                            $match: {
                                garage_id: _id,
                                ...phoneFilter,
                            },
                        },
                        { $count: "total" },
                    ],
                },
            },
        ]);

        return successResponse(res, {
            message: "Customer exceptions fetched successfully",
            payload: {
                exceptions: cloneDeep(customerExceptions)?.[0]?.exceptions ?? [],
                total: cloneDeep(customerExceptions)?.[0]?.total?.[0]?.total ?? 0,
            },
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }
};

const deleteCustomerException = async (req, res) => {
    try {
        logger.log("[DELETE CUSTOMER EXCEPTION] Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const { exceptionId } = req.params;
        const isValidObjectID = mongoose.Types.ObjectId.isValid(exceptionId);
        if (!isValidObjectID)
            return badRequestResponse(res, { message: "Invalid exception id" });
        // Find and delete the exception
        const deletedException =
            await CUSTOMER_EXCEPTIONS_FOR_PICKUP.findOneAndDelete({
                garage_id: _id,
                _id: exceptionId,
            });
        if (!deletedException) {
            return notFoundResponse(res, {
                message: "Customer exception not found",
            });
        }
        return successResponse(res, {
            message: "Customer exception deleted successfully",
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Failed to delete customer exception",
        });
    }
};


const getCarMakes = async (req, res) => {
    try {
        logger.log("[GET CAR MAKES] Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const token = await carApiAuth();
        if (!token) {
            return badRequestResponse(res, { message: "Failed to retrieve authentication token from Car API" });
        }
        const makesApiUrl = 'https://carapi.app/api/makes';
        const makesResponse = await fetch(makesApiUrl, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const rawResponse = await makesResponse.text(); // Log raw response
        logger.log("Raw Makes Response:", rawResponse);

        if (!makesResponse.ok) {
            return notFoundResponse(res, {
                message: "Failed to fetch car makes",
            });
        }

        try {
            const carMakes = JSON.parse(rawResponse); // Parse only if valid JSON
            return successResponse(res, { message: "Car makes fetched successfully", payload: { carMakes } });
        } catch (parseError) {
            throw new Error(`Failed to parse car makes JSON: ${parseError.message} - Raw Response: ${rawResponse}`);
        }

    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, { message: "Something went wrong while fetching car makes" });
    }
};


const getCarModel = async (req, res) => {
    try {
        logger.log("[GET CAR MAKES] Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const token = await carApiAuth();
        if (!token) {
            return badRequestResponse(res, { message: "Failed to retrieve authentication token from Car API" });
        }
        const { make_id } = req.query;

        if (!make_id) {
            return badRequestResponse(res, { message: "make_id is required in the query parameters" });
        }
        const modelApiUrl = `https://carapi.app/api/models?make_id=${make_id}`;
        const modelResponse = await fetch(modelApiUrl, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        const rawResponse = await modelResponse.text(); // Log raw response
        logger.log("Raw Model Response:", rawResponse);

        if (!modelResponse.ok) {
            return notFoundResponse(res, {
                message: "Failed to fetch car Model",
            });
        }

        try {
            const carModel = JSON.parse(rawResponse); // Parse only if valid JSON
            return successResponse(res, { message: "Car Model fetched successfully", payload: { carModel } });
        } catch (parseError) {
            throw new Error(`Failed to parse car makes JSON: ${parseError.message} - Raw Response: ${rawResponse}`);
        }

    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, { message: "Something went wrong while fetching car Model" });
    }
};


const addToVehiclePickup = async (req, res) => {
    try {
        logger.log("[ADD TO BLACKLIST] API Called");

        const { _id } = req.user; // Get user ID from request
        const garage = await GARAGE.findById(_id);
        if (!garage) {
            return badRequestResponse(res, { message: "Garage not found" });
        }

        const { makes } = req.body; // Expecting an array of makes

        if (!makes || !Array.isArray(makes) || makes.length === 0) {
            return badRequestResponse(res, { message: "An array of makes is required." });
        }

        // Replace the existing `excluded_models` array with the new data
        const updatedExcludedModels = makes.map(({ make_id, make_name, models }) => {
            if (!make_id || !make_name || !models || !Array.isArray(models) || models.length === 0) {
                throw new Error("Invalid make or model data.");
            }
            return {
                make_id,
                make_name,
                models: models.map(({ model_id, model_name }) => ({ model_id, model_name })),
            };
        });

        // Update or create the document with the new `excluded_models` array
        await PICKUP_OPTION.updateOne(
            { garage_id: _id },
            { $set: { excluded_models: updatedExcludedModels } },
            { upsert: true }
        );

        return successResponse(res, {
            message: 'Vehicle models updated in blacklist successfully',
        });
    } catch (error) {
        logger.error(`[ADD TO BLACKLIST ERROR] ${error.message}`, { error });
        return internalServerErrorResponse(res, {
            message: 'Failed to update vehicle models in blacklist',
            error: error.message,
        });
    }
};

const getVehiclePickup = async (req, res) => {
    try {
        logger.log("[GET BLACKLISTED MODELS] API Called");

        const { _id } = req.user; // Get user ID from request
        const garage = await GARAGE.findById(_id);

        // Check if the garage exists
        if (!garage) {
            return badRequestResponse(res, { message: "Garage not found" });
        }

        let sortBy = req?.query?.sortBy;
        let sortOrder = req?.query?.sortOrder;

        // Call the sortingQuery function to generate the sorting stage
        const sortStage = sortingQuery(sortBy, sortOrder);

        const vehicleInfo = await PICKUP_OPTION.aggregate([
            {
                $match: {
                    garage_id: _id,
                },
            },
            {
                $unwind: "$excluded_models",
            },
            {
                $addFields: {
                    models_count: { $size: "$excluded_models.models" }, // Add models_count field
                },
            },
            {
                $project: {
                    excluded_models: 1,
                    models_count: 1, // Include models_count in the projection
                    _id: 0,
                },
            },
            sortStage, // Add the sorting stage from sortingQuery function
            ...getPagination(req?.query?.page, req?.query?.limit),
        ]);

        const totalCount = await PICKUP_OPTION.countDocuments({ garage_id: _id });

        return successResponse(res, {
            message: "Blacklisted models fetched successfully",
            payload: {
                excluded_models: vehicleInfo.map(info => ({
                    ...info.excluded_models,
                    models_count: info.models_count, // Add models count to the response
                })) || [],
                total: totalCount,
            },
        });

    } catch (error) {
        logger.error(`[GET BLACKLISTED MODELS ERROR] ${error.message}`, { error });
        return internalServerErrorResponse(res, {
            message: 'Failed to retrieve blacklisted models',
            error: error.message,
        });
    }
};

export default {
    updatePickupOptionSettings,
    getPickupOptionSettings,
    updateAllowedVehicleModels,
    getAllowedVehicleModels,
    addCustomerException,
    getCustomerException,
    deleteCustomerException,
    getCarMakes,
    getCarModel,
    addToVehiclePickup,
    getVehiclePickup

};

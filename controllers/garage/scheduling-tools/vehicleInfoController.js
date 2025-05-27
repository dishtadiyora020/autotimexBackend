
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
import GARAGE from "../../../models/garage.js";
import Logger from "../../../middleware/logger.js";
const logger = new Logger("garage/scheduling-tools/vehicleInfoController.js");
import VEHICLE_INFO from "../../../models/scheduling-tools/vehicleInfo.js";
import { getPagination, sortingQuery } from "../../../utils/common.js";



const createOrUpdateVehicleInfo = async (req, res) => {
    try {
        logger.log("[UPDATE VEHICLE INFO] API Called");

        const { _id } = req.user; // Get user ID from request
        const garage = await GARAGE.findById(_id); // Find garage by ID

        // Check if the garage exists
        if (!garage) {
            return badRequestResponse(res, { message: "Garage not found" });
        }

        // Extract years from request body
        const { serviced_years_start, serviced_years_end } = req.body;

        // Fetch existing vehicle info if years are not provided
        let existingVehicleInfo = null;
        if (serviced_years_start === undefined || serviced_years_end === undefined) {
            existingVehicleInfo = await VEHICLE_INFO.findOne({ garage_id: _id });
        }

        // If years are not provided, use existing values from database
        const startYear = serviced_years_start !== undefined ? serviced_years_start : existingVehicleInfo?.serviced_years_start;
        const endYear = serviced_years_end !== undefined ? serviced_years_end : existingVehicleInfo?.serviced_years_end;

        // Validate that serviced_years_start is less than or equal to serviced_years_end
        if (startYear !== undefined && endYear !== undefined) {
            if (startYear > endYear) {
                return badRequestResponse(res, {
                    message: '"serviced_years_start" must not exceed "serviced_years_end"'
                });
            }
        }

        // Update or create vehicle info record
        const vehicleInfo = await VEHICLE_INFO.updateOne(
            { garage_id: _id },
            { $set: { ...req.body, serviced_years_start: startYear, serviced_years_end: endYear } },
            { upsert: true, new: true }
        );

        return successResponse(res, {
            message: 'Vehicle info updated successfully',
        });
    } catch (error) {
        logger.error(`[UPDATE VEHICLE INFO ERROR] ${error.message}`, { error });

        return internalServerErrorResponse(res, {
            message: 'Failed to update vehicle info record',
            error: error.message,
        });
    }
};
const getVehicleInfo = async (req, res) => {
    try {
        logger.log("[GET VEHICLE INFO]  Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })

        let VEHICLE = await VEHICLE_INFO.findOne({ garage_id: _id });

        const requiredFields = {
            serviced_years_end: VEHICLE?.serviced_years_end,
            serviced_years_start: VEHICLE?.serviced_years_start,
            show_license_plate_field: VEHICLE?.show_license_plate_field,
            show_vin_field: VEHICLE?.show_vin_field
        };
        return successResponse(res, {
            message: "Vehicle info fetched successfully",
            payload: {
                requiredFields
            },
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }
};

const addToBlacklist = async (req, res) => {
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
        await VEHICLE_INFO.updateOne(
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

const getBlacklistedModels = async (req, res) => {
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

        const vehicleInfo = await VEHICLE_INFO.aggregate([
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

        const totalCount = await VEHICLE_INFO.countDocuments({ garage_id: _id });

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





export default { createOrUpdateVehicleInfo, addToBlacklist, getBlacklistedModels, getVehicleInfo }
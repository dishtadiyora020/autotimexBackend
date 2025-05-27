import SERVICE from "../../../models/availability/serviceModels.js";
import SERVICE_SCHEDULER from "../../../models/availability/serviceSchedulerModels.js";
import Logger from "../../../middleware/logger.js";
import GARAGE from "../../../models/garage.js";
import {
    badRequestResponse,
    internalServerErrorResponse,
    notFoundResponse,
    successResponse,
} from "../../../middleware/responses.js";
import { getPagination, sortingQuery } from "../../../utils/common.js";
import { cloneDeep } from "../../../lib/commonQueries.js";
const logger = new Logger(
    "garage/calendarSettings/serviceController.js"
);
import mongoose from "mongoose";

const addServiceSettings = async (req, res) => {
    try {
        logger.log("[ADD SERVICE] API Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        // Check for existing service
        const existingService = await SERVICE.findOne({
            name: req.body.name.trim(),
            garage_id: _id
        });

        if (existingService) {
            return badRequestResponse(res, {
                message: "Service with this name already exists for your garage",
            });
        }
        // Create new exception
        const newService = new SERVICE({
            garage_id: _id,
            ...req.body,
        });
        // Save to database
        await newService.save();

        return successResponse(res, {
            message: "Service added successfully",
        });

    } catch (error) {

        logger.error(`[ADD SERVICE ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id
        });
        return internalServerErrorResponse(res, {
            message: "Failed to add service",
        });
    }
};

const getServiceSettings = async (req, res) => {
    try {
        logger.log("[GET SERVICE]  Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const services = await SERVICE.aggregate([
            {
                $facet: {
                    services: [
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
            message: "Services fetched successfully",
            payload: {
                services:
                    cloneDeep(services)?.[0]?.services ?? [],
                total: cloneDeep(services)?.[0]?.total?.[0]?.total ?? 0,
            },
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }

};

const deleteServiceSettings = async (req, res) => {
    try {
        logger.log("[DELETE SERVICE]  Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const { serviceId } = req.params;
        const isValidObjectID = mongoose.Types.ObjectId.isValid(serviceId);
        if (!isValidObjectID)
            return badRequestResponse(res, { message: "Invalid service id" });
        // Find and delete the service
        const deletedService =
            await SERVICE.findOneAndDelete({
                garage_id: _id,
                _id: serviceId,
            });
        if (!deletedService) {
            return notFoundResponse(res, {
                message: "service not found",
            });
        }
        return successResponse(res, {
            message: "Service deleted successfully",
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Failed to delete service",
        });
    }
};

const updateServiceSettings = async (req, res) => {
    try {
        logger.log("[UPDATE SERVICE SETTINGS] API Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        // Check if the service exists
        const existingService = await SERVICE.findOne({ garage_id: _id, _id: req.params.serviceId });
        if (!existingService) {
            return badRequestResponse(res, { message: "Service not found for your garage" });
        }
        // Update the service scheduler
        Object.assign(existingService, req.body);

        // Save updated service scheduler to database
        await existingService.save();

        return successResponse(res, {
            message: "Service settings updated successfully",
        });
    } catch (error) {
        logger.error(`[UPDATE SERVICE SETTINGS ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id,
        });
        return internalServerErrorResponse(res, {
            message: "Failed to update service settings",
        });
    }
};
const getServiceSettingsById = async (req, res) => {
    try {
        logger.log("[GET SERVICE BY ID] API Called");
        const { _id } = req.user;
        const { serviceId } = req.params;
        const service = await SERVICE.findOne({ _id: serviceId, garage_id: _id });

        if (!service) {
            return badRequestResponse(res, {
                message: "Service  not found for your garage"
            });
        }
        return successResponse(res, {
            message: "Service  fetched successfully",
            payload: service
        });
    } catch (error) {
        logger.error(`[GET SERVICE BY ID ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id
        });
        return internalServerErrorResponse(res, {
            message: "Failed to fetch Service"
        });
    }
};


//service Scheduler modes

const addServiceScheduler = async (req, res) => {
    try {
        logger.log("[ADD SERVICE SCHEDULER] API Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        // Create new service scheduler instance
        const serviceIds = req.body.services;
        const services = await SERVICE.find({ _id: { $in: serviceIds } }); if (services.length !== serviceIds.length) {
            return badRequestResponse(res, { message: "One or more service IDs are invalid" });
        }
        const newServiceScheduler = new SERVICE_SCHEDULER({
            garage_id: _id,
            services: serviceIds,
            ...req.body
        });

        // Save to database
        await newServiceScheduler.save();

        logger.log(`[ADD SERVICE SCHEDULER] Created scheduler ID: ${newServiceScheduler._id}`);
        return successResponse(res, {
            message: "Service scheduler added successfully"
        });

    } catch (error) {
        logger.error(`[ADD SERVICE SCHEDULER ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id
        });
        return internalServerErrorResponse(res, {
            message: "Failed to add service scheduler",
        });
    }
};
const getServiceScheduler = async (req, res) => {
    try {
        logger.log("[GET SERVICE SCHEDULER]  Api Called");
        const { _id } = req.user;
        const services = await SERVICE_SCHEDULER.aggregate([
            {
                $match: { garage_id: _id } 
            },
            {
                $lookup: {
                  from: 'services',
                    localField: 'services', 
                    foreignField: '_id', 
                    as: 'serviceDetails'
                }
            },
            {
                $unwind: {
                    path: '$serviceDetails',
                    preserveNullAndEmptyArrays: true 
                }
            },
            {
                $group: {
                    _id: '$_id', 
                    garage_id: { $first: '$garage_id' },
                    appointment_type: { $first: '$appointment_type' },
                    mode: { $first: '$mode' },
                    calendar_note: { $first: '$calendar_note' },
                    services: { $push: '$serviceDetails' } 
                }
            },
            ...getPagination(req?.query?.page, req?.query?.limit), 
            {
                $project: {
                    garage_id: 1,
                    appointment_type: 1,
                    mode: 1,
                    calendar_note: 1,
                    services: {
                        $map: {
                            input: '$services',
                            as: 'service',
                            in: {
                                _id: '$$service._id',
                                name: '$$service.name' 
                            }
                        }
                    }
                }
            }
        ]);

        const totalCount = await SERVICE_SCHEDULER.countDocuments({ garage_id: _id });
        return successResponse(res, {
            message: "Services Scheduler fetched successfully",
            payload: {
                services,
                total: totalCount,
            },
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }

};
const deleteServiceScheduler = async (req, res) => {
    try {
        logger.log("[DELETE SERVICE SCHEDULER]  Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const { schedulerId } = req.params;
        const isValidObjectID = mongoose.Types.ObjectId.isValid(schedulerId);
        if (!isValidObjectID)
            return badRequestResponse(res, { message: "Invalid schedulerId id" });
        // Find and delete the service
        const deletedService =
            await SERVICE_SCHEDULER.findOneAndDelete({
                garage_id: _id,
                _id: schedulerId,
            });
        if (!deletedService) {
            return notFoundResponse(res, {
                message: "service scheduler not found",
            });
        }
        return successResponse(res, {
            message: "scheduler Service deleted successfully",
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Failed to delete scheduler service",
        });
    }
};
const updateServiceScheduler = async (req, res) => {
    try {
        logger.log("[UPDATE SERVICE SCHEDULER] API Called");
        const { _id } = req.user;
        const { schedulerId } = req.params; // Assuming scheduler ID is in the URL

        // Find the service scheduler
        const existingScheduler = await SERVICE_SCHEDULER.findOne({
            _id: schedulerId,
            garage_id: _id
        });

        if (!existingScheduler) {
            return badRequestResponse(res, {
                message: "Service scheduler not found for your garage"
            });
        }
        const serviceIds = req.body.services;
        const services = await SERVICE.find({ _id: { $in: serviceIds } }); if (services.length !== serviceIds.length) {
            return badRequestResponse(res, { message: "One or more service IDs are invalid" });
        }
        // Update the service scheduler
        Object.assign(existingScheduler, req.body);

        // Save updated service scheduler to database
        await existingScheduler.save();

        logger.log(`[UPDATE SERVICE SCHEDULER] Updated scheduler ID: ${existingScheduler._id}`);
        return successResponse(res, {
            message: "Service scheduler updated successfully",
        });

    } catch (error) {
        logger.error(`[UPDATE SERVICE SCHEDULER ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id
        });
        return internalServerErrorResponse(res, {
            message: "Failed to update service scheduler"
        });
    }
};

const getServiceSchedulerById = async (req, res) => {
    try {
        logger.log("[GET SERVICE SCHEDULER BY ID] API Called");
        const { _id } = req.user; 
        const { schedulerId } = req.params;

        // Find the service scheduler by ID and garage_id, and populate service details
        const serviceScheduler = await SERVICE_SCHEDULER.findOne({ _id: schedulerId, garage_id: _id })
            .populate('services', 'name')

        if (!serviceScheduler) {
            return badRequestResponse(res, {
                message: "Service Scheduler not found for your garage"
            });
        }

        return successResponse(res, {
            message: "Service Scheduler fetched successfully",
            payload: {
                ...serviceScheduler.toObject(), // Convert Mongoose document to plain object
                services: serviceScheduler.services.map(service => ({
                    _id: service._id,
                    name: service.name // Include service name in the response
                }))
            }
        });
    } catch (error) {
        logger.error(`[GET SERVICE SCHEDULER BY ID ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id
        });
        return internalServerErrorResponse(res, {
            message: "Failed to fetch Service Scheduler"
        });
    }
};

export default {
    addServiceSettings,
    getServiceSettings,
    deleteServiceSettings,
    updateServiceSettings,
    getServiceSettingsById,
    addServiceScheduler,
    getServiceScheduler,
    deleteServiceScheduler,
    updateServiceScheduler,
    getServiceSchedulerById
};

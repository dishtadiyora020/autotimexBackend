import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
import CAPACITY_BLOCKER from "../../../models/availability/capacityBlockerModels.js";
import Logger from "../../../middleware/logger.js";
import GARAGE from "../../../models/garage.js";
import SERVICE from "../../../models/availability/serviceModels.js";
import mongoose from "mongoose";
import { getPagination, sortingQuery } from "../../../utils/common.js";
import { cloneDeep } from "../../../lib/commonQueries.js";
const logger = new Logger(
    "garage/calendarSettings/capacityBlockerController.js"
);

const addCapacityBlocker = async (req, res) => {
    try {
        logger.log("[ADD CAPACITY BLOCKER] Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        // Create a new capacity blocker instance
        const { services } = req.body;
        if (services && services.length > 0) {
            const validServices = await SERVICE.find({ _id: { $in: services } });
            if (validServices.length !== services.length) {
                return badRequestResponse(res, { message: "One or more service IDs are invalid" });
            }
        }
        const newBlocker = new CAPACITY_BLOCKER({
            garage_id: req.user._id,
            ...req.body,
        });

        // Save the new blocker to the database
        await newBlocker.save();

        return successResponse(res, { message: 'Capacity blocker added successfully', data: newBlocker });
    } catch (error) {
        return internalServerErrorResponse(res, { message: 'Failed to add capacity blocker', error: error.message });
    }
};

const getCapacityBlocker = async (req, res) => {
    try {
        logger.log("[GET CAPACITY BLOCKER] API Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        const { block_type, min_date, max_date } = req.body;
        const dateFilter = {};
        if (min_date) dateFilter.$gte = new Date(min_date);
        if (max_date) dateFilter.$lte = new Date(max_date);

        const filter = {
            garage_id: _id,
            ...(block_type && { block_type }),
            ...(Object.keys(dateFilter).length && { created_at: dateFilter })
        };

        // Aggregate pipeline for capacity blockers
        const capacityBlocker = await CAPACITY_BLOCKER.aggregate([
            {
                $match: filter
            },
            {
                $match: {
                    block_type: { $ne: "calendar_note" }
                }
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
                $project: {
                    _id: 1,
                    is_enable: 1,
                    block_type: 1,
                    days_of_week: 1,
                    start_time: 1,
                    end_time: 1,
                    max_scheduled_hours: 1,
                    max_scheduled_minutes: 1,
                    Max_booking: 1,
                    start_on: 1,
                    end_on: 1,
                    block_reason: 1,
                    apply_to_appointment_types: 1,
                    apply_to_customer_types: 1,
                    block_internal_notes: 1,
                    selected_holiday: 1,
                    use_business_hours: 1,
                    block_for_days: 1,
                    block_after_days: 1,
                    created_at: 1,
                    updated_at: 1,
                    services: {
                        $map: {
                            input: '$serviceDetails',
                            as: 'service',
                            in: {
                                _id: '$$service._id',
                                name: '$$service.name'
                            }
                        }
                    }
                }
            },
            {
                $facet: {
                    blocker: [
                        ...getPagination(req?.query?.page, req?.query?.limit),
                        { ...sortingQuery(req?.query?.sortBy, req?.query?.sortOrder) },
                        { $unset: ["garage_id"] }
                    ],
                    total: [
                        { $count: "total" }
                    ]
                }
            }
        ]);

        return successResponse(res, {
            message: "Capacity Blockers fetched successfully",
            payload: {
                blocker: cloneDeep(capacityBlocker)?.[0]?.blocker ?? [],
                total: cloneDeep(capacityBlocker)?.[0]?.total?.[0]?.total ?? 0,
            },
        });
    } catch (error) {
        logger.error(`[GET CAPACITY BLOCKER ERROR] ${error.message}`, { error });
        return internalServerErrorResponse(res, {
            message: "Failed to fetch capacity blockers",
            error: error.message
        });
    }
};

const updateCapacityBlocker = async (req, res) => {
    try {
        logger.log("[UPDATE CAPACITY BLOCKER] API Called");
        const { _id } = req.user;
        const { blockerId } = req.params; // Assuming blockerId is passed as a route parameter
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        // Check if the capacity blocker exists
        const existingBlocker = await CAPACITY_BLOCKER.findById(blockerId);
        if (!existingBlocker) return badRequestResponse(res, { message: "Capacity Blocker not found" });

        const { services } = req.body;
        if (services && services.length > 0) {
            const validServices = await SERVICE.find({ _id: { $in: services } });
            if (validServices.length !== services.length) {
                return badRequestResponse(res, { message: "One or more service IDs are invalid" });
            }
        }
        Object.assign(existingBlocker, req.body);

        // Save the updated blocker to the database
        await existingBlocker.save();

        return successResponse(res, { message: 'Capacity blocker updated successfully' });
    } catch (error) {
        logger.error(`[UPDATE CAPACITY BLOCKER ERROR] ${error.message}`, { error: error.stack });
        return internalServerErrorResponse(res, { message: 'Failed to update capacity blocker', error: error.message });
    }
};

const getCapacityBlockerById = async (req, res) => {
    try {
        logger.log("[GET CAPACITY BLOCKER BY ID] API Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        const { blockerId } = req.params;

        // Find the capacity blocker by ID
        const capacityBlocker = await CAPACITY_BLOCKER.findOne({
            _id: blockerId,
            garage_id: _id
        }).populate({
            path: 'services',
            select: 'name'
        });

        if (!capacityBlocker) {
            return badRequestResponse(res, { message: "Capacity Blocker not found" });
        }

        return successResponse(res, {
            message: "Capacity Blocker fetched successfully",
            payload: { blocker: capacityBlocker }
        });
    } catch (error) {
        logger.error(`[GET CAPACITY BLOCKER BY ID ERROR] ${error.message}`, { error: error.stack });
        return internalServerErrorResponse(res, {
            message: "Failed to fetch capacity blocker",
            error: error.message
        });
    }
};

const deleteCapacityBlocker = async (req, res) => {
    try {
        logger.log("[DELETE CAPACITY BLOCKER ] Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const { blockerId } = req.params;
        const isValidObjectID = mongoose.Types.ObjectId.isValid(blockerId);
        if (!isValidObjectID)
            return badRequestResponse(res, { message: "Invalid blockerId id" });
        // Find and delete the exception
        const deletedCapacityBlocker =
            await CAPACITY_BLOCKER.findOneAndDelete({
                garage_id: _id,
                _id: blockerId,
            });
        if (!deletedCapacityBlocker) {
            return notFoundResponse(res, {
                message: "Capacity Blocker not found",
            });
        }
        return successResponse(res, {
            message: "Capacity Blocker deleted successfully",
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Failed to delete Capacity Blocker",
        });
    }
};

export default { addCapacityBlocker, getCapacityBlocker, updateCapacityBlocker, getCapacityBlockerById, deleteCapacityBlocker }
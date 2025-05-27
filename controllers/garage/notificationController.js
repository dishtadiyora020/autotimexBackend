import mongoose from "mongoose";
import GARAGE_SETTINGS from "../../models/garageSettings.js"
import NOTIFICATION_KEYS from "../../models/notificationKeys.js"
import NOTIFICATION from "../../models/notification.js"
import SERVICE from "../../models/availability/serviceModels.js";
import GARAGE from "../../models/garage.js"
import APPOINTMENT from "../../models/appointment.js"
import Logger from "../../middleware/logger.js";
import { internalServerErrorResponse, successResponse } from "../../middleware/responses.js";
const logger = new Logger("garage/notificationController.js")
import { getPagination, sortingQuery } from "../../utils/common.js";
import { cloneDeep } from "../../lib/commonQueries.js";


const updateNotificationSettings = async (req, res) => {
    try {
        logger.log("[UPDATE GARAGE NOTIFICATION SETTINGS] Api Called")
        const { _id } = req.user
        await GARAGE_SETTINGS.updateOne({ garage_id: _id }, { $set: { email_notifications: req.body.email_notifications, notifications: req.body.notifications } }, { upsert: true })
        return successResponse(res, { message: "Notification settings updated successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getNotificationSettings = async (req, res) => {
    try {
        logger.log("[GET GARAGE NOTIFICATION SETTINGS] Api Called")
        const { _id } = req.user
        const garageSettings = await GARAGE_SETTINGS.findOne({ garage_id: _id })
        return successResponse(res, {
            payload: {
                email_notifications: garageSettings.email_notifications,
                notifications: garageSettings.notifications
            }, message: "Notification settings get successfully"
        })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}
const getNotificationKeys = async (req, res) => {
    try {
        logger.log("[GET NOTIFICATION KEYS] Api Called");
        const notificationKeys = await NOTIFICATION_KEYS.find();
        return successResponse(res, { payload: notificationKeys, message: "Notification keys fetched successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}



///notification

// Helper Functions
 export const processServiceArray = (input) => {
    if (!input) return [];

    // Handle both array and string cases
    const rawItems = Array.isArray(input)
        ? input.flatMap(item => item.split(','))
        : String(input).split(',');

    return rawItems
        .map(item => item.trim())
        .filter(item => isValidObjectId(item));
};

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

export const getServiceNames = async (serviceIds) => {
    if (serviceIds.length === 0) return [];

    try {
        const services = await SERVICE.find(
            { _id: { $in: serviceIds } },
            { name: 1 }
        ).lean();

        // Create strict ID-to-Name mapping
        const serviceMap = {};
        services.forEach(service => {
            serviceMap[service._id.toString()] = service.name;
        });
        return serviceIds.map(id => serviceMap[id]).filter(Boolean);

    } catch (err) {
        logger.error(`Service fetch error: ${err.message}`);
        return []; // Return empty array on error
    }
};
export const getService = async (serviceIds) => {
    if (!Array.isArray(serviceIds)) return [];
    if (serviceIds.length === 0) return [];

    try {
        // Convert to valid ObjectIds
        const validIds = serviceIds.map(id => {
            try {
                return new mongoose.Types.ObjectId(id);
            } catch {
                logger.error(`Invalid service ID: ${id}`);
                return null;
            }
        }).filter(Boolean);

        // Fetch services
        const services = await SERVICE.find({
            _id: { $in: validIds }
        }).lean();

        // Create lookup map
        const serviceMap = new Map();
        services.forEach(service => {
            serviceMap.set(service._id.toString(), service);
        });

        // Return only found services
        return serviceIds.reduce((result, id) => {
            try {
                const service = serviceMap.get(id.toString());
                if (service) result.push(service);
            } catch {
                logger.error(`Invalid ID processing: ${id}`);
            }
            return result;
        }, []);

    } catch (err) {
        logger.error(`Service fetch failed: ${err.message}`);
        return [];
    }
};


const getNotification = async (req, res) => {
    try {
        logger.log("[GET NOTIFICATION KEYS] Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const { status, phone, first_name, last_name, notification_min_date,
            notification_max_date,
            appointment_min_date,
            appointment_max_date } = req.body;

        const matchConditions = [];


        if (status) {
            matchConditions.push({ "status": status });
        }

        if (phone) {
            matchConditions.push({ "appointment.user.phone": { $regex: phone, $options: "i" } });
        }

        if (first_name) {
            matchConditions.push({ "appointment.user.first_name": { $regex: first_name, $options: "i" } });
        }

        if (last_name) {
            matchConditions.push({ "appointment.user.last_name": { $regex: last_name, $options: "i" } });
        }
        if (notification_min_date || notification_max_date) {
            const notifyDateFilter = {};
            if (notification_min_date) notifyDateFilter.$gte = new Date(notification_min_date);
            if (notification_max_date) notifyDateFilter.$lte = new Date(notification_max_date);
            matchConditions.push({ createdAt: notifyDateFilter });
        }

        // 🔹 Appointment date filter
        if (appointment_min_date || appointment_max_date) {
            const appDateFilter = {};
            if (appointment_min_date) appDateFilter.$gte = new Date(appointment_min_date);
            if (appointment_max_date) appDateFilter.$lte = new Date(appointment_max_date);
            matchConditions.push({ "appointment.start_time": appDateFilter });
        }

        const pipeline = [
            // Join appointment
            {
                $match: {
                    garage_id: _id
                }
            },
            {
                $lookup: {
                    from: "appointments",
                    localField: "appointment_id",
                    foreignField: "_id",
                    as: "appointment"
                }
            },
            { $unwind: { path: "$appointment", preserveNullAndEmptyArrays: true } },

            // Join user
            {
                $lookup: {
                    from: "users",
                    localField: "appointment.user",
                    foreignField: "_id",
                    as: "appointment.user"
                }
            },
            { $unwind: { path: "$appointment.user", preserveNullAndEmptyArrays: true } },

            // Join vehicle
            {
                $lookup: {
                    from: "vehicles",
                    localField: "appointment.vehicle",
                    foreignField: "_id",
                    as: "appointment.vehicle"
                }
            },
            { $unwind: { path: "$appointment.vehicle", preserveNullAndEmptyArrays: true } },

            // Conditionally apply filters
            ...(matchConditions.length > 0 ? [{ $match: { $and: matchConditions } }] : []),

            // Facet for pagination and total count
            {
                $facet: {
                    data: [
                        { ...sortingQuery(req?.query?.sortBy, req?.query?.sortOrder) },
                        ...getPagination(req?.query?.page, req?.query?.limit)
                    ],
                    total: [
                        { $count: "count" }
                    ]
                }
            }
        ];

        const result = await NOTIFICATION.aggregate(pipeline);

        const notifications = result[0]?.data || [];

        // Optional: Post-process service field
        for (const notification of notifications) {
            const serviceData = notification?.appointment?.service;
            const serviceIds = processServiceArray(serviceData);
            notification.appointment.service = await getServiceNames(serviceIds);
        }

        return successResponse(res, {
            payload: {
                notifications: cloneDeep(result)?.[0]?.data ?? [],
                total: cloneDeep(result)?.[0]?.total?.[0]?.count ?? 0,
                currentPage: page,
                totalPages: Math.ceil((cloneDeep(result)?.[0]?.total?.[0]?.count ?? 0) / limit)
            },
            message: "Notifications fetched successfully"
        });

    } catch (error) {
        logger.error("Controller Error:", error);
        return internalServerErrorResponse(res, {
            message: "Failed to process notifications"
        });
    }
};


const getNotificationById = async (req, res) => {
    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return badRequestResponse(res, { message: "Invalid notification ID format" });
        }

        const notification = await NOTIFICATION.findById(id)
            .populate({
                path: 'appointment_id',
                populate: [
                    {
                        path: 'user',
                    },
                    {
                        path: 'vehicle',
                    },
                    {
                        path: 'color_option',
                    },
                    {
                        path: 'service_advisor',
                    },
                    {
                        path: 'technician',
                    },
                    {
                        path: 'job_label',
                    },
                    {
                        path: 'progress_percentage',
                    }
                ]
            })
            .lean();

        if (!notification) {
            return notFoundResponse(res, { message: "Notification not found" });
        }
        if (notification.appointment_id?.service) {
            const serviceIds = processServiceArray(notification.appointment_id.service);
            notification.appointment_id.service = await getService(serviceIds);
        }

        return successResponse(res, {
            payload: notification,
            message: "Notification fetched successfully"
        });

    } catch (error) {
        logger.error(`ID: ${req.params.id} Error: ${error.message}`);
        return internalServerErrorResponse(res, {
            message: "Failed to fetch notification"
        });
    }
};


const updateAppointmentFromNotification = async (req, res) => {
    try {
        logger.log("[UPDATE APPOINTMENT FROM NOTIFICATION] API Called");

        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const { notification_id } = req.params;
        const {
            color_option,
            start_time,
            end_time,
            service_advisor,
            service_advisor_notes,
            progress_percentage,
            technician,
            job_label,
            is_arrived
        } = req.body;

        const notification = await NOTIFICATION.findById(notification_id);
        if (!notification) {
            return notFoundResponse(res, { message: "Notification not found" });
        }

        // 🔍 Find Appointment via appointment_id in Notification
        const appointment = await APPOINTMENT.findById(notification.appointment_id);
        if (!appointment) {
            return notFoundResponse(res, { message: "Appointment not found" });
        }
        if (color_option) appointment.color_option = color_option;
        if (start_time) appointment.start_time = start_time;
        if (end_time) appointment.end_time = end_time;
        if (service_advisor) appointment.service_advisor = service_advisor;
        if (service_advisor_notes !== undefined) appointment.service_advisor_notes = service_advisor_notes;
        if (progress_percentage) appointment.progress_percentage = progress_percentage;
        if (technician) appointment.technician = technician;
        if (job_label) appointment.job_label = job_label;
        if (is_arrived !== undefined) appointment.is_arrived = is_arrived;

        await appointment.save();
        return successResponse(res, {
            payload: appointment,
            message: "Appointment updated successfully via notification"
        });

    } catch (error) {
        logger.error("Controller Error:", error);
        return internalServerErrorResponse(res, {
            message: "Failed to update appointment"
        });
    }

};
const deleteAppointment = async (req, res) => {
    try {
        logger.log("[DELETE APPOINTMENT FROM NOTIFICATION] API Called");

        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const { appointment_id } = req.params;

        const appointment = await APPOINTMENT.findById(appointment_id);
        if (!appointment) {
            return notFoundResponse(res, { message: "Appointment not found" });
        }

        appointment.is_deleted = true;
        await appointment.save();

        return successResponse(res, {
            payload: appointment,
            message: "Appointment deleted successfully via notification"
        });

    } catch (error) {
        logger.error("Controller Error:", error);
        return internalServerErrorResponse(res, {
            message: "Failed to delete appointment"
        });
    }
};

export default { updateNotificationSettings, getNotificationSettings, getNotificationKeys, getNotification, getNotificationById, updateAppointmentFromNotification, deleteAppointment }
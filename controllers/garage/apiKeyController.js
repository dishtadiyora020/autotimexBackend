import GARAGE from "../../models/garage.js"
import API_KEYS from "../../models/apiKeys.js"
import LEADS from "../../models/leads.js"
import APPOINTMENTS from "../../models/appointment.js"
import NOTIFICATION from "../../models/notification.js"
import Logger from "../../middleware/logger.js";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../middleware/responses.js";
const logger = new Logger("garage/apiKeyController.js")

const getApiKey = async (req, res) => {
    try {
        logger.log("[GET API KEY] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id).lean().select('-status -propel_auth_org_id -propel_auth_owner_id -members')
        if (!garage) {
            return badRequestResponse(res, { message: "Garage not found" })
        }
        const apiKey = await API_KEYS.findOne({ garage_id: _id })
        return successResponse(res, { message: "Garage info fetched successfully", payload: { apiKey: apiKey?.api_key ?? null } })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}
const getGarageStats = async (req, res) => {
    try {
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        const { min_date, max_date } = req.body;

        // Build date filter if any
        const dateFilter = {};
        if (min_date) dateFilter.$gte = new Date(min_date);

        if (max_date) {
            // Set max date to the end of the day
            let maxDate = new Date(max_date);
            maxDate.setHours(23, 59, 59, 999);  // Set to the end of the day
            dateFilter.$lte = maxDate;
        }

        // Build lead query
        const leadQuery = { garage_id: _id , is_deleted: false  };
        if (min_date || max_date) {
            leadQuery.createdAt = dateFilter;
        }

        // Build appointment query
        const appointmentQuery = { garage_id: _id, is_deleted: false };
        if (min_date || max_date) {
            appointmentQuery.start_time = dateFilter;
        }


        const notificationQuery = { garage_id: _id, status: "completed" };
        if (min_date || max_date) {
            notificationQuery.createdAt = dateFilter;
        }

        // Fetch counts
        const [totalLeads, totalAppointments, newCustomerLeads, newCustomerAppointments, notifications] = await Promise.all([
            LEADS.countDocuments(leadQuery),
            APPOINTMENTS.countDocuments(appointmentQuery),
            LEADS.countDocuments({ ...leadQuery, is_new_customer: true }),
            APPOINTMENTS.countDocuments({ ...appointmentQuery, is_new_customer: true }),
            NOTIFICATION.countDocuments(notificationQuery),
        ]);

        const leadsByDate = await LEADS.aggregate([
            { $match: leadQuery },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    count: 1
                }
            }
        ])

        const appointmentsByDate = await APPOINTMENTS.aggregate([
            { $match: appointmentQuery },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$start_time" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    count: 1
                }
            }
        ]);

        const followupLeadsCount = await LEADS.countDocuments({
            ...leadQuery,
            followUp: true
        });
        // Send successful response
        return successResponse(res, {
            total_leads: totalLeads,
            total_appointments: totalAppointments,
            new_customer_leads: newCustomerLeads,
            new_customer_appointments: newCustomerAppointments,
            leads_by_date: leadsByDate,
            appointments_by_date: appointmentsByDate,
            notifications: notifications,
            followupLeadsCount: followupLeadsCount
        });

    } catch (error) {
        logger.error(`[GET GARAGE STATS ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id,
        });

        return internalServerErrorResponse(res, {
            message: "Failed to fetch stats",
        });
    }
};





export default { getApiKey, getGarageStats }
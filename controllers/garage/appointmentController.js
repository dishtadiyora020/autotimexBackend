import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../middleware/responses.js";
import GARAGE from "../../models/garage.js";
import Logger from "../../middleware/logger.js";
import APPOINTMENT from "../../models/appointment.js";
import CUSTOMER_INFO from "../../models/scheduling-tools/customerInfo.js";
import VEHICLE from "../../models/vehicle.js";
import APPOINTMENT_COLOR_CONDITIONS from "../../models/calendar-settings/appointmentColorCondition.js";
import APPOINTMENT_TECHNICIAN_CONDITIONS from "../../models/calendar-settings/appointmentTechnicianCondition.js";
import APPOINTMENT_JOB_LABEL_CONDITIONS from "../../models/calendar-settings/appointmentLabelCondition.js";
import MARKETING_LINK from "../../models/marketingLinks.js";
import NOTIFICATION from "../../models/notification.js";
import GARAGE_SETTINGS from "../../models/garageSettings.js";
const logger = new Logger("garage/appointmentController.js");
import { getClientIp } from 'request-ip';
import moment from "moment-timezone";
import { getPagination, sortingQuery } from "../../utils/common.js";
import { getService, processServiceArray } from "./notificationController.js";
import mongoose from "mongoose";
import Stripe from "stripe"
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import { sendSMS } from "../../services/aws-sns.js";
import User from "../../models/user.js";

const createAppointment = async (req, res) => {
    try {
        logger.log("[GET CREATE APPOINTMENT] API Called");

        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        const { code } = req.params;
        const userIp = getClientIp(req);
        let marketingLink;
        if (code) {
            marketingLink = await MARKETING_LINK.findOne({ code });
        }
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });
        let user_id = req.body.user_id
        let dedicated_field_values = req.body.dedicated_field_values
        let customer_field_values = req.body.customer_field_values
        let comments = req.body.comments
        if (req.body.user) {
            const user = new CUSTOMER_INFO({
                first_name: req.body.user.first_name,
                last_name: req.body.user.last_name,
                email: req.body.user.email,
                phone: req.body.user.phone,
                garage_id: _id
            })
            user_id = await user.save()
        }
        let vehicle_id = req.body.vehicle_id
        let is_new_customer = req.body.is_new_customer
        if (req.body.vehicle) {
            const vehicle = new VEHICLE({
                year: req.body.vehicle.year,
                make: req.body.vehicle.make,
                model: req.body.vehicle.model,
                VIN: req.body.vehicle.vin,
                license_plate: req.body.vehicle.license_plate,
                garage_id: _id
            })
            vehicle_id = await vehicle.save()
        }
        const [appointmentColorCondition, appointmentTechnicianConditions, appointmentLabelConditions] = await Promise.all([
            APPOINTMENT_COLOR_CONDITIONS.find({ garage_id: _id }).sort({ index: 1 }),
            APPOINTMENT_TECHNICIAN_CONDITIONS.find({ garage_id: _id }).sort({ index: 1 }),
            APPOINTMENT_JOB_LABEL_CONDITIONS.find({ garage_id: _id })
        ]);

        let matchedColor = null;
        const appointmentPayload = {
            ...req.body,
            is_new_customer,
            user: user_id,
            vehicle: vehicle_id,
            garage_id: _id
        };
        const timezone = garage.timezone;
        function evaluateCondition(appointment, condition) {
            const fieldValue = appointment[condition.field];
            const conditionValue = condition.value === 'yes' ? true : condition.value === 'no' ? false : condition.value;

            switch (condition.operator) {
                case 'equals':
                    return fieldValue === conditionValue;
                case 'not_equals':
                    return fieldValue !== conditionValue;
                case 'contains':
                    return Array.isArray(fieldValue) && fieldValue.includes(conditionValue);
                case 'greater_than':
                    return fieldValue > conditionValue;
                case 'less_than':
                    return fieldValue < conditionValue;
                case 'starts_with':
                    return typeof fieldValue === 'string' && fieldValue.startsWith(conditionValue);
                case 'ends_with':
                    return typeof fieldValue === 'string' && fieldValue.endsWith(conditionValue);
                case 'is_empty':
                    return fieldValue == null || fieldValue === '';
                case 'is_not_empty':
                    return fieldValue != null && fieldValue !== '';
                default:
                    return condition.is_default_condition;
            }
        }

        for (const condition of appointmentColorCondition) {
            if (evaluateCondition(appointmentPayload, condition)) {
                matchedColor = condition.color_id;
                break;
            }
        }

        let matchedTechnician = null;
        for (const condition of appointmentTechnicianConditions) {
            if (evaluateCondition(appointmentPayload, condition)) {
                matchedTechnician = condition.technician_id;
                break;
            }
        }

        let matchedJobLabel = null;
        for (const condition of appointmentLabelConditions) {
            if (evaluateCondition(appointmentPayload, condition)) {
                matchedJobLabel = condition.label_id;
                break;
            }
        }
        const appointment = new APPOINTMENT({
            ...req.body,
            is_new_customer,
            user: user_id,
            vehicle: vehicle_id,
            color_option: matchedColor,
            garage_id: _id,
            dedicated_field_values: dedicated_field_values,
            customer_field_values: customer_field_values,
            service: req.body.service,
            technician: matchedTechnician,
            job_label: matchedJobLabel,
            comments: comments,
            appointment_type: req.body.appointment_type,
            address: req.body.address,
            ...(marketingLink && {
                marketing_data: {
                    _id: marketingLink._id,
                    source_tracking: marketingLink?.source_tracking
                }
            }),
            transport_option: req.body.transportOption,
            ...(marketingLink?.locationEnabled === true && {
                lat: req.body.lat,
                lon: req.body.lon
            }),
            start_time: moment.tz(req.body.start_time, "YYYY-MM-DD hh:mm A", timezone).toDate(),
            end_time: moment.tz(req.body.end_time, "YYYY-MM-DD hh:mm A", timezone).toDate(),


        });
        await appointment.save();
        try {
            if (garage.stripe_customer_id) {
                await stripe.billing.meterEvents.create({
                    event_name: 'appointment',
                    payload: {
                        value: '1',
                        stripe_customer_id: garage.stripe_customer_id,
                    },
                    identifier: `booking_${appointment._id}`,
                });
                logger.log(`Stripe metered event recorded for appointment: ${appointment._id}`);
            } else {
                logger.warn(`Stripe customer ID not found for garage: ${_id}`);
            }

            // Save appointment only after Stripe success
            // await appointment.save();
            const garageSettings = await GARAGE_SETTINGS.findOne({ garage_id: _id });
            const user = await User.findOne({ _id: appointment.user, garage_id: _id });
            const vehicle = await VEHICLE.findOne({ _id: appointment.vehicle, garage_id: _id });
            const notificationConfig = garageSettings.notifications.find(
                (n) => n.key === "RIGHT_AFTER_BOOKING"
            );
            const typeMap = {
                drop: "dropoff",
                wait: "waiter",
                pickup: "pickup"
            };
            const mappedType = typeMap[appointment?.appointment_type];
            if (!mappedType) {
                console.error(`Unknown appointment type: ${appointment?.appointment_type}`);
                return;
            }

            const selectedNotification = notificationConfig[mappedType];
            const garageName = garage.name;
            const garagePhone = garage.phone;
            const appointmentDate = moment(appointment.start_time).format("MMMM Do, YYYY");
            const appointmentWeekMonthDate = moment(appointment.start_time).format("dddd, MMMM Do");
            const appointmentDayOfWeek = moment(appointment.start_time).format("dddd");
            const appointmentTime = `${moment(appointment.start_time).format("h:mm A")} - ${moment(appointment.end_time).format("h:mm A")}`;
            const appointmentDay = moment(appointment.start_time).format("dddd").toLowerCase();
            const shopHours = garageSettings.shop_hours.find(h => h.day === appointmentDay);

            let shopOpenTime = "Closed";
            let shopCloseTime = "Closed";
            let appointmentTimeLabel = "";

            if (shopHours && !shopHours.is_closed) {
                shopOpenTime = shopHours.start;
                shopCloseTime = shopHours.end;

                const appointmentTimeOnly = moment(appointment.start_time, "YYYY-MM-DDTHH:mm:ss");
                const openMoment = moment(shopOpenTime, "hh:mm A");
                const closeMoment = moment(shopCloseTime, "hh:mm A");

                // Check if appointment is within shop hours
                if (appointmentTimeOnly.isBetween(openMoment, closeMoment, null, '[]')) {
                    appointmentTimeLabel = `${moment(appointment.start_time).format("h:mm A")} (During Shop Hours)`;
                } else {
                    appointmentTimeLabel = `${moment(appointment.start_time).format("h:mm A")} (After Hours)`;
                }
            } else {
                appointmentTimeLabel = `${moment(appointment.start_time).format("h:mm A")} (Garage Closed)`;
            }
            function replacePlaceholders(template, data) {
                return template.replace(/:([a-zA-Z0-9-_]+)/g, (_, key) => data[`:${key}`] || '');
            }
            const notificationTemplate = selectedNotification || "Your appointment is confirmed at {{garage_name}} on {{appointment_date}} from {{appointment_time}}.";
            const finalNotificationMessage = replacePlaceholders(notificationTemplate, {

                ":appointment-month-date-year": appointmentDate,
                ":appointment-week-month-date": appointmentWeekMonthDate,
                ":appointment-day-of-week": appointmentDayOfWeek,
                ":appointment-time": appointmentTime,
                ":appointment-time-label": appointmentTimeLabel,
                ":cust-name": user?.name || "Customer",
                ":shop-open-time": shopOpenTime,
                ":shop-name": garageName,
                ":shop-phone": garagePhone,
                ":vehicle": vehicle?.year + " " + vehicle?.make + " " + vehicle?.model,
                // ":appointment-date": appointmentDate,


            });
            const notification = new NOTIFICATION({
                garage_id: _id,
                status: 'pending',
                appointment_id: appointment._id,
                notification_content: "notification sended"
            });

            await notification.save();

            try {

                const phoneNumber = process.env.PHONE_NUMBER;

                if (!phoneNumber) {
                    throw new Error("Phone number not provided for SMS");
                }

                const message = finalNotificationMessage;

                await sendSMS(phoneNumber, message);

                // Update notification status as completed
                notification.status = 'completed';
                notification.notification_content = `SMS sent successfully to ${phoneNumber}`;
                await notification.save();

            } catch (smsError) {
                // Update notification status as failed
                notification.status = 'failed';
                notification.notification_content = `SMS failed to send: ${smsError.message}`;
                await notification.save();

                logger.error(`[SMS ERROR] ${smsError.message}`, {
                    appointment_id: appointment._id,
                    error: smsError.stack,
                });
            }


            if (marketingLink) {
                marketingLink.scan.booking.push({
                    date: new Date(),
                    ip: userIp,
                    booking_id: appointment._id,
                });
                await marketingLink.save();
            }
        } catch (error) {
            logger.error(`[CREATE APPOINTMENT API ERROR] ${error.message}`, {
                error: error.stack,
                user: req.user?._id
            });
            return internalServerErrorResponse(res, {
                message: "Something went wrong",
                error: error.message || "Unknown error",
            });
        }

        return successResponse(res, {
            message: "Appointment created successfully",
            payload: appointment._id
        });
    } catch (error) {
        logger.error(`[CREATE APPOINTMENT API ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id
        });
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
            error: error.message || "Unknown error",
        });
    }
};

// const getAppointments = async (req, res) => {
//     try {
//         logger.log("[GET APPOINTMENT] API Called");
//         const { _id } = req.user;
//         const garage = await GARAGE.findById(_id);
//         if (!garage) return badRequestResponse(res, { message: "Garage not found" });
//         const filter = {};
//         if (req.query.start_date) filter.start_date = moment(moment(req.query.start_date).isValid() ? req.query.start_date : new Date()).toDate()
//         if (req.query.end_date) filter.end_date = moment(moment(req.query.end_date).isValid() ? req.query.end_date : new Date()).toDate()
//         if (req.query.phone_no) filter['user.phone'] = {
//             $regex: req.query.phone_no,
//             $options: 'i'
//         }
//         if (req.query.customer_name) filter['user.full_name'] = {
//             $regex: req.query.customer_name,
//             $options: 'i'
//         }
//         if (req.query.technician) {
//             // if query is 'unassign' string, then look for null/undefined technician appointments
//             if (req.query.technician === 'unassign') {
//                 filter.$or = [
//                     { technician: null },
//                     { technician: { $exists: false } }
//                 ];
//             } else if (req.query.technician === 'assign') {
//                 filter.technician = { $ne: null };
//             } else {
//                 let technicianArray = [];

//                 try {
//                     technicianArray = JSON.parse(req.query.technician);
//                 } catch (e) {
//                     technicianArray = [req.query.technician];
//                 }

//                 technicianArray = technicianArray.map(id => new mongoose.Types.ObjectId(id));

//                 filter.technician = { $in: technicianArray };
//             }
//         }
//         if (req.query.color) {
//             let colorArray = [];
//             try {
//                 colorArray = JSON.parse(req.query.color);
//             } catch (e) {
//                 colorArray = [req.query.color];
//             }
//             colorArray = colorArray.map(id => new mongoose.Types.ObjectId(id));
//             filter.color_option = { $in: colorArray };
//         }
//         if (req.query.label) {
//             let labelArray = [];
//             try {
//                 labelArray = JSON.parse(req.query.label);
//             } catch (e) {
//                 labelArray = [req.query.label];
//             }
//             labelArray = labelArray.map(id => new mongoose.Types.ObjectId(id));

//             filter.job_label = { $in: labelArray };
//         }

//         if (req.query.progress) {
//             let progressArray = [];
//             try {
//                 progressArray = JSON.parse(req.query.progress);
//             } catch (e) {
//                 progressArray = [req.query.progress];
//             }
//             progressArray = progressArray.map(id => new mongoose.Types.ObjectId(id));
//             filter.progress_percentage = { $in: progressArray };
//         }
//         if (req.query.serviceAdvisor) {
//             let serviceAdvisorArray = [];
//             try {
//                 serviceAdvisorArray = JSON.parse(req.query.serviceAdvisor);
//             } catch (e) {
//                 serviceAdvisorArray = [req.query.serviceAdvisor];
//             }
//             serviceAdvisorArray = serviceAdvisorArray.map(id => new mongoose.Types.ObjectId(id));
//             filter.service_advisor = { $in: serviceAdvisorArray };
//         }
//         const appointments = await APPOINTMENT.aggregate([
//             {
//                 $facet: {
//                     appointments: [

//                         { $match: { garage_id: _id, is_deleted: false, ...filter } },
//                         {
//                             $lookup: {
//                                 from: "vehicles",
//                                 localField: "vehicle",
//                                 foreignField: "_id",
//                                 as: "vehicle"
//                             }
//                         },
//                         {
//                             $lookup: {
//                                 from: "users",
//                                 localField: "user",
//                                 foreignField: "_id",
//                                 as: "user"
//                             }
//                         },
//                         {
//                             $lookup: {
//                                 from: "serviceadvisors",
//                                 localField: "service_advisor",
//                                 foreignField: "_id",
//                                 as: "service_advisor"
//                             }
//                         },
//                         {
//                             $lookup: {
//                                 from: "coloroptions",
//                                 localField: "color_option",
//                                 foreignField: "_id",
//                                 as: "color_option"
//                             }
//                         },
//                         {
//                             $unwind: {
//                                 path: "$color_option",
//                                 preserveNullAndEmptyArrays: true
//                             }
//                         },
//                         {
//                             $lookup: {
//                                 from: "progressoptions",
//                                 localField: "progress_percentage",
//                                 foreignField: "_id",
//                                 as: "progress_percentage"
//                             }
//                         },
//                         {
//                             $unwind: {
//                                 path: "$progress_percentage",
//                                 preserveNullAndEmptyArrays: true
//                             }
//                         },
//                         {
//                             $lookup: {
//                                 from: "technicians",
//                                 localField: "technician",
//                                 foreignField: "_id",
//                                 as: "technician"
//                             }
//                         },
//                         {
//                             $unwind: {
//                                 path: "$technician",
//                                 preserveNullAndEmptyArrays: true
//                             }
//                         },
//                         {
//                             $lookup: {
//                                 from: "joblabels",
//                                 localField: "job_label",
//                                 foreignField: "_id",
//                                 as: "job_label"
//                             }
//                         },
//                         {
//                             $addFields: {
//                                 user: {
//                                     $cond: {
//                                         if: { $eq: [{ $size: "$user" }, 0] },
//                                         then: null,
//                                         else: { $first: "$user" }
//                                     }
//                                 },
//                                 vehicle: {
//                                     $cond: {
//                                         if: { $eq: [{ $size: "$vehicle" }, 0] },
//                                         then: null,
//                                         else: { $first: "$vehicle" }
//                                     }
//                                 },
//                                 service_advisor: {
//                                     $cond: {
//                                         if: { $eq: [{ $size: "$service_advisor" }, 0] },
//                                         then: null,
//                                         else: { $first: "$service_advisor" }
//                                     }
//                                 }
//                             }
//                         },

//                         {
//                             $unwind: {
//                                 path: "$customer_field_values",
//                                 preserveNullAndEmptyArrays: true
//                             }
//                         },
//                         {
//                             $unwind: {
//                                 path: "$dedicated_field_values",
//                                 preserveNullAndEmptyArrays: true
//                             }
//                         },
//                         {
//                             $unwind: {
//                                 path: "$vehicle.custom_field_values",
//                                 preserveNullAndEmptyArrays: true
//                             }
//                         },
//                         {
//                             $lookup: {
//                                 from: "customfields",
//                                 let: { custom_field_id: "$vehicle.custom_field_values.custom_field" },
//                                 pipeline: [
//                                     { $unwind: "$custom_fields" },
//                                     {
//                                         $match: { $expr: { $eq: ["$custom_fields._id", "$$custom_field_id"] } }
//                                     },
//                                     { $replaceRoot: { newRoot: "$custom_fields" } }
//                                 ],
//                                 as: "vehicle.custom_field_values.custom_field"
//                             }
//                         },
//                         {
//                             $unwind: {
//                                 path: "$vehicle.custom_field_values.custom_field",
//                                 preserveNullAndEmptyArrays: true
//                             }
//                         },
//                         {
//                             $lookup: {
//                                 from: "customfields",
//                                 let: { custom_field_id: "$customer_field_values.custom_field" },
//                                 pipeline: [
//                                     { $unwind: "$custom_fields" },
//                                     {
//                                         $match: { $expr: { $eq: ["$custom_fields._id", "$$custom_field_id"] } }
//                                     },
//                                     { $replaceRoot: { newRoot: "$custom_fields" } }
//                                 ],
//                                 as: "customer_field_values.custom_field"
//                             }
//                         },
//                         {
//                             $unwind: {
//                                 path: "$customer_field_values.custom_field",
//                                 preserveNullAndEmptyArrays: true
//                             }
//                         },
//                         {
//                             $lookup: {
//                                 from: "customfields",
//                                 let: { custom_field_id: "$dedicated_field_values.custom_field" },
//                                 pipeline: [
//                                     { $unwind: "$custom_fields" },
//                                     {
//                                         $match: { $expr: { $eq: ["$custom_fields._id", "$$custom_field_id"] } }
//                                     },
//                                     { $replaceRoot: { newRoot: "$custom_fields" } }
//                                 ],
//                                 as: "dedicated_field_values.custom_field"
//                             }
//                         },
//                         {
//                             $unwind: {
//                                 path: "$dedicated_field_values.custom_field",
//                                 preserveNullAndEmptyArrays: true
//                             }
//                         },
//                         {
//                             $group: {
//                                 _id: "$_id",
//                                 user: { $first: "$user" },
//                                 dedicated_field_values: { $push: "$dedicated_field_values" },
//                                 customer_field_values: { $push: "$customer_field_values" },
//                                 vehicle: { $first: "$vehicle" },
//                                 service_advisor: { $first: "$service_advisor" },
//                                 status: { $first: "$status" },
//                                 start_time: { $first: "$start_time" },
//                                 end_time: { $first: "$end_time" },
//                                 address: { $first: "$address" },
//                                 media: { $first: "$media" },
//                                 comments: { $first: "$comments" },
//                                 appointment_type: { $first: "$appointment_type" },
//                                 transport_option: { $first: "$transport_option" },
//                                 is_arrived: { $first: "$is_arrived" },
//                                 is_deleted: { $first: "$is_deleted" },
//                                 createdAt: { $first: "$createdAt" },
//                                 updated_at: { $first: "$updated_at" },
//                                 service: { $first: "$service" },
//                                 color_option: { $first: "$color_option" },
//                                 technician: { $first: "$technician" },
//                                 progress_percentage: { $first: "$progress_percentage" },
//                                 job_label: { $first: "$job_label" },
//                                 service_advisor_notes: { $first: "$service_advisor_notes" },
//                             }
//                         },
//                         {
//                             $addFields: {
//                                 "user.full_name": {
//                                     $cond: [
//                                         {
//                                             $and: [
//                                                 { $ne: ["$user.first_name", null] },
//                                                 { $ne: ["$user.last_name", null] }
//                                             ]
//                                         },
//                                         { $concat: ["$user.first_name", " ", "$user.last_name"] },
//                                         null
//                                     ]
//                                 }
//                             }
//                         },
//                         {
//                             $addFields: {
//                                 customer_field_values: {
//                                     $filter: {
//                                         input: "$customer_field_values",
//                                         as: "item",
//                                         cond: { $gt: [{ $size: { $objectToArray: "$$item" } }, 0] }
//                                     }
//                                 },
//                                 dedicated_field_values: {
//                                     $filter: {
//                                         input: "$dedicated_field_values",
//                                         as: "item",
//                                         cond: { $gt: [{ $size: { $objectToArray: "$$item" } }, 0] }
//                                     }
//                                 }
//                             }
//                         },

//                         ...getPagination(req?.query?.page, req?.query?.limit),
//                         { ...sortingQuery(req?.query?.sortBy, req?.query?.sortOrder) }
//                     ],
//                     total: [
//                         { $match: { garage_id: _id, is_deleted: false, ...filter } },
//                         {
//                             $lookup: {
//                                 from: "users",
//                                 localField: "user",
//                                 foreignField: "_id",
//                                 as: "user"
//                             }
//                         },
//                         {
//                             $addFields: {
//                                 user: {
//                                     $cond: {
//                                         if: { $eq: [{ $size: "$user" }, 0] },
//                                         then: null,
//                                         else: { $first: "$user" }
//                                     }
//                                 }
//                             }
//                         },
//                         {
//                             $addFields: {
//                                 "user.full_name": {
//                                     $cond: [
//                                         { $and: [{ $ne: ["$user.first_name", null] }, { $ne: ["$user.last_name", null] }] },
//                                         { $concat: ["$user.first_name", " ", "$user.last_name"] },
//                                         null
//                                     ]
//                                 }
//                             }
//                         },
//                         {
//                             $group: {
//                                 _id: "$_id",
//                                 garage_id: { $first: "$garage_id" },
//                                 service_advisor_notes: { $first: "$service_advisor_notes" },
//                                 customer_notes: { $first: "$customer_notes" },
//                                 is_new_customer: { $first: "$is_new_customer" },
//                                 service_advisor: { $first: "$service_advisor" },
//                                 color_option: { $first: "$color_option" },
//                                 vehicle: { $first: "$vehicle" },
//                                 issue_tree: { $first: "$issue_tree" },
//                                 start_time: { $first: "$start_time" },
//                                 date_label: { $first: "$date_label" },
//                                 end_time: { $first: "$end_time" },
//                                 customer_field_values: { $first: "$customer_field_values" },
//                                 dedicated_field_values: { $first: "$dedicated_field_values" },
//                                 createdAt: { $first: "$createdAt" },
//                                 updatedAt: { $first: "$updatedAt" },
//                                 user: { $first: "$user" },
//                                 address: { $first: "$address" },
//                                 progress_percentage: { $first: "$progress_percentage" },
//                                 technician: { $first: "$technician" },
//                                 job_label: { $first: "$job_label" },
//                             }
//                         },

//                         { $count: "total" }
//                     ]
//                 }
//             }
//         ]);
//         const processedAppointments = await Promise.all(
//             cloneDeep(appointments)?.[0]?.appointments.map(async (appointment) => {
//                 // Debugging to check if service data is present
//                 const serviceData = appointment?.service;
//                 // Check if service is present
//                 if (serviceData && serviceData.length > 0) {
//                     const serviceIds = processServiceArray(serviceData);
//                     const serviceNames = await getService(serviceIds);
//                     appointment.service = serviceNames;  // Update the service field with the fetched names
//                 } else {
//                     appointment.service = [];  // Handle empty or missing service field
//                 }
//                 return appointment;
//             })
//         );
//         return successResponse(res, {
//             message: "Appointment fetched successfully",
//             payload: {
//                 appointments: processedAppointments ?? [],
//                 total: cloneDeep(appointments)?.[0]?.total?.[0]?.total ?? 0,
//             },
//         });
//     } catch (error) {
//         logger.error(`[GET APPOINTMENT API ERROR] ${error.message}`, {
//             error: error.stack,
//             user: req.user?._id
//         });
//         return internalServerErrorResponse(res, {
//             message: "Something went wrong",
//             error: error.message || "Unknown error",
//         });
//     }
// }

const getAppointments = async (req, res) => {
    try {
        logger.log("[GET APPOINTMENT] API Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });
        const filter = {};
        if (req.query.technician) {
            // if query is 'unassign' string, then look for null/undefined technician appointments
            if (req.query.technician === 'unassign') {
                filter.$or = [
                    { technician: null },
                    { technician: { $exists: false } }
                ];
            } else if (req.query.technician === 'assign') {
                filter.technician = { $ne: null };
            } else {
                let technicianArray = [];

                try {
                    technicianArray = JSON.parse(req.query.technician);
                } catch (e) {
                    technicianArray = [req.query.technician];
                }

                technicianArray = technicianArray.map(id => new mongoose.Types.ObjectId(id));

                filter.technician = { $in: technicianArray };
            }
        }
        if (req.query.color) {
            let colorArray = [];
            try {
                colorArray = JSON.parse(req.query.color);
            } catch (e) {
                colorArray = [req.query.color];
            }
            colorArray = colorArray.map(id => new mongoose.Types.ObjectId(id));
            filter.color_option = { $in: colorArray };
        }
        if (req.query.label) {
            let labelArray = [];
            try {
                labelArray = JSON.parse(req.query.label);
            } catch (e) {
                labelArray = [req.query.label];
            }
            labelArray = labelArray.map(id => new mongoose.Types.ObjectId(id));

            filter.job_label = { $in: labelArray };
        }

        if (req.query.progress) {
            let progressArray = [];
            try {
                progressArray = JSON.parse(req.query.progress);
            } catch (e) {
                progressArray = [req.query.progress];
            }
            progressArray = progressArray.map(id => new mongoose.Types.ObjectId(id));
            filter.progress_percentage = { $in: progressArray };
        }
        if (req.query.serviceAdvisor) {
            let serviceAdvisorArray = [];
            try {
                serviceAdvisorArray = JSON.parse(req.query.serviceAdvisor);
            } catch (e) {
                serviceAdvisorArray = [req.query.serviceAdvisor];
            }
            serviceAdvisorArray = serviceAdvisorArray.map(id => new mongoose.Types.ObjectId(id));
            filter.service_advisor = { $in: serviceAdvisorArray };
        }
        const appointments = await APPOINTMENT.aggregate([
            {
                $match: {
                    garage_id: _id,
                    is_deleted: false,
                    ...filter,
                },
            },
            {
                $lookup: {
                    from: "vehicles",
                    localField: "vehicle",
                    foreignField: "_id",
                    as: "vehicle",
                },
            },
            {
                $unwind: {
                    path: "$vehicle",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "serviceadvisors",
                    localField: "service_advisor",
                    foreignField: "_id",
                    as: "service_advisor",
                },
            },
            {
                $unwind: {
                    path: "$service_advisor",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "coloroptions",
                    localField: "color_option",
                    foreignField: "_id",
                    as: "color_option",
                },
            },
            {
                $unwind: {
                    path: "$color_option",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "progressoptions",
                    localField: "progress_percentage",
                    foreignField: "_id",
                    as: "progress_percentage",
                },
            },
            {
                $unwind: {
                    path: "$progress_percentage",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "technicians",
                    localField: "technician",
                    foreignField: "_id",
                    as: "technician",
                },
            },
            {
                $unwind: {
                    path: "$technician",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "joblabels",
                    localField: "job_label",
                    foreignField: "_id",
                    as: "job_label",
                },
            },
            {
                $unwind: {
                    path: "$job_label",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    "user.full_name": {
                        $cond: [
                            {
                                $and: [
                                    { $ne: ["$user.first_name", null] },
                                    { $ne: ["$user.last_name", null] },
                                ],
                            },
                            { $concat: ["$user.first_name", " ", "$user.last_name"] },
                            null,
                        ],
                    },
                },
            },
            
            {
                $match: {
                    ...(req.query.phone_no
                        ? { "user.phone": { $regex: req.query.phone_no, $options: "i" } }
                        : {}),
                    ...(req.query.customer_name
                        ? { "user.full_name": { $regex: req.query.customer_name, $options: "i" } }
                        : {}),
                    // ...(req.query.start_date || req.query.end_date
                    //     ? {
                    //         createdAt: {
                    //             ...(req.query.start_date
                    //                 ? {
                    //                     $gte: moment(req.query.start_date, "DD-MM-YYYY")
                    //                         .startOf("day")
                    //                         .toDate(),
                    //                 }
                    //                 : {}),
                    //             ...(req.query.end_date
                    //                 ? {
                    //                     $lte: moment(req.query.end_date, "DD-MM-YYYY")
                    //                         .endOf("day")
                    //                         .toDate(),
                    //                 }
                    //                 : {}),
                    //         },
                    //     }
                    //     : {}),
                    ...(req.query.start_date || req.query.end_date
                        ? {
                            createdAt: {
                                ...(req.query.start_date
                                    ? {
                                        $gte: new Date(req.query.start_date),
                                    }
                                    : {}),
                                ...(req.query.end_date
                                    ? {
                                        $lte: new Date(req.query.end_date),
                                    }
                                    : {}),
                            },
                        }
                        : {}),

                },
            },
            {
                $facet: {
                    appointments: [
                        ...getPagination(req?.query?.page, req?.query?.limit),
                        { ...sortingQuery(req?.query?.sortBy, req?.query?.sortOrder) },
                    ],
                    total: [{ $count: "count" }],
                },
            },
        ]);
        const processedAppointments = await Promise.all(
            (appointments?.[0]?.appointments || []).map(async (appointment) => {
                const serviceData = appointment?.service;
                if (serviceData && serviceData.length > 0) {
                    const serviceIds = processServiceArray(serviceData);
                    const serviceNames = await getService(serviceIds);
                    appointment.service = serviceNames;
                } else {
                    appointment.service = [];
                }
                return appointment;
            })
        );

        const totalCount = appointments[0]?.total?.[0]?.count || 0;



        return successResponse(res, {
            message: "Appointment fetched successfully",
            payload: {
                appointments: processedAppointments ?? [],
                total: totalCount
            },
        });
    } catch (error) {
        logger.error(`[GET APPOINTMENT API ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id
        });
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
            error: error.message || "Unknown error",
        });
    }
}

const getAppointmentById = async (req, res) => {
    try {
        logger.log("[GET APPOINTMENT BY ID] API Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });
        const { appointmentId } = req.params;

        if (!appointmentId) {
            return badRequestResponse(res, { message: "Appointment ID is required." });
        }

        const appointment = await APPOINTMENT.findOne({
            _id: appointmentId,
            garage_id: garage._id
        })
            .populate('service_advisor')
            .populate('color_option')
            .populate('user')
            .populate('vehicle')
            .populate('progress_percentage')
            .populate('technician')
            .populate('job_label')
            .populate('marketing_data._id');

        if (!appointment) {
            return badRequestResponse(res, { message: "Appointment not found." });
        }
        if (!appointment) {
            return badRequestResponse(res, { message: "Appointment not found." });
        }

        // Manually populate the service field if it's present
        if (appointment.service && appointment.service.length > 0) {
            const serviceIds = appointment.service; // assuming it's an array of service IDs
            const serviceNames = await getService(serviceIds); // Fetch service data based on IDs
            appointment.service = serviceNames;  // Update the service field with the fetched names
        } else {
            appointment.service = [];  // Handle empty or missing service field
        }

        return successResponse(res, {
            message: "Appointment fetched successfully.",
            data: appointment
        });

    } catch (error) {
        logger.error(`[GET APPOINTMENT BY ID ERROR] ${error.message}`, { error });
        return internalServerErrorResponse(res, {
            message: 'Failed to fetch appointment',
            error: error.message,
        });
    }
};

const updateAppointment = async (req, res) => {
    try {
        logger.log("[UPDATE APPOINTMENT FROM NOTIFICATION] API Called");

        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const { appointmentId } = req.params;
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
        const appointment = await APPOINTMENT.findById(appointmentId);
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
            message: "Appointment updated successfully"
        });

    } catch (error) {
        logger.error("Controller Error:", error);
        return internalServerErrorResponse(res, {
            message: "Failed to update appointment"
        });
    }

};

export default { createAppointment, getAppointments, getAppointmentById, updateAppointment }


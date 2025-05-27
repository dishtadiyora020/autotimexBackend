import moment from "moment";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../middleware/responses.js";
import GARAGE from "../../models/garage.js";
import Logger from "../../middleware/logger.js";
import LEADS from "../../models/leads.js";
import APPOINTMENTS from "../../models/appointment.js";
import GARAGE_SETTINGS from "../../models/garageSettings.js";
import NOTIFICATION from "../../models/notification.js";
import MARKETING_LINK from "../../models/marketingLinks.js";
import mongoose from "mongoose";
const logger = new Logger("garage/dashboardController.js");

const buildSourceFilter = (sources, allowedSources) => {
    if (!sources.length) return {};

    const hasOther = sources.includes("other");
    const actualSources = sources.filter(source => source !== "other");

    if (hasOther && actualSources.length) {
        return {
            $or: [
                { "marketing_data.source_tracking.value": { $in: actualSources } },
                { "marketing_data.source_tracking.value": { $nin: allowedSources } },
            ],
        };
    } else if (hasOther) {
        return {
            "marketing_data.source_tracking.value": { $nin: allowedSources },
        };
    } else if (actualSources.length) {
        return {
            "marketing_data.source_tracking.value": { $in: actualSources },
        };
    }
    return {};
};


const getDashboardStats = async (req, res) => {
    try {
        logger.log("[GET DASHBOARD STATS] API Called");

        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        const { start_date = new Date(), end_date = new Date(), allSource = "" } = req.query;
        if (!moment(start_date).isValid() || !moment(end_date).isValid()) {
            return badRequestResponse(res, { message: "Invalid Parameters" });
        }

        const sources = allSource ? allSource.split(",") : [];
        const allowedSources = [
            "website",
            "dashboard",
            "google_button",
            "steer",
            "google_ad",
            "facebook_ad",
            "bing_ad",
            "repairpal",
        ];
        const sourceFilter = buildSourceFilter(sources, allowedSources);
        const startDateMoment = moment(start_date).startOf("day");
        const endDateMoment = moment(end_date).endOf("day");
        const garageSettings = await GARAGE_SETTINGS.findOne({ garage_id: _id });
        if (!garageSettings) {
            return badRequestResponse(res, { message: "Garage settings not found" });
        }
        const leadStats = await LEADS.aggregate([
            {
                $facet: {
                    totalLeads: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },
                                ...sourceFilter
                            },
                        },
                        { $count: "total" },
                    ],
                    newCustomerLeads: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                is_new_customer: true,
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },
                                ...sourceFilter
                            },
                        },
                        { $count: "total" },
                    ],
                    weekWiseLeads: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },
                                ...sourceFilter
                            },
                        },
                        {
                            $group: {
                                _id: {
                                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                                },
                                total: { $sum: 1 }
                            },
                        },
                    ],
                    dayWiseLeads: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },
                                ...sourceFilter
                            },
                        },
                        {
                            $group: {
                                _id: { $dayOfWeek: "$createdAt" }, // 1=Sunday, 7=Saturday
                                total: { $sum: 1 }
                            },
                        },
                    ],

                    leadsFollowedUp: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                followUp: true,
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },
                                ...sourceFilter
                            },
                        },
                        { $count: "total" },
                    ],
                    sourceWiseLeads: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },
                                ...sourceFilter
                            },
                        },
                        {
                            $group: {
                                _id: "$marketing_data.source_tracking.value",
                                total: { $sum: 1 }
                            }
                        }
                    ]
                },
            },
        ]);

        const appointmentStats = await APPOINTMENTS.aggregate([
            {
                $facet: {
                    totalAppointments: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },
                                ...sourceFilter
                            },
                        },
                        { $count: "total" },
                    ],
                    newCustomerAppointments: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                is_new_customer: true,
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },
                                ...sourceFilter
                            },
                        },
                        { $count: "total" },
                    ],

                    weekWiseAppointments: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },
                                ...sourceFilter
                            },
                        },
                        {
                            $group: {
                                _id: {
                                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                                },
                                total: { $sum: 1 }
                            },
                        },
                    ],
                    sourceWiseAppointments: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },
                                ...sourceFilter
                            },
                        },
                        {
                            $group: {
                                _id: "$marketing_data.source_tracking.value",
                                total: { $sum: 1 }
                            }
                        }
                    ],
                    dayWiseAppointments: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },
                                ...sourceFilter
                            },
                        },
                        {
                            $group: {
                                _id: { $dayOfWeek: "$createdAt" }, // 1=Sunday, 7=Saturday
                                total: { $sum: 1 }
                            },
                        },
                    ],

                },
            },
        ]);
        const shopHoursMap = {};
        garageSettings.shop_hours.forEach(hour => {
            shopHoursMap[hour.day.toLowerCase()] = hour;
        });
        const appointments = await APPOINTMENTS.find({
            garage_id: _id,
            is_deleted: false,
            createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },
            ...sourceFilter
        });

        const completedNotificationsCount = await NOTIFICATION.countDocuments({ garage_id: _id, status: "completed" });
        let afterHoursAppointmentsCount = 0;

        appointments.forEach(appointment => {
            const appointmentMoment = moment(appointment.createdAt);
            const dayOfWeek = appointmentMoment.format("dddd").toLowerCase();
            const shopHours = shopHoursMap[dayOfWeek];
            if (shopHours) {
                if (!shopHours.is_closed) {

                    const startTime = appointmentMoment.clone().set({
                        hour: moment(shopHours.start, "hh:mm A").hour(),
                        minute: moment(shopHours.start, "hh:mm A").minute(),
                        second: 0,
                        millisecond: 0
                    });

                    const endTime = appointmentMoment.clone().set({
                        hour: moment(shopHours.end, "hh:mm A").hour(),
                        minute: moment(shopHours.end, "hh:mm A").minute(),
                        second: 0,
                        millisecond: 0
                    });

                    const appointmentTime = appointmentMoment.clone().startOf("minute");

                    if (appointmentTime.isBefore(startTime) || appointmentTime.isAfter(endTime)) {
                        afterHoursAppointmentsCount++;
                    } else {
                        // console.log("Status: Within Business Hours 🕑");
                    }
                } else {

                    afterHoursAppointmentsCount++;
                }
            } else {
                afterHoursAppointmentsCount++;
            }
        });
        const dateWiseStats = {};

        leadStats?.[0]?.weekWiseLeads.forEach((lead) => {
            const date = lead._id;
            if (!dateWiseStats[date]) {
                dateWiseStats[date] = { leads: 0, appointments: 0 };
            }
            dateWiseStats[date].leads += lead.total;
        });

        appointmentStats?.[0]?.weekWiseAppointments.forEach((appointment) => {
            const date = appointment._id;
            if (!dateWiseStats[date]) {
                dateWiseStats[date] = { leads: 0, appointments: 0 };
            }
            dateWiseStats[date].appointments += appointment.total;
        });

        const startDate = moment(start_date);
        const endDate = moment(end_date);
        const output = [];

        while (startDate.isSameOrBefore(endDate)) {
            const date = startDate.format("YYYY-MM-DD");
            output.push({
                label: date,
                leads: dateWiseStats[date]?.leads || 0,
                appointments: dateWiseStats[date]?.appointments || 0,
            });
            startDate.add(1, "day");
        }

        const validSources = [
            "website", "dashboard", "google_button", "steer", "google_ad",
            "facebook_ad", "bing_ad", "repairpal"
        ];


        const sourceWiseTotal = {};
        leadStats[0]?.sourceWiseLeads?.forEach(item => {
            let source = item._id || "other";

            source = String(source).trim().toLowerCase();

            const finalSource = validSources.includes(source) ? source : "other";
            if (!sourceWiseTotal[finalSource]) {
                sourceWiseTotal[finalSource] = { leads: 0, appointments: 0 };
            }

            sourceWiseTotal[finalSource].leads += item.total;
        });

        appointmentStats[0]?.sourceWiseAppointments?.forEach(item => {
            let source = item._id || "other";

            source = String(source).trim().toLowerCase();
            const finalSource = validSources.includes(source) ? source : "other";
            if (!sourceWiseTotal[finalSource]) {
                sourceWiseTotal[finalSource] = { leads: 0, appointments: 0 };
            }
            sourceWiseTotal[finalSource].appointments += item.total;
        })
        validSources.forEach(source => {
            const normalizedSource = source.trim().toLowerCase();
            if (!sourceWiseTotal[normalizedSource]) {
                sourceWiseTotal[normalizedSource] = { leads: 0, appointments: 0 };
            }
        });
        const formattedSourceWiseTotal = {};
        Object.keys(sourceWiseTotal).forEach(source => {
            formattedSourceWiseTotal[source] = sourceWiseTotal[source].leads + sourceWiseTotal[source].appointments;
        });


        const dayWiseStats = {
            Sunday: { leads: 0, appointments: 0 },
            Monday: { leads: 0, appointments: 0 },
            Tuesday: { leads: 0, appointments: 0 },
            Wednesday: { leads: 0, appointments: 0 },
            Thursday: { leads: 0, appointments: 0 },
            Friday: { leads: 0, appointments: 0 },
            Saturday: { leads: 0, appointments: 0 },
        };
        const daysMap = {
            0: "Sunday",
            1: "Monday",
            2: "Tuesday",
            3: "Wednesday",
            4: "Thursday",
            5: "Friday",
            6: "Saturday"
        };


        leadStats?.[0]?.dayWiseLeads.forEach((lead) => {
            const day = daysMap[lead._id];
            if (day) {
                dayWiseStats[day].leads += lead.total;
            }
        });

        appointmentStats?.[0]?.dayWiseAppointments.forEach((appointment) => {
            const day = daysMap[appointment._id];
            if (day) {
                dayWiseStats[day].appointments += appointment.total;
            }
        })
        const weekWiseDayOutput = Object.keys(dayWiseStats).map((day) => ({
            day,
            total: dayWiseStats[day].leads + dayWiseStats[day].appointments,
        }));

        return successResponse(res, {
            message: "Dashboard stats fetched successfully",
            payload: {
                stats: {
                    totalLeads: leadStats[0]?.totalLeads[0]?.total ?? 0,
                    newCustomerLeads: leadStats[0]?.newCustomerLeads[0]?.total ?? 0,
                    newCustomerAppointments: appointmentStats[0]?.newCustomerAppointments[0]?.total ?? 0,
                    leadsFollowedUp: leadStats[0]?.leadsFollowedUp[0]?.total ?? 0,
                    totalAppointments: appointmentStats[0]?.totalAppointments[0]?.total ?? 0,
                    weekWiseData: output,
                    afterHoursAppointments: afterHoursAppointmentsCount,
                    NotificationsCount: completedNotificationsCount,
                    sourceWiseTotal: formattedSourceWiseTotal,
                    DaysTotal: weekWiseDayOutput
                },
            },
        });
    } catch (error) {
        logger.error(`[GET DASHBOARD STATS ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id,
        });
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
            error: error.message || "Unknown error",
        });
    }
};

const getJourneyChart = async (req, res) => {
    try {
        logger.log("[GET JOURNEY CHART] API Called");

        const { _id } = req.user;
        if (!_id) return badRequestResponse(res, { message: "User ID missing" });

        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });
        const totalLeads = await LEADS.countDocuments({ garage_id: _id });
        const progressStages = [
            { label: "Opened", value: "0%" },
            { label: "Issue", value: "17%" },
            { label: "Customer", value: "34%" },
            { label: "Vehicle", value: "51%" },
            { label: "Schedule", value: "68%" },
            { label: "Confirm", value: "85%" },
            { label: "Booked", value: "100%" }
        ];
        const stageCounts = await LEADS.aggregate([
            { $match: { garage_id: _id } },
            { $group: { _id: "$progress", count: { $sum: 1 } } }
        ]);
        const countsMap = stageCounts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});
        const progressCounts = progressStages.map(stage => ({
            label: stage.label,
            value: stage.value,
            count: countsMap[stage.value] || 0
        }));
        let remainingLeads = totalLeads;
        const retentionData = [];
        progressCounts.forEach((stage, index) => {
            if (index === 0) {
                retentionData.push(remainingLeads);
            } else {
                remainingLeads -= stage.count;
                retentionData.push(remainingLeads);
            }
        });
        const regressionData = progressCounts.map((stage, index) => (index === 0 ? 0 : stage.count));
        const labels = progressStages.map(stage => stage.label);
        const chartData = {
            labels,
            datasets: [
                {
                    label: "Retention",
                    data: retentionData
                },
                {
                    label: "Regression",
                    data: regressionData
                }
            ]
        };
        return res.json({
            success: true,
            message: "Journey chart data fetched successfully",
            payload: chartData,
            totalLeads
        });

    } catch (error) {
        logger.error("[GET JOURNEY CHART ERROR]", error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong while fetching chart data"
        });
    }
};
const advanceValue = async (req, res) => {
    try {
        logger.log("[GET JOURNEY CHART] API Called");

        const { _id } = req.user;
        if (!_id) return badRequestResponse(res, { message: "User ID missing" });

        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        const marketingLinks = await MARKETING_LINK.find({ garage_id: _id });

        const keyValueMap = {};

        marketingLinks.forEach(link => {
            link.source_tracking.forEach(tracking => {
                if (keyValueMap[tracking.key]) {
                    keyValueMap[tracking.key].push(tracking.value);
                } else {
                    keyValueMap[tracking.key] = [tracking.value];
                }
            });
        });
        const result = Object.entries(keyValueMap).map(([key, values]) => ({
            key,
            values
        }));

        return successResponse(res, {
            message: "Values fetched successfully",
            payload: result
        });

    } catch (error) {
        logger.error("[GET JOURNEY CHART] Error:", error);
        return serverErrorResponse(res, { message: "Internal Server Error" });
    }
};

const SourceFilter = (sourceObj) => {
    if (!sourceObj || !sourceObj.key) return {};

    const { key, value } = sourceObj;
    if (value) {
        return {
            "marketing_data.source_tracking": {
                $elemMatch: { key, value }
            }
        };
    } else {
        return {
            "marketing_data.source_tracking.key": key
        };
    }
};
const getAdvanceDashboardStats = async (req, res) => {
    try {
        logger.log("[GET DASHBOARD STATS] API Called");

        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        const { start_date = new Date(), end_date = new Date() } = req.query;
        if (!moment(start_date).isValid() || !moment(end_date).isValid()) {
            return badRequestResponse(res, { message: "Invalid Parameters" });
        }
        const { source } = req.body


        const startDateMoment = moment(start_date).startOf("day");
        const endDateMoment = moment(end_date).endOf("day");
        const garageSettings = await GARAGE_SETTINGS.findOne({ garage_id: _id });
        if (!garageSettings) {
            return badRequestResponse(res, { message: "Garage settings not found" });
        }

        const sourceFilter = SourceFilter(source);

        const leadStats = await LEADS.aggregate([
            {
                $facet: {
                    totalLeads: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },


                            },
                        },
                        { $count: "total" },
                    ],
                    newCustomerLeads: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                is_new_customer: true,
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },

                            },
                        },
                        { $count: "total" },
                    ],
                    weekWiseLeads: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },

                            },
                        },
                        {
                            $group: {
                                _id: {
                                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                                },
                                total: { $sum: 1 }
                            },
                        },
                    ],
                    sourceWiseLeads: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },
                                ...sourceFilter,
                            },
                        },
                        { $unwind: "$marketing_data.source_tracking" },

                        {
                            $group: {
                                _id: "$marketing_data.source_tracking.value",
                                total: { $sum: 1 }
                            }
                        },

                    ],




                },
            },
        ]);

        const appointmentStats = await APPOINTMENTS.aggregate([
            {
                $facet: {
                    totalAppointments: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },

                            },
                        },
                        { $count: "total" },
                    ],
                    newCustomerAppointments: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                is_new_customer: true,
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },

                            },
                        },
                        { $count: "total" },
                    ],

                    weekWiseAppointments: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },

                            },
                        },
                        {
                            $group: {
                                _id: {
                                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                                },
                                total: { $sum: 1 }
                            },
                        },
                    ],
                    sourceWiseAppointments: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id),
                                is_deleted: false,
                                createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },
                                ...sourceFilter,
                            },
                        },
                        { $unwind: "$marketing_data.source_tracking" },
                        {
                            $group: {
                                _id: "$marketing_data.source_tracking.value",
                                total: { $sum: 1 }
                            }
                        },


                    ],


                },
            },
        ]);
        const shopHoursMap = {};
        garageSettings.shop_hours.forEach(hour => {
            shopHoursMap[hour.day.toLowerCase()] = hour;
        });
        const appointments = await APPOINTMENTS.find({
            garage_id: _id,
            is_deleted: false,
            createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },
        });
        let afterHoursAppointmentsCount = 0;

        appointments.forEach(appointment => {
            const appointmentMoment = moment(appointment.createdAt);
            const dayOfWeek = appointmentMoment.format("dddd").toLowerCase();
            const shopHours = shopHoursMap[dayOfWeek];
            if (shopHours) {
                if (!shopHours.is_closed) {

                    const startTime = appointmentMoment.clone().set({
                        hour: moment(shopHours.start, "hh:mm A").hour(),
                        minute: moment(shopHours.start, "hh:mm A").minute(),
                        second: 0,
                        millisecond: 0
                    });

                    const endTime = appointmentMoment.clone().set({
                        hour: moment(shopHours.end, "hh:mm A").hour(),
                        minute: moment(shopHours.end, "hh:mm A").minute(),
                        second: 0,
                        millisecond: 0
                    });

                    const appointmentTime = appointmentMoment.clone().startOf("minute");

                    if (appointmentTime.isBefore(startTime) || appointmentTime.isAfter(endTime)) {
                        afterHoursAppointmentsCount++;
                    } else {
                    }
                } else {

                    afterHoursAppointmentsCount++;
                }
            } else {
                afterHoursAppointmentsCount++;
            }
        });
        const leads = await LEADS.find({
            garage_id: _id,
            is_deleted: false,
            createdAt: { $gte: startDateMoment.toDate(), $lte: endDateMoment.toDate() },

        });
        let afterHoursLeadsCount = 0;
        leads.forEach(leads => {
            const leadMoment = moment(leads.createdAt);
            const dayOfWeek = leadMoment.format("dddd").toLowerCase();
            const shopHours = shopHoursMap[dayOfWeek];
            if (shopHours) {
                if (!shopHours.is_closed) {

                    const startTime = leadMoment.clone().set({
                        hour: moment(shopHours.start, "hh:mm A").hour(),
                        minute: moment(shopHours.start, "hh:mm A").minute(),
                        second: 0,
                        millisecond: 0
                    });

                    const endTime = leadMoment.clone().set({
                        hour: moment(shopHours.end, "hh:mm A").hour(),
                        minute: moment(shopHours.end, "hh:mm A").minute(),
                        second: 0,
                        millisecond: 0
                    });

                    const leadTime = leadMoment.clone().startOf("minute");

                    if (leadTime.isBefore(startTime) || leadTime.isAfter(endTime)) {
                        afterHoursLeadsCount++;
                    } else {

                    }
                } else {

                    afterHoursLeadsCount++;
                }
            } else {
                afterHoursLeadsCount++;
            }
        });
        const dateWiseStats = {};

        leadStats?.[0]?.weekWiseLeads.forEach((lead) => {
            const date = lead._id;
            if (!dateWiseStats[date]) {
                dateWiseStats[date] = { leads: 0, appointments: 0 };
            }
            dateWiseStats[date].leads += lead.total;
        });

        appointmentStats?.[0]?.weekWiseAppointments.forEach((appointment) => {
            const date = appointment._id;
            if (!dateWiseStats[date]) {
                dateWiseStats[date] = { leads: 0, appointments: 0 };
            }
            dateWiseStats[date].appointments += appointment.total;
        });

        const startDate = moment(start_date);
        const endDate = moment(end_date);
        const output = [];

        while (startDate.isSameOrBefore(endDate)) {
            const date = startDate.format("YYYY-MM-DD");
            output.push({
                label: date,
                leads: dateWiseStats[date]?.leads || 0,
                appointments: dateWiseStats[date]?.appointments || 0,
            });
            startDate.add(1, "day");
        }
        let marketingLinks = [];
        if (source && source.key) {
            marketingLinks = await MARKETING_LINK.find({
                garage_id: _id,
                "source_tracking.key": source.key,
                ...(source.value && {
                    "source_tracking.value": source.value
                })
            });
        } else {
            console.error("Source or Source Key is undefined");
        }

        const values = marketingLinks.flatMap(link =>
            link.source_tracking
                .filter(tracking => tracking.key === source.key)
                .map(tracking => tracking.value)
        );

        const sourceWiseStatsMap = {};

        leadStats?.[0]?.sourceWiseLeads.forEach(item => {
            const source = item._id ? item._id : 'unknown';
            if (!sourceWiseStatsMap[source]) {
                sourceWiseStatsMap[source] = { leads: 0, appointments: 0 };
            }
            sourceWiseStatsMap[source].leads += item.total;
        });

        appointmentStats?.[0]?.sourceWiseAppointments.forEach(item => {
            const source = item._id ? item._id : 'unknown';

            if (!sourceWiseStatsMap[source]) {
                sourceWiseStatsMap[source] = { leads: 0, appointments: 0 };
            }
            sourceWiseStatsMap[source].appointments += item.total;
        });

        const selectedSourceValue = source;
        let filteredSourceStats = null;

        if (selectedSourceValue && values.length > 0) {
            filteredSourceStats = Object.keys(sourceWiseStatsMap)
                .filter(sourceKey => values.includes(sourceKey))
                .reduce((acc, sourceKey) => {
                    acc[sourceKey] = sourceWiseStatsMap[sourceKey];
                    return acc;
                }, {});

            if (Object.keys(filteredSourceStats).length === 0) {
                filteredSourceStats = { values };
            }
        } else {
            filteredSourceStats = sourceWiseStatsMap;
        }

        const finalSourceStats = Object.keys(filteredSourceStats).reduce((acc, key) => {
            const item = filteredSourceStats[key];
            acc[key] = (item.leads || 0) + (item.appointments || 0);
            return acc;
        }, {});


        let customStats = [];

        if (source?.key === "AfterHours") {
            if (source?.value === "Scheduled Online Outside of Shop Hours") {
                customStats = [
                    {
                        label: "Scheduled Online Outside of Shop Hours",
                        leads: afterHoursLeadsCount,
                        appointments: afterHoursAppointmentsCount,
                    },
                ];
            } else if (source?.value === "Scheduled Online During Shop Hours") {
                customStats = [
                    {
                        label: "Scheduled Online During Shop Hours",
                        leads: (leadStats?.[0]?.totalLeads?.[0]?.total || 0) - afterHoursLeadsCount,
                        appointments: (appointmentStats?.[0]?.totalAppointments?.[0]?.total || 0) - afterHoursAppointmentsCount,
                    },
                ];
            } else {
                customStats = [
                    {
                        label: "Scheduled Online Outside of Shop Hours",
                        leads: afterHoursLeadsCount,
                        appointments: afterHoursAppointmentsCount,
                    },
                    {
                        label: "Scheduled Online During Shop Hours",
                        leads: (leadStats?.[0]?.totalLeads?.[0]?.total || 0) - afterHoursLeadsCount,
                        appointments: (appointmentStats?.[0]?.totalAppointments?.[0]?.total || 0) - afterHoursAppointmentsCount,
                    },
                ];
            }
        } else if (source?.key === "newCustomer") {
            if (source?.value === "Existing Customer") {
                customStats = [
                    {
                        label: "Existing Customer",
                        leads: (leadStats?.[0]?.totalLeads?.[0]?.total || 0) - (leadStats?.[0]?.newCustomerLeads?.[0]?.total || 0),
                        appointments: (appointmentStats?.[0]?.totalAppointments?.[0]?.total || 0) - (appointmentStats?.[0]?.newCustomerAppointments?.[0]?.total || 0),
                    },
                ];
            } else if (source?.value === "New Customer") {
                customStats = [
                    {
                        label: "New Customer",
                        leads: leadStats[0]?.newCustomerLeads[0]?.total || 0,
                        appointments: appointmentStats[0]?.newCustomerAppointments[0]?.total || 0,
                    },
                ];
            } else {
                customStats = [
                    {
                        label: "New Customer",
                        leads: leadStats[0]?.newCustomerLeads[0]?.total || 0,
                        appointments: appointmentStats[0]?.newCustomerAppointments[0]?.total || 0,
                    },
                    {
                        label: "Existing Customer",
                        leads: (leadStats?.[0]?.totalLeads?.[0]?.total || 0) - (leadStats?.[0]?.newCustomerLeads?.[0]?.total || 0),
                        appointments: (appointmentStats?.[0]?.totalAppointments?.[0]?.total || 0) - (appointmentStats?.[0]?.newCustomerAppointments?.[0]?.total || 0),
                    },
                ];
            }
        }
        if (customStats.length > 0) {
            customStats.forEach((stat) => {
                const key = stat.label.toLowerCase().replace(/\s+/g, '_');
                finalSourceStats[key] = (finalSourceStats[key] || 0) + (stat.leads || 0) + (stat.appointments || 0);
            });
        }
        return successResponse(res, {
            message: "Dashboard stats fetched successfully",
            payload: {
                stats: {
                    totalLeads: leadStats[0]?.totalLeads[0]?.total ?? 0,
                    newCustomerLeads: leadStats[0]?.newCustomerLeads[0]?.total ?? 0,
                    newCustomerAppointments: appointmentStats[0]?.newCustomerAppointments[0]?.total ?? 0,
                    totalAppointments: appointmentStats[0]?.totalAppointments[0]?.total ?? 0,
                    weekWiseData: output,
                    afterHoursAppointments: afterHoursAppointmentsCount,
                    afterHoursLeadsCount: afterHoursLeadsCount,
                    ...(source?.key ? { sourceWiseStats: finalSourceStats } : {}),
                },
            },
        });
    } catch (error) {
        logger.error(`[GET DASHBOARD STATS ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id,
        });
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
            error: error.message || "Unknown error",
        });
    }
};


export default { getDashboardStats, getJourneyChart, advanceValue, getAdvanceDashboardStats }
import moment from "moment";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../middleware/responses.js";
import GARAGE from "../../models/garage.js";
import CAPACITY_BLOCKERS from "../../models/availability/capacityBlockerModels.js";
import PICKUP_OPTION from "../../models/availability/pickupOption.js";
import WAITER_CAPACITY from "../../models/availability/waiterCapacity.js";
import DROP_OFF_CAPACITY from "../../models/availability/dropOffCapacity.js";
import DROPOFF_WAITING_WARNING from "../../models/scheduling-tools/dropoffWaiting.js";
import SERVICES from "../../models/availability/serviceModels.js";
import CUSTOMER_EXCEPTIONS_FOR_PICKUP from "../../models/availability/customerExceptionsForPickup.js";
import MISC_SETTINGS from "../../models/availability/miscSettings.js"
import CALENDAR_NOTE from "../../models/scheduling-tools/calendarNote.js";
import Logger from "../../middleware/logger.js";
import mongoose from "mongoose";
const logger = new Logger("garage/calendarController.js");

const getCalendarBlockers = async (req, res) => {
    try {
        logger.log("[GET CALENDAR BLOCKER] API Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });
        const { start_date = new Date(), end_date = new Date() } = req.body
        if (!moment(start_date).isValid() || !moment(end_date).isValid()) return badRequestResponse(res, { message: "Invalid Parameters" })
        const calendarBlockers = await CAPACITY_BLOCKERS.aggregate([
            {
                $match: {
                    garage_id: new mongoose.Types.ObjectId(_id),
                    is_enable: true,
                    block_type: {
                        $in: ['holiday_blocker', 'calendar_notes', 'schedule_blocker', 'schedule_blocker_repeating']
                    },
                    $or: [
                        { start_on: { $gte: moment(start_date).toDate() } },
                        { start_on: null }
                    ],
                    $or: [
                        { end_on: { $lte: moment(end_date).toDate() } },
                        { end_on: null }
                    ]
                }
            },
            { $unset: ["garage_id"] },
        ]);
        return successResponse(res, {
            message: "Calendar blockers fetched successfully",
            payload: {
                calendarBlockers: calendarBlockers
            },
        });
    } catch (error) {
        logger.error(`[GET CALENDAR BLOCKER  ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id
        });
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
            error: error.message || "Unknown error",
        });
    }
};

const getAppointmentOptions = async (req, res) => {
    try {
        logger.log("[GET DROP LEAD] API Called");

        const { _id } = req.user;
        const { vehicle, user, service } = req.body;
        // Check if the garage exists
        const garage = await GARAGE.findById(_id);
        if (!garage) {
            return badRequestResponse(res, { message: "Garage not found" });
        }
        // Fetch required options and capacity
        const [pickupOption, waiterCapacity, dropOffCapacity, warningtext] = await Promise.all([
            PICKUP_OPTION.findOne({ garage_id: _id }),
            WAITER_CAPACITY.findOne({ garage_id: _id }),
            DROP_OFF_CAPACITY.findOne({ garage_id: _id }),
            DROPOFF_WAITING_WARNING.findOne({ garage_id: _id })
        ]);

        // If any of the options are missing, return error
        if (!pickupOption || !waiterCapacity || !dropOffCapacity) {
            return badRequestResponse(res, { message: "Pickup Option, Waiter Capacity or Drop Off Capacity not found" });
        }

        // Fetch related services
        const services = await SERVICES.find({ _id: { $in: service } });

        // Check for enabled services
        const isWaiterEnabled = services.every(service => service.is_waiter === true);
        const isDropoffEnabled = services.every(service => service.is_dropoff === true);
        const isPickupEnabled = services.every(service => service.is_pickup === true);

        // Default values for pickup option
        let pickupShow = false;
        let pickupWarning = null;

        if (pickupOption.is_enabled && isPickupEnabled) {
            // Fetch pickup customer exceptions
            const pickupCustomer = await CUSTOMER_EXCEPTIONS_FOR_PICKUP.find({ garage_id: _id });
            // Find if the user phone matches any exception **and** exception_type is "allow"
            const match = Array.isArray(pickupCustomer)
                ? pickupCustomer.find(c => c.phone === user.phone && c.exception_type === "allow")
                : (pickupCustomer?.phone === user.phone && pickupCustomer?.exception_type === "allow");
            const isModelExcluded = pickupOption.excluded_models?.some(excludedMake =>
                excludedMake.make_name === vehicle.make ||
                excludedMake.models.some(model => model.model_name === vehicle.model)
            );
            if (match && isModelExcluded && isPickupEnabled) {
                pickupShow = true;
                pickupWarning = warningtext?.pickup || null;
            }

        }

        // Prepare the response
        const response = {
            message: "Drop lead fetched successfully",
            pickupOption: {
                show: pickupShow,
                warning: pickupWarning || null
            },
            waiterCapacity: {
                show: isWaiterEnabled,
                warning: warningtext?.waiter || null
            },
            dropOffCapacity: {
                show: isDropoffEnabled,
                warning: warningtext?.drop_off || null
            }
        };

        return successResponse(res, response);

    } catch (error) {
        logger.error(`[GET DROP LEAD ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id,
        });

        return internalServerErrorResponse(res, {
            message: "Failed to get drop lead",
            error: error.message,
        });
    }
}
const generateTimeSlots = (startTime, endTime, interval) => {
    const slots = [];
    let start = moment(startTime, "hh:mm A");
    const end = moment(endTime, "hh:mm A");

    while (start.isBefore(end)) {
        slots.push(start.format("hh:mm A"));
        start.add(interval, "minutes");
    }

    return slots;
};

const getScheduledAppointmentDrop = async (req, res) => {
    try {
        logger.log("[GET SCHEDULED APPOINTMENT DROP] API Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });
        const { service } = req.body;


        let serviceIds = [];

        if (Array.isArray(service)) {
            serviceIds = service.flatMap(serviceString =>
                serviceString.split(',')
                    .map(id => id.trim())
                    .filter(id => id && mongoose.Types.ObjectId.isValid(id))
            );
        } else if (typeof service === 'string') {
            serviceIds = service
                .split(',')
                .map(id => id.trim())
                .filter(id => id && mongoose.Types.ObjectId.isValid(id));
        }

        const services = await SERVICES.find({ _id: { $in: serviceIds } });
        const [monthSettings, dropOffCapacity, calendarNote, capacityBlockers] = await Promise.all([
            MISC_SETTINGS.findOne({ garage_id: _id }),
            DROP_OFF_CAPACITY.findOne({ garage_id: _id }),
            CALENDAR_NOTE.findOne({ garage_id: _id }),
            CAPACITY_BLOCKERS.find({ garage_id: _id, is_enable: true }),
        ]);

        let totalEstimatedTime = 0;

        if (monthSettings?.is_use_single_service_duration) {
            totalEstimatedTime = services
                .filter(service => service.is_dropoff)
                .reduce((sum, service) => sum + (parseInt(service.estimated_minutes) || 0), 0);
        } else {
            totalEstimatedTime = Math.max(
                ...services.map(service => parseInt(service.estimated_minutes) || 0)
            );
        }

        // If none found, fallback to your default interval
        const finalInterval = totalEstimatedTime > 0 ? totalEstimatedTime : 30;

        if (!monthSettings || !dropOffCapacity || !calendarNote) {
            return badRequestResponse(res, {
                message: "Missing MISC_SETTINGS, DROP_OFF_CAPACITY, or CALENDAR_NOTE"
            });
        }

        const istOffset = "+05:30";
        const interval = parseInt(dropOffCapacity?.automatic_appointment_times?.timeslot_interval || 30);
        const schedulingHours = dropOffCapacity?.automatic_appointment_times?.scheduling_hours || [];
        const textTimeslots = dropOffCapacity?.automatic_appointment_times?.text_timeslot || [];
        const notes = calendarNote?.drop_off || "";

        const disabledDates = [];

        // Block specific dates globally based on blockers
        capacityBlockers.forEach(blocker => {
            const blockFor = parseInt(blocker?.block_for_days?.value || 0);
            const blockAfter = parseInt(blocker?.block_after_days?.value || 0);

            if (!isNaN(blockFor) && !isNaN(blockAfter)) {
                const blockStartDate = moment().add(blockAfter, "days");
                for (let i = 0; i < blockFor; i++) {
                    const dateStr = blockStartDate.clone().add(i, "days").format("YYYY-MM-DD");
                    if (!disabledDates.includes(dateStr)) {
                        disabledDates.push(dateStr);
                    }
                }
            }
        });

        const monthCount = parseInt(monthSettings?.booking_window || 1);
        const startDate = moment().utcOffset(istOffset).startOf("day");
        const endDate = moment(startDate).add(monthCount, "months").startOf("month").subtract(1, "day");

        const availability = [];

        let currentDate = startDate.clone();
        while (currentDate.isSameOrBefore(endDate, "day")) {
            const dateStr = currentDate.format("YYYY-MM-DD");
            const dayName = currentDate.format("dddd").toLowerCase();
            const isGloballyBlocked = disabledDates.includes(dateStr);

            let slots = [];

            const schedule = schedulingHours.find(h =>
                h.day.toLowerCase() === dayName && h.is_closed === false
            );

            if (
                schedule &&
                !isGloballyBlocked &&
                dropOffCapacity.mode === "automatic" &&
                dropOffCapacity.automatic_appointment_times?.is_show_dropoff
            ) {
                // Generate slots
                slots = generateTimeSlots(schedule.start, schedule.end, interval);

                // Apply time-based blockers
                capacityBlockers.forEach(blocker => {
                    if (!["dropoff", "all"].includes(blocker.apply_to_appointment_types)) return;

                    const {
                        days_of_week,
                        start_time: blockStart,
                        end_time: blockEnd,
                    } = blocker;

                    const isDayBlocked = Array.isArray(days_of_week) && days_of_week.includes(dayName);
                    if (isDayBlocked) {
                        console.log(`[BLOCKER HIT] ${dateStr} (${dayName}) blocked by`, blocker);
                    }
                    if (isDayBlocked) {
                        // Block slots within a time range
                        if (blockStart && blockEnd) {
                            const blockStartTime = moment(blockStart, "hh:mm A");
                            const blockEndTime = moment(blockEnd, "hh:mm A");

                            slots = slots.filter(slot => {
                                const slotTime = moment(slot, "hh:mm A");
                                return slotTime.isBefore(blockStartTime) || slotTime.isSameOrAfter(blockEndTime);
                            });
                        }

                        // If full day blocked (repeating) and no time specified
                        if ((!blockStart || !blockEnd)) {
                            slots = [];
                        }
                    }
                });

                // Format slots with time + date
                slots = slots.map((slot, index) => {
                    const start = moment(`${dateStr} ${slot}`, "YYYY-MM-DD hh:mm A").utcOffset(istOffset);
                    return {
                        id: `${dateStr}-${index}`,
                        label: slot,
                        start: start.toISOString(),
                        end: start.clone().add(interval, "minutes").toISOString()
                    };
                });
                const formattedTextSlots = textTimeslots.map((textSlot, index) => {
                    const start = moment(`${dateStr} ${textSlot.time}`, "YYYY-MM-DD hh:mm A").utcOffset(istOffset);
                    return {
                        id: `${dateStr}-text-${index}`,
                        label: textSlot.text,
                        start: start.toISOString(),
                        end: start.clone().add(interval, "minutes").toISOString(),
                        is_text_timeslot: true,
                        is_always_available: textSlot.is_always_available,
                        text_slot_id: textSlot._id?.toString(),
                    };
                });

                slots = [...slots, ...formattedTextSlots];
            } else if (schedule &&
                !isGloballyBlocked &&
                dropOffCapacity.mode === "automatic" &&
                dropOffCapacity.automatic_appointment_times?.is_show_dropoff === false) {
                const notes = calendarNote?.drop_off || "";

                slots = [
                    {
                        id: `${dateStr}-note`,
                        label: notes,
                        start: null,
                        end: null,
                    }
                ];
            } else if (schedule &&
                !isGloballyBlocked &&
                dropOffCapacity.mode === "manual") {
                const manualSchedule = dropOffCapacity?.manual_appointment_times?.scheduling_time || [];
                const manualDaySchedule = manualSchedule.find(d => d.day.toLowerCase() === dayName);

                if (manualDaySchedule && manualDaySchedule.timings.length > 0) {
                    const hasRepeatingBlocker = capacityBlockers.some(blocker => {
                        return (
                            ["dropoff", "all"].includes(blocker.apply_to_appointment_types) &&
                            Array.isArray(blocker.days_of_week) &&
                            blocker.days_of_week.includes(dayName) &&
                            (!blocker.start_time || !blocker.end_time)
                        );
                    });

                    if (!hasRepeatingBlocker) {
                        slots = manualDaySchedule.timings.map((slot, index) => {
                            const start = moment(`${dateStr} ${slot.label}`, "YYYY-MM-DD hh:mm A").utcOffset(istOffset);
                            const safeInterval = (finalInterval && !isNaN(finalInterval) && finalInterval > 0) ? finalInterval : 30;
                            const end = start.clone().add(safeInterval, "minutes");
                            return {
                                id: `${dateStr}-${index}`,
                                label: slot.label,
                                start: start.format("YYYY-MM-DD hh:mm A"),
                                end: end.format("YYYY-MM-DD hh:mm A")
                            };
                        });

                    } else {
                        // Full-day blocker applies, so no slots
                        slots = [];
                    }
                }
            }

            availability.push({
                date: dateStr,
                timeslots: slots
            });

            currentDate.add(1, "day");
        }

        return successResponse(res, {
            message: "Drop lead fetched successfully",
            month: monthSettings.booking_window,
            availability,
            notes,
        });

    } catch (error) {
        logger.error(`[GET SCHEDULED APPOINTMENT DROP ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id,
        });
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
            error: error.message || "Unknown error",
        });
    }
};
const getScheduledAppointmentWaiter = async (req, res) => {
    try {
        logger.log("[GET SCHEDULED APPOINTMENT Waiter] API Called");
        const { _id } = req.user;

        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });
        const { service } = req.body;

        let serviceIds = [];

        if (Array.isArray(service)) {
            serviceIds = service.flatMap(serviceString =>
                serviceString.split(',')
                    .map(id => id.trim())
                    .filter(id => id && mongoose.Types.ObjectId.isValid(id))
            );
        } else if (typeof service === 'string') {
            serviceIds = service
                .split(',')
                .map(id => id.trim())
                .filter(id => id && mongoose.Types.ObjectId.isValid(id));
        }

        const services = await SERVICES.find({ _id: { $in: serviceIds } });
        const [monthSettings, waiterCapacity, calendarNote, capacityBlockers] = await Promise.all([
            MISC_SETTINGS.findOne({ garage_id: _id }),
            WAITER_CAPACITY.findOne({ garage_id: _id }),
            CALENDAR_NOTE.findOne({ garage_id: _id }),
            CAPACITY_BLOCKERS.find({ garage_id: _id, is_enable: true }),
        ]);

        if (!monthSettings || !waiterCapacity || !calendarNote) {

            return badRequestResponse(res, {
                message: "Missing MISC_SETTINGS, WAITER_CAPACITY, or CALENDAR_NOTE"
            });
        }
        let totalEstimatedTime = 0;
        if (monthSettings?.is_use_single_service_duration) {
            totalEstimatedTime = services
                .filter(service => service.is_waiter)
                .reduce((sum, service) => sum + (parseInt(service.estimated_minutes) || 0), 0);
        } else {
            totalEstimatedTime = Math.max(
                ...services.map(service => parseInt(service.estimated_minutes) || 0)
            );
        }


        // If none found, fallback to your default interval
        const finalInterval = totalEstimatedTime > 0 ? totalEstimatedTime : 30;

        const istOffset = "+05:30";
        const interval = parseInt(waiterCapacity?.automatic_appointment_times?.timeslot_interval || 30);
        const schedulingHours = waiterCapacity?.automatic_appointment_times?.scheduling_hours || [];
        const textTimeslots = waiterCapacity?.automatic_appointment_times?.text_timeslot || [];
        const notes = calendarNote?.waiter || "";

        const disabledDates = [];

        // Block specific dates globally based on blockers
        capacityBlockers.forEach(blocker => {
            const blockFor = parseInt(blocker?.block_for_days?.value || 0);
            const blockAfter = parseInt(blocker?.block_after_days?.value || 0);

            if (!isNaN(blockFor) && !isNaN(blockAfter)) {
                const blockStartDate = moment().add(blockAfter, "days");
                for (let i = 0; i < blockFor; i++) {
                    const dateStr = blockStartDate.clone().add(i, "days").format("YYYY-MM-DD");
                    if (!disabledDates.includes(dateStr)) {
                        disabledDates.push(dateStr);
                    }
                }
            }
        });

        const monthCount = parseInt(monthSettings?.booking_window || 1);
        const startDate = moment().utcOffset(istOffset).startOf("day");
        const endDate = moment(startDate).add(monthCount, "months").startOf("month").subtract(1, "day");

        const availability = [];

        let currentDate = startDate.clone();
        while (currentDate.isSameOrBefore(endDate, "day")) {
            const dateStr = currentDate.format("YYYY-MM-DD");
            const dayName = currentDate.format("dddd").toLowerCase();
            const isGloballyBlocked = disabledDates.includes(dateStr);

            let slots = [];

            const schedule = schedulingHours.find(h =>
                h.day.toLowerCase() === dayName && h.is_closed === false
            );

            if (
                schedule &&
                !isGloballyBlocked &&
                waiterCapacity.mode === "automatic"
            ) {
                // Generate slots
                slots = generateTimeSlots(schedule.start, schedule.end, interval);

                // Apply time-based blockers
                capacityBlockers.forEach(blocker => {
                    if (!["waiter", "all"].includes(blocker.apply_to_appointment_types)) return;

                    const {
                        days_of_week,
                        start_time: blockStart,
                        end_time: blockEnd,
                    } = blocker;

                    const isDayBlocked = Array.isArray(days_of_week) && days_of_week.includes(dayName);
                    if (isDayBlocked) {
                        console.log(`[BLOCKER HIT] ${dateStr} (${dayName}) blocked by`, blocker);
                    }
                    if (isDayBlocked) {
                        // Block slots within a time range
                        if (blockStart && blockEnd) {
                            const blockStartTime = moment(blockStart, "hh:mm A");
                            const blockEndTime = moment(blockEnd, "hh:mm A");

                            slots = slots.filter(slot => {
                                const slotTime = moment(slot, "hh:mm A");
                                return slotTime.isBefore(blockStartTime) || slotTime.isSameOrAfter(blockEndTime);
                            });
                        }

                        // If full day blocked (repeating) and no time specified
                        if ((!blockStart || !blockEnd)) {
                            slots = [];
                        }
                    }
                });

                // Format slots with time + date
                slots = slots.map((slot, index) => {
                    const start = moment(`${dateStr} ${slot}`, "YYYY-MM-DD hh:mm A").utcOffset(istOffset);
                    return {
                        id: `${dateStr}-${index}`,
                        label: slot,
                        start: start.toISOString(),
                        end: start.clone().add(interval, "minutes").toISOString()
                    };
                });
                const formattedTextSlots = textTimeslots.map((textSlot, index) => {
                    const start = moment(`${dateStr} ${textSlot.time}`, "YYYY-MM-DD hh:mm A").utcOffset(istOffset);
                    return {
                        id: `${dateStr}-text-${index}`,
                        label: textSlot.text,
                        start: start.toISOString(),
                        end: start.clone().add(interval, "minutes").toISOString(),
                        is_text_timeslot: true,
                        is_always_available: textSlot.is_always_available,
                        text_slot_id: textSlot._id?.toString(),
                    };
                });

                slots = [...slots, ...formattedTextSlots];
            } else if (schedule &&
                !isGloballyBlocked &&
                waiterCapacity.mode === "manual") {
                const manualSchedule = waiterCapacity?.manual_appointment_times?.scheduling_time || [];
                const manualDaySchedule = manualSchedule.find(d => d.day.toLowerCase() === dayName);

                if (manualDaySchedule && manualDaySchedule.timings.length > 0) {
                    const hasRepeatingBlocker = capacityBlockers.some(blocker => {
                        return (
                            ["waiter", "all"].includes(blocker.apply_to_appointment_types) &&
                            Array.isArray(blocker.days_of_week) &&
                            blocker.days_of_week.includes(dayName) &&
                            (!blocker.start_time || !blocker.end_time)
                        );
                    });

                    if (!hasRepeatingBlocker) {
                        slots = manualDaySchedule.timings.map((slot, index) => {
                            const start = moment(`${dateStr} ${slot.label}`, "YYYY-MM-DD hh:mm A").utcOffset(istOffset);
                            const safeInterval = (finalInterval && !isNaN(finalInterval) && finalInterval > 0) ? finalInterval : 30;
                            const end = start.clone().add(safeInterval, "minutes");
                            return {
                                id: `${dateStr}-${index}`,
                                label: slot.label,
                                start: start.format("YYYY-MM-DD hh:mm A"),
                                end: end.format("YYYY-MM-DD hh:mm A")
                            };
                        });
                    } else {
                        // Full-day blocker applies, so no slots
                        slots = [];
                    }
                }
            }

            availability.push({
                date: dateStr,
                timeslots: slots
            });

            currentDate.add(1, "day");
        }

        return successResponse(res, {
            message: "Waiter lead fetched successfully",
            month: monthSettings.booking_window,
            availability,
            notes

        });

    } catch (error) {
        logger.error(`[GET SCHEDULED APPOINTMENT WAITER ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id,
        });
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
            error: error.message || "Unknown error",
        });
    }
};


export default { getCalendarBlockers, getAppointmentOptions, getScheduledAppointmentDrop, getScheduledAppointmentWaiter }
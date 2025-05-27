
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
import GARAGE from "../../../models/garage.js";
import DROP_OFF_WAITING from "../../../models/scheduling-tools/dropoffWaiting.js";
import CALENDAR_NOTE from "../../../models/scheduling-tools/calendarNote.js";
import Logger from "../../../middleware/logger.js";
const logger = new Logger("garage/scheduling-tools/dropOfWaitingController.js")

const createOrUpdateDropoffWaiting = async (req, res) => {
    try {
        logger.log("[UPDATE DROPOFF WAITING] API Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);

        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        const updateData = {
            waiter: req.body.waiter,
            waiter_disabled: req.body.waiter_disabled,
            drop_off: req.body.drop_off,
            drop_off_disabled: req.body.drop_off_disabled,
            pickup: req.body.pickup,
        };
        const dropoffWaiting = await DROP_OFF_WAITING.updateOne(
            { garage_id: _id },
            { $set: updateData },
            { upsert: true, new: true }
        );
        return successResponse(res, {
            message: 'Drop-off waiting record updated successfully',
            payload: { dropoffWaiting }
        });
    } catch (error) {
        logger.error(`[UPDATE DROPOFF WAITING ERROR] ${error.message}`, { error });
        return internalServerErrorResponse(res, {
            message: 'Failed to update drop-off waiting record',
            error: error.message,
        });
    }
};


const getDropoffWaiting = async (req, res) => {
    try {
        logger.log("[GET DROPOFF WAITING]  Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })

        let dropoffWaiting = await DROP_OFF_WAITING.findOne({ garage_id: _id });

        return successResponse(res, {
            message: "Drop-off waiting fetched successfully",
            payload: {
                dropoffWaiting
            },
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }
};


//calendar note
const createOrUpdateCalendarNote = async (req, res) => {
    try {
        logger.log("[UPDATE CALENDAR NOTE] API Called");

        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);

        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        const updateData = {
            waiter: req.body.waiter,
            drop_off: req.body.drop_off,
            pickup: req.body.pickup,
        };
        const calendarNote = await CALENDAR_NOTE.updateOne(
            { garage_id: _id },
            { $set: updateData },
            { upsert: true, new: true }
        );

        return successResponse(res, {
            message: 'Calendar note record updated successfully',
            payload: { calendarNote }
        });
    } catch (error) {
        logger.error(`[UPDATE CALENDAR NOTE ERROR] ${error.message}`, { error });
        return internalServerErrorResponse(res, {
            message: 'Failed to update calendar note record',
            error: error.message,
        });
    }
};
const getCalendarNote = async (req, res) => {
    try {
        logger.log("[GET CALENDAR NOTE]  Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })

        let calendarNote = await CALENDAR_NOTE.findOne({ garage_id: _id });

        return successResponse(res, {
            message: "Calendar note fetched successfully",
            payload: {
                calendarNote
            },
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }
};

export default { createOrUpdateDropoffWaiting, getDropoffWaiting, createOrUpdateCalendarNote, getCalendarNote }
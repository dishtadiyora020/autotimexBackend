import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
import GARAGE from "../../../models/garage.js";
import CONFIRM_BOOKING from "../../../models/scheduling-tools/confirmBooking.js";
import SUCCESS_BOOKING from "../../../models/scheduling-tools/successBooking.js";
import Logger from "../../../middleware/logger.js";
const logger = new Logger("garage/scheduling-tools/transportationOptionsController.js");


const createOrUpdateConfirmBooking = async (req, res) => {
    try {
        logger.log("[UPDATE CONFIRM BOOKING] API Called");

        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);

        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        const updateData = {
            waiter_mobile_repair: req.body.waiter_mobile_repair || [],
            drop_off: req.body.drop_off || [],
            pickup: req.body.pickup || [],
            destination_url: req.body.destination_url || '',
            is_open_url_new_tab: req.body.is_open_url_new_tab !== undefined ? req.body.is_open_url_new_tab : true
        };

        const confirmBooking = await CONFIRM_BOOKING.updateOne(
            { garage_id: _id },
            { $set: updateData },
            { upsert: true, new: true }
        );

        return successResponse(res, {
            message: 'Confirm booking updated successfully'
        });
    } catch (error) {
        logger.error(`[UPDATE CONFIRM BOOKING ERROR] ${error.message}`, { error });
        return internalServerErrorResponse(res, {
            message: 'Failed to update confirm booking record',
            error: error.message,
        });
    }
};
const getConfirmBooking = async (req, res) => {
    try {
        logger.log("[GET CONFIRM BOOKING]  Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })

        let confirmBooking = await CONFIRM_BOOKING.findOne({ garage_id: _id });

        return successResponse(res, {
            message: "Confirm booking fetched successfully",
            payload: {
                confirmBooking
            },
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }
};


// success booking
const createOrUpdateSuccessBooking = async (req, res) => {
    try {
        logger.log("[UPDATE SUCCESS BOOKING] API Called");

        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);

        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        const updateData = req.body;
        const successBooking = await SUCCESS_BOOKING.updateOne(
            { garage_id: _id },
            { $set: updateData },
            { upsert: true, new: true }
        );

        return successResponse(res, {
            message: 'Success booking updated successfully'
        });
    } catch (error) {
        logger.error(`[UPDATE SUCCESS BOOKING ERROR] ${error.message}`, { error });
        return internalServerErrorResponse(res, {
            message: 'Failed to update Success booking record',
            error: error.message,
        });
    }
};

const getSuccessBooking = async (req, res) => {
    try {
        logger.log("[GET SUCCESS BOOKING]  Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })

        let successBooking = await SUCCESS_BOOKING.findOne({ garage_id: _id });

        return successResponse(res, {
            message: "Success booking fetched successfully",
            payload: {
                successBooking
            },
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }
};

export default { createOrUpdateConfirmBooking, getConfirmBooking, createOrUpdateSuccessBooking, getSuccessBooking }
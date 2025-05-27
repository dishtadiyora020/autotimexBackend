
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
import GARAGE from "../../../models/garage.js";
import TRANSPORTATION_OPTIONS from "../../../models/scheduling-tools/transportationOptions.js";
import Logger from "../../../middleware/logger.js";
const logger = new Logger("garage/scheduling-tools/transportationOptionsController.js");


const createOrUpdateTransportationOptions = async (req, res) => {
    try {
        logger.log("[UPDATE TRANSPORTATION OPTIONS] API Called");

        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);

        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        const updateData = {
            is_enable: req.body.is_enable,
            request_options: req.body.request_options,
            hours: req.body.hours,
        };

        const transportationOptions = await TRANSPORTATION_OPTIONS.updateOne(
            { garage_id: _id },
            { $set: updateData },
            { upsert: true, new: true }
        );

        return successResponse(res, {
            message: 'Transportation options record updated successfully',
        });
    } catch (error) {
        logger.error(`[UPDATE TRANSPORTATION OPTIONS ERROR] ${error.message}`, { error });
        return internalServerErrorResponse(res, {
            message: 'Failed to update transportation options record',
            error: error.message,
        });
    }
};


const getTransportationOptions = async (req, res) => {
    try {
        logger.log("[GET CUSTOMER TOOL]  Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })

        let transportationOptions = await TRANSPORTATION_OPTIONS.findOne({ garage_id: _id });
        const defaultTransportationOptions = {
            is_enable: false,
            request_options: [],
            hours: [
                { day: "Monday", is_available: false },
                { day: "Tuesday", is_available: false },
                { day: "Wednesday", is_available: false },
                { day: "Thursday", is_available: false },
                { day: "Friday", is_available: false },
                { day: "Saturday", is_available: false },
                { day: "Sunday", is_available: false },
            ],
        }
        return successResponse(res, {
            message: "Transportation options fetched successfully",
            payload: {
                transportationOptions: transportationOptions ? transportationOptions : defaultTransportationOptions
            },
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }
};

export default { createOrUpdateTransportationOptions, getTransportationOptions }
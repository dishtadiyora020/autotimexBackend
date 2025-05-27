
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
import GARAGE from "../../../models/garage.js";
import LEAD_CAPTURE from "../../../models/scheduling-tools/leadCapture.js";
import Logger from "../../../middleware/logger.js";
const logger = new Logger("garage/scheduling-tools/leadCaptureController.js");


const createOrUpdateLeadCapture = async (req, res) => {
    try {
        logger.log("[UPDATE LEAD CAPTURE] API Called");

        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);

        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        const updateData = req.body;
        const LeadCapture = await LEAD_CAPTURE.updateOne(
            { garage_id: _id },
            { $set: updateData },
            { upsert: true, new: true }
        );

        return successResponse(res, {
            message: 'Lead capture updated successfully'
        });
    } catch (error) {
        logger.error(`[UPDATE LEAD CAPTURE ERROR] ${error.message}`, { error });
        return internalServerErrorResponse(res, {
            message: 'Failed to update Lead capture record',
            error: error.message,
        });
    }
};

const getLeadCapture = async (req, res) => {
    try {
        logger.log("[GET LEAD CAPTURE]  Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })

        let LeadCapture = await LEAD_CAPTURE.findOne({ garage_id: _id });

        return successResponse(res, {
            message: "Lead capture fetched successfully",
            payload: {
                LeadCapture
            },
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }
};




export default { createOrUpdateLeadCapture , getLeadCapture}
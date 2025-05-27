import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
import GARAGE from "../../../models/garage.js";
import Logger from "../../../middleware/logger.js";
const logger = new Logger("garage/scheduling-tools/sourceTrackingSettingController");
import SOURCE_TRACKING_SETTING from "../../../models/scheduling-tools/sourceTrackingSetting.js";

const updateTrackingSettings = async (req, res) => {
    try {
        logger.log("[UPDATE TRACKING SETTINGS]  Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) {
            return badRequestResponse(res, {
                message: "Garage not found"
            });
        }
        // Get the field to update
        const fieldToUpdate = Object.keys(req.body)[0];
        const valueToUpdate = req.body[fieldToUpdate];
        // Upsert operation
        const updatedSettings = await SOURCE_TRACKING_SETTING.findOneAndUpdate(
            { garage_id: _id },
            { $set: { [fieldToUpdate]: valueToUpdate } },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        return successResponse(res, {
            message: 'Tracking settings updated successfully'
        });

    } catch (error) {
        logger.error(`[TRACKING SETTINGS ERROR] ${error.message}`, { error });
        return internalServerErrorResponse(res, {
            message: 'Failed to update tracking settings',
            error: error.message
        });
    }
};


const getTrackingSettings = async (req, res) => {
    try {
        logger.log("[GET TRACKING SETTINGS]  Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })

        let trackingSettings = await SOURCE_TRACKING_SETTING.findOne({ garage_id: _id }).select({
            garage_id: 0,
            _id: 0,
            updated_at: 0,
            created_at: 0
        });

        return successResponse(res, {
            message: "Tracking settings fetched successfully",
            payload: {
                trackingSettings
            },
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }
};
export default { updateTrackingSettings, getTrackingSettings }
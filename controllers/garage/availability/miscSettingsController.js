import GARAGE from "../../../models/garage.js"
import MISC_SETTINGS from "../../../models/availability/miscSettings.js"
import Logger from "../../../middleware/logger.js";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
const logger = new Logger("garage/calendarSettings/miscSettingsController.js")

const updateMiscSettings = async (req, res) => {
    try {
        logger.log("[UPDATE MISC SETTINGS] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        await MISC_SETTINGS.updateOne({ garage_id: _id }, { $set: { ...req.body } }, { upsert: true })
        return successResponse(res, { message: "Misc settings updated successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getMiscSettings = async (req, res) => {
    try {
        logger.log("[GET MISC SETTINGS] Api Called")
        const { _id } = req.user
        const miscSettings = await MISC_SETTINGS.findOne({ garage_id: _id }).select('-garage_id')
        return successResponse(res, { message: "Misc settings fetched successfully", payload: miscSettings })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

export default { updateMiscSettings, getMiscSettings }
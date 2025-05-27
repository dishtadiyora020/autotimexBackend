import GARAGE from "../../../models/garage.js"
import CALENDAR_GENERAL_SETTINGS from "../../../models/calendar-settings/generalSettings.js"
import Logger from "../../../middleware/logger.js";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
const logger = new Logger("garage/calendarSettings/generalSettingsController.js")

const updateGeneralSettings = async (req, res) => {
    try {
        logger.log("[UPDATE GENERAL SETTINGS] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        await CALENDAR_GENERAL_SETTINGS.updateOne({ garage_id: _id }, { $set: req.body }, { upsert: true })
        return successResponse(res, { message: "General settings updated successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getGeneralSettings = async (req, res) => {
    try {
        logger.log("[GET GENERAL SETTINGS] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const generalSettings = await CALENDAR_GENERAL_SETTINGS.findOne({ garage_id: _id }).select('-garage_id')
        return successResponse(res, { message: "General settings fetched successfully", payload: { generalSettings } })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

export default { updateGeneralSettings, getGeneralSettings }
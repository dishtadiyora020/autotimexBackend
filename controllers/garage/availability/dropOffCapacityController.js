import GARAGE from "../../../models/garage.js"
import DROPOFF_CAPACITY from "../../../models/availability/dropOffCapacity.js"
import Logger from "../../../middleware/logger.js";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
const logger = new Logger("garage/calendarSettings/dropOffCapacityController.js")

const updateDropOffCapacity = async (req, res) => {
    try {
        logger.log("[UPDATE DROP OFF CAPACITY] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        await DROPOFF_CAPACITY.updateOne({ garage_id: _id }, { $set: { ...req.body } }, { upsert: true })
        return successResponse(res, { message: "Drop Off capacity updated successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getDropOffCapacity = async (req, res) => {
    try {
        logger.log("[GET DROP OFF CAPACITY] Api Called")
        const { _id } = req.user
        const dropOffCapacity = await DROPOFF_CAPACITY.findOne({ garage_id: _id })
        return successResponse(res, { message: "Drop Off capacity fetched successfully", payload: dropOffCapacity })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

export default { updateDropOffCapacity, getDropOffCapacity }
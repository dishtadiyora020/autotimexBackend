import GARAGE from "../../../models/garage.js"
import WAITER_CAPACITY from "../../../models/availability/waiterCapacity.js"
import Logger from "../../../middleware/logger.js";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
const logger = new Logger("garage/calendarSettings/waiterCapacityController.js")

const updateWaiterCapacity = async (req, res) => {
    try {
        logger.log("[UPDATE WAITER CAPACITY] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        await WAITER_CAPACITY.updateOne({ garage_id: _id }, { $set: { ...req.body } }, { upsert: true })
        return successResponse(res, { message: "Waiter capacity updated successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getWaiterCapacity = async (req, res) => {
    try {
        logger.log("[GET WAITER CAPACITY] Api Called")
        const { _id } = req.user
        const waiterCapacity = await WAITER_CAPACITY.findOne({ garage_id: _id })
        return successResponse(res, { message: "Waiter capacity fetched successfully", payload: waiterCapacity })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

export default { updateWaiterCapacity, getWaiterCapacity }
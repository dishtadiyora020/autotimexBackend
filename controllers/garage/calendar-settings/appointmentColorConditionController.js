import GARAGE from "../../../models/garage.js"
import APPOINTMENT_COLOR_CONDITIONS from "../../../models/calendar-settings/appointmentColorCondition.js"
import COLOR_OPTIONS from "../../../models/calendar-settings/colorOptions.js"
import Logger from "../../../middleware/logger.js";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
import mongoose from "mongoose";
const logger = new Logger("garage/calendarSettings/appointmentColorConditionController.js")

const getAppointmentColorConditions = async (req, res) => {
    try {
        logger.log("[GET APPOINTMENT COLOR CONDITIONS] Api Called")
        const { _id } = req.user
        const appointmentColorConditions = await APPOINTMENT_COLOR_CONDITIONS.find({ garage_id: _id }).populate("color_id").select('-garage_id').sort({ index: 1 })
        return successResponse(res, {
            message: "Appointment color conditions fetched successfully",
            payload: { appointment_color_conditions: appointmentColorConditions || [] }
        })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const createAppointmentColorCondition = async (req, res) => {
    try {
        logger.log("[CREATE APPOINTMENT COLOR CONDITION] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const colorOption = await COLOR_OPTIONS.findOne({ garage_id: _id, _id: new mongoose.Types.ObjectId(req.body.color_id) })
        if (!colorOption) return badRequestResponse(res, { message: "Color option not found" })
        const appointmentColorCondition = new APPOINTMENT_COLOR_CONDITIONS({
            garage_id: _id,
            ...req.body
        })
        await appointmentColorCondition.save()
        return successResponse(res, { message: "Appointment color condition created successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const updateAppointmentColorCondition = async (req, res) => {
    try {
        logger.log("[UPDATE APPOINTMENT COLOR CONDITION] Api Called")
        const existingConditions = await APPOINTMENT_COLOR_CONDITIONS
            .find({ garage_id: req.user._id })
            .select('_id')
            .lean();

        const incomingConditionIds = req.body.color_conditions.map(condition =>
            condition._id ? new mongoose.Types.ObjectId(condition._id) : null
        ).filter(id => id !== null);

        const conditionsToDelete = existingConditions
            .filter(condition => !incomingConditionIds.some(id => id.equals(condition._id)))
            .map(condition => condition._id);

        const bulkOperations = [];

        req.body.color_conditions.forEach((colorCondition, index) => {
            const { _id, ...colorConditionsWithoutID } = colorCondition;
            bulkOperations.push({
                updateOne: {
                    filter: {
                        _id: _id ? new mongoose.Types.ObjectId(_id) : new mongoose.Types.ObjectId(),
                        garage_id: req.user._id
                    },
                    update: { $set: { ...colorConditionsWithoutID, index } },
                    upsert: true
                }
            });
        });

        conditionsToDelete.forEach((conditionId) => {
            bulkOperations.push({
                deleteOne: {
                    filter: {
                        _id: conditionId,
                        garage_id: req.user._id
                    }
                }
            });
        });

        if (bulkOperations.length > 0) {
            await APPOINTMENT_COLOR_CONDITIONS.bulkWrite(bulkOperations);
        }

        return successResponse(res, {
            message: "Appointment color conditions updated successfully"
        });
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getAppointmentColorConditionById = async (req, res) => {
    try {
        logger.log("[UPDATE APPOINTMENT COLOR CONDITION] Api Called")
        const { appointment_color_condition_id } = req.params
        const appointmentColorCondition = await APPOINTMENT_COLOR_CONDITIONS.findOne({ _id: appointment_color_condition_id, garage_id: req.user._id }).populate("color_id").select('-garage_id')
        if (!appointmentColorCondition) return badRequestResponse(res, { message: "Appointment color condition not found" })
        return successResponse(res, {
            message: "Appointment color condition get successfully",
            payload: { appointment_color_condition: appointmentColorCondition }
        })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const deleteAppointmentColorCondition = async (req, res) => {
    try {
        logger.log("[DELETE APPOINTMENT COLOR CONDITION] Api Called")
        const { appointment_color_condition_id } = req.params
        const appointmentColorCondition = await APPOINTMENT_COLOR_CONDITIONS.findOne({ _id: appointment_color_condition_id, garage_id: req.user._id })
        if (!appointmentColorCondition) return badRequestResponse(res, { message: "Appointment color condition not found" })
        await APPOINTMENT_COLOR_CONDITIONS.findOneAndDelete(appointment_color_condition_id)
        return successResponse(res, { message: "Appointment color condition deleted successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

export default { getAppointmentColorConditions, createAppointmentColorCondition, updateAppointmentColorCondition, getAppointmentColorConditionById, deleteAppointmentColorCondition }
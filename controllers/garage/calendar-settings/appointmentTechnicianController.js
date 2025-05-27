import mongoose from "mongoose"
import Logger from "../../../middleware/logger.js"
import { internalServerErrorResponse, successResponse } from "../../../middleware/responses.js"
import APPOINTMENT_TECHNICIAN_CONDITIONS from "../../../models/calendar-settings/appointmentTechnicianCondition.js"

const logger = new Logger("garage/calendarSettings/appointmentTechnicianConditionController.js")
const updateAppointmentTechnicianCondition = async (req, res) => {
    try {
        logger.log("[UPDATE APPOINTMENT COLOR CONDITION] Api Called")
        const existingConditions = await APPOINTMENT_TECHNICIAN_CONDITIONS
            .find({ garage_id: req.user._id })
            .select('_id')
            .lean();

        const incomingConditionIds = req.body.appointment_technician_conditions.map(condition =>
            condition._id ? new mongoose.Types.ObjectId(condition._id) : null
        ).filter(id => id !== null);

        const conditionsToDelete = existingConditions
            .filter(condition => !incomingConditionIds.some(id => id.equals(condition._id)))
            .map(condition => condition._id);

        const bulkOperations = [];

        req.body.appointment_technician_conditions.forEach((colorCondition, index) => {
            const { _id, ...technicianConditionsWithoutID } = colorCondition;
            bulkOperations.push({
                updateOne: {
                    filter: {
                        _id: _id ? new mongoose.Types.ObjectId(_id) : new mongoose.Types.ObjectId(),
                        garage_id: req.user._id
                    },
                    update: { $set: { ...technicianConditionsWithoutID, index } },
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
            await APPOINTMENT_TECHNICIAN_CONDITIONS.bulkWrite(bulkOperations);
        }

        return successResponse(res, {
            message: "Appointment technician conditions updated successfully"
        });
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getAppointmentTechnicianCondition = async (req, res) => {
    try {
        logger.log("[GET APPOINTMENT TECHNICIAN CONDITIONS] Api Called")
        const { _id } = req.user
        const appointmentTechnicianConditions = await APPOINTMENT_TECHNICIAN_CONDITIONS.find({ garage_id: _id }).lean().populate("technician_id", '-garage_id').select('-garage_id -__v').sort({ index: 1 })
        return successResponse(res, {
            message: "Appointment technician conditions fetched successfully",
            payload: { appointmentTechnicianConditions }
        })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

export default { updateAppointmentTechnicianCondition, getAppointmentTechnicianCondition }
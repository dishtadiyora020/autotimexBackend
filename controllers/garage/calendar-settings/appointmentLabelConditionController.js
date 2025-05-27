import mongoose from "mongoose"
import Logger from "../../../middleware/logger.js"
import { internalServerErrorResponse, successResponse } from "../../../middleware/responses.js"
import APPOINTMENT_LABEL_CONDITIONS from "../../../models/calendar-settings/appointmentLabelCondition.js"

const logger = new Logger("garage/calendarSettings/appointmentLabelConditionController.js")
const updateAppointmentLabelCondition = async (req, res) => {
    try {
        logger.log("[UPDATE APPOINTMENT COLOR CONDITION] Api Called")
        const existingConditions = await APPOINTMENT_LABEL_CONDITIONS
            .find({ garage_id: req.user._id })
            .select('_id')
            .lean();

        const incomingConditionIds = req.body.appointment_label_conditions.map(condition =>
            condition._id ? new mongoose.Types.ObjectId(condition._id) : null
        ).filter(id => id !== null);

        const conditionsToDelete = existingConditions
            .filter(condition => !incomingConditionIds.some(id => id.equals(condition._id)))
            .map(condition => condition._id);

        const bulkOperations = [];

        req.body.appointment_label_conditions.forEach((colorCondition) => {
            const { _id, ...labelConditionsWithoutID } = colorCondition;
            bulkOperations.push({
                updateOne: {
                    filter: {
                        _id: _id ? new mongoose.Types.ObjectId(_id) : new mongoose.Types.ObjectId(),
                        garage_id: req.user._id
                    },
                    update: { $set: { ...labelConditionsWithoutID } },
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
            await APPOINTMENT_LABEL_CONDITIONS.bulkWrite(bulkOperations);
        }

        return successResponse(res, {
            message: "Appointment job label conditions updated successfully"
        });
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getAppointmentLabelCondition = async (req, res) => {
    try {
        logger.log("[GET APPOINTMENT JOB LABEL CONDITIONS] Api Called")
        const { _id } = req.user
        const appointmentLabelConditions = await APPOINTMENT_LABEL_CONDITIONS.find({ garage_id: _id }).lean().select('-garage_id -__v').populate("label_id")
        return successResponse(res, {
            message: "Appointment job label conditions fetched successfully",
            payload: { appointmentLabelConditions }
        })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

export default { updateAppointmentLabelCondition, getAppointmentLabelCondition }
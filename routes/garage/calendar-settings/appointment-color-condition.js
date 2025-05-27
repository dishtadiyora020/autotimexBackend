import express from 'express'
import appointmentColorConditionController from "../../../controllers/garage/calendar-settings/appointmentColorConditionController.js"
import { isUserAuthorized } from '../../../middleware/auth.js'
import { isPayloadValid } from '../../../middleware/validation.js'
import { createAppointmentColorConditionsSchema, updateAppointmentColorConditionsSchema } from '../../../validation/garage/calendar-settings/appointment-color-condition.js'

const router = express.Router()

router.get('/get-appointment-color-conditions', isUserAuthorized(['Owner', 'Shop Details']), appointmentColorConditionController.getAppointmentColorConditions)
router.get('/get-appointment-color-condition/:appointment_color_condition_id', isUserAuthorized(['Owner', 'Shop Details']), appointmentColorConditionController.getAppointmentColorConditionById)
router.post('/create-appointment-color-conditions', isUserAuthorized(['Owner', 'Shop Details']), isPayloadValid(createAppointmentColorConditionsSchema), appointmentColorConditionController.createAppointmentColorCondition)
router.put('/update-appointment-color-condition', isUserAuthorized(['Owner', 'Shop Details']), isPayloadValid(updateAppointmentColorConditionsSchema), appointmentColorConditionController.updateAppointmentColorCondition)
router.delete('/delete-appointment-color-condition/:appointment_color_condition_id', isUserAuthorized(['Owner', 'Shop Details']), appointmentColorConditionController.deleteAppointmentColorCondition)

export default router;
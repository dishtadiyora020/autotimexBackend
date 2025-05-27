import express from 'express'
import appointmentLabelConditionController from "../../../controllers/garage/calendar-settings/appointmentLabelConditionController.js"
import { isUserAuthorized } from '../../../middleware/auth.js'
import { isPayloadValid } from '../../../middleware/validation.js'
import { updateAppointmentLabelConditionsSchema } from '../../../validation/garage/calendar-settings/appointment-label-condition.js'

const router = express.Router()

router.get('/get-appointment-label-conditions', isUserAuthorized(['Owner','Shop Details']), appointmentLabelConditionController.getAppointmentLabelCondition)
router.put('/update-appointment-label-conditions', isUserAuthorized(['Owner','Shop Details']), isPayloadValid(updateAppointmentLabelConditionsSchema), appointmentLabelConditionController.updateAppointmentLabelCondition)

export default router;
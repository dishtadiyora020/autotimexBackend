import express from 'express'
import appointmentTechnicianConditionController from "../../../controllers/garage/calendar-settings/appointmentTechnicianController.js"
import { isUserAuthorized } from '../../../middleware/auth.js'
import { isPayloadValid } from '../../../middleware/validation.js'
import { updateAppointmentTechnicianConditionsSchema } from '../../../validation/garage/calendar-settings/appointment-technician-condition.js'

const router = express.Router()

router.get('/get-appointment-technician-conditions', isUserAuthorized(['Owner','Shop Details']), appointmentTechnicianConditionController.getAppointmentTechnicianCondition)
router.put('/update-appointment-technician-conditions', isUserAuthorized(['Owner','Shop Details']), isPayloadValid(updateAppointmentTechnicianConditionsSchema), appointmentTechnicianConditionController.updateAppointmentTechnicianCondition)

export default router;
import express from 'express'
import technicianController from "../../../controllers/garage/calendar-settings/technicianController.js"
import { isUserAuthorized } from '../../../middleware/auth.js'
import { isPayloadValid } from '../../../middleware/validation.js'
import { createTechnicianSchema, updateTechnicianSchema } from '../../../validation/garage/calendar-settings/technician.js'

const router = express.Router()

router.post('/create-technician', isUserAuthorized(['Owner','Shop Details']), isPayloadValid(createTechnicianSchema), technicianController.createTechnician)
router.get('/get-technicians', isUserAuthorized(['Owner','Shop Details',"Appointments", "Appointments Viewer"]), technicianController.getTechnicians)
router.put('/update-technician/:technician_id', isUserAuthorized(['Owner','Shop Details']), isPayloadValid(updateTechnicianSchema), technicianController.updateTechnician)
router.delete('/delete-technician/:technician_id', isUserAuthorized(['Owner','Shop Details']), technicianController.deleteTechnician)
router.get('/get-technician/:technician_id', isUserAuthorized(['Owner','Shop Details']), technicianController.getTechnicianByID)

export default router;
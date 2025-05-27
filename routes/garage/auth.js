import express from 'express'
import { isPayloadValid } from '../../middleware/validation.js'
import authController from '../../controllers/garage/authController.js'
import { updateGarageInfoSchema } from '../../validation/garage/auth.js'
import { isUserAuthorized } from '../../middleware/auth.js'

const router = express.Router()

router.put('/update-garage-info', isUserAuthorized(['Owner' , "Shop Details"]), isPayloadValid(updateGarageInfoSchema), authController.updateGarageInfo)
router.get('/get-garage-info', isUserAuthorized(['Owner', "Appointments", "Appointments Viewer", "Leads", "Availability", "Marketing Links", "Notifications", "Scheduling Tool", "Shop Details", "Voicemails"]), authController.getGarageInfo)
router.get('/get-member-info', isUserAuthorized(['Owner', "Appointments", "Appointments Viewer", "Leads", "Availability", "Marketing Links", "Notifications", "Scheduling Tool", "Shop Details", "Voicemails"]), authController.getGarageMemberByAuthIds)

export default router;
import express from 'express'
import { isPayloadValid } from '../../../middleware/validation.js'
import miscSettingsController from '../../../controllers/garage/availability/miscSettingsController.js'
import { isUserAuthorized } from '../../../middleware/auth.js'
import { updateMiscSettingsSchema } from '../../../validation/garage/availability/miscSettings.js'

const router = express.Router()

router.put('/update-misc-settings', isUserAuthorized(['Owner' , 'Availability']), isPayloadValid(updateMiscSettingsSchema), miscSettingsController.updateMiscSettings)
router.get('/get-misc-settings', isUserAuthorized(['Owner' , 'Availability']), miscSettingsController.getMiscSettings)

export default router;
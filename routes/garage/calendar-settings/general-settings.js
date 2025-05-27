import express from 'express'
import generalSettingsController from "../../../controllers/garage/calendar-settings/generalSettingsController.js"
import { isUserAuthorized } from '../../../middleware/auth.js'
import { isPayloadValid } from '../../../middleware/validation.js'
import { updateGeneralSettingsSchema } from '../../../validation/garage/calendar-settings/general-settings.js'

const router = express.Router()

router.get('/get-general-settings', isUserAuthorized(['Owner','Shop Details']), generalSettingsController.getGeneralSettings)
router.put('/update-general-settings', isUserAuthorized(['Owner','Shop Details']), isPayloadValid(updateGeneralSettingsSchema), generalSettingsController.updateGeneralSettings)

export default router;
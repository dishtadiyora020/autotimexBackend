import express from 'express'
import progressOptionController from "../../../controllers/garage/calendar-settings/progressOptionController.js"
import { isUserAuthorized } from '../../../middleware/auth.js'
import { isPayloadValid } from '../../../middleware/validation.js'
import { createProgressOptionsSchema, updateProgressOptionsSchema } from '../../../validation/garage/calendar-settings/progress-option.js'

const router = express.Router()

router.post('/create-progress-option', isUserAuthorized(['Owner', 'Shop Details']), isPayloadValid(createProgressOptionsSchema), progressOptionController.createProgressOption)
router.get('/get-progress-options', isUserAuthorized(['Owner', 'Shop Details' , "Appointments", "Appointments Viewer"]), progressOptionController.getProgressOptions)
router.put('/update-progress-option/:progress_option_id', isUserAuthorized(['Owner', 'Shop Details']), isPayloadValid(updateProgressOptionsSchema), progressOptionController.updateProgressOption)
router.get('/get-progress-option/:progress_option_id', isUserAuthorized(['Owner', 'Shop Details']), progressOptionController.getProgressOptionById)
router.delete('/delete-progress-option/:progress_option_id', isUserAuthorized(['Owner', 'Shop Details']), progressOptionController.deleteProgressOption)

export default router;
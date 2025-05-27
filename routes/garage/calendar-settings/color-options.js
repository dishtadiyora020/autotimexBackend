import express from 'express'
import colorOptionController from "../../../controllers/garage/calendar-settings/colorOptionController.js"
import { isUserAuthorized } from '../../../middleware/auth.js'
import { isPayloadValid } from '../../../middleware/validation.js'
import { createColorOptionsSchema, updateColorOptionsSchema } from '../../../validation/garage/calendar-settings/color-option.js'

const router = express.Router()

router.get('/get-color-options', isUserAuthorized(['Owner','Shop Details' , "Appointments", "Appointments Viewer"]), colorOptionController.getColorOptions)
router.post('/create-color-option', isUserAuthorized(['Owner','Shop Details']), isPayloadValid(createColorOptionsSchema), colorOptionController.createColorOption)
router.put('/update-color-option/:color_option_id', isUserAuthorized(['Owner','Shop Details']), isPayloadValid(updateColorOptionsSchema), colorOptionController.updateColorOption)
router.get('/get-color-option/:color_option_id', isUserAuthorized(['Owner','Shop Details']), colorOptionController.getColorOptionById)
router.delete('/delete-color-option/:color_option_id', isUserAuthorized(['Owner','Shop Details']), colorOptionController.deleteColorOption)

export default router;
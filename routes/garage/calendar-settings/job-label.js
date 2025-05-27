import express from 'express'
import jobLabelController from "../../../controllers/garage/calendar-settings/jobLabelController.js"
import { isUserAuthorized } from '../../../middleware/auth.js'
import { isPayloadValid } from '../../../middleware/validation.js'
import { createJobLabelSchema, updateJobLabelSchema } from '../../../validation/garage/calendar-settings/job-color.js'

const router = express.Router()

router.post('/create-job-label', isUserAuthorized(['Owner', 'Shop Details']), isPayloadValid(createJobLabelSchema), jobLabelController.createLabelOption)
router.get('/get-job-labels', isUserAuthorized(['Owner', 'Shop Details' , "Appointments", "Appointments Viewer"]), jobLabelController.getLabelOptions)
router.put('/update-job-label/:job_label_id', isUserAuthorized(['Owner', 'Shop Details']), isPayloadValid(updateJobLabelSchema), jobLabelController.updateLabelOption)
router.delete('/delete-job-label/:job_label_id', isUserAuthorized(['Owner', 'Shop Details']), jobLabelController.deleteLabelOption)
router.get('/get-job-label/:job_label_id', isUserAuthorized(['Owner', 'Shop Details']), jobLabelController.getLabelByID)

export default router;
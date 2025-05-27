import express from 'express'
import serviceAdvisorController from "../../../controllers/garage/calendar-settings/serviceAdvisorController.js"
import { isUserAuthorized } from '../../../middleware/auth.js'
import { isPayloadValid } from '../../../middleware/validation.js'
import { createServiceAdvisorSchema, updateServiceAdvisorSchema } from '../../../validation/garage/calendar-settings/service-advisor.js'

const router = express.Router()

router.post('/create-service-advisor', isUserAuthorized(['Owner','Shop Details']), isPayloadValid(createServiceAdvisorSchema), serviceAdvisorController.createServiceAdvisor)
router.get('/get-service-advisors', isUserAuthorized(['Owner','Shop Details',"Appointments", "Appointments Viewer"]), serviceAdvisorController.getServiceAdvisors)
router.put('/update-service-advisor/:service_advisor_id', isUserAuthorized(['Owner','Shop Details']), isPayloadValid(updateServiceAdvisorSchema), serviceAdvisorController.updateServiceAdvisor)
router.delete('/delete-service-advisor/:service_advisor_id', isUserAuthorized(['Owner','Shop Details']), serviceAdvisorController.deleteServiceAdvisor)
router.get('/get-service-advisor/:service_advisor_id', isUserAuthorized(['Owner','Shop Details']), serviceAdvisorController.getServiceAdvisorById)

export default router;
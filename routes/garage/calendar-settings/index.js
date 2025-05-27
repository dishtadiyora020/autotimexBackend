import express from 'express'
import colorOptions from './color-options.js'
import appointmentColorCondition from './appointment-color-condition.js'
import progressOptions from './progress-options.js'
import serviceAdvisor from './service-advisor.js'
import generalSettings from './general-settings.js'
import jobLabel from './job-label.js'
import appointmentLabelCondition from './appointment-label-condition.js'
import technician from './technician.js'
import appointmentTechnicianCondition from './appointment-technician-condition.js'

const router = express.Router()

router.use('/color-options', colorOptions)
router.use('/appointment-color-conditions', appointmentColorCondition)
router.use('/progress-options', progressOptions)
router.use('/service-advisors', serviceAdvisor)
router.use('/general-settings', generalSettings)
router.use('/job-labels', jobLabel)
router.use('/appointment-job-conditions', appointmentLabelCondition)
router.use('/technicians', technician)
router.use('/appointment-technician-conditions', appointmentTechnicianCondition)

export default router;
import express from 'express'
import auth from './auth.js'
import notification from './notification.js'
import member from './members.js'
import calendarSettings from './calendar-settings/index.js'
import availability from './availability/index.js'
import schedulingTool from './scheduling-tools/index.js'
import marketingLink from './marketingLink.js'
import leads from './leads.js'
import calendar from './calendar.js'
import dashboard from './dashboard.js'
import appointment from './appointment.js'
import siteSetup from './siteSetup.js'

const router = express.Router()

router.use('/auth', auth)
router.use('/notification', notification)
router.use('/members', member)
router.use('/calendar-settings', calendarSettings)
router.use('/availability', availability)
router.use('/scheduling-tools',schedulingTool)
router.use('/marketing', marketingLink)
router.use('/leads', leads)
router.use('/calendar', calendar)
router.use('/dashboard', dashboard)
router.use('/appointment', appointment)
router.use('/site-setup', siteSetup)

export default router;
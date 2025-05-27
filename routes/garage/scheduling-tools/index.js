import express from 'express'
import customerTool from './customerTool.js'
import dropOfWaiting from './dropOffWaiting.js'
import transportationOptions from './transportationOptions.js'
import confirmBooking from './booking.js'
import branding from './branding.js'
import leadCapture from './leadCapture.js'
import vehicleInfo from './vehicleInfo.js'
import CustomField from './customField.js'
import sourceTrackingSetting from './sourceTrackingSetting.js'
import issueTree from './issueTree.js'

const router = express.Router()

router.use('/customer-info', customerTool),
router.use('/drop-off-waiting', dropOfWaiting),
router.use('/transportation-options', transportationOptions),
router.use('/booking', confirmBooking),
router.use('/branding', branding),
router.use('/lead-capture', leadCapture),
router.use('/vehicle-info', vehicleInfo),
router.use('/custom-field', CustomField),
router.use('/source-tracking', sourceTrackingSetting),
router.use('/issue-tree', issueTree)

export default router;
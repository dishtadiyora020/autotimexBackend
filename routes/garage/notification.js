import express from 'express'
import { isPayloadValid } from '../../middleware/validation.js'
import notificationController from '../../controllers/garage/notificationController.js'
import { isUserAuthorized } from '../../middleware/auth.js'
import { updateAppointmentFromNotificationSchema, updateNotificationSettingsSchema } from '../../validation/garage/notification.js'

const router = express.Router()

router.put('/update-notification-settings', isUserAuthorized(['Owner', 'Shop Details']), isPayloadValid(updateNotificationSettingsSchema), notificationController.updateNotificationSettings)
router.get('/get-notification-settings', isUserAuthorized(['Owner', 'Shop Details']), notificationController.getNotificationSettings)
router.get('/get-notification-keys', isUserAuthorized(['Owner', 'Shop Details']), notificationController.getNotificationKeys)

//notification

router.post('/get-notification', isUserAuthorized(['Owner', 'Notifications']), notificationController.getNotification)
router.get('/get-notification/:id', isUserAuthorized(['Owner', 'Notifications']), notificationController.getNotificationById)
router.put('/update-notification/:notification_id', isUserAuthorized(['Owner', 'Notifications']), isPayloadValid(updateAppointmentFromNotificationSchema), notificationController.updateAppointmentFromNotification),
router.delete('/delete-appointment/:appointment_id', isUserAuthorized(['Owner', 'Notifications']), notificationController.deleteAppointment)


export default router;
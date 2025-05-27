import express from 'express'
import { isUserAuthorized } from '../../middleware/auth.js';
import appointmentController from '../../controllers/garage/appointmentController.js';
import { isPayloadValid } from '../../middleware/validation.js';
import { createAppointmentSchema } from '../../validation/garage/appointment.js';
import { updateAppointmentFromNotificationSchema } from '../../validation/garage/notification.js';

const router = express.Router()

router.post(
    "/create-appointment/:code?",
    isUserAuthorized(["Owner", "Appointments"]),
    isPayloadValid(createAppointmentSchema),
    appointmentController.createAppointment
);
router.get(
    "/get-appointments",
    isUserAuthorized(["Owner", "Appointments", "Appointments Viewer"]),
    appointmentController.getAppointments
);
router.get(
    "/appointments/:appointmentId",
    isUserAuthorized(["Owner", "Appointments", "Appointments Viewer"]),
    appointmentController.getAppointmentById
);

router.put('/update-appointment/:appointmentId',
    isUserAuthorized(['Owner', "Appointments"]),
    isPayloadValid(updateAppointmentFromNotificationSchema),
    appointmentController.updateAppointment);


export default router;
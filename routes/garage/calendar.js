import express from 'express'
import { isUserAuthorized } from '../../middleware/auth.js';
import calendarController from '../../controllers/garage/calendarController.js';

const router = express.Router()

router.post(
    "/get-calendar-blockers",
    isUserAuthorized(["Owner", "Appointments", "Appointments Viewer"]),
    calendarController.getCalendarBlockers
);

router.post(
    "/get-appointment-options",
    isUserAuthorized(["Owner", "Leads", "Appointments Viewer", "Appointments"]),
    calendarController.getAppointmentOptions
);


router.post(
    "/get-scheduled-appointment-drop",
    isUserAuthorized(["Owner", "Leads", "Appointments Viewer", "Appointments"]),
    calendarController.getScheduledAppointmentDrop
);

router.post(
    "/get-scheduled-appointment-waiter",
    isUserAuthorized(["Owner", "Leads", "Appointments Viewer", "Appointments"]),
    calendarController.getScheduledAppointmentWaiter
);


export default router;
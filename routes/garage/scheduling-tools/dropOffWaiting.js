import express from 'express'
import { isUserAuthorized } from '../../../middleware/auth.js';
import { isPayloadValid } from '../../../middleware/validation.js';
import dropOfWaitingController from '../../../controllers/garage/scheduling-tools/dropOffWaitingController.js';
import { CalendarNoteSchema, dropoffWaitingSchema } from '../../../validation/garage/scheduling-tools/dropOfWaiting.js';

const router = express.Router()

router.post(
    "/add-drop-off-waiting",
    isUserAuthorized(["Owner" , "Scheduling Tool"]),
    isPayloadValid(dropoffWaitingSchema),
    dropOfWaitingController.createOrUpdateDropoffWaiting
);
router.get(
    "/get-drop-off-waiting",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    dropOfWaitingController.getDropoffWaiting
);

//calendar notes

router.post(
    "/add-calendar-note",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    isPayloadValid(CalendarNoteSchema),
    dropOfWaitingController.createOrUpdateCalendarNote
);
router.get(
    "/get-calendar-note",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    dropOfWaitingController.getCalendarNote
);

export default router;
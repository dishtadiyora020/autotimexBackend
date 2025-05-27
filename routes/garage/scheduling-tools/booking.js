import express from 'express'
import { isUserAuthorized } from '../../../middleware/auth.js';
import { isPayloadValid } from '../../../middleware/validation.js';
import confirmBookingController from '../../../controllers/garage/scheduling-tools/BookingController.js';
import { ConfirmBookingSchema, SuccessBookingSchema } from '../../../validation/garage/scheduling-tools/booking.js';

const router = express.Router()

router.post(
    "/add-confirm-booking",
    isUserAuthorized(["Owner",'Scheduling Tool']),
    isPayloadValid(ConfirmBookingSchema),
    confirmBookingController.createOrUpdateConfirmBooking
);
router.get(
    "/get-confirm-booking",
    isUserAuthorized(["Owner",'Scheduling Tool']),
    confirmBookingController.getConfirmBooking
);


//success booking
router.post(
    "/add-success-booking",
    isUserAuthorized(["Owner",'Scheduling Tool']),
    isPayloadValid(SuccessBookingSchema),
    confirmBookingController.createOrUpdateSuccessBooking
);
router.get(
    "/get-success-booking",
    isUserAuthorized(["Owner",'Scheduling Tool']),
    confirmBookingController.getSuccessBooking
);



export default router;
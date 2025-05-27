import express from 'express'
import { isUserAuthorized } from '../../../middleware/auth.js';
import { isPayloadValid } from '../../../middleware/validation.js';
import transportationOptionsController from '../../../controllers/garage/scheduling-tools/transportationOptionsController.js';
import { TransportationOptionsSchema } from '../../../validation/garage/scheduling-tools/transportationOptions.js';

const router = express.Router()

router.post(
    "/add-transportation-options",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    isPayloadValid(TransportationOptionsSchema),
    transportationOptionsController.createOrUpdateTransportationOptions
);

router.get(
    "/get-transportation-options",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    transportationOptionsController.getTransportationOptions
);


export default router;
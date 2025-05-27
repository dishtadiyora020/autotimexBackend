import express from 'express'
import { isUserAuthorized } from '../../../middleware/auth.js';
import { isPayloadValid } from '../../../middleware/validation.js';
import sourceTrackingSettingController from '../../../controllers/garage/scheduling-tools/sourceTrackingSettingController.js';
import { trackingFieldSchema } from '../../../validation/garage/scheduling-tools/sourceTrackingSetting.js';

const router = express.Router()

router.post(
    "/update-source-tracking",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    isPayloadValid(trackingFieldSchema),
    sourceTrackingSettingController.updateTrackingSettings
);

router.get(
    "/get-source-tracking",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    sourceTrackingSettingController.getTrackingSettings
);

export default router;
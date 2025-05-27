import express from 'express'
import { isUserAuthorized } from '../../../middleware/auth.js';
import { isPayloadValid } from '../../../middleware/validation.js';
import leadCaptureController from '../../../controllers/garage/scheduling-tools/leadCaptureController.js';
import { leadCaptureValidationSchema } from '../../../validation/garage/scheduling-tools/leadCapture.js';

const router = express.Router()

router.post(
    "/add-lead-capture",
    isUserAuthorized(["Owner" , "Scheduling Tool"]),
    isPayloadValid(leadCaptureValidationSchema),
    leadCaptureController.createOrUpdateLeadCapture
);

router.get(
    "/get-lead-capture",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    leadCaptureController.getLeadCapture
);
export default router;
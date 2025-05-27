import express from 'express'
import { isUserAuthorized } from '../../../middleware/auth.js';
import { isPayloadValid } from '../../../middleware/validation.js';
import vehicleInfo from '../../../controllers/garage/scheduling-tools/vehicleInfoController.js';
import { blacklistValidationSchema, vehicleInfoValidationSchema } from '../../../validation/garage/scheduling-tools/vehicleInfo.js';

const router = express.Router()

router.post(
    "/add-vehicle-info",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    isPayloadValid(vehicleInfoValidationSchema),
    vehicleInfo.createOrUpdateVehicleInfo
);
router.get(
    "/get-vehicle-info",
    isUserAuthorized(["Owner", "Scheduling Tool"]), 
    vehicleInfo.getVehicleInfo 
);

router.post(
    "/add-to-blacklist",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    isPayloadValid(blacklistValidationSchema), 
    vehicleInfo.addToBlacklist
);

router.get(
    "/get-blacklisted-models",
    isUserAuthorized(["Owner", "Scheduling Tool"]), 
    vehicleInfo.getBlacklistedModels 
);

export default router;
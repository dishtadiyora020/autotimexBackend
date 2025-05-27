import express from "express";
import { isUserAuthorized } from "../../../middleware/auth.js";
import { isPayloadValid } from "../../../middleware/validation.js";
import { addServiceSchedulerSchema, addServiceSchema, updateServiceSchedulerSchema, updateServiceSchema } from "../../../validation/garage/availability/service.js";
import serviceController from "../../../controllers/garage/availability/serviceController.js";
const router = express.Router();


router.post(
    "/add-service",
    isUserAuthorized(["Owner", 'Availability']),
    isPayloadValid(addServiceSchema),
    serviceController.addServiceSettings
);
router.get(
    "/get-service",
    isUserAuthorized(["Owner", 'Availability', 'Scheduling Tool']),
    serviceController.getServiceSettings
);
router.delete(
    "/delete-service/:serviceId",
    isUserAuthorized(["Owner", 'Availability']),
    serviceController.deleteServiceSettings
);
router.put(
    "/update-service/:serviceId",
    isUserAuthorized(["Owner", 'Availability']),
    isPayloadValid(updateServiceSchema),
    serviceController.updateServiceSettings
);
router.get(
    "/get-service/:serviceId",
    isUserAuthorized(["Owner", 'Availability']),
    serviceController.getServiceSettingsById
);



//service schedulers modes

router.post(
    "/add-service-schedulers",
    isUserAuthorized(["Owner", 'Availability']),
    isPayloadValid(addServiceSchedulerSchema),
    serviceController.addServiceScheduler
);
router.get(
    "/get-service-schedulers",
    isUserAuthorized(["Owner", 'Availability']),
    serviceController.getServiceScheduler
);
router.delete(
    "/delete-service-schedulers/:schedulerId",
    isUserAuthorized(["Owner", 'Availability']),
    serviceController.deleteServiceScheduler
);
router.put(
    "/update-service-schedulers/:schedulerId",
    isUserAuthorized(["Owner", 'Availability']),
    isPayloadValid(updateServiceSchedulerSchema),
    serviceController.updateServiceScheduler
);
router.get(
    "/get-service-schedulers/:schedulerId",
    isUserAuthorized(["Owner", 'Availability']),
    serviceController.getServiceSchedulerById
);

export default router;
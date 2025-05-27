import express from "express";
import { isPayloadValid } from "../../../middleware/validation.js";
import pickupOptionController from "../../../controllers/garage/availability/pickupOptionController.js";
import { isUserAuthorized } from "../../../middleware/auth.js";
import {
    addCustomerExceptionsSchema,
    AddVehicleInfoValidationSchema,
    allowedVehicleModelsSchema,
    updatePickupOptionSettingsSchema,
} from "../../../validation/garage/availability/pickupOption.js";

const router = express.Router();

// pickup option routes
router.put(
    "/update-pickup-option-settings",
    isUserAuthorized(["Owner", 'Availability']),
    isPayloadValid(updatePickupOptionSettingsSchema),
    pickupOptionController.updatePickupOptionSettings
);
router.get(
    "/get-pickup-option-settings",
    isUserAuthorized(["Owner", 'Availability']),
    pickupOptionController.getPickupOptionSettings
);

// allowed vehicle models routes
router.put(
    "/update-allowed-vehicle-models",
    isUserAuthorized(["Owner", 'Availability']),
    isPayloadValid(allowedVehicleModelsSchema),
    pickupOptionController.updateAllowedVehicleModels
);
router.get(
    "/get-allowed-vehicle-models",
    isUserAuthorized(["Owner", 'Availability']),
    pickupOptionController.getAllowedVehicleModels
);

// customer exceptions
router.post(
    "/add-customer-exception",
    isUserAuthorized(["Owner", 'Availability']),
    isPayloadValid(addCustomerExceptionsSchema),
    pickupOptionController.addCustomerException
);
router.get(
    "/get-customer-exceptions",
    isUserAuthorized(["Owner", 'Availability']),
    pickupOptionController.getCustomerException
);

router.delete(
    "/delete-customer-exceptions/:exceptionId",
    isUserAuthorized(["Owner", 'Availability']),
    pickupOptionController.deleteCustomerException
);

router.get(
    "/get-car-makes",
    isUserAuthorized(["Owner", 'Availability' , 'Scheduling Tool']),
    pickupOptionController.getCarMakes
);

router.get(
    "/get-car-model",
    isUserAuthorized(["Owner", 'Availability' , 'Scheduling Tool']),
    pickupOptionController.getCarModel
);



router.post(
    "/add-vehicle-pickup",
    isUserAuthorized(["Owner", 'Availability']),
    isPayloadValid(AddVehicleInfoValidationSchema),
    pickupOptionController.addToVehiclePickup
);



router.get(
    "/get-vehicle-pickup",
    isUserAuthorized(["Owner", 'Availability']),
    pickupOptionController.getVehiclePickup
);


export default router;

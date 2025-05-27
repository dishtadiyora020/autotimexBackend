import express from 'express'
import { isUserAuthorized } from '../../../middleware/auth.js';
import { isPayloadValid } from '../../../middleware/validation.js';
import customFieldController from '../../../controllers/garage/scheduling-tools/customFieldController.js';
import { createCustomFieldSchema, updateCustomFieldObjectSchema } from '../../../validation/garage/scheduling-tools/customField.js';

const router = express.Router()

router.post(
    "/add-custom-field",
    isUserAuthorized(["Owner" , "Scheduling Tool"]),
    isPayloadValid(createCustomFieldSchema),
    customFieldController.createCustomField
);


router.get(
    "/get-custom-field",
    isUserAuthorized(["Owner" , "Scheduling Tool"]),
    customFieldController.getCustomFields
);
router.get(
    "/get-customer-custom-field",
    isUserAuthorized(["Owner" , "Scheduling Tool"]),
    customFieldController.getCustomerCustomFields
);
router.get(
    "/get-appointment-custom-field",
    isUserAuthorized(["Owner" , "Scheduling Tool"]),
    customFieldController.getAppointmentCustomFields
);
router.get(
    "/get-vehicle-custom-field",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    customFieldController.getVehicleCustomFields
);


router.put(
    "/update-custom-field",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    isPayloadValid(updateCustomFieldObjectSchema),
    customFieldController.updateCustomFieldObject
);

router.delete(
    "/delete-custom-field",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    customFieldController.deleteCustomFieldObject
);

router.get(
    "/get-custom-field-object-by-id",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    customFieldController.getCustomFieldObjectById
);

router.get(
    "/filter-custom-fields",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    customFieldController.filterCustomFields
);




export default router;
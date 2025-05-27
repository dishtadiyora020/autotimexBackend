import express from 'express'
import { isUserAuthorized } from '../../../middleware/auth.js';
import { isPayloadValid } from '../../../middleware/validation.js';
import customerInfoController from '../../../controllers/garage/scheduling-tools/customerInfoController.js';
import { customerInfoSchema, customerToolSchema } from '../../../validation/garage/scheduling-tools/customerTool.js';

const router = express.Router()

router.post(
    "/add-customer-tool",
    isUserAuthorized(["Owner" , "Scheduling Tool"]),
    isPayloadValid(customerToolSchema),
    customerInfoController.createCustomerTool
);

router.get(
    "/get-customer-tool",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    customerInfoController.getCustomerTool
);


//customer info

router.post(
    "/add-customer-info",
    isUserAuthorized(["Owner" , "Scheduling Tool"]),
    isPayloadValid(customerInfoSchema),
    customerInfoController.addCustomerInfo
);
router.post(
    "/get-customer-info",
    isUserAuthorized(["Owner" , "Scheduling Tool"]),
    customerInfoController.getCustomerInfo
);
router.delete(
    "/delete-customer-info/:customerId",
    isUserAuthorized(["Owner", "Scheduling Tool"]),
    customerInfoController.deleteCustomerInfo
);
export default router;
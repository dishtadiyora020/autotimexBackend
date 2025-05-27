import express from "express";
import { isUserAuthorized } from "../../../middleware/auth.js";
import { isPayloadValid } from "../../../middleware/validation.js";
import capacityBlockerController from "../../../controllers/garage/availability/capacityBlockerController.js";
import { capacityBlockerSchema } from "../../../validation/garage/availability/capacityBlocker.js";
const router = express.Router();


router.post(
    "/add-capacity-blocker",
    isUserAuthorized(["Owner" ,'Availability']),
    isPayloadValid(capacityBlockerSchema),
    capacityBlockerController.addCapacityBlocker
);
router.post(
    "/get-capacity-blocker",
    isUserAuthorized(["Owner" , 'Availability']),
    capacityBlockerController.getCapacityBlocker
);
router.put(
    "/update-capacity-blocker/:blockerId", 
    isUserAuthorized(["Owner" , 'Availability']),
    isPayloadValid(capacityBlockerSchema),
    capacityBlockerController.updateCapacityBlocker 
);
router.get(
    "/capacity-blocker/:blockerId",
    isUserAuthorized(["Owner" , 'Availability']), 
    capacityBlockerController.getCapacityBlockerById 
);
router.delete(
    "/delete-capacity-blocker/:blockerId",
    isUserAuthorized(["Owner" , 'Availability']), 
    capacityBlockerController.deleteCapacityBlocker 
);



export default router;
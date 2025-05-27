import express from 'express'
import { isUserAuthorized } from '../../middleware/auth.js';
import { isPayloadValid } from '../../middleware/validation.js';
import leadsController from '../../controllers/garage/leadsController.js';
import { addExitLeadSchema, createLeadSchema, updateExitLeadSchema, updateLeadSchema } from '../../validation/garage/leads.js';
import { upload } from '../../middleware/fileUploadHandler.js';


const router = express.Router()

router.post(
    "/add-exit-lead",
    isUserAuthorized(["Owner", "Leads"]),
    isPayloadValid(addExitLeadSchema),
    leadsController.addExitLead
);

router.get(
    "/get-exit-lead",
    isUserAuthorized(["Owner", "Leads"]),
    leadsController.getExitLead
);
router.put(
    "/update-exit-lead/:exitLeadID",
    isUserAuthorized(["Owner", "Leads"]),
    isPayloadValid(updateExitLeadSchema),
    leadsController.updateExitLead
);
router.post(
    "/create-lead/:code?/:leadID?",
    upload.any(),
    isUserAuthorized(["Owner", "Leads"]),
    leadsController.createLead
);
router.put(
    "/update-lead/:leadID",
    isUserAuthorized(["Owner", "Leads"]),
    leadsController.updateLead
);
router.get(
    "/get-lead",
    isUserAuthorized(["Owner", "Leads"]),
    leadsController.getLead
);
router.get(
    "/get-hide-lead",
    isUserAuthorized(["Owner", "Leads"]),
    leadsController.getHideLead
);
router.put(
    "/update-status/:leadID",
    isUserAuthorized(["Owner", "Leads"]),
    leadsController.toggleLeadStatus
);

router.delete(
    "/delete-lead/:leadID/:code?",
    isUserAuthorized(["Owner", "Leads"]),
    leadsController.deleteLead
);
router.post(
    "/date-range-leads",
    isUserAuthorized(["Owner", "Leads"]),
    leadsController.getLeadsByDateRange
);

router.get(
    "/get-drop-leads/:leadID",
    isUserAuthorized(["Owner", "Leads"]),
    leadsController.getDropLead
);

router.get(
    "/get-drop-schedule-leads/:leadID",
    isUserAuthorized(["Owner", "Leads"]),
    leadsController.getScheduledAppointmentDrop
);

router.get(
    "/get-waiter-schedule-leads/:leadID",
    isUserAuthorized(["Owner", "Leads"]),
    leadsController.getScheduledAppointmentWaiter
);

router.get(
    "/get-pickup-schedule-leads",
    isUserAuthorized(["Owner", "Leads"]),
    leadsController.getScheduledAppointmentPickup
);

router.get(
    "/get-vehicle-detail/:userId",
    isUserAuthorized(["Owner"]),
    leadsController.getVehicleDetail
);

router.get(
    "/get-transportation-options/:leadID",
    isUserAuthorized(["Owner", "Leads"]),
    leadsController.getTransportationOptions
);
router.get(
    "/get-lead-by-id/:leadID",
    isUserAuthorized(["Owner", "Leads"]),
    leadsController.getLeadById
);

router.get(
    "/get-lead-by-phone",
    isUserAuthorized(["Owner", "Leads", "Appointments Viewer", "Appointments"]),
    leadsController.getCustomerByPhone
);
router.post("/get-distance", isUserAuthorized(["Owner"]), leadsController.getPickupDistance)



export default router;
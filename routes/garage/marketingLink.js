import express from 'express'
import { addMarketingLinkSchema } from '../../validation/garage/marketingLink.js';
import marketingLinkController from '../../controllers/garage/marketingLinkController.js';
import { isUserAuthorized } from '../../middleware/auth.js';
import { isPayloadValid } from '../../middleware/validation.js';


const router = express.Router()

router.post(
    "/add-marketing-link",
    isUserAuthorized(["Owner", "Marketing Links"]),
    isPayloadValid(addMarketingLinkSchema),
    marketingLinkController.addMarketingLink
);
router.post(
    "/get-marketing-link",
    isUserAuthorized(["Owner", "Marketing Links"]),
    marketingLinkController.getMarketingLink
);

router.post(
    "/marketing-link-by-id/:marketingLinkId",
    isUserAuthorized(["Owner", "Marketing Links"]),
    marketingLinkController.getByIDMarketingLink
);
router.put(
    "/update-marketing-link/:marketingLinkId",
    isUserAuthorized(["Owner", "Marketing Links"]),
    isPayloadValid(addMarketingLinkSchema),
    marketingLinkController.updateMarketingLink
);
router.get(
    "/marketing-click/:code",
    marketingLinkController.getMarketingClick
);

router.delete('/delete-marketing-link/:marketingLinkId', isUserAuthorized(['Owner']), marketingLinkController.deleteMarketingLink)


router.get('/get-marketing-link-by-code/:code', marketingLinkController.getMarketingLinkByCode)

router.get('/get-location-wise-marketing-link',isUserAuthorized(["Owner", "Marketing Links"]), marketingLinkController.getLocationWiseMarketingLink);
router.get('/get-location-wise-appointment',isUserAuthorized(["Owner", "Marketing Links"]), marketingLinkController.getLocationByAppointment);




export default router;
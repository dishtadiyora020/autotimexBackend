import express from 'express'
import { isUserAuthorized } from '../../../middleware/auth.js';
import { isPayloadValid } from '../../../middleware/validation.js';
import brandingController from '../../../controllers/garage/scheduling-tools/brandingController.js';
import { updateBrandingSchema } from '../../../validation/garage/scheduling-tools/branding.js';
import { upload } from '../../../middleware/fileUploadHandler.js';


const router = express.Router()

// router.post(
//     "/add-branding-color",
//     isUserAuthorized(["Owner"]),
//     isPayloadValid(brandingColorsSchema),
//     brandingController.createOrUpdateBrandingColors
// );
router.get(
    "/get-branding",
    isUserAuthorized(["Owner" , ,'Scheduling Tool']),
    brandingController.getBranding
);

router.post(
    "/update-branding",
    isUserAuthorized(["Owner" ,'Scheduling Tool']),
    upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'header_image', maxCount: 1 }
    ]),
    isPayloadValid(updateBrandingSchema),
    brandingController.updateBranding
);

// //add image
// router.post(
//     "/add-branding-image",
//     isUserAuthorized(["Owner"]),
//     upload.fields([
//         { name: 'logo', maxCount: 1 },
//         { name: 'header_image', maxCount: 1 }
//     ]),
//     isPayloadValid(brandingImageSchema),
//     brandingController.createOrUpdateBrandingImage
// );
// //add title
// router.post(
//     "/add-branding-title",
//     isUserAuthorized(["Owner"]),
//     isPayloadValid(schedulerTitlesSchema),
//     brandingController.createOrUpdateBrandingTitles
// );

export default router;
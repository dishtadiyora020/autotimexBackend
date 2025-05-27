import express from 'express'
import listingController from '../controllers/listingController.js'

const router = express.Router()

router.get('/get-user-roles', listingController.getRoles)
router.get('/get-cloudflare-sub-domains', listingController.getCloudFlareSubDomains)

export default router;
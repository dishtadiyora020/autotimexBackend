import express from 'express'
import commonController from '../controllers/commonController.js'

const router = express.Router()

router.get('/fetch-garage-id-by-api-key/:api_key', commonController.fetchGarageIdByApiKey)
router.get('/fetch-branding/:garage_id', commonController.fetchBranding)
router.get('/fetch-garage-id-by-sub-domain/:sub_domain', commonController.fetchGarageIdBySubdomain)
router.get('/fetch-all-domains', commonController.fetchAllDomains)
router.get('/add-sub-domains', commonController.addNewSubDomain)

export default router;
import express from 'express'
import apiKeyController from '../../controllers/garage/apiKeyController.js'
import { isUserAuthorized } from '../../middleware/auth.js'

const router = express.Router()

router.get('/get-api-key', isUserAuthorized(['Owner', 'Shop Details']), apiKeyController.getApiKey)
router.get('/get-garage-stats', isUserAuthorized(['Owner', 'Shop Details']), apiKeyController.getGarageStats)

export default router;
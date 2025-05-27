import express from 'express'
import { isPayloadValid } from '../../middleware/validation.js'
import authController from '../../controllers/super-admin/authController.js'
import { loginSchema } from '../../validation/super-admin/auth.js'

const router = express.Router()

router.post('/login', isPayloadValid(loginSchema), authController.login)

export default router;
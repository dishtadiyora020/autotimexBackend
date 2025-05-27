import express from 'express'
import authController from './auth.js'
import garageController from './garage.js'

const router = express.Router()

router.use('/auth', authController)
router.use('/garage', garageController)

export default router;
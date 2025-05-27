import express from 'express'
import waiterCapacity from './waiterCapacity.js'
import dropOffCapacity from './dropOffCapacity.js'
import miscSettings from './miscSettings.js'
import pickupOption from './pickupOption.js'
import service from './service.js'
import capacityBlocker from './capacityBlocker.js'

const router = express.Router()

router.use('/waiter-capacity', waiterCapacity)
router.use('/dropoff-capacity', dropOffCapacity)
router.use('/misc-settings', miscSettings)
router.use('/pickup-option', pickupOption)
router.use('/service', service)
router.use('/capacity-blocker', capacityBlocker)

export default router;
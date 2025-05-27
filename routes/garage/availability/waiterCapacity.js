import express from 'express'
import { isPayloadValid } from '../../../middleware/validation.js'
import waiterCapacityController from '../../../controllers/garage/availability/waiterCapacityController.js'
import { updateWaiterCapacitySchema } from '../../../validation/garage/availability/waiterCapacity.js'
import { isUserAuthorized } from '../../../middleware/auth.js'

const router = express.Router()

router.put('/update-waiter-capacity', isUserAuthorized(['Owner','Availability']), isPayloadValid(updateWaiterCapacitySchema), waiterCapacityController.updateWaiterCapacity)
router.get('/get-waiter-capacity', isUserAuthorized(['Owner','Availability']), waiterCapacityController.getWaiterCapacity)

export default router;
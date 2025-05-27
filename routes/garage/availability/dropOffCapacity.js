import express from 'express'
import { isPayloadValid } from '../../../middleware/validation.js'
import dropOffCapacityController from '../../../controllers/garage/availability/dropOffCapacityController.js'
import { isUserAuthorized } from '../../../middleware/auth.js'
import { updateDropOffCapacitySchema } from '../../../validation/garage/availability/dropOffCapacity.js'

const router = express.Router()

router.put('/update-dropoff-capacity', isUserAuthorized(['Owner' , 'Availability']), isPayloadValid(updateDropOffCapacitySchema), dropOffCapacityController.updateDropOffCapacity)
router.get('/get-dropoff-capacity', isUserAuthorized(['Owner', 'Availability']), dropOffCapacityController.getDropOffCapacity)

export default router;
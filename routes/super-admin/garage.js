import express from 'express'
import { isPayloadValid } from '../../middleware/validation.js'
import { isSuperAdminAuthorized, isUserAuthorized } from '../../middleware/auth.js'
import garageController from '../../controllers/super-admin/garageController.js'
import { createGarageSchema, updateGarageSchema } from '../../validation/super-admin/garage.js'
import { ROLES } from '../../utils/enums.js'

const router = express.Router()

router.post('/create-garage', isSuperAdminAuthorized([ROLES.SUPER_ADMIN]), isPayloadValid(createGarageSchema), garageController.createNewGarage)
router.get('/get-all-garages', isSuperAdminAuthorized([ROLES.SUPER_ADMIN]), garageController.getAllGarages)
router.put('/update-garage/:garage_id', isSuperAdminAuthorized([ROLES.SUPER_ADMIN]), isPayloadValid(updateGarageSchema), garageController.updateGarage)
router.get('/get-garage/:garage_id', isSuperAdminAuthorized([ROLES.SUPER_ADMIN]), garageController.getGarageById)
router.delete('/delete-garage/:garage_id', isUserAuthorized([ROLES.SUPER_ADMIN]), garageController.deleteGarage)
router.put('/update-meter', garageController.updateStripe)
router.get('/get-all-organizations/:userId', garageController.getUserOrganizationsByUserId)


export default router;
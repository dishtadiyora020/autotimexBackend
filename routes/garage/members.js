import express from 'express'
import garageMembersController from '../../controllers/garage/garageMembersController.js'
import { isUserAuthorized } from '../../middleware/auth.js'
import { isPayloadValid } from '../../middleware/validation.js'
import { addNewMemberSchema, updateMemberSchema } from '../../validation/garage/member.js'

const router = express.Router()

router.get('/get-all-members', isUserAuthorized(['Owner', 'Shop Details']), garageMembersController.getGarageMembers)
router.post('/add-new-member', isUserAuthorized(['Owner', 'Shop Details']), isPayloadValid(addNewMemberSchema), garageMembersController.addNewMember)
router.put('/update-member/:member_id', isUserAuthorized(['Owner', 'Shop Details']), isPayloadValid(updateMemberSchema), garageMembersController.updateMember)
router.delete('/delete-member/:member_id', isUserAuthorized(['Owner', 'Shop Details']), garageMembersController.deleteMember)

export default router;
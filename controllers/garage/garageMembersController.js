import GARAGE from "../../models/garage.js"
import USER_ROLES from "../../models/userRoles.js"
import Logger from "../../middleware/logger.js";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../middleware/responses.js";
import { getPagination, searchQuery, sortingQuery } from "../../utils/common.js";
import propelAuth from "../../services/propelauth.js";
const logger = new Logger("garage/garageMembersController.js")

const getGarageMembers = async (req, res) => {
    try {
        logger.log("[GET GARAGE MEMBERS] Api Called")
        const { _id } = req.user
        const {
            page = 1,
            limit = 10,
            search = '',
            sortBy = 'first_name',
            sortOrder = 'asc'
        } = req.query;

        const garageMembers = await GARAGE.aggregate([
            {
                $facet: {
                    members: [
                        {
                            $match: {
                                _id: _id
                            }
                        },
                        { $unwind: "$members" },
                        {
                            $lookup: {
                                from: "userroles",
                                localField: "members.roles",
                                foreignField: "_id",
                                as: "members.roles"
                            }
                        },
                        {
                            $match: {
                                ...searchQuery(search, [{ name: "members.first_name", type: "string" }, { name: "members.last_name", type: "string" }, { name: "members.email", type: "string" }])
                            }
                        },
                        { ...sortingQuery(`members.${sortBy}`, sortOrder) },
                        ...getPagination(page, limit),
                        { $replaceRoot: { newRoot: "$members" } }
                    ],
                    totalCount: [
                        {
                            $match: {
                                _id: _id
                            }
                        },
                        { $unwind: "$members" },
                        {
                            $match: {
                                ...searchQuery(search, [{ name: "members.first_name", type: "string" }, { name: "members.last_name", type: "string" }, { name: "members.email", type: "string" }])
                            }
                        },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            data: {
                members: garageMembers[0]?.members || [],
                total: garageMembers[0]?.totalCount[0]?.count || 0
            },
            message: "Garage members retrieved successfully"
        });
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const addNewMember = async (req, res) => {
    try {
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const isEmailAlreadyExist = await propelAuth.fetchUsersByQuery({ emailOrUsername: req.body.email })
        if (isEmailAlreadyExist.totalUsers > 0) {
            return badRequestResponse(res, { message: "An account already exists with that email address" })
        }
        const user = await propelAuth.createUser({
            email: req.body.email,
            firstName: req.body.first_name,
            lastName: req.body.last_name,
            emailConfirmed: false,
            sendEmailToConfirmEmailAddress: true,
            askUserToUpdatePasswordOnLogin: true
        });
        const additionalRoles = await USER_ROLES.find({ _id: { $in: req.body.roles } })
        await propelAuth.addUserToOrg({
            userId: user.userId,
            orgId: garage.propel_auth_org_id,
            role: 'Member',
            additionalRoles: additionalRoles.map(role => role.role)
        })

        if (!user) return badRequestResponse(res, { message: "Something went wrong while adding garage" })
        await garage.updateOne({
            $push: {
                members: {
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    email: req.body.email,
                    phone: req.body.phone,
                    roles: req.body.roles,
                    propel_auth_user_id: user.userId
                }
            }
        }, { new: true })
        return successResponse(res, { message: "Member added successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const updateMember = async (req, res) => {
    try {
        const { _id } = req.user
        const { member_id } = req.params;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        if (!member_id) return badRequestResponse(res, { message: "Member not found" })
        const garageMember = garage.members.find(member => member._id.toString() === member_id)
        if (!garageMember) return badRequestResponse(res, { message: "Member not found" })
        const roles = await USER_ROLES.find({ _id: { $in: req.body.roles } })
        await propelAuth.changeUserRoleInOrg({
            orgId: garage.propel_auth_org_id,
            userId: garageMember.propel_auth_user_id,
            role: 'Member',
            additionalRoles: roles.map(role => role.role)
        })

        await GARAGE.updateOne({
            _id: _id,
            "members._id": member_id
        },
            {
                "$set": {
                    "members.$[item].first_name": req.body.first_name,
                    "members.$[item].last_name": req.body.last_name,
                    "members.$[item].email": req.body.email,
                    "members.$[item].phone": req.body.phone,
                    "members.$[item].roles": req.body.roles
                }
            },
            {
                arrayFilters: [
                    {
                        "item._id": {
                            $eq: member_id
                        }
                    }
                ]
            })
        return successResponse(res, { message: "Member updated successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const deleteMember = async (req, res) => {
    try {
        const { _id } = req.user
        const { member_id } = req.params;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        if (!member_id) return badRequestResponse(res, { message: "Member not found" })
        const garageMember = garage.members.find(member => member._id.toString() === member_id)
        if (!garageMember) return badRequestResponse(res, { message: "Member not found" })
        await GARAGE.updateOne({
            _id: _id,
            "members._id": member_id
        },
            {
                $pull: {
                    members: {
                        _id: member_id
                    }
                }
            }
        )
        await propelAuth.deleteUser(garageMember.propel_auth_user_id)
        return successResponse(res, { message: "Member deleted successfully" })
    }
    catch (error) {
        logger.log(error);
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const sendInvitationMail = async (req, res) => {
    try {
        propelAuth.resendEmailConfirmation(req.body.email);
        return successResponse(res, { message: "Invitation sent successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

export default { getGarageMembers, addNewMember, updateMember, deleteMember, sendInvitationMail }
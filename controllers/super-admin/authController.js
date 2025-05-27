import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import SUPERADMIN from "../../models/superAdmin.js"
import Logger from "../../middleware/logger.js";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../middleware/responses.js";
import { ROLES } from "../../utils/enums.js";
const logger = new Logger("superAdmin/authController.js")
const login = async (req, res) => {
    try {
        logger.log("[LOGIN] Api Called")
        const { email, password } = req.body
        const superAdmin = await SUPERADMIN.findOne({ email }).select("+password")
        if (!superAdmin) {
            return badRequestResponse(res, { message: "Invalid credentials" })
        }
        const isPasswordValid = await bcrypt.compare(password, superAdmin.password)
        if (!isPasswordValid) {
            return badRequestResponse(res, { message: "Invalid credentials" })
        }

        const token = jwt.sign({
            _id: superAdmin._id,
            email: superAdmin.email,
            role: ROLES.SUPER_ADMIN
        }, process.env.JWT_SECRET_KEY, { expiresIn: "24h" })
        await superAdmin.updateOne({
            $push: {
                sessions: {
                    date: new Date(),
                    ip: req.ip,
                    location: null
                }
            }
        }, { new: true })
        return successResponse(res, { payload: { token }, message: "Login successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

export default { login }
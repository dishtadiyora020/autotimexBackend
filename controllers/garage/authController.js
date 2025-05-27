import GARAGE from "../../models/garage.js"
import GARAGE_SETTINGS from "../../models/garageSettings.js"
import Logger from "../../middleware/logger.js";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../middleware/responses.js";
import { generateKey } from "../../utils/common.js";
const logger = new Logger("garage/authController.js")
const updateGarageInfo = async (req, res) => {
    try {
        logger.log("[UPDATE GARAGE INFO] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) {
            return badRequestResponse(res, { message: "Garage not found" })
        }
        await garage.updateOne({
            ...req.body,
            key: generateKey(req.body.name)
        }, { new: true })
        await GARAGE_SETTINGS.updateOne({ garage_id: _id }, { $set: { shop_hours: req.body.shop_hours } }, { upsert: true })
        return successResponse(res, { message: "Garage info updated successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getGarageInfo = async (req, res) => {
    try {
        logger.log("[GET GARAGE INFO] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id).lean().select('-status  -propel_auth_owner_id -members')
        if (!garage) {
            return badRequestResponse(res, { message: "Garage not found" })
        }
        const garageShopHours = await GARAGE_SETTINGS.findOne({ garage_id: _id })
        garage.shop_hours = garageShopHours?.shop_hours
        return successResponse(res, { message: "Garage info fetched successfully", payload: { garage } })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getGarageMemberByAuthIds = async (req, res) => {
    try {
        logger.log("[GET GARAGE MEMBER INFO] Api Called");
        const { propel_auth_org_id, propel_auth_user_id } = req.query;
        const garage = await GARAGE.findOne({ propel_auth_org_id }).lean();
        if (!garage) {
            return badRequestResponse(res, { message: "Garage not found" });
        }
        const member = garage.members.find(
            (m) => m.propel_auth_user_id === propel_auth_user_id
        );
        if (!member) {
            return badRequestResponse(res, { message: "Member not found" });
        }
        return successResponse(res, {
            message: "Member info fetched successfully",
            payload: { member },
        });

    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, { message: "Something went wrong" });
    }
};



export default { updateGarageInfo, getGarageInfo, getGarageMemberByAuthIds }
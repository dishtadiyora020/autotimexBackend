import API_KEYS from "../models/apiKeys.js"
import BRANDING from "../models/scheduling-tools/branding.js"
import GARAGE from "../models/garage.js"
import Logger from "../middleware/logger.js";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../middleware/responses.js";
import mongoose from "mongoose";
import { cloudFlareService } from "../services/cloudflare.js";
const logger = new Logger("garage/listingController.js")
const fetchGarageIdByApiKey = async (req, res) => {
    try {
        logger.log("[FETCH GARAGE ID BY API KEY] Api Called")
        const garage = await API_KEYS.findOne({ api_key: req.params.api_key, is_enabled: true })
        if (!garage) return badRequestResponse(res, { message: "Invalid API Key" })
        return successResponse(res, { message: "Garage fetched successfully", payload: garage.garage_id })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const fetchBranding = async (req, res) => {
    try {
        logger.log("[FETCH BRANDING] Api Called")
        const isValidObjectID = mongoose.Types.ObjectId.isValid(req.params.garage_id);
        if (!isValidObjectID) return badRequestResponse(res, { message: "Invalid garage id" });
        const branding = await BRANDING.findOne({ garage_id: req.params.garage_id })
        if (!branding) return badRequestResponse(res, { message: "Invalid Garage ID" })
        return successResponse(res, { message: "Branding fetched successfully", payload: branding })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const fetchGarageIdBySubdomain = async (req, res) => {
    try {
        logger.log("[FETCH GARAGE ID BY SUBDOMAIN] Api Called")
        const garage = await GARAGE.findOne({ domain_slug: req.params.sub_domain })
        if (!garage) return badRequestResponse(res, { message: "Invalid Subdomain" })
        return successResponse(res, { message: "Garage fetched successfully", payload: garage._id })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const fetchAllDomains = async (req, res) => {
    try {
        logger.log("[FETCH ALL DOMAINS] Api Called")
        const garage = await cloudFlareService('/dns_records', 'GET')
        return successResponse(res, { message: "Garage fetched successfully", payload: garage })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const addNewSubDomain = async (req, res) => {
    try {
        logger.log("[FETCH ALL DOMAINS] Api Called")
        const garage = await cloudFlareService('/dns_records', 'POST', {
            "type": "A",
            "name": "hardiks-second-garage.dev.autotimex.com",
            "content": process.env.SERVER_IP,
            "ttl": 3600,
            "proxied": false
        })
        // const garage = await cloudFlareService('/dns_records/39e0be09cc3dd366e379da4343b1a022', 'delete')
        return successResponse(res, { message: "Garage fetched successfully", payload: garage })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

export default { fetchGarageIdByApiKey, fetchBranding, fetchGarageIdBySubdomain, fetchAllDomains, addNewSubDomain }
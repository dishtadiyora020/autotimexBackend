import USER_ROLES from "../models/userRoles.js"
import Logger from "../middleware/logger.js";
import { internalServerErrorResponse, successResponse } from "../middleware/responses.js";
import { cloudFlareService } from "../services/cloudflare.js";
const logger = new Logger("garage/listingController.js")
const getRoles = async (req, res) => {
    try {
        logger.log("[GET ROLES] Api Called")
        const roles = await USER_ROLES.find()
        return successResponse(res, { message: "Roles fetched successfully", payload: roles })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getCloudFlareSubDomains = async (req, res) => {
    try {
        // const domainSlug = req.params.domainSlug; // Assuming you are passing the domain slug in the URL parameter
        // const domain = `${domainSlug}.${process.env.SERVER_BASE_DOMAIN}`;

        const records = await cloudFlareService(`/dns_records`, 'GET');

        // const subDomains = records.filter(record => 
        //     (record.type === 'A' || record.type === 'CNAME') && 
        //     record.name.endsWith(domain)
        // );

        return res.status(200).json({
            success: true,
            subDomains: records
        });

    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, { message: "Something went wrong while fetching subdomains" });
    }
};
export default { getRoles, getCloudFlareSubDomains }
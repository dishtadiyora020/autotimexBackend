import { badRequestResponse, internalServerErrorResponse, notFoundResponse, successResponse } from "../../middleware/responses.js";
import GARAGE from "../../models/garage.js";
import MARKETING_LINK from "../../models/marketingLinks.js";
import SOURCE_TRACKING from "../../models/scheduling-tools/sourceTrackingSetting.js";
import APPOINTMENT from "../../models/appointment.js";
import Logger from "../../middleware/logger.js";
import { getPagination, sortingQuery } from "../../utils/common.js";
import { getClientIp } from 'request-ip';
const logger = new Logger("garage/marketingLinkController.js");
import axios from "axios";

const addMarketingLink = async (req, res) => {
    try {
        logger.log("[ADD MARKETING LINK] API Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const newLink = new MARKETING_LINK({
            garage_id: _id,
            ...req.body,
        });
        await newLink.save();
        return successResponse(res, {
            message: "Marking link added successfully",
        });
    } catch (error) {
        logger.error(`[ADD MARKETING LINK ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id
        });
        return internalServerErrorResponse(res, {
            message: "Failed to add marketing link",
        });
    }
};


const getMarketingLink = async (req, res) => {
    try {
        logger.log("[GET MARKETING LINK] API Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });
        const { min_date, max_date } = req.body;
        const dateFilter = {};
        if (min_date) dateFilter.$gte = new Date(min_date);
        if (max_date) dateFilter.$lte = new Date(max_date);
        const filter = { garage_id: _id };
        if (Object.keys(dateFilter).length) filter.createdAt = dateFilter;
        const marketingData = await MARKETING_LINK.aggregate([
            {
                $facet: {
                    marketing: [
                        { $match: filter },
                        { ...sortingQuery(req?.query?.sortBy, req?.query?.sortOrder) },
                        ...getPagination(req?.query?.page, req?.query?.limit),
                        { $unset: ["garage_id"] },
                    ],
                    total: [{ $match: filter }, { $count: "total" }],
                },
            },
        ]);

        return successResponse(res, {
            message: "Marketing links fetched successfully",
            payload: {
                marketing: marketingData[0]?.marketing || [],
                total: marketingData[0]?.total?.[0]?.total || 0,
            },
        });
    } catch (error) {
        logger.error(`[GET MARKETING LINK ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id
        });
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
            error: error.message || "Unknown error",
        });
    }
};

const getByIDMarketingLink = async (req, res) => {
    try {
        logger.log("[GET MARKETING LINK BY ID] API Called");
        const { _id } = req.user;
        const { marketingLinkId } = req.params;
        const { min_date, max_date } = req.body;

        // Validate garage existence
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        // Fetch the marketing link
        const marketingLink = await MARKETING_LINK.findOne({ _id: marketingLinkId });
        if (!marketingLink) return badRequestResponse(res, { message: "Marketing link not found" });

        // Prepare date range
        let start = min_date ? new Date(min_date) : null;
        let end = max_date ? new Date(`${max_date}T23:59:59.999Z`) : null;

        // Helper to filter array by date
        const filterByDate = (arr) => {
            if (!arr) return [];
            return arr.filter(item => {
                if (!item.date) return false;
                const date = new Date(item.date);
                if (start && date < start) return false;
                if (end && date > end) return false;
                return true;
            });
        };

        // Filter scan arrays
        const filteredScan = {
            click: filterByDate(marketingLink.scan.click),
            lead: filterByDate(marketingLink.scan.lead),
            booking: filterByDate(marketingLink.scan.booking)
        };

        return successResponse(res, {
            message: "Marketing link fetched successfully",
            payload: {
                marketingLink: {
                    ...marketingLink.toObject(),
                    scan: filteredScan
                }
            }
        });
    } catch (error) {
        logger.error(`[GET MARKETING LINK BY ID ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id
        });
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
            error: error.message || "Unknown error",
        });
    }
};



const updateMarketingLink = async (req, res) => {
    try {
        logger.log("[UPDATE MARKETING LINK] API Called");

        const { _id } = req.user;
        const { marketingLinkId } = req.params;
        const updateData = req.body;

        // Check if the garage exists
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        // Find and update the marketing link
        const updatedLink = await MARKETING_LINK.findOneAndUpdate(
            { _id: marketingLinkId, garage_id: _id },
            { $set: updateData },
            { new: true }
        );

        if (!updatedLink) return notFoundResponse(res, { message: "Marketing link not found" });

        return successResponse(res, {
            message: "Marketing link updated successfully",
        });
    } catch (error) {
        logger.error(`[UPDATE MARKETING LINK ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id
        });
        return internalServerErrorResponse(res, {
            message: "Failed to update marketing link",
        });
    }
};

const deleteMarketingLink = async (req, res) => {
    try {
        logger.log("[DELETE MARKETING LINK] API Called");

        const { _id } = req.user;
        const { marketingLinkId } = req.params;

        // Check if the garage exists
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        // Find and delete the marketing link
        const deletedLink = await MARKETING_LINK.findOneAndDelete({
            _id: marketingLinkId,
        });

        if (!deletedLink) return notFoundResponse(res, { message: "Marketing link not found" });

        return successResponse(res, {
            message: "Marketing link deleted successfully"
        });
    } catch (error) {
        logger.error(`[DELETE MARKETING LINK ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id
        });
        return internalServerErrorResponse(res, {
            message: "Failed to delete marketing link",
        });
    }
};



export const getMarketingClick = async (req, res) => {
    try {
        logger.log("[ADD MARKETING CLICK] API Called");
        const { code } = req.params;
        const userIp = getClientIp(req);
        const marketingLink = await MARKETING_LINK.findOne({ code });
        if (!marketingLink) {
            return notFoundResponse(res, { message: "Marketing link not found" });
        }
        // Fetch lat/lon from IP
        let lat = null, lon = null;
        try {
            if (marketingLink.locationEnabled === true) {
                const geoRes = await axios.get(`http://ip-api.com/json/${userIp}`);
                if (geoRes.data && geoRes.data.status === "success") {
                    lat = geoRes.data.lat;
                    lon = geoRes.data.lon;
                }
            }
        } catch (geoErr) {
            logger.warn(`GeoIP lookup failed for IP: ${userIp}`);
        }
        marketingLink.scan.click.push({
            date: new Date(),
            ip: userIp,
            lat,
            lon
        });
        await marketingLink.save();
        let finalUrl = marketingLink.url_destination;
        if (marketingLink.use_query_parameter) {
            const urlObj = new URL(finalUrl);
            urlObj.searchParams.set("use_query_parameter", "true");
            if (marketingLink.online_scheduling_tools) {
                urlObj.searchParams.set("online_scheduling_tools", "true");
                urlObj.searchParams.set("code", marketingLink.code);
            }
            if (marketingLink.source_tracking && marketingLink.source_tracking.length) {
                marketingLink.source_tracking.forEach(({ key, value }) => {
                    urlObj.searchParams.set(key, value);
                });
            }
            finalUrl = urlObj.toString();
        }
        return res.redirect(302, finalUrl);
    } catch (error) {
        logger.error(`[ADD MARKETING CLICK ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id
        });
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
            error: error.message || "Unknown error",
        });
    }
};

export const getMarketingLinkByCode = async (req, res) => {
    try {
        logger.log("[GET MARKETING LINK] API Called");
        const { code } = req.params;
        const marketingLink = await MARKETING_LINK.findOne({ code });
        if (!marketingLink) {
            return notFoundResponse(res, { message: "Marketing link not found" });
        }
        return successResponse(res, {
            message: "Marketing link fetched successfully",
            data: marketingLink
        });
    } catch (error) {
        logger.error(`[GET MARKETING LINK ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id
        });
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
            error: error.message || "Unknown error",
        });
    }
};

export const getLocationWiseMarketingLink = async (req, res) => {
    try {
        logger.log("[GET MARKETING LINK] API Called");
        const { _id } = req.user;
        const { min_date, max_date } = req.query;

        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        // get all marketing links with locationEnabled true
        const marketingLinks = await MARKETING_LINK.find({ garage_id: _id, locationEnabled: true });
        if (!marketingLinks || marketingLinks.length === 0) {
            // return notFoundResponse(res, { message: "Marketing links not found" });
            return successResponse(res, {
                message: "Marketing links not found",
                data: []
            })
        }

        // prepare date filters
        const start = min_date ? new Date(min_date) : null;
        const end = max_date ? new Date(`${max_date}T23:59:59.999Z`) : null;

        // Helper to filter array by date
        const filterByDate = (arr) => {
            if (!arr) return [];
            return arr.filter(item => {
                if (!item.date) return false;
                const date = new Date(item.date);
                if (start && date < start) return false;
                if (end && date > end) return false;
                return true;
            });
        };

        // map through all locationEnabled links, filter scan data by date and add totalCount
        const filteredLinks = marketingLinks.map(link => {
            const clickData = filterByDate(link.scan.click);
            const leadData = filterByDate(link.scan.lead);
            const bookingData = filterByDate(link.scan.booking);

            return {
                ...link.toObject(),
                scan: {
                    click: clickData,
                    lead: leadData,
                    booking: bookingData
                },
                name: link.name,
                totalCount: clickData.length + leadData.length + bookingData.length
            };
        });

        return successResponse(res, {
            message: "Marketing links fetched successfully",
            payload: filteredLinks
        });

    } catch (error) {
        logger.error(`[GET MARKETING LINK ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id
        });
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
            error: error.message || "Unknown error",
        });
    }
};
const getCountryByLatLon = async (lat, lon) => {
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
            params: {
                format: "json",
                lat,
                lon
            }
        });
        return response.data.address.country || "Unknown";
    } catch (err) {
        return "Unknown";
    }
};

const topCountries = ["India", "USA", "UK", "UAE", "Canada", "Germany", "France", "Australia", "Japan", "Singapore"];

export const getLocationByAppointment = async (req, res) => {
    try {
        logger.log("[GET APPOINTMENT LOCATIONS] API Called");
        const { _id } = req.user;
        const { min_date, max_date } = req.query;

        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        const start = min_date ? new Date(min_date) : null;
        const end = max_date ? new Date(`${max_date}T23:59:59.999Z`) : null;

        const query = {
            garage_id: _id,
            is_deleted: false,
            lat: { $nin: [null, ""] },
            lon: { $nin: [null, ""] },
        };

        if (start && end) query.createdAt = { $gte: start, $lte: end };
        else if (start) query.createdAt = { $gte: start };
        else if (end) query.createdAt = { $lte: end };

        const appointments = await APPOINTMENT.find(query);

        // Country count map
        const countryCount = {};

        for (const appointment of appointments) {
            const { lat, lon } = appointment;
            const country = await getCountryByLatLon(lat, lon);
            if (countryCount[country]) countryCount[country]++;
            else countryCount[country] = 1;
        }

        // Prepare final response with topCountries and Others
        const responsePayload = [];
        let othersCount = 0;

        topCountries.forEach((country) => {
            const count = countryCount[country] || 0;
            responsePayload.push({
                name: country,
                total: count
            });
        });

        // Calculate others
        for (const [country, count] of Object.entries(countryCount)) {
            if (!topCountries.includes(country)) {
                othersCount += count;
            }
        }

        if (othersCount > 0) {
            responsePayload.push({
                name: "Others",
                total: othersCount
            });
        }

        return successResponse(res, {
            message: "Appointments fetched successfully",
            payload: responsePayload
        });

    } catch (error) {
        logger.error(`[GET APPOINTMENT LOCATIONS ERROR] ${error.message}`, {
            error: error.stack,
            user: req.user?._id
        });
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
            error: error.message || "Unknown error"
        });
    }
};


export default {
    addMarketingLink, getMarketingLink, getByIDMarketingLink, updateMarketingLink, deleteMarketingLink, getMarketingClick, getMarketingLinkByCode, getLocationWiseMarketingLink, getLocationByAppointment
};

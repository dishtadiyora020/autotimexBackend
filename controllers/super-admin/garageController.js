import GARAGE from "../../models/garage.js"
import Logger from "../../middleware/logger.js";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../middleware/responses.js";
import { checkDuplicateRecord, cloneDeep } from "../../lib/commonQueries.js";
import propelAuth from "../../services/propelauth.js";
import { generateApiKey, generateDomainSlug, generateKey, getPagination, searchQuery, sortingQuery } from "../../utils/common.js";
import mongoose from "mongoose";
import GARAGE_SETTINGS from "../../models/garageSettings.js";
import { DEFAULT_ISSUE_TREE, DEFAULT_SHOP_HOURS } from "../../utils/constants.js";
import CALENDAR_GENERAL_SETTINGS from "../../models/calendar-settings/generalSettings.js";
import USER_ROLES from "../../models/userRoles.js";
import API_KEYS from "../../models/apiKeys.js";
import ISSUE_TREE from "../../models/scheduling-tools/issueTree.js";
import { cloudFlareService } from "../../services/cloudflare.js";
const logger = new Logger("superAdmin/garageController.js")
import Stripe from "stripe"
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const priceId = process.env.STRIPE_PRICE_ID;


const createNewGarage = async (req, res) => {
    try {
        const createdResources = {
            orgId: null,
            userId: null,
            customerId: null,
            subscriptionId: null,
            domainId: null,
            garageId: null,
            apiKeyId: null,
            issueTreeId: null,
            settingsId: null,
            calendarSettingsId: null
        };

        logger.log("[CREATE GARAGE] Api Called")
        const isGarageAlreadyExist = await checkDuplicateRecord(GARAGE, null, [
            { key: "key", value: generateKey(req.body.name), type: 'string' }
        ])
        if (isGarageAlreadyExist) {
            return badRequestResponse(res, { message: "Garage already exist" })
        }
        // const isEmailAlreadyExist = await propelAuth.fetchUsersByQuery({ emailOrUsername: req.body.email })
        // if (isEmailAlreadyExist.totalUsers > 0) {
        //     return badRequestResponse(res, { message: "An account already exists with that email address" })
        // }
        // const isOrgAlreadyExist = await propelAuth.fetchOrgByQuery({ name: req.body.name })
        // if (isOrgAlreadyExist.totalOrgs > 0) return badRequestResponse(res, { message: "Garage already exist!" })
        const userQueryResult = await propelAuth.fetchUsersByQuery({ emailOrUsername: req.body.email });
        let userId = null;
        let organization = null;
        let user = null

        if (userQueryResult.totalUsers > 0) {
            // user exists — get their userId
            const existingUser = userQueryResult.users[0];
            userId = userQueryResult.users[0].userId;
            user = existingUser;
            logger.log(`[CREATE GARAGE] Existing user found with email ${req.body.email}`);

        } else {
            // user does not exist — create them
            user = await propelAuth.createUser({
                email: req.body.email,
                firstName: req.body.first_name,
                lastName: req.body.last_name,
                emailConfirmed: false,
                sendEmailToConfirmEmailAddress: true,
                askUserToUpdatePasswordOnLogin: true
            });
            if (!user) return badRequestResponse(res, { message: "Something went wrong while creating user" });

            userId = user.userId;
            createdResources.userId = user.userId;
            logger.log(`[CREATE GARAGE] New user created with email ${req.body.email}`);


        }
        organization = await propelAuth.createOrg({
            name: req.body.name
        })
        createdResources.orgId = organization.orgId;
        await propelAuth.addUserToOrg({
            userId: user.userId,
            orgId: organization.orgId,
            role: 'Owner'
        })
        const ownerRole = await USER_ROLES.findOne({ role: "Owner" })
        const domain_slug = generateDomainSlug(req.body.name);
        const stripeCustomer = await stripe.customers.create({
            name: req.body.name,
            email: req.body.email,
            metadata: {
                garage_id: organization.orgId,
                default_event_name: req.body.name
            }
        })
        createdResources.customerId = stripeCustomer.id;
        const subscription = await stripe.subscriptions.create({
            customer: stripeCustomer.id,
            items: [
                {
                    price: priceId,
                },
            ],
            collection_method: "charge_automatically",
        });

        createdResources.subscriptionId = subscription.id;


        const newGarage = new GARAGE({
            ...req.body,
            propel_auth_org_id: organization.orgId,
            propel_auth_owner_id: user.userId,
            domain_slug: domain_slug,
            members: [{
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                email: req.body.email,
                phone: req.body.phone,
                roles: [ownerRole],
                propel_auth_user_id: user.userId
            }],
            key: generateKey(req.body.name),
            stripe_customer_id: stripeCustomer.id
        })
        await newGarage.save()
        createdResources.garageId = newGarage._id;
        const apiKey = await API_KEYS.create({ garage_id: newGarage._id, api_key: generateApiKey() })
        await apiKey.save();
        createdResources.apiKeyId = apiKey._id;
        const garageSettings = new GARAGE_SETTINGS({ garage_id: newGarage._id, shop_hours: DEFAULT_SHOP_HOURS })
        await garageSettings.save()
        createdResources.settingsId = garageSettings._id;
        const default_issue_tree = new ISSUE_TREE({
            ...DEFAULT_ISSUE_TREE,
            garage_id: newGarage._id
        })
        await default_issue_tree.save()
        createdResources.issueTreeId = default_issue_tree._id;

        const calendarGeneralSettings = new CALENDAR_GENERAL_SETTINGS({ garage_id: newGarage._id })
        await calendarGeneralSettings.save()
        createdResources.calendarSettingsId = calendarGeneralSettings._id;

        const result = await cloudFlareService('/dns_records', 'POST', {
            "type": "A",
            "name": `${domain_slug}.${process.env.SERVER_BASE_DOMAIN}`,
            "content": process.env.SERVER_IP,
            "ttl": 3600,
            "proxied": false
        })
        createdResources.domainId = result?.result.id;
        const domain_id = result?.result.id
        await GARAGE.findByIdAndUpdate(newGarage._id, { domain_id: domain_id })
        return successResponse(res, { message: "Garage created successfully" })
    } catch (error) {
        logger.error(error);
        try {
            if (createdResources.domainId) await cloudFlareService(`/dns_records/${createdResources.domainId}`, 'DELETE');
            if (createdResources.customerId) await stripe.customers.del(createdResources.customerId);
            if (createdResources.subscriptionId) await stripe.subscriptions.del(createdResources.subscriptionId);
            if (createdResources.userId) await propelAuth.deleteUser(createdResources.userId);
            if (createdResources.orgId) await propelAuth.deleteOrg(createdResources.orgId);

            if (createdResources.calendarSettingsId) await CALENDAR_GENERAL_SETTINGS.findByIdAndDelete(createdResources.calendarSettingsId);
            if (createdResources.issueTreeId) await ISSUE_TREE.findByIdAndDelete(createdResources.issueTreeId);
            if (createdResources.settingsId) await GARAGE_SETTINGS.findByIdAndDelete(createdResources.settingsId);
            if (createdResources.apiKeyId) await API_KEYS.findByIdAndDelete(createdResources.apiKeyId);
            if (createdResources.garageId) await GARAGE.findByIdAndDelete(createdResources.garageId);

        } catch (rollbackErr) {
            logger.error("Error during rollback", rollbackErr);
        }
        return internalServerErrorResponse(res, { message: error?.message || "Something went wrong" })
    }
}

const updateGarage = async (req, res) => {
    try {
        logger.log("[UPDATE GARAGE] Api Called");
        const { garage_id } = req.params
        const garage = await GARAGE.findById(garage_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const garageOwner = garage.members.find(member => member.role === "Owner")
        if (garageOwner) {
            await GARAGE.updateOne(
                { _id: garage._id, "members._id": garageOwner._id },
                {
                    $set: {
                        ...req.body,
                        "members.$.first_name": req.body.first_name,
                        "members.$.last_name": req.body.last_name,
                        "members.$.email": req.body.email
                    }
                },
                { new: true }
            )
        }
        return successResponse(res, { message: "Garage updated successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: error?.message || "Something went wrong" })
    }
}

const getAllGarages = async (req, res) => {
    try {
        logger.log("[GET GARAGES] Api Called")
        const allGarages = await GARAGE.aggregate([
            {
                $facet: {
                    garages: [
                        {
                            $match: searchQuery(req.query.search, [{ name: "name", type: "string" }, { name: "key", type: "string" }])
                        },
                        { ...sortingQuery(req?.query?.sortBy, req?.query?.sortOrder) },
                        ...getPagination(req?.query?.page, req?.query?.limit)
                    ],
                    total: [
                        {
                            $match: {
                                ...searchQuery(req.query.search, [{ name: "name", type: "string" }, { name: "key", type: "string" }])
                            }
                        },
                        {
                            $count: "count"
                        }
                    ]
                }
            }
        ])
        return successResponse(res, { message: "Garages fetched successfully", payload: { garages: cloneDeep(allGarages)?.[0]?.garages ?? [], total: cloneDeep(allGarages)?.[0]?.total?.[0]?.count ?? 0 } });
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getGarageById = async (req, res) => {
    try {
        logger.log("[GET GARAGE BY ID] Api Called");
        const { garage_id } = req.params
        const isValidObjectID = mongoose.Types.ObjectId.isValid(garage_id)
        if (!isValidObjectID) return badRequestResponse(res, { message: "Invalid garage id" })
        const garage = await GARAGE.findById(garage_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        return successResponse(res, { message: "Garage fetched successfully", payload: { garage } })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const deleteGarage = async (req, res) => {
    try {
        logger.log("[DELETE GARAGE] Api Called");
        const { garage_id } = req.params
        const isValidObjectID = mongoose.Types.ObjectId.isValid(garage_id)
        if (!isValidObjectID) return badRequestResponse(res, { message: "Invalid garage id" })
        const garage = await GARAGE.findById(garage_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const usersInOrg = await propelAuth.fetchUsersByQuery({ orgId: garage.propel_auth_org_id })
        await Promise.all(usersInOrg.users.map(user => propelAuth.deleteUser(user.userId)))
        await propelAuth.deleteOrg(garage.propel_auth_org_id)
        await garage.deleteOne()
        await cloudFlareService(`/dns_records/${garage.domain_id}`, 'delete')
        return successResponse(res, { message: "Garage deleted successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}


const updateStripe = async (req, res) => {
    try {
        const { meterId, customerId, priceId } = req.body; // make sure you pass these from client

        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [
                {
                    price: priceId, // ✅ do NOT include `quantity` for metered plans
                },
            ],
            collection_method: "charge_automatically",
            expand: ['latest_invoice.payment_intent'], // optional
        });

        res.status(200).json({ message: "Subscription created", subscription });
    } catch (error) {
        console.error("Error creating subscription:", error);
        res.status(500).json({ error: error.message });
    }
};

const getUserOrganizationsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;  // Getting userId from request parameters

        // Fetch user data using their userId (PropelAuth API Call)
        const userQueryResult = await propelAuth.fetchUsersByQuery({ userId: userId });

        // Check if user exists and has orgMemberships
        if (userQueryResult.totalUsers > 0) {
            const existingUser = userQueryResult.users[0];
            // Check if the user has orgMemberships
            if (existingUser.orgMemberships && existingUser.orgMemberships.length > 0) {
                const orgIds = existingUser.orgMemberships.map(org => org.orgId);

                // Respond with the organization IDs
                console.log(`[USER ORGANIZATION LIST] User is part of organizations: ${orgIds}`);
                return res.status(200).json({
                    message: "Organizations fetched successfully.",
                    orgIds: orgIds  // Return the list of organization IDs
                });
            } else {
                console.log("[USER ORGANIZATION LIST] User has no organizations.");
                return res.status(404).json({ message: "User has no organizations." });
            }
        } else {
            console.log("[USER ORGANIZATION LIST] User not found.");
            return res.status(404).json({ message: "User not found." });
        }
    } catch (error) {
        console.error("[ERROR] Failed to fetch user organizations:", error);
        return res.status(500).json({ error: error.message });
    }
};




export default { createNewGarage, updateGarage, getAllGarages, getGarageById, deleteGarage, updateStripe, getUserOrganizationsByUserId }
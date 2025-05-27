import GARAGE from "../../../models/garage.js"
import SERVICE_ADVISORS from "../../../models/calendar-settings/serviceAdvisor.js"
import Logger from "../../../middleware/logger.js";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
import mongoose from "mongoose";
import { getPagination, searchQuery, sortingQuery } from "../../../utils/common.js";
import { cloneDeep } from "../../../lib/commonQueries.js";
const logger = new Logger("garage/calendarSettings/serviceAdvisorController.js")

const createServiceAdvisor = async (req, res) => {
    try {
        logger.log("[CREATE SERVICE ADVISOR] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const serviceAdvisor = new SERVICE_ADVISORS({
            garage_id: _id,
            ...req.body
        })
        await serviceAdvisor.save()
        return successResponse(res, { message: "Service Advisor created successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getServiceAdvisors = async (req, res) => {
    try {
        logger.log("[GET SERVICE ADVISORS] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const { page, limit, search, sortBy, sortOrder } = req.query
        const serviceAdvisors = await SERVICE_ADVISORS.aggregate([
            {
                $facet: {
                    serviceAdvisors: [
                        { $match: { garage_id: _id } },
                        { $match: searchQuery(search, [{ name: "first_name", type: "string" }, { name: "last_name", type: "string" }, { name: "display_color", type: "string" }]) },
                        { ...sortingQuery(sortBy, sortOrder) },
                        ...getPagination(page, limit),
                        { $unset: ["garage_id"] }
                    ],
                    total: [
                        { $match: { garage_id: _id } },
                        { $match: searchQuery(search, [{ name: "first_name", type: "string" }, { name: "last_name", type: "string" }, { name: "display_color", type: "string" }]) },
                        { $count: "total" }
                    ]
                }
            }
        ])
        return successResponse(res, {
            payload: {
                serviceAdvisors: cloneDeep(serviceAdvisors)?.[0]?.serviceAdvisors ?? [], total: cloneDeep(serviceAdvisors)?.[0]?.total?.[0]?.total ?? 0
            },
            message: "Service Advisors fetched successfully"
        })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const updateServiceAdvisor = async (req, res) => {
    try {
        logger.log("[UPDATE SERVICE ADVISOR] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const { service_advisor_id } = req.params
        const isValidObjectID = mongoose.Types.ObjectId.isValid(service_advisor_id)
        if (!isValidObjectID) return badRequestResponse(res, { message: "Invalid service advisor id" })
        const serviceAdvisor = await SERVICE_ADVISORS.findById(service_advisor_id)
        if (!serviceAdvisor) return badRequestResponse(res, { message: "Service Advisor not found" })
        await SERVICE_ADVISORS.findByIdAndUpdate(service_advisor_id, req.body, { new: true })
        return successResponse(res, { message: "Service Advisor updated successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const deleteServiceAdvisor = async (req, res) => {
    try {
        logger.log("[DELETE SERVICE ADVISOR] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const { service_advisor_id } = req.params
        const isValidObjectID = mongoose.Types.ObjectId.isValid(service_advisor_id)
        if (!isValidObjectID) return badRequestResponse(res, { message: "Invalid service advisor id" })
        const serviceAdvisor = await SERVICE_ADVISORS.findById(service_advisor_id)
        if (!serviceAdvisor) return badRequestResponse(res, { message: "Service Advisor not found" })
        await SERVICE_ADVISORS.findByIdAndDelete(service_advisor_id)
        return successResponse(res, { message: "Service Advisor deleted successfully" })
    }
    catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getServiceAdvisorById = async (req, res) => {
    try {
        logger.log("[GET SERVICE ADVISOR BY ID] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const { service_advisor_id } = req.params
        const isValidObjectID = mongoose.Types.ObjectId.isValid(service_advisor_id)
        if (!isValidObjectID) return badRequestResponse(res, { message: "Invalid service advisor id" })
        const serviceAdvisor = await SERVICE_ADVISORS.findById(service_advisor_id).select('-garage_id')
        if (!serviceAdvisor) return badRequestResponse(res, { message: "Service Advisor not found" })
        return successResponse(res, { message: "Service Advisor fetched successfully", payload: { serviceAdvisor } })
    }
    catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

export default { createServiceAdvisor, getServiceAdvisors, updateServiceAdvisor, deleteServiceAdvisor, getServiceAdvisorById }
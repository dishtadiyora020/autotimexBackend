import GARAGE from "../../../models/garage.js"
import TECHNICIAN from "../../../models/calendar-settings/technician.js"
import Logger from "../../../middleware/logger.js";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
import { getPagination, searchQuery, sortingQuery } from "../../../utils/common.js";
import { cloneDeep } from "../../../lib/commonQueries.js";
import mongoose from "mongoose";
// import mongoose from "mongoose";
// import { getPagination, searchQuery, sortingQuery } from "../../../utils/common.js";
// import { cloneDeep } from "../../../lib/commonQueries.js";
const logger = new Logger("garage/calendarSettings/technicianController.js")

const createTechnician = async (req, res) => {
    try {
        logger.log("[CREATE TECHNICIAN] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const technician = new TECHNICIAN({
            garage_id: _id,
            ...req.body
        })
        await technician.save()
        return successResponse(res, { message: "Technician created successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getTechnicians = async (req, res) => {
    const { _id } = req.user
    const { page, limit, search, sortBy, sortOrder } = req.query
    const technicians = await TECHNICIAN.aggregate([
        {
            $facet: {
                technicians: [
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
            technicians: cloneDeep(technicians)?.[0]?.technicians ?? [],
            total: cloneDeep(technicians)?.[0]?.total?.[0]?.total ?? 0
        },
        message: "Technicians fetched successfully"
    })
}

const updateTechnician = async (req, res) => {
    try {
        logger.log("[UPDATE TECHNICIAN] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const { technician_id } = req.params
        const isValidObjectID = mongoose.Types.ObjectId.isValid(technician_id)
        if (!isValidObjectID) return badRequestResponse(res, { message: "Invalid technician id" })
        const technician = await TECHNICIAN.findById(technician_id)
        if (!technician) return badRequestResponse(res, { message: "Technician not found" })
        await TECHNICIAN.findByIdAndUpdate(technician_id, req.body, { new: true })
        return successResponse(res, { message: "Technician updated successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const deleteTechnician = async (req, res) => {
    const { technician_id } = req.params
    const isValidObjectID = mongoose.Types.ObjectId.isValid(technician_id)
    if (!isValidObjectID) return badRequestResponse(res, { message: "Invalid technician id" })
    const technician = await TECHNICIAN.findById(technician_id)
    if (!technician) return badRequestResponse(res, { message: "Technician not found" })
    await TECHNICIAN.findByIdAndDelete(technician_id)
    return successResponse(res, { message: "Technician deleted successfully" })
}

const getTechnicianByID = async (req, res) => {
    const { technician_id } = req.params
    const isValidObjectID = mongoose.Types.ObjectId.isValid(technician_id)
    if (!isValidObjectID) return badRequestResponse(res, { message: "Invalid technician id" })
    const technician = await TECHNICIAN.findById(technician_id).select('-garage_id')
    if (!technician) return badRequestResponse(res, { message: "Technician not found" })
    return successResponse(res, { payload: technician, message: "Technician fetched successfully" })
}

export default { createTechnician, getTechnicians, updateTechnician, deleteTechnician, getTechnicianByID }
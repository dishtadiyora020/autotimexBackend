import GARAGE from "../../../models/garage.js"
import JOB_LABEL from "../../../models/calendar-settings/jobLabel.js"
import Logger from "../../../middleware/logger.js";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
import { getPagination, searchQuery, sortingQuery } from "../../../utils/common.js";
import { checkDuplicateRecord, cloneDeep } from "../../../lib/commonQueries.js";
import mongoose from "mongoose";
const logger = new Logger("garage/calendarSettings/jobLabelController.js")

const createLabelOption = async (req, res) => {
    try {
        logger.log("[CREATE LABEL OPTION] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const jobLabel = new JOB_LABEL({
            garage_id: _id,
            ...req.body
        })
        await jobLabel.save()
        return successResponse(res, { message: "Job label created successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getLabelOptions = async (req, res) => {
    try {
        logger.log("[GET LABEL OPTIONS] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        // const jobLabels = await JOB_LABEL.find({ garage_id: _id }).select('-garage_id')
        const jobLabels = await JOB_LABEL.aggregate([
            {
                $facet: {
                    jobLabels: [
                        { $match: { garage_id: _id } },
                        {
                            $match: searchQuery(req.query.search, [
                                { name: "label", type: "string" },
                                { name: "description", type: "string" },
                                { name: "label_color", type: "string" }
                            ])
                        },
                        { ...sortingQuery(req?.query?.sortBy, req?.query?.sortOrder) },
                        ...getPagination(req?.query?.page, req?.query?.limit),
                        { $unset: ["garage_id"] }
                    ],
                    total: [
                        { $match: { garage_id: _id } },
                        {
                            $match: searchQuery(req.query.search, [
                                { name: "label", type: "string" },
                                { name: "description", type: "string" },
                                { name: "label_color", type: "string" }
                            ])
                        },
                        { $count: "total" }
                    ]
                }
            }
        ])
        return successResponse(res, {
            message: "Job labels fetched successfully",
            payload: {
                job_labels: cloneDeep(jobLabels)?.[0]?.jobLabels ?? [],
                total: cloneDeep(jobLabels)?.[0]?.total?.[0]?.total ?? 0
            }
        })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const updateLabelOption = async (req, res) => {
    const { _id } = req.user
    const garage = await GARAGE.findById(_id)
    if (!garage) return badRequestResponse(res, { message: "Garage not found" })
    try {
        logger.log("[UPDATE LABEL OPTION] Api Called")
        const { job_label_id } = req.params
        const isValidObjectID = mongoose.Types.ObjectId.isValid(job_label_id)
        if (!isValidObjectID) return badRequestResponse(res, { message: "Invalid job label id" })
        const ifAlreadyExists = await checkDuplicateRecord(JOB_LABEL, job_label_id, [{ key: "label", value: req.body.label, type: "string" }], null)
        if (ifAlreadyExists) return badRequestResponse(res, { message: "Job label already exist" })
            const jobLabel = await JOB_LABEL.findOne({ _id: job_label_id, garage_id: _id })
        if (!jobLabel) return badRequestResponse(res, { message: "Job label not found" })
        await jobLabel.updateOne({ ...req.body })
        return successResponse(res, { message: "Job label updated successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const deleteLabelOption = async (req, res) => {
    const { _id } = req.user
    const garage = await GARAGE.findById(_id)
    if (!garage) return badRequestResponse(res, { message: "Garage not found" })
    try {
        logger.log("[DELETE LABEL OPTION] Api Called")
        const { job_label_id } = req.params
        const isValidObjectID = mongoose.Types.ObjectId.isValid(job_label_id)
        if (!isValidObjectID) return badRequestResponse(res, { message: "Invalid job label id" })
        const jobLabel = await JOB_LABEL.findById(job_label_id)
        if (!jobLabel) return badRequestResponse(res, { message: "Job label not found" })
        await jobLabel.deleteOne();
        return successResponse(res, { message: "Job label deleted successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getLabelByID = async (req, res) => {
    const { _id } = req.user
    const garage = await GARAGE.findById(_id)
    if (!garage) return badRequestResponse(res, { message: "Garage not found" })
    try {
        logger.log("[GET LABEL OPTION BY ID] Api Called")
        const { job_label_id } = req.params
        const isValidObjectID = mongoose.Types.ObjectId.isValid(job_label_id)
        if (!isValidObjectID) return badRequestResponse(res, { message: "Invalid job label id" })
        const jobLabel = await JOB_LABEL.findById(job_label_id).select('-garage_id')
        if (!jobLabel) return badRequestResponse(res, { message: "Job label not found" })
        return successResponse(res, { message: "Job label get successfully", jobLabel })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

export default { createLabelOption, getLabelOptions, updateLabelOption, deleteLabelOption, getLabelByID }
import GARAGE from "../../../models/garage.js"
import PROGRESS_OPTIONS from "../../../models/calendar-settings/progressOption.js"
import Logger from "../../../middleware/logger.js";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
import mongoose from "mongoose";
import { getPagination, searchQuery, sortingQuery } from "../../../utils/common.js";
import { cloneDeep } from "../../../lib/commonQueries.js";
// import { getPagination, searchQuery, sortingQuery } from "../../../utils/common.js";
// import { cloneDeep } from "../../../lib/commonQueries.js";
const logger = new Logger("garage/calendarSettings/progressOptionController.js")

const createProgressOption = async (req, res) => {
    try {
        logger.log("[CREATE PROGRESS OPTIONS] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const progressOption = new PROGRESS_OPTIONS({
            garage_id: _id,
            ...req.body
        })
        await progressOption.save()
        return successResponse(res, { message: "Progress option created successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getProgressOptions = async (req, res) => {
    try {
        logger.log("[GET PROGRESS OPTIONS] Api Called");
        const { _id } = req.user
        const progressOptions = await PROGRESS_OPTIONS.aggregate([
            {
                $facet: {
                    progressOptions: [
                        {
                            $match: {
                                garage_id: new mongoose.Types.ObjectId(_id)
                            }
                        },
                        {
                            $match: searchQuery(req.query.search, [
                                { name: "label", type: "string" },
                                { name: "progress_percentage", type: "number" }
                            ])
                        },
                        { ...sortingQuery(req?.query?.sortBy, req?.query?.sortOrder) },
                        ...getPagination(req?.query?.page, req?.query?.limit),
                        {
                            $project: {
                                _id: 1,
                                label: 1,
                                progress_percentage: 1
                            }
                        }
                    ],
                    total: [
                        { $match: { garage_id: _id } },
                        {
                            $match: searchQuery(req.query.search, [
                                { name: "label", type: "string" },
                                { name: "progress_percentage", type: "number" }
                            ])
                        },
                        { $count: "total" }
                    ]
                }
            }
        ])
        return successResponse(res, {
            payload: {
                progress_options: cloneDeep(progressOptions)?.[0]?.progressOptions ?? [],
                total: cloneDeep(progressOptions)?.[0]?.total?.[0]?.total ?? 0
            },
            message: "Progress options fetched successfully"
        })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const updateProgressOption = async (req, res) => {
    try {
        logger.log("[UPDATE PROGRESS OPTIONS] Api Called")
        const { progress_option_id } = req.params
        const progressOption = await PROGRESS_OPTIONS.findOne({ _id: progress_option_id, garage_id: req.user._id })
        if (!progressOption) return badRequestResponse(res, { message: "Progress option not found" })
        await progressOption.updateOne({ ...req.body })
        return successResponse(res, { message: "Progress options updated successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getProgressOptionById = async (req, res) => {
    try {
        logger.log("[GET PROGRESS OPTION BY ID] Api Called")
        const { progress_option_id } = req.params
        const progressOption = await PROGRESS_OPTIONS.findOne({
            _id: new mongoose.Types.ObjectId(progress_option_id),
            garage_id: req.user._id
        }).select('-garage_id')
        if (!progressOption) return badRequestResponse(res, { message: "Progress option not found" })
        return successResponse(res, { message: "Progress option fetched successfully", payload: { progress_option: progressOption } })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const deleteProgressOption = async (req, res) => {
    try {
        logger.log("[DELETE PROGRESS OPTION] Api Called")
        const { progress_option_id } = req.params
        await PROGRESS_OPTIONS.deleteOne({ _id: progress_option_id, garage_id: req.user._id })
        return successResponse(res, { message: "Progress option deleted successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

export default { createProgressOption, getProgressOptions, updateProgressOption, getProgressOptionById, deleteProgressOption }
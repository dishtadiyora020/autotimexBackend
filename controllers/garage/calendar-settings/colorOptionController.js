import GARAGE from "../../../models/garage.js"
import COLOR_OPTIONS from "../../../models/calendar-settings/colorOptions.js"
import Logger from "../../../middleware/logger.js";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
import { getPagination, searchQuery, sortingQuery } from "../../../utils/common.js";
import { cloneDeep } from "../../../lib/commonQueries.js";
const logger = new Logger("garage/calendarSettings/colorOptionController.js")

const getColorOptions = async (req, res) => {
    try {
        logger.log("[GET COLOR OPTIONS] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const colorOptions = await COLOR_OPTIONS.aggregate([
            {
                $facet: {
                    colorOptions: [
                        { $match: { garage_id: _id } },
                        {
                            $match: searchQuery(req.query.search, [
                                { name: "color", type: "string" },
                                { name: "description", type: "string" },
                                { name: "text_color", type: "string" },
                                { name: "border_color", type: "string" }
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
                                { name: "color", type: "string" },
                                { name: "description", type: "string" },
                                { name: "text_color", type: "string" },
                                { name: "border_color", type: "string" }
                            ])
                        },
                        { $count: "total" }
                    ]
                }
            }
        ])
        return successResponse(res, {
            message: "Color options fetched successfully",
            payload: {
                color_options: cloneDeep(colorOptions)?.[0]?.colorOptions ?? [],
                total: cloneDeep(colorOptions)?.[0]?.total?.[0]?.total ?? 0
            }
        })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const createColorOption = async (req, res) => {
    try {
        logger.log("[CREATE COLOR OPTIONS] Api Called")
        const { _id } = req.user
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const colorOption = new COLOR_OPTIONS({
            garage_id: _id,
            ...req.body
        })
        await colorOption.save()
        return successResponse(res, { message: "Color option created successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const updateColorOption = async (req, res) => {
    try {
        logger.log("[UPDATE COLOR OPTIONS] Api Called")
        const { color_option_id } = req.params
        const colorOption = await COLOR_OPTIONS.findById(color_option_id)
        if (!colorOption) return badRequestResponse(res, { message: "Color option not found" })
        await colorOption.updateOne({ ...req.body })
        return successResponse(res, { message: "Color options updated successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const getColorOptionById = async (req, res) => {
    try {
        logger.log("[GET COLOR OPTION BY ID] Api Called")
        const { color_option_id } = req.params
        const colorOption = await COLOR_OPTIONS.findById(color_option_id)
        if (!colorOption) return badRequestResponse(res, { message: "Color option not found" })
        return successResponse(res, { message: "Color option fetched successfully", payload: { color_option: colorOption } })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

const deleteColorOption = async (req, res) => {
    try {
        logger.log("[DELETE COLOR OPTION] Api Called")
        const { color_option_id } = req.params
        await COLOR_OPTIONS.deleteOne({ _id: color_option_id })
        return successResponse(res, { message: "Color option deleted successfully" })
    } catch (error) {
        logger.error(error)
        return internalServerErrorResponse(res, { message: "Something went wrong" })
    }
}

export default { getColorOptions, createColorOption, updateColorOption, getColorOptionById, deleteColorOption }
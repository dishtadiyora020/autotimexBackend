import Joi from "joi";

export const createProgressOptionsSchema = Joi.object({
    label: Joi.string().required(),
    progress_percentage: Joi.number().min(0).max(100).required()
})

export const updateProgressOptionsSchema = Joi.object({
    label: Joi.string(),
    progress_percentage: Joi.number().min(0).max(100)
})
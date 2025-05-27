import Joi from "joi";

export const createJobLabelSchema = Joi.object({
    label: Joi.string().required(),
    label_color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).messages({
        'string.pattern.base': '{#label} is not a valid hex color!'
    }),
    description: Joi.string().allow(''),
})

export const updateJobLabelSchema = Joi.object({
    label: Joi.string().required(),
    label_color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).messages({
        'string.pattern.base': '{#label} is not a valid hex color!'
    }),
    description: Joi.string().allow(''),
})
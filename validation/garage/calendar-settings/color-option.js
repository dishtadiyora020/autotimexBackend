import Joi from "joi";

export const createColorOptionsSchema = Joi.object({
    color: Joi.string().required().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).messages({
        'string.pattern.base': '{#label} is not a valid hex color!'
    }),
    description: Joi.string(),
    text_color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).messages({
        'string.pattern.base': '{#label} is not a valid hex color!'
    }),
    border_color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).messages({
        'string.pattern.base': '{#label} is not a valid hex color!'
    })
})
export const updateColorOptionsSchema = Joi.object({
    color: Joi.string().required().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).messages({
        'string.pattern.base': '{#label} is not a valid hex color!'
    }),
    description: Joi.string(),
    text_color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).messages({
        'string.pattern.base': '{#label} is not a valid hex color!'
    }),
    border_color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).messages({
        'string.pattern.base': '{#label} is not a valid hex color!'
    })
})
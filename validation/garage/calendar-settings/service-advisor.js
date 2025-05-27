import Joi from "joi";

export const createServiceAdvisorSchema = Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    display_color: Joi.string().required().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).messages({
        "string.pattern.base": "Invalid hex color"
    }),
    sms_id: Joi.string().allow(null)
})

export const updateServiceAdvisorSchema = Joi.object({
    first_name: Joi.string(),
    last_name: Joi.string(),
    display_color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).messages({
        "string.pattern.base": "Invalid hex color"
    }),
    sms_id: Joi.string().allow(null)
})
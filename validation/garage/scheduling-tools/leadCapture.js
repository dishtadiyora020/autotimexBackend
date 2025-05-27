import Joi from "joi";

export const leadCaptureValidationSchema = Joi.object({
    is_enable: Joi.boolean().default(false),
    title: Joi.string()
        .required()
        .trim()
        .messages({
            'any.required': '"title" is required',
            'string.base': '"title" must be a string'
        }),
    sub_title: Joi.string()
        .required()
        .trim()
        .messages({
            'any.required': '"sub_title" is required',
            'string.base': '"sub_title" must be a string'
        }),
    phone_number: Joi.string()
        .required()
        .trim()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .messages({
            'any.required': '"phone_number" is required',
            'string.base': '"phone_number" must be a string',
            'string.pattern.base': '"phone_number" must be a valid phone number!'
        })
});

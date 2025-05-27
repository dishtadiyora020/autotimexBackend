import Joi from 'joi';


export const TransportationOptionsSchema = Joi.object({
    is_enable: Joi.boolean().default(false).messages({
        'boolean.base': 'is_enable must be a boolean',
    }),
    request_options: Joi.array().items(
        Joi.object({
            title: Joi.string().trim().required().messages({
                'string.base': 'Title must be a string',
                'any.required': 'Title is required',
            }),
            description: Joi.string().trim().allow('').optional().messages({
                'string.base': 'Description must be a string',
            }),
            customer_warning: Joi.string().trim().allow('').optional().messages({
                'string.base': 'Customer warning must be a string',
            }),
        })
    ).messages({
        'array.base': 'request_options must be an array',
    }),
    hours: Joi.array().items(
        Joi.object({
            day: Joi.string().valid(
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday',
                'saturday',
                'sunday'
            ).required().messages({
                'string.base': 'Day must be a string',
                'any.required': 'Day is required',
                'any.only': 'Day must be a valid day of the week',
            }),
            is_available: Joi.boolean().default(false).messages({
                'boolean.base': 'is_available must be a boolean',
            }),
            start_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).when('is_available', {
                is: true,
                then: Joi.required(),
                otherwise: Joi.optional().allow('')
            }).messages({
                'string.base': 'Start time must be a string',
                'string.pattern.base': 'Start time must be in HH:MM format (24-hour)',
                'any.required': 'Start time is required when is_available is true'
            }),
            end_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).when('is_available', {
                is: true,
                then: Joi.required(),
                otherwise: Joi.optional().allow('')
            }).messages({
                'string.base': 'End time must be a string',
                'string.pattern.base': 'End time must be in HH:MM format (24-hour)',
                'any.required': 'End time is required when is_available is true'
            }),
        })
    ).messages({
        'array.base': 'hours must be an array',
    }),
});

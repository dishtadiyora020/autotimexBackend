import Joi from 'joi';

// Validation schema for vehicle info
export const vehicleInfoValidationSchema = Joi.object({
    show_license_plate_field: Joi.boolean()
        .optional()
        .messages({
            'boolean.base': '"show_license_plate_field" must be a boolean value',
        }),
    show_vin_field: Joi.boolean()
        .optional()
        .messages({
            'boolean.base': '"show_vin_field" must be a boolean value',
        }),
    serviced_years_start: Joi.number()
        .integer()
        .min(1950)
        .optional()
        .messages({
            'number.base': '"serviced_years_start" must be a number',
            'number.integer': '"serviced_years_start" must be an integer',
            'number.min': '"serviced_years_start" must be at least 1950',
        }),
    serviced_years_end: Joi.number()
        .integer()
        .max(new Date().getFullYear())
        .optional()
        .messages({
            'number.base': '"serviced_years_end" must be a number',
            'number.integer': '"serviced_years_end" must be an integer',
            'number.max': `"serviced_years_end" must not exceed ${new Date().getFullYear()}`,
        }),
});


export const blacklistValidationSchema = Joi.object({
    makes: Joi.array().items(Joi.object({
        make_id: Joi.string().trim().required().messages({
            'string.base': '"make_id" must be a string',
            'any.required': '"make_id" is required',
        }),
        make_name: Joi.string().trim().required().messages({
            'string.base': '"make_name" must be a string',
            'any.required': '"make_name" is required',
        }),
        models: Joi.array().items(Joi.object({
            model_id: Joi.string().trim().required().messages({
                'string.base': '"model_id" must be a string',
                'any.required': '"model_id" is required',
            }),
            model_name: Joi.string().trim().required().messages({
                'string.base': '"model_name" must be a string',
                'any.required': '"model_name" is required',
            }),
        })).min(1).required().messages({
            'array.base': '"models" must be an array',
            'array.empty': '"models" must not be an empty array',
            'any.required': '"models" is required',
        }),
    })).min(1).required().messages({
        'array.base': '"makes" must be an array',
        'array.empty': '"makes" must not be an empty array',
        'any.required': '"makes" is required',
    }),
});


import Joi from "joi";
import mongoose from "mongoose";

export const addExitLeadSchema = Joi.object({
    first_name: Joi.string().trim().required().messages({
        'string.empty': 'Name is required',
        'any.required': 'Name is required'
    }),
    email: Joi.string().trim().required().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),
    question: Joi.string().trim().required().messages({
        'string.empty': 'Question is required',
        'any.required': 'Question is required'
    }),
})

export const updateExitLeadSchema = Joi.object({
    followUp: Joi.boolean().optional().messages({
        'boolean.base': 'Follow-up must be true or false',
    }),
    followUp_notes: Joi.string().trim().optional().messages({
        'string.base': 'Follow-up notes must be a string',
    }),
});

export const createLeadSchema = Joi.object({
    phone: Joi.string()
        .trim()
        .pattern(/^[0-9]{10,15}$/) // adjust pattern to match your format
        .messages({
            'string.pattern.base': 'Phone number must be valid and contain 10 to 15 digits',
            'string.base': 'Phone must be a string',
        }),
    issue_tree: Joi.array().items(
        Joi.object({
            issue_id: Joi.string().required().messages({
                'any.required': 'issue ID is required',
                'string.base': 'Issue ID must be a string',
            }),
            category_id: Joi.string().required().messages({
                'any.required': 'Category ID is required',
                'string.base': 'Category ID must be a string',
            }),
            service_id: Joi.string().required().messages({
                'any.required': 'Service ID is required',
                'string.base': 'Service ID must be a string',
            }),
            question_id: Joi.string().required().messages({
                'any.required': 'Question ID is required',
                'string.base': 'Question ID must be a string',
            }),
            option_id: Joi.string().required().messages({
                'any.required': 'Option ID is required',
                'string.base': 'Option ID must be a string',
            }),
            comment: Joi.string()
                .trim()
                .optional()
                .messages({
                    'string.base': 'Comment must be a string'
                }),
            media: Joi.array()
                .items(
                    Joi.alternatives().try(
                        Joi.string().uri().messages({
                            'string.uri': 'Media must be a valid URL',
                            'string.base': 'Media item must be a string or valid object'
                        }),
                        Joi.object().unknown(true) // allow any type of file object
                    )
                )
                .optional()
                .messages({
                    'array.base': 'Media must be an array'
                })
        })
    ).optional()
});


export const updateLeadSchema = Joi.object({
    first_name: Joi.string().trim().required().messages({
        'string.empty': 'First Name is required',
        'any.required': 'First Name is required'
    }),
    progress: Joi.string().trim().required().messages({
        'string.empty': 'progress is required',
        'any.required': 'progress is required'
    }),
    last_name: Joi.string().trim().required().messages({
        'string.empty': 'Last Name is required',
        'any.required': 'Last Name is required'
    }),
    email: Joi.string().trim().optional().messages({
        'string.base': 'Email must be a string',
    }),
    followUp: Joi.boolean().optional().messages({
        'boolean.base': 'Follow-up must be true or false',
    }),
    followUp_notes: Joi.string().trim().optional().messages({
        'string.base': 'Follow-up notes must be a string',
    }),
    vehicle: Joi.alternatives().try(
        Joi.string().trim().regex(/^[0-9a-fA-F]{24}$/).messages({
            'string.pattern.base': 'Vehicle ID must be a valid MongoDB ObjectId',
        }),
        Joi.object()
            .keys({
                year: Joi.string().trim().optional(),
                make: Joi.string().trim().optional(),
                model: Joi.string().trim().optional(),
                license_plate: Joi.string().trim().optional(),
                license_region: Joi.string().trim().optional(),
                VIN: Joi.string().trim().optional(),
            })
            .pattern(
                Joi.string(),
                Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean())
            )
    ).optional(),

    drop: Joi.object({
        pickup_type: Joi.string().trim().optional().messages({
            'string.base': 'Type must be a string',
        }),
        date: Joi.string().trim().optional().messages({
            'string.base': 'Date must be a string',
        }),
        time: Joi.string().trim().optional().messages({
            'string.base': 'Time must be a string',
        }),
        transportOption: Joi.string().trim().optional().messages({
            'string.base': 'TransportOption plate must be a string',
        })
    }).optional(),
    appointment: Joi.object({
        confirmBooking: Joi.boolean().optional().messages({
            'boolean.base': 'ConfirmBooking must be true or false',
        }),
        terms: Joi.boolean().optional().messages({
            'boolean.base': 'terms must be true or false',
        }),
        drop_of_terms: Joi.boolean().optional().messages({
            'boolean.base': 'drop_of_terms must be true or false',
        }),
    }).optional(),

});
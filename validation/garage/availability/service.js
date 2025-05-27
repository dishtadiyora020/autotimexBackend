import Joi from "joi";
import mongoose from "mongoose";

export const addServiceSchema = Joi.object({
    name: Joi.string().required().trim().messages({
        'string.empty': 'Service name is required',
        'any.required': 'Service name is required'
    }),
    estimated_minutes: Joi.number().integer().min(0).required().messages({
        'number.base': 'Estimated minutes must be a number',
        'number.min': 'Estimated minutes cannot be negative',
        'any.required': 'Estimated time is required'
    }),
    is_waiter: Joi.boolean().default(true),
    is_dropoff: Joi.boolean().default(true),
    is_pickup: Joi.boolean().default(false),
    internal_notes: Joi.string().trim().allow('').optional(),
    garage_id: Joi.string().custom((value, helper) => {
        return mongoose.Types.ObjectId.isValid(value)
            ? value
            : helper.error('string.invalid');
    }).messages({
        'string.invalid': 'Invalid garage ID format'
    }).optional()
});


export const updateServiceSchema = Joi.object({
    name: Joi.string().trim().optional().messages({
        'string.empty': 'Service name cannot be empty',
    }),
    estimated_minutes: Joi.number().integer().min(0).optional().messages({
        'number.base': 'Estimated minutes must be a number',
        'number.min': 'Estimated minutes cannot be negative',
    }),
    is_waiter: Joi.boolean().optional(),
    is_dropoff: Joi.boolean().optional(),
    is_pickup: Joi.boolean().optional(),
    internal_notes: Joi.string().trim().allow('').optional(),
});

export const addServiceSchedulerSchema = Joi.object({
   services: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()).required().min(1).messages({
        'array.base': 'Services must be an array of valid ObjectIds',
        'any.required': 'Services are required',
        'array.min': 'At least one service must be specified',
        'string.pattern.base': 'Each service must be a valid MongoDB ObjectId'
    }),
    appointment_type: Joi.string().valid('waiter', 'dropoff', 'all').required().messages({
        'any.only': 'Appointment type must be one of waiter, dropoff, or all',
        'any.required': 'Appointment type is required'
    }),
    mode: Joi.object({
        type: Joi.string().valid('date_only', 'preference_timeslots').required().messages({
            'any.only': 'Mode type must be date_only or preference_timeslots',
            'any.required': 'Mode type is required'
        }),
        timeslots: Joi.when('type', {
            is: 'preference_timeslots',
            then: Joi.array().items(Joi.object({
                label: Joi.string().trim().required().messages({
                    'any.required': 'Label is required for preference timeslots'
                }),
                time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
                    'string.pattern.base': 'Time must be in HH:MM format',
                    'any.required': 'Time is required for preference timeslots'
                })
            })).min(1).required().messages({
                'array.base': 'Time slots must be an array',
                'array.min': 'At least one time slot is required for preference timeslots',
                'any.required': 'Time slots are required for preference timeslots'
            }),
            otherwise: Joi.forbidden()
        })
    }).required().messages({
        'any.required': 'Mode is required'
    }),
    calendar_note: Joi.string().trim().allow('').optional()
});


export const updateServiceSchedulerSchema = Joi.object({
    services: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()).required().min(1).messages({
        'array.base': 'Services must be an array of valid ObjectIds',
        'any.required': 'Services are required',
        'array.min': 'At least one service must be specified',
        'string.pattern.base': 'Each service must be a valid MongoDB ObjectId'
    }),
    appointment_type: Joi.string().valid('waiter', 'dropoff', 'all').messages({
        'any.only': 'Appointment type must be one of waiter, dropoff, or all'
    }),
    mode: Joi.object({
        type: Joi.string().valid('date_only', 'preference_timeslots').messages({
            'any.only': 'Mode type must be date_only or preference_timeslots'
        }),
        timeslots: Joi.when('type', {
            is: 'preference_timeslots',
            then: Joi.array().items(Joi.object({
                label: Joi.string().trim().required().messages({
                    'any.required': 'Label is required for preference timeslots'
                }),
                time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
                    'string.pattern.base': 'Time must be in HH:MM format',
                    'any.required': 'Time is required for preference timeslots'
                })
            })).min(1).messages({
                'array.base': 'Time slots must be an array',
                'array.min': 'At least one time slot is required for preference timeslots'
            }),
            otherwise: Joi.forbidden()
        })
    }).messages({
        'any.required': 'Mode is required'
    }),
    calendar_note: Joi.string().trim().allow('').optional()
})





import Joi from "joi";
import mongoose from "mongoose";

export const updatePickupOptionSettingsSchema = Joi.object({
    is_enabled: Joi.boolean().required(),
    max_pickup_per_day: Joi.number().integer().min(0).required(),
    max_distance_from_garage: Joi.number().integer().min(0).required(),
    earliest_pickup_time: Joi.object({
        type: Joi.string().valid('days', 'hours', 'minutes').required(),
        value: Joi.number().integer().min(0).required().allow(null)
    }).required(),
    pickup_timeslots: Joi.array().items({
        time_in_sms: Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
            'string.pattern.base': '{#label} is not a valid time format! Use HH:MM (24-hour format)'
        }),
        label: Joi.string().required().trim().allow(''),
        max_pickup_during_timeslot: Joi.number().integer().min(0).required().allow(null)
    }),
    allowed_vehicle_years: Joi.object({
        start_year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).required(),
        end_year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).required()
    }).required(),
    allowed_customer_types: Joi.string().valid('all', 'new', 'existing').default('all')
})

export const allowedVehicleModelsSchema = Joi.object({
    allowed_vehicle_models: Joi.array().items({
        _id: Joi.string().custom((value, helper) => {
            return !mongoose.Types.ObjectId.isValid(value) ? helper.error('string.object_id', { value }) : true
        }).messages({
            'string.object_id': 'Invalid {#label} id',
        }),
        make: Joi.string().required().trim(),
        models: Joi.array().items(Joi.string().required().trim()).required().allow(null)
    }).required()
})

export const addCustomerExceptionsSchema = Joi.object({
    phone: Joi.string().required().trim(),
    first_name: Joi.string().trim(),
    last_name: Joi.string().trim(),
    notes: Joi.string().trim().allow('').optional(),
    exception_type: Joi.string().valid('allow', 'block').required()
})

export const AddVehicleInfoValidationSchema = Joi.object({
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
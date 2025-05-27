import Joi from "joi";
import mongoose from "mongoose";

export const updateAppointmentTechnicianConditionsSchema = Joi.object({
    appointment_technician_conditions: Joi.array().items(Joi.object({
        _id: Joi.string().custom((value, helper) => {
            return !mongoose.Types.ObjectId.isValid(value) ? helper.error('string.object_id', { value }) : true
        }).messages({
            'string.object_id': 'Invalid {#label} id',
        }),
        is_default_condition: Joi.boolean().required(),
        field: Joi.string().when('is_default_condition', {
            is: false,
            then: Joi.required(),
            otherwise: Joi.optional()
        }),
        operator: Joi.string().valid('equals', 'contains', 'one_contains', 'not_equals', 'greater_than', 'less_than', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty').when('is_default_condition', {
            is: false,
            then: Joi.required(),
            otherwise: Joi.optional()
        }),
        value: Joi.string().when('is_default_condition', {
            is: false,
            then: Joi.when('operator', {
                is: Joi.string().valid('is_empty', 'is_not_empty'),
                then: Joi.string().allow('').optional(),
                otherwise: Joi.string().required()
            }),
            otherwise: Joi.optional()
        }),
        technician_id: Joi.string().custom((value, helper) => {
            return !mongoose.Types.ObjectId.isValid(value) ? helper.error('string.object_id', { value }) : true
        }).required().messages({
            'string.object_id': 'Invalid {#label} id',
        })
    })).required()
})
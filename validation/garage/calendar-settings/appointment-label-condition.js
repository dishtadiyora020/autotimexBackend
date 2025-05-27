import Joi from "joi";
import mongoose from "mongoose";

export const updateAppointmentLabelConditionsSchema = Joi.object({
    appointment_label_conditions: Joi.array().items(Joi.object({
        _id: Joi.string().custom((value, helper) => {
            return !mongoose.Types.ObjectId.isValid(value) ? helper.error('string.object_id', { value }) : true
        }).messages({
            'string.object_id': 'Invalid {#label} id',
        }),
        field: Joi.string().required(),
        operator: Joi.string().valid('equals', 'contains', 'one_contains', 'not_equals', 'greater_than', 'less_than', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty').required(),
        value: Joi.string().when('operator', {
            is: Joi.string().valid('is_empty', 'is_not_empty'),
            then: Joi.string().allow('').optional(),
            otherwise: Joi.string().required()
        }),
        label_id: Joi.string().custom((value, helper) => {
            return !mongoose.Types.ObjectId.isValid(value) ? helper.error('string.object_id', { value }) : true
        }).required().messages({
            'string.object_id': 'Invalid {#label} id',
        })
    })).required()
})
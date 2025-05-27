import Joi from "joi";

import mongoose, { Schema } from "mongoose";

// const appointmentConditionSchema = new Schema({
//     // type: {
//     //   type: String,
//     //   required: true,
//     //   enum: ['appointment', 'customer', 'vehicle']
//     // },
//     garage_id: {
//         type: Schema.Types.ObjectId,
//         required: true,
//         ref: 'Garage'
//     },
//     field: {
//         type: String,
//         required: true
//     },
//     operator: {
//         type: String,
//         required: true,
//         enum: ['equals', 'contains', 'not_equals', 'greater_than', 'less_than', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty']
//     },
//     value: {
//         type: Schema.Types.Mixed,
//         required: function () {
//             return !['is_empty', 'is_not_empty'].includes(this.operator);
//         }
//     },
//     color_id: {
//         type: Schema.Types.ObjectId,
//         required: true,
//         ref: 'ColorOption'
//     }
// });

// appointmentConditionSchema.index({ garage_id: 1 }, { unique: true });

// const AppointmentColorCondition = mongoose.model('AppointmentColorCondition', appointmentConditionSchema);

// export default AppointmentColorCondition;

export const createAppointmentColorConditionsSchema = Joi.object({
    field: Joi.string().required(),
    operator: Joi.string().valid('equals', 'contains', 'one_contains', 'not_equals', 'greater_than', 'less_than', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty').required(),
    value: Joi.string().when('operator', {
        is: Joi.string().valid('is_empty', 'is_not_empty'),
        then: Joi.string().allow('').optional(),
        otherwise: Joi.string().required()
    }),
    color_id: Joi.string().custom((value, helper) => {
        return !mongoose.Types.ObjectId.isValid(value) ? helper.error('string.object_id', { value }) : true
    }).required().messages({
        'string.object_id': 'Invalid {#label} id',
    })
})

export const updateAppointmentColorConditionsSchema = Joi.object({
    color_conditions: Joi.array().items(Joi.object({
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
        color_id: Joi.string().custom((value, helper) => {
            return !mongoose.Types.ObjectId.isValid(value) ? helper.error('string.object_id', { value }) : true
        }).required().messages({
            'string.object_id': 'Invalid {#label} id',
        })
    }))
})
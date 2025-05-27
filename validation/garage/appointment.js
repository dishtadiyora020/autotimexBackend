import Joi from "joi"
import mongoose from "mongoose";

export const createAppointmentSchema = Joi.object({
    service: Joi.array().required(),
    issue_tree: Joi.array().required(),
    media: Joi.array().optional(),
    comments: Joi.array().optional(),
    vehicle: Joi.string().custom((value, helper) => {
        return mongoose.Types.ObjectId.isValid(value)
            ? value
            : helper.error('string.invalid');
    }).messages({
        'string.invalid': 'Invalid vehicle ID'
    }).required(),
    user_id: Joi.string().custom((value, helper) => {
        return mongoose.Types.ObjectId.isValid(value)
            ? value
            : helper.error('string.invalid');
    }).messages({
        'string.invalid': 'Invalid user ID'
    }),
    user: Joi.object({
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        mobile_number: Joi.string().required(),
        email: Joi.string().email().optional()
    }),
    vehicle_id: Joi.string().custom((value, helper) => {
        return mongoose.Types.ObjectId.isValid(value)
            ? value
            : helper.error('string.invalid');
    }).messages({
        'string.invalid': 'Invalid vehicle ID'
    }),
    vehicle: Joi.object({
        year: Joi.string().required(),
        make: Joi.string().required(),
        model: Joi.string().required(),
        vin: Joi.string().required(),
        license_plate: Joi.string().required(),
    }),
    dedicated_field_values: Joi.array().items(
        Joi.object({
            custom_field: Joi.string().custom((value, helper) => {
                return mongoose.Types.ObjectId.isValid(value)
                    ? value
                    : helper.error('string.invalid');
            }).messages({
                'string.invalid': 'Invalid custom field ID in dedicated_field_values'
            }),
            value: Joi.any()
        })
    ).optional(),
    is_new_customer: Joi.boolean()
        .optional()
        .messages({
            'boolean.base': '"is_new_customer" must be a boolean value',
        }),
    customer_field_values: Joi.array().items(
        Joi.object({
            custom_field: Joi.string().custom((value, helper) => {
                return mongoose.Types.ObjectId.isValid(value)
                    ? value
                    : helper.error('string.invalid');
            }).messages({
                'string.invalid': 'Invalid custom field ID in customer_field_values'
            }),
            value: Joi.any()
        })
    ).optional(),

    start_time: Joi.string().required(),

    end_time: Joi.string().required(),
    appointment_type: Joi.string().trim().optional().allow('', null),
    address: Joi.string().trim().optional().allow('', null),
    marketing_data: Joi.object({
        _id: Joi.string().custom((value, helper) => {
            return mongoose.Types.ObjectId.isValid(value)
                ? value
                : helper.error('string.invalid');
        }).messages({
            'string.invalid': 'Invalid marketing link ID'
        }).optional(),

        source_tracking: Joi.array().items(
            Joi.object({
                name: Joi.string().trim().required(),
                value: Joi.string().trim().required()
            })
        ).optional()
    }),
    transportOption: Joi.string().trim().optional().allow('', null),
    lat: Joi.alternatives().try(Joi.string(), Joi.number()).optional().allow('', null),
    lon: Joi.alternatives().try(Joi.string(), Joi.number()).optional().allow('', null),


}).xor('user', 'user_id').messages({
    'object.xor': 'You must provide either user details or user ID, but not both',
}).xor('vehicle', 'vehicle_id').messages({
    'object.xor': 'You must provide either vehicle details or vehicle ID, but not both',
})
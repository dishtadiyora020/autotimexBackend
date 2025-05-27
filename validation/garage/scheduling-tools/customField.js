import Joi from 'joi';

// Joi Validation Schema for select options
const selectOptionSchema = Joi.object({
    title: Joi.string().trim().required().messages({
        'string.empty': 'Option title cannot be empty',
        'any.required': 'Option title is required'
    })
});

// Joi Validation Schema for individual custom fields
export const customFieldSchema = Joi.object({
    type: Joi.string().valid(
        'yes/no', 'text', 'number', 'select',
        'multiselect', 'emailinput', 'date'
    ).required().messages({
        'any.only': 'Invalid field type',
        'any.required': 'Field type is required'
    }),
    field_name: Joi.string().trim().required().messages({
        'string.empty': 'Field name cannot be empty',
        'any.required': 'Field name is required'
    }),
    field_title: Joi.string().trim().required().messages({
        'string.empty': 'Field title cannot be empty',
        'any.required': 'Field title is required'
    }),
    is_required: Joi.boolean().default(false),
    is_show_in_sms: Joi.boolean().default(false),
    is_active: Joi.boolean().default(true),
    select_options: Joi.when('type', {
        is: Joi.string().valid('select', 'multiselect'),
        then: Joi.array().items(selectOptionSchema).min(2).required().messages({
            'array.base': 'Select options must be an array of objects',
            'array.min': 'At least two select option must be specified',
            'any.required': 'Select options are required for select/multiselect fields'
        }),
        otherwise: Joi.forbidden()
    }),
    when_to_collect: Joi.alternatives()
        .conditional(Joi.ref('/custom_type'), {
            is: Joi.valid('CUSTOMER', 'VEHICLE'),
            then: Joi.string().valid('new', 'existing', 'everytime').required(),
            otherwise: Joi.forbidden()
        }).messages({
            'any.only': 'Invalid collection timing',
            'any.required': 'Collection timing is required for customer/vehicle fields'
        })
});

// Main validation schema for creating custom fields
export const createCustomFieldSchema = Joi.object({
    custom_type: Joi.string().valid(
        'APPOINTMENT_ISSUE_TREE',
        'APPOINTMENT_DEDICATED',
        'CUSTOMER',
        'VEHICLE'
    ).required().messages({
        'any.only': 'Invalid custom type',
        'any.required': 'Custom type is required'
    }),
    custom_fields: Joi.array()
        .items(customFieldSchema) // Validate each item in the array against the custom field schema
        .min(1) // Ensure at least one custom field is provided
        .required()
        .messages({
            'array.base': 'Custom fields must be an array of objects',
            'array.min': 'At least one custom field must be specified',
            'any.required': 'Custom fields are required'
        })
});


export const updateCustomFieldObjectSchema = Joi.object({
    custom_type: Joi.string().valid(
        'APPOINTMENT_ISSUE_TREE', 
        'APPOINTMENT_DEDICATED',
        'CUSTOMER',
        'VEHICLE'
    ).required().messages({
        'any.only': 'Invalid custom type',
        'any.required': 'custom_type is required'
    }),
    field_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
        'string.pattern.base': 'field_id must be a valid MongoDB ObjectId',
        'any.required': 'field_id is required'
    }),
    update_data: Joi.object({
        type: Joi.string().valid(
            'yes/no', 'text', 'number', 'select', 
            'multiselect', 'emailinput', 'date'
        ).optional(),
        field_name: Joi.string().trim().optional(),
        field_title: Joi.string().trim().optional(),
        is_required: Joi.boolean().optional(),
        is_show_in_sms: Joi.boolean().optional(),
        is_active: Joi.boolean().optional(),
        
         select_options: Joi.when('type', {
            is: Joi.string().valid('select', 'multiselect'),
            then: Joi.array().items(Joi.object({
                title: Joi.string().trim().required().messages({
                    'string.empty': 'Option title cannot be empty',
                    'any.required': 'Option title is required'
                })
            })).min(2).optional(),
            otherwise: Joi.forbidden()
         }),
        
         when_to_collect: Joi.alternatives()
             .conditional(Joi.ref('/custom_type'), {
                 is: Joi.valid('CUSTOMER', 'VEHICLE'),
                 then: Joi.string().valid('new', 'existing', 'everytime').optional(),
                 otherwise: Joi.forbidden()
             }).messages({
                 'any.only': 'Invalid collection timing'
             })
    }).required().messages({
         'object.base': 'update_data must be an object',
         'any.required': 'update_data is required'
     })
});


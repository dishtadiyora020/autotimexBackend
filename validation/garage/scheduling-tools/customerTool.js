import Joi from 'joi';

export const customerToolSchema = Joi.object({
    is_collect_email: Joi.boolean().default(true).optional(),
    is_require_email: Joi.boolean().default(true).optional(),
    is_ask_customer_address: Joi.boolean().default(false).optional(),
    is_verify_phone_new_customer: Joi.boolean().default(true).optional()
})

export const customerInfoSchema = Joi.object({
    phone: Joi.string().required().trim().messages({
        'any.required': 'Phone number is required',
        'string.empty': 'Phone number cannot be empty'
    }),
    notes: Joi.string().trim().optional().allow(''),
    first_name: Joi.string().trim().optional().allow(''),
    last_name: Joi.string().trim().optional().allow('')
});
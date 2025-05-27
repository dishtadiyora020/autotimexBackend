import Joi from 'joi';

export const capacityBlockerSchema = Joi.object({
    is_enable: Joi.boolean().default(false),
    block_type: Joi.string().trim().required().messages({
        'any.required': 'Block type is required',
        'string.empty': 'Block type cannot be empty',
    }),
    days_of_week: Joi.array()
        .items(Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'))
        .default([]),
    start_time: Joi.string().allow(null, '').optional(),
    end_time: Joi.string().allow(null, '').optional(),
    max_scheduled_hours: Joi.string().allow(null, '').optional(),
    max_scheduled_minutes: Joi.string().allow(null, '').optional(),
    Max_booking: Joi.number().min(0).optional(),
    start_on: Joi.date().optional().allow('', null),
    end_on: Joi.date().optional().allow('', null),
    block_reason: Joi.string().trim().allow('').default(''),
    apply_to_appointment_types: Joi.string()
        .valid('waiter', 'dropoff', 'all')
        .optional(),
    apply_to_customer_types: Joi.string()
        .valid('existing', 'new', 'all')
        .optional(),
    block_internal_notes: Joi.string().trim().allow('').default(''),
    services: Joi.array().items(Joi.string()).default([]),
    selected_holiday: Joi.object({
        us: Joi.object({
            name: Joi.string().allow(null, '').optional(),
            date: Joi.string().allow(null, '').optional(),
        }).optional(),
        ca: Joi.object({
            name: Joi.string().allow(null, '').optional(),
            date: Joi.string().allow(null, '').optional(),
        }).optional(),
    }).optional(),
    use_business_hours: Joi.boolean().default(false),
    block_for_days: Joi.object({
        label: Joi.string().allow(null, '').optional(),
        value: Joi.string().allow(null, '').optional(),
    }).optional(),
    block_after_days: Joi.object({
        label: Joi.string().allow(null, '').optional(),
        value: Joi.string().allow(null, '').optional(),
    }).optional(),
    background_color: Joi.string().allow(null, '').optional(),
    text_color: Joi.string().allow(null, '').optional(),
});


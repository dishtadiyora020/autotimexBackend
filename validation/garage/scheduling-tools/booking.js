import Joi from 'joi';

export const ConfirmBookingSchema = Joi.object({
    waiter_mobile_repair: Joi.array().items(
        Joi.object({
            title: Joi.string().trim().optional().allow('').messages({
                'string.base': 'Title must be a string'
            })
        })
    ).messages({
        'array.base': 'Waiter mobile repair must be an array',
    }),
    drop_off: Joi.array().items(
        Joi.object({
            title: Joi.string().trim().optional().allow('').messages({
                'string.base': 'Title must be a string'
            })
        })
    ).messages({
        'array.base': 'Drop-off must be an array',
    }),
    pickup: Joi.array().items(
        Joi.object({
            title: Joi.string().trim().optional().allow('').messages({
                'string.base': 'Title must be a string'
            })
        })
    ).messages({
        'array.base': 'Pickup must be an array',
    }),
    destination_url: Joi.string().trim().optional().allow('').messages({
        'string.base': 'Destination URL must be a string',
    }),
    is_open_url_new_tab: Joi.boolean().default(true).messages({
        'boolean.base': 'Is open URL in new tab must be a boolean',
    }),
});

export const SuccessBookingSchema = Joi.object({

    is_show_extended_appointment_info: Joi.boolean().default(true).messages({
        'boolean.base': 'Is show extended appointment info must be a boolean',
    }),
    waiter_success_msg: Joi.string().trim().optional().allow('').messages({
        'string.base': 'Waiter success message must be a string',
    }),
    drop_off_success_msg: Joi.string().trim().optional().allow('').messages({
        'string.base': 'Drop-off success message must be a string',
    }),
    pickup_success_msg: Joi.string().trim().optional().allow('').messages({
        'string.base': 'Pickup success message must be a string',
    }),
    waiter_instruction_msg: Joi.string().trim().optional().allow('').messages({
        'string.base': 'Waiter instruction message must be a string',
    }),
    drop_off_instruction_msg: Joi.string().trim().optional().allow('').messages({
        'string.base': 'Drop-off instruction message must be a string',
    }),
    pickup_instruction_msg: Joi.string().trim().optional().allow('').messages({
        'string.base': 'Pickup instruction message must be a string',
    }),
    animation: Joi.object({
        confetti: Joi.boolean().default(false).messages({
            'boolean.base': 'Confetti must be a boolean',
        }),
        fireworks: Joi.boolean().default(false).messages({
            'boolean.base': 'Fireworks must be a boolean',
        }),
        text_explosion: Joi.boolean().default(false).messages({
            'boolean.base': 'Text explosion must be a boolean',
        }),
        text_explosion_text: Joi.string().trim().optional().allow('').messages({
            'string.base': 'Text explosion text must be a string',
        }),
    }).optional()
});

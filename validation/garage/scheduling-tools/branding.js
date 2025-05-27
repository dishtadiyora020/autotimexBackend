import Joi from 'joi';

export const brandingColorsSchema = Joi.object({
    colors: Joi.object({
        icon_button_color: Joi.string()
            .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
            .optional()
            .messages({
                'string.pattern.base': '"icon_button_color" must be a valid hex color code',
            }),
        text_color: Joi.string()
            .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
            .optional()
            .messages({
                'string.pattern.base': '"text_color" must be a valid hex color code',
            })
    }).required()
});


export const brandingImageSchema = Joi.object({
    is_header_show: Joi.string()
        .valid('true', 'false')
        .optional()
        .messages({
            'any.only': '"is_header_show" must be either "true" or "false"'
        })
});


export const schedulerTitlesSchema = Joi.object({
    scheduler_titles: Joi.object({
        service_selection: Joi.object({
            header: Joi.string().trim().allow('').optional()
        }).optional(),
        customer_phone_page: Joi.object({
            header: Joi.string().trim().allow('').optional(),
            primary_subtitle: Joi.string().trim().allow('').optional(),
            secondary_subtitle: Joi.string().trim().allow('').optional()
        }).optional(),
        phone_verification_page: Joi.object({
            header: Joi.string().trim().allow('').optional(),
            subtitle: Joi.string().trim().allow('').optional()
        }).optional(),
        new_customer_info_page: Joi.object({
            header: Joi.string().trim().allow('').optional(),
            subtitle: Joi.string().trim().allow('').optional()
        }).optional(),
        vehicle_select_page: Joi.object({
            header: Joi.string().trim().allow('').optional(),
            primary_subtitle: Joi.string().trim().allow('').optional(),
            secondary_subtitle: Joi.string().trim().allow('').optional()
        }).optional(),
        new_vehicle_page: Joi.object({
            subtitle: Joi.string().trim().allow('').optional()
        }).optional(),
        deferred_work_page: Joi.object({
            header: Joi.string().trim().allow('').optional()
        }).optional(),
        drop_waiter_pickup_page: Joi.object({
            header: Joi.string().trim().allow('').optional(),
            subtitle: Joi.string().trim().allow('').optional()
        }).optional(),
        schedule_page: Joi.object({
            header: Joi.string().trim().allow('').optional()
        }).optional(),
        transportation_req_page: Joi.object({
            header: Joi.string().trim().allow('').optional(),
            subtitle: Joi.string().trim().allow('').optional()
        }).optional(),
        customer_address_page: Joi.object({
            header: Joi.string().trim().allow('').optional()
        }).optional(),
        confirmation_page: Joi.object({
            header: Joi.string().trim().allow('').optional()
        }).optional(),
        success_page: Joi.object({
            header: Joi.string().trim().allow('').optional()
        }).optional()
    }).required()
});

export const updateBrandingSchema = Joi.object({
    colors: Joi.object({
        button_color: Joi.string()
            .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
            .optional()
            .messages({
                'string.pattern.base': '"button_color" must be a valid hex color code',
            }),
        text_color: Joi.string()
            .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
            .optional()
            .messages({
                'string.pattern.base': '"text_color" must be a valid hex color code',
            }), 
        icon_color: Joi.string()
            .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
            .optional()
            .messages({
                'string.pattern.base': '"icon_color" must be a valid hex color code',
            }),
        button_text_color: Joi.string()
            .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
            .optional()
            .messages({
                'string.pattern.base': '"button_text_color" must be a valid hex color code',
            }),
        border_color: Joi.string()
            .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
            .optional()
            .messages({
                'string.pattern.base': '"border_color" must be a valid hex color code',
            }),
        theme_color: Joi.string()
            .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
            .optional()
            .messages({
                'string.pattern.base': '"theme_color" must be a valid hex color code',
            })
    }).optional(),

    images: Joi.object({
        is_header_show: Joi.boolean().optional(),
        logo: Joi.string().optional().allow(null, ''),
        header_image: Joi.string().optional().allow(null, '')
    }),

    scheduler_titles: Joi.object({
        service_selection: Joi.object({
            header: Joi.string().trim().allow('').optional()
        }).optional(),
        customer_phone_page: Joi.object({
            header: Joi.string().trim().allow('').optional(),
            primary_subtitle: Joi.string().trim().allow('').optional(),
            secondary_subtitle: Joi.string().trim().allow('').optional()
        }).optional(),
        phone_verification_page: Joi.object({
            header: Joi.string().trim().allow('').optional(),
            subtitle: Joi.string().trim().allow('').optional()
        }).optional(),
        new_customer_info_page: Joi.object({
            header: Joi.string().trim().allow('').optional(),
            subtitle: Joi.string().trim().allow('').optional()
        }).optional(),
        vehicle_select_page: Joi.object({
            header: Joi.string().trim().allow('').optional(),
            primary_subtitle: Joi.string().trim().allow('').optional(),
            secondary_subtitle: Joi.string().trim().allow('').optional()
        }).optional(),
        new_vehicle_page: Joi.object({
            subtitle: Joi.string().trim().allow('').optional()
        }).optional(),
        deferred_work_page: Joi.object({
            header: Joi.string().trim().allow('').optional()
        }).optional(),
        drop_waiter_pickup_page: Joi.object({
            header: Joi.string().trim().allow('').optional(),
            subtitle: Joi.string().trim().allow('').optional()
        }).optional(),
        schedule_page: Joi.object({
            header: Joi.string().trim().allow('').optional()
        }).optional(),
        transportation_req_page: Joi.object({
            header: Joi.string().trim().allow('').optional(),
            subtitle: Joi.string().trim().allow('').optional()
        }).optional(),
        customer_address_page: Joi.object({
            header: Joi.string().trim().allow('').optional()
        }).optional(),
        confirmation_page: Joi.object({
            header: Joi.string().trim().allow('').optional()
        }).optional(),
        success_page: Joi.object({
            header: Joi.string().trim().allow('').optional()
        }).optional()
    }).optional()
});
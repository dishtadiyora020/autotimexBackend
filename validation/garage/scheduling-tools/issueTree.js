import Joi from 'joi';

// Validation schema for IssueTree
export const issueTreeSchema = Joi.object({
    key: Joi.string().required().trim().messages({
        'any.required': 'Key is required',
        'string.empty': 'Key cannot be empty'
    }),
    description: Joi.string().required().trim().messages({
        'any.required': 'Description is required',
        'string.empty': 'Description cannot be empty'
    }),
});


export const issueTreeValidationSchema = Joi.object({
    default: Joi.boolean().optional().allow(null),
    single_page_mode: Joi.boolean().optional().allow(null),
    single_service_selection_only: Joi.boolean().optional().allow(null),
    show_as_popular: Joi.boolean().optional().allow(null),
    key: Joi.string().trim().optional().allow('', null),
    name: Joi.string().trim().optional().allow('', null),
    description: Joi.string().trim().optional().allow('', null),
    categories: Joi.array().items(
        Joi.object({
            name: Joi.string().trim().optional().allow('', null),
            key: Joi.string().trim().optional().allow('', null),
            services: Joi.array().items(
                Joi.object({
                    name: Joi.string().trim().optional().allow('', null),
                    key: Joi.string().trim().optional().allow('', null),
                    description: Joi.string().trim().optional().allow('', null),
                    icon: Joi.string().trim().optional().allow('', null),
                    comment: Joi.string().trim().optional().allow('', null),
                    destination_type: Joi.string()
                        .valid('question', 'comments', 'elsewhere', 'end')
                        .optional()
                        .allow('', null),
                    service: Joi.string()
                        .regex(/^[0-9a-fA-F]{24}$/) // MongoDB ObjectId validation
                        .optional()
                        .allow('', null),
                    popular_services: Joi.boolean().optional().allow(null),
                    advanced_options: Joi.object({
                        description: Joi.string().trim().optional().allow('', null),
                        pre_selection_key: Joi.string().trim().optional().allow('', null)
                    }).optional().allow(null),
                    issue_image: Joi.string().trim().optional().uri().allow('', null),
                    questions: Joi.array().items(
                        Joi.object({
                            title: Joi.string().trim().optional().allow('', null),
                            options: Joi.array().items(
                                Joi.object({
                                    option_text: Joi.string().trim().optional().allow('', null),
                                    description: Joi.string().trim().optional().allow('', null),
                                    icon: Joi.string().trim().optional().allow('', null),
                                    destination_type: Joi.string()
                                        .valid('question', 'comments', 'elsewhere', 'end')
                                        .optional()
                                        .allow('', null),
                                    service: Joi.string()
                                        .regex(/^[0-9a-fA-F]{24}$/)
                                        .optional()
                                        .allow('', null),
                                    popular_service: Joi.boolean().optional().allow(null),

                                    advanced_options: Joi.object({
                                        description: Joi.string().trim().optional().allow('', null),
                                        pre_selection_key: Joi.string().trim().optional().allow('', null)
                                    }).optional().allow(null),
                                    issue_image: Joi.string().trim().optional().uri().allow('', null),
                                    highlighted_option_text: Joi.string().trim().optional().allow('', null),

                                    highlighted_option_advanced_options: Joi.object({
                                        bg_color: Joi.string().trim().optional().allow('', null),
                                        font_color: Joi.string().trim().optional().allow('', null),
                                    }).optional().allow(null),

                                    feature_subtitle: Joi.string().trim().optional().allow('', null),
                                    feature_image: Joi.string().trim().optional().allow('', null),
                                    feature_title_image: Joi.string().trim().optional().allow('', null),

                                    bullet_points: Joi.array().items(Joi.string().trim()).optional().allow(null),

                                    footer_text: Joi.string().trim().optional().allow('', null),

                                    feature_footer_text_advanced_options: Joi.object({
                                        color: Joi.string().trim().optional().allow('', null),
                                        size: Joi.string().trim().optional().allow('', null),
                                        weight: Joi.string().trim().optional().allow('', null),
                                    }).optional().allow(null),
                                    feature_subtitle_advanced_options: Joi.object({
                                        color: Joi.string().trim().optional().allow('', null),
                                        size: Joi.string().trim().optional().allow('', null),
                                        weight: Joi.string().trim().optional().allow('', null),
                                    }).optional().allow(null),
                                    bullet_point_advanced_options: Joi.object({
                                        color: Joi.string().trim().optional().allow('', null),
                                        style: Joi.string().trim().optional().allow('', null),
                                        font_color: Joi.string().trim().optional().allow('', null),
                                        font_size: Joi.string().trim().optional().allow('', null),
                                        font_weight: Joi.string().trim().optional().allow('', null),
                                    }).optional().allow(null),
                                    feature_button_text: Joi.string().trim().optional().allow('', null),
                                })
                            ).optional().allow(null),
                            advanced_selection: Joi.boolean().optional().allow(null),
                            custom_fields: Joi.array().optional().allow(null),
                            footer_text: Joi.string().trim().optional().allow('', null),
                            footer_advanced_options: Joi.object({
                                color: Joi.string().trim().optional().allow('', null),
                                size: Joi.string().trim().optional().allow('', null),
                                weight: Joi.string().trim().optional().allow('', null),
                            }).optional().allow(null),
                            auto_advance: Joi.boolean().optional().allow(null),
                            orderOn_mobile: Joi.boolean().optional().allow(null),
                            option_button_text: Joi.string().trim().optional().allow('', null),
                        })
                    ).optional().allow(null),
                    discount: Joi.string().trim().optional().allow('', null)
                })
            ).optional().allow(null)
        })
    ).optional().allow(null)
});

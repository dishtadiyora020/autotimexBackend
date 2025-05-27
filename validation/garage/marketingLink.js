import Joi from "joi";

export const addMarketingLinkSchema = Joi.object({
    name: Joi.string().trim().required().messages({
        'string.empty': 'Marketing link name is required',
        'any.required': 'Marketing link name is required'
    }),
    link: Joi.string().trim().optional(),
    code: Joi.string().trim().optional(),
    url_destination: Joi.string().uri().optional().messages({
        'string.uri': 'URL Destination must be a valid URL',
    }),
    type: Joi.string().valid('link', 'qrcode').optional().messages({
        'any.only': "Type must be either 'link' or 'qrcode'",
    }),
    source_tracking: Joi.array()
        .items(
            Joi.object({
                key: Joi.string().optional().messages({
                    'any.required': 'Tracking key is required'
                }),
                value: Joi.string().optional().messages({
                    'any.required': 'Tracking value is required'
                })
            })
        )
        .optional(),
    use_query_parameter: Joi.boolean().default(false),
    locationEnabled: Joi.boolean().default(false),
    online_scheduling_tools: Joi.boolean().default(false),
    lat: Joi.number()
        .when('locationEnabled', {
            is: true,
            then: Joi.required().messages({
                'any.required': 'Latitude is required when location is enabled',
                'number.base': 'Latitude must be a number'
            }),
            otherwise: Joi.optional()
        }),

    long: Joi.number()
        .when('locationEnabled', {
            is: true,
            then: Joi.required().messages({
                'any.required': 'Longitude is required when location is enabled',
                'number.base': 'Longitude must be a number'
            }),
            otherwise: Joi.optional()
        })
});
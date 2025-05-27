import Joi from "joi"

export const createGarageSchema = Joi.object({
    name: Joi.string().required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().required(),
    website: Joi.string().uri().required(),
    address_line_1: Joi.string().required(),
    address_line_2: Joi.string(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zip: Joi.string().required(),
    country: Joi.string().required(),
    location: Joi.object({
        type: Joi.string().valid('Point').required(),
        coordinates: Joi.array()
            .ordered(
                Joi.number().min(-180).max(180).required().description('Longitude'),
                Joi.number().min(-90).max(90).required().description('Latitude'),
            )
            .length(2)
            .required()
            .description('Array of [longitude, latitude]')
        // coordinates: Joi.array().items(Joi.number().min(-180).max(180), Joi.number().min(-90).max(90)).length(2).required()
    }).required(),
    timezone: Joi.string().required()
})

export const updateGarageSchema = Joi.object({
    name: Joi.string(),
    first_name: Joi.string(),
    last_name: Joi.string(),
    phone: Joi.string(),
    email: Joi.string().email(),
    website: Joi.string().uri(),
    address_line_1: Joi.string(),
    address_line_2: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    zip: Joi.string(),
    country: Joi.string(),
    location: Joi.object({
        type: Joi.string().valid('Point'),
        coordinates: Joi.array()
            .ordered(
                Joi.number().min(-180).max(180).description('Longitude'),
                Joi.number().min(-90).max(90).description('Latitude'),
            )
            .length(2)
            .description('Array of [longitude, latitude]')
    }),
    timezone: Joi.string()
})
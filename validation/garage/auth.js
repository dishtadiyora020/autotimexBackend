import Joi from "joi"
import moment from "moment"

export const updateGarageInfoSchema = Joi.object({
    name: Joi.string(),
    phone: Joi.string(),
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
                Joi.number().min(-90).max(90).description('Latitude')
            )
            .length(2)
            .description('Array of [longitude, latitude]')
    }),
    timezone: Joi.string(),
    shop_hours: Joi.array().min(1).items(Joi.object({
        day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
        start: Joi.string().regex(/^([1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/).when('is_closed', {
            is: false,
            then: Joi.string().required().messages({
                'string.pattern.base': '{#label} is not a valid time format! Use HH:MM (12-hour format) with AM/PM'
            })
        }),
        end: Joi.string().regex(/^([1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/).when('is_closed', {
            is: false,
            then: Joi.string().required().messages({
                'string.pattern.base': '{#label} is not a valid time format! Use HH:MM (12-hour format) with AM/PM'
            }).custom((value, helpers) => {
                const start = helpers.state.ancestors[0].start;
                const momentStart = moment(start, 'h:mm A');
                const momentEnd = moment(value, 'h:mm A');
                if (!momentEnd.isSameOrAfter(momentStart)) {
                    return helpers.message('End time must be greater than start time and not the same');
                }
                return value;
            })
        }),
        is_closed: Joi.boolean().custom((value, helpers) => {
            const { start, end } = helpers.state.ancestors[0];
            if (start && end && value) {
                return helpers.message('"is_closed" cannot be true if start and end times are provided');
            }
            return value;
        })
    })).unique('day')
})
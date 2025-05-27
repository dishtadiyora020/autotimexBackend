import Joi from "joi";
import moment from "moment";

export const updateWaiterCapacitySchema = Joi.object({
    automatic_appointment_times: Joi.object({
        scheduling_hours: Joi.array().min(1).items(Joi.object({
            day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
            start: Joi.string().regex(/^([1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/).when('is_closed', {
                is: false,
                then: Joi.string().required().messages({
                    'string.pattern.base': '{#label} is not a valid time format! Use HH:MM (12-hour format) with AM/PM'
                }),
                otherwise: Joi.forbidden()
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
                }),
                otherwise: Joi.forbidden()
            }),
            is_closed: Joi.boolean().required(),
        })).required().unique('day'),
        timeslot_interval: Joi.number().min(5).max(120).required(),
    }).when('mode', {
        is: 'automatic',
        then: Joi.required()
    }),
    manual_appointment_times: Joi.object({
        scheduling_time: Joi.array().min(1).items(Joi.object({
            day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
            timings: Joi.array().min(1).items(Joi.object({
                start: Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
                    'string.pattern.base': '{#label} is not a valid time format! Use HH:MM (24-hour format)'
                }),
                label: Joi.string().required().trim(),
                max_appointment_duration: Joi.number().min(0).required()
            })).required().unique('start').unique('label'),
        })).required().unique('day'),
    }).when('mode', {
        is: 'manual',
        then: Joi.required()
    }),
    mode: Joi.string().valid('automatic', 'manual').required()
})

import Joi from "joi";

export const updateDropOffCapacitySchema = Joi.object({
    automatic_appointment_times: Joi.object({
        scheduling_hours: Joi.array().items(
            Joi.object({
                day: Joi.string()
                    .valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
                    .required(),
                start: Joi.string()
                    .pattern(/^([1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/)
                    .when('is_closed', {
                        is: false,
                        then: Joi.required(),
                        otherwise: Joi.allow(null)
                    })
                    .messages({
                        'string.pattern.base': '{{#value}} is not a valid time format! Use HH:MM (12-hour format) with AM/PM'
                    }),
                end: Joi.string()
                    .pattern(/^([1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/)
                    .when('is_closed', {
                        is: false,
                        then: Joi.required(),
                        otherwise: Joi.allow(null)
                    })
                    .messages({
                        'string.pattern.base': '{{#value}} is not a valid time format! Use HH:MM (12-hour format) with AM/PM'
                    }),
                is_closed: Joi.boolean().default(false)
            })
        ),
        timeslot_interval: Joi.alternatives()
            .try(
                Joi.string().valid('auto'),
                Joi.number().custom((value, helpers) => {
                    if (value % 5 !== 0) {
                        return helpers.error('any.custom', { message: 'Timeslot interval must be a multiple of 5 minutes' });
                    }
                    return value;
                })
            )
            .default('auto'),
        is_show_dropoff: Joi.boolean().default(true),
        text_timeslot: Joi.array().items(
            Joi.object({
                text: Joi.string().required().trim(),
                time: Joi.string()
                    .pattern(/^([1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/)
                    .required()
                    .messages({
                        'string.pattern.base': '{{#value}} is not a valid time format! Use HH:MM (12-hour format) with AM/PM'
                    }),
                is_always_available: Joi.boolean().default(false)
            })
        )
    }).default({
        scheduling_hours: [],
        timeslot_interval: 'auto',
        is_show_dropoff: true,
        text_timeslot: []
    }),

    manual_appointment_times: Joi.object({
        scheduling_time: Joi.array().items(
            Joi.object({
                day: Joi.string()
                    .valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
                    .required(),
                timings: Joi.array().items(
                    Joi.object({
                        start: Joi.string()
                            .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
                            .allow(null)
                            .messages({
                                'string.pattern.base': '{{#value}} is not a valid time format! Use HH:MM (24-hour format)'
                            }),
                        label: Joi.string().allow(null).trim(),
                        is_always_available: Joi.boolean().default(false),
                        max_appointment_duration: Joi.number().min(0)
                    })
                )
            })
        )
    }).default({
        scheduling_time: []
    }),

    mode: Joi.string().valid('automatic', 'manual').required()
});
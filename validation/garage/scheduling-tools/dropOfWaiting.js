import Joi from 'joi';

export const dropoffWaitingSchema = Joi.object({
    waiter: Joi.string().trim().optional().allow('').messages({
        'string.base': 'Waiter must be a string',
    }),
    waiter_disabled: Joi.string().trim().optional().allow('').messages({
        'string.base': 'Waiter Disabled must be a string',
    }),
    drop_off: Joi.string().trim().optional().allow('').messages({
        'string.base': 'Drop-off must be a string',
    }),
    drop_off_disabled: Joi.string().trim().optional().allow('').messages({
        'string.base': 'Drop-off Disabled must be a string',
    }),
    pickup: Joi.string().trim().optional().allow('').messages({
        'string.base': 'Pickup must be a string',
    }),
});


export const CalendarNoteSchema = Joi.object({
    waiter: Joi.string().trim().optional().allow('').messages({
        'string.base': 'Waiter must be a string',
    }),
    drop_off: Joi.string().trim().optional().allow('').messages({
        'string.base': 'Drop-off must be a string',
    }),
    pickup: Joi.string().trim().optional().allow('').messages({
        'string.base': 'Pickup must be a string',
    }),
});

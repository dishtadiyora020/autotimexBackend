import Joi from "joi";

export const updateMiscSettingsSchema = Joi.object({
    is_use_single_service_duration: Joi.boolean().required(),
    is_use_deferred_work_estimated_minutes: Joi.boolean().required(),
    booking_window: Joi.number().integer().min(2).max(13).required()
})

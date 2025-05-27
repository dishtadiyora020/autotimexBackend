import Joi from "joi";

export const updateGeneralSettingsSchema = Joi.object({
    is_allow_custom_time: Joi.boolean(),
    is_grey_out_non_operating_hours: Joi.boolean(),
    is_hide_non_operating_hours: Joi.boolean(),
    is_force_standard_issue_select: Joi.boolean(),
    is_require_email_address: Joi.boolean(),
    issue_tree_id: Joi.string()
})
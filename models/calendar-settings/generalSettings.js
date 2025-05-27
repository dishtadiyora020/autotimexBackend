import mongoose, { Schema } from "mongoose";

const generalSettingsSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage'
    },
    is_allow_custom_time: {
        type: Boolean,
        default: false
    },
    is_grey_out_non_operating_hours: {
        type: Boolean,
        default: true
    },
    is_hide_non_operating_hours: {
        type: Boolean,
        default: false
    },
    is_force_standard_issue_select: {
        type: Boolean,
        default: false
    },
    is_require_email_address: {
        type: Boolean,
        default: true
    },
    issue_tree_id: {
        type: Schema.Types.ObjectId,
        ref: 'IssueTree',
        default: null
    }
}, { timestamps: true });

generalSettingsSchema.index({ garage_id: 1 });

const GeneralSettings = mongoose.model('GeneralSettings', generalSettingsSchema);

export default GeneralSettings;
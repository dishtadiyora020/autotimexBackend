import mongoose, { Schema } from 'mongoose';

const customFieldBaseSchema = {
    type: {
        type: String,
        required: true,
        enum: ['yes/no', 'text', 'number', 'select', 'multiselect', 'emailinput', 'date']
    },
    field_name: {
        type: String,
        required: true,
        trim: true
    },
    field_title: {
        type: String,
        required: true,
        trim: true
    },
    is_required: {
        type: Boolean,
        default: false
    },
    is_show_in_sms: {
        type: Boolean,
        default: false
    },
    is_active: {
        type: Boolean,
        default: true
    },
    select_options: [{
        title: {
            type: String,
            required: function () {
                return this.parent().type === 'select' || this.parent().type === 'multiselect';
            }
        }
    }],
    when_to_collect: {
        type: String,
        enum: ['new', 'existing', 'everytime'],
        default: 'everytime',
        required: function () {
            // Make this field required only for CUSTOMER and VEHICLE types
            return this.custom_type === 'CUSTOMER' || this.custom_type === 'VEHICLE';
        }
    }
};
const customFieldSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage',
    },
    custom_type: {
        type: String,
        required: true,
        trim: true,
        enum: ['APPOINTMENT_ISSUE_TREE', 'APPOINTMENT_DEDICATED', 'CUSTOMER', 'VEHICLE']
    },
    custom_fields: [customFieldBaseSchema]
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Unique index on garage_id and custom_type
customFieldSchema.index({ garage_id: 1, custom_type: 1 }, { unique: true });

// Model creation
const CustomField = mongoose.model('CustomField', customFieldSchema);

export default CustomField;

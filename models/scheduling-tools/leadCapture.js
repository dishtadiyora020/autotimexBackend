import mongoose, { Schema } from 'mongoose';

const leadCaptureSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage',
    },
    is_enable: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    sub_title: {
        type: String,
        required: true,
        trim: true
    },
    phone_number: {
        type: String,
        required: true,
        trim: true, 
        validate: {
            validator: function (v) {
                // Basic phone number validation (adjust regex as needed)
                return /^\+?[1-9]\d{1,14}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
leadCaptureSchema.index({ garage_id: 1 }, { unique: true });
const LeadCapture = mongoose.model('LeadCapture', leadCaptureSchema);

export default LeadCapture;
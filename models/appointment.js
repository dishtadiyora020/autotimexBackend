
import mongoose, { Schema } from 'mongoose';

const customFieldSchema = new Schema({
    custom_field: {
        type: Schema.Types.ObjectId,
        ref: 'CustomField',
    },
    value: {
        type: Schema.Types.Mixed,
        required: false
    }
}, { _id: false });
const CommentSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        ref: 'service',
    },
    comment: {
        type: String,
        trim: true,
    }
}, { _id: false });
const appointmentSchema = new mongoose.Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        ref: 'Garage',
        required: true
    },
    service_advisor_notes: {
        type: String,
        required: false,
        default: null
    },
    customer_notes: {
        type: String,
        required: false,
        default: null
    },
    is_new_customer: {
        type: Boolean,
        default: false,
        required: false
    },
    service_advisor: {
        type: Schema.Types.ObjectId,
        ref: 'ServiceAdvisor',
        required: false,
        default: null
    },
    color_option: {
        type: Schema.Types.ObjectId,
        ref: 'ColorOptions',
        required: false,
        default: null
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vehicle: {
        type: Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    progress_percentage: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: 'ProgressOptions'
    },
    technician: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: 'Technician',
        default: null
    },
    job_label: [{
        type: Schema.Types.ObjectId,
        required: false,
        ref: 'JobLabel'
    }],
    issue_tree: Schema.Types.Mixed,
    question: {
        type: String,
        trim: true
    },
    start_time: {
        type: Date,
        trim: true,
        required: true
    },
    date_label: {
        type: String,
        trim: true,
        required: false,
        default: null
    },
    end_time: {
        type: Date,
        trim: true,
        required: true
    },
    transport_option: {
        type: String,
        trim: true
    },
    service: Schema.Types.Mixed,
    customer_field_values: [customFieldSchema],
    dedicated_field_values: [customFieldSchema],
    is_deleted: {
        type: Boolean,
        default: false
    },
    is_arrived: {
        type: Boolean,
        default: false
    },
    media: Schema.Types.Mixed,
    comments: [CommentSchema],
    appointment_type: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    marketing_data: {
        _id: {
            type: Schema.Types.ObjectId,
            ref: 'MarketingLinks',
        },
        source_tracking: [
            {
                _id: false,
                key: {
                    type: String,
                    trim: true
                },
                value: {
                    type: String,
                    trim: true
                }
            }
        ]
    },
    lat: {
        type: String,
    },
    lon: {
        type: String,
    }

}, {
    timestamps: true
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment
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

const leadsSchema = new mongoose.Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        ref: 'Garage',
        required: true
    },
    is_new_customer: {
        type: Boolean,
        required: false
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    vehicle: {
        type: Schema.Types.ObjectId,
        ref: 'Vehicle',
    },
    service: Schema.Types.Mixed,
    issue_tree: Schema.Types.Mixed,
    question: {
        type: String,
        trim: true
    },
    followUp: {
        type: Boolean,
        default: false
    },
    followUp_notes: {
        type: String,
        trim: true
    },
    reason: {
        type: String,
        trim: true
    },
    drop: {
        pickup_type: {
            type: String,
            trim: true
        },
        date: {
            type: String,
            trim: true
        },
        time: Schema.Types.Mixed,
        transportOption: {
            type: String,
            trim: true
        },
        pickUp_address: {
            type: String,
            trim: true
        },
    },
    appointment: {
        confirmBooking: {
            type: Boolean,
        },
        terms: {
            type: Boolean,
        },
        drop_of_terms: {
            type: Boolean,
        }
    },
    progress: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        trim: true,
        enum: ['hide', 'show'],
        default: 'show'

    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    customer_field_values: [customFieldSchema],
    dedicated_field_values: [customFieldSchema],
    media: Schema.Types.Mixed,
    comments: [CommentSchema],
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
    }
}, {
    timestamps: true
});

const Leads = mongoose.model('Leads', leadsSchema);

export default Leads
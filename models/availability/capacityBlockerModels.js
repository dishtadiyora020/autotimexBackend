import mongoose, { Schema } from 'mongoose';

const capacityBlockerModelsSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage',
    },
    is_enable: {
        type: Boolean,
        default: false
    },
    block_type: {
        type: String,
        trim: true
    },
    days_of_week: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    }],
    start_time: {
        type: String,
        trim: true
    },
    end_time: {
        type: String,
        trim: true
      
    },
    max_scheduled_hours: {
        type: String,
        trim: true
    },
    max_scheduled_minutes: {
        type: String,
        trim: true
    },
    Max_booking: {
        type: Number,
        min: 0
    },
    start_on: {
        type: Date,
        default: null,
    },
    end_on: {
        type: Date,
        default: null,
    },
    block_reason: {
        type: String,
        trim: true
    },
    apply_to_appointment_types: {
        type: String,
        enum: ['waiter', 'dropoff', 'all']
    },
    apply_to_customer_types: {
        type: String,
        enum: ['existing', 'new', 'all']
    },
    block_internal_notes: {
        type: String,
        trim: true
    },
    services: [{
        type: Schema.Types.ObjectId,
        ref: 'Service',
    }],
    selected_holiday: {
        us: {
            name: {
                type: String,
            },
            date: {
                type: String,
            }
        },
        ca: {
            name: {
                type: String,
            },
            date: {
                type: String,
            }
        }
    },
    use_business_hours: {
        type: Boolean,
        default: false,
    },
    block_for_days: {
        label: {
            type: String,
        },
        value: {
            type: String,
        }
    },
    block_after_days: {
        label: {
            type: String,
        },
        value: {
            type: String,
        }
    },
    background_color: {
        type: String,
        allowNull: true,
        default: ''
    },
    text_color: {
        type: String,
        allowNull: true,
        default: ''
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const CapacityBlocker = mongoose.model('CapacityBlocker', capacityBlockerModelsSchema);

export default CapacityBlocker;
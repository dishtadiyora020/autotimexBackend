import mongoose, { Schema } from "mongoose";

const pickupOptionSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage'
    },
    is_enabled: {
        type: Boolean,
        default: true
    },
    max_pickup_per_day: {
        type: Number,
        min: 0
    },
    max_distance_from_garage: {
        type: Number,
        min: 0
    },
    earliest_pickup_time: {
        type: {
            type: String,
            enum: ['days', 'hours', 'minutes'],
            required: true
        },
        value: {
            type: Schema.Types.Mixed,
            required: true,
            default: null
        }
    },
    pickup_timeslots: {
        type: [
            {
                time_in_sms: {
                    type: String,
                    required: true,
                    validate: {
                        validator: function (v) {
                            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
                        },
                        message: props => `${props.value} is not a valid time format! Use HH:MM (24-hour format)`
                    }
                },
                label: {
                    type: String,
                    required: true,
                    trim: true
                },
                max_pickup_during_timeslot: {
                    type: Number,
                    required: false,
                    default: 0,
                    min: 0
                }
            }
        ]
    },
    allowed_vehicle_years: {
        start_year: {
            type: Number,
            min: 1900,
            max: function () {
                return new Date().getFullYear() + 1;
            }
        },
        end_year: {
            type: Number,
            min: 1900,
            max: function () {
                return new Date().getFullYear() + 1;
            },
            validate: {
                validator: function (v) {
                    return v >= this.start_year;
                },
                message: 'End year must be greater than or equal to start year'
            }
        }
    },
    allowed_customer_types: {
        type: String,
        enum: ['all', 'new', 'existing'],
        default: 'all'
    },
    excluded_models: [{
        make_id: {
            type: String,
            required: true,
        },
        make_name: {
            type: String,
            required: true,
            trim: true,
        },
        models: [{
            model_id: {
                type: String,
                required: true,
            },
            model_name: {
                type: String,
                required: true,
                trim: true,
            },
        }],
    }],
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

pickupOptionSchema.index({ garage_id: 1 }, { unique: true });

const PickupOption = mongoose.model('PickupOption', pickupOptionSchema);

export default PickupOption;
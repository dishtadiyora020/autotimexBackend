import mongoose, { Schema } from "mongoose";

const waiterCapacitySchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage'
    },
    automatic_appointment_times: {
        type: {
            scheduling_hours: [
                {
                    day: {
                        type: String,
                        required: true,
                        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                    },
                    start: {
                        type: String,
                        default: null,
                        required: function () {
                            return !this.is_closed;
                        },
                        validate: {
                            validator: function (v) {
                                return /^([1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(v);
                            },
                            message: props => `${props.value} is not a valid time format! Use HH:MM (12-hour format) with AM/PM`
                        }
                    },
                    end: {
                        type: String,
                        default: null,
                        required: function () {
                            return !this.is_closed;
                        },
                        validate: {
                            validator: function (v) {
                                return /^([1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(v);
                            },
                            message: props => `${props.value} is not a valid time format! Use HH:MM (12-hour format) with AM/PM`
                        }
                    },
                    is_closed: {
                        type: Boolean,
                        default: false
                    }
                }
            ],
            timeslot_interval: {
                type: Number,
                min: 5,
                default: 60,
                validate: {
                    validator: function (v) {
                        return v % 5 === 0;
                    },
                    message: 'Timeslot interval must be a multiple of 5 minutes'
                }
            },
        },
        default: {
            scheduling_hours: [],
            timeslot_interval: 60
        }
    },
    manual_appointment_times: {
        type: {
            scheduling_time: [{
                day: {
                    type: String,
                    required: true,
                    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                },
                timings: [{
                    start: {
                        type: String,
                        required: false,
                        default: null,
                        validate: {
                            validator: function (v) {
                                return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
                            },
                            message: props => `${props.value} is not a valid time format! Use HH:MM (24-hour format)`
                        }
                    },
                    label: {
                        type: String,
                        default: null,
                        trim: true
                    },
                    max_appointment_duration: {
                        type: Number,
                        min: 0
                    }
                }]
            }]
        },
        default: {
            scheduling_time: []
        }
    },
    mode: {
        type: String,
        required: true,
        enum: ['automatic', 'manual']
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

waiterCapacitySchema.index({ garage_id: 1 });

const WaiterCapacity = mongoose.model('WaiterCapacity', waiterCapacitySchema);

export default WaiterCapacity;
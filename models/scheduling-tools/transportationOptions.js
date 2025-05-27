import mongoose, { Schema } from 'mongoose';

const transportationOptionsSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage',
    },
    is_enable: {
        type: Boolean,
        default: false
    },
    request_options: [
        {
            title: {
                type: String,
                required: true,
                trim: true
            },
            description: {
                type: String,
                trim: true
            },
            customer_warning: {
                type: String,
                trim: true
            }
        }
    ],
    hours: [{
        day: {
            type: String,
            required: true,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        },
        is_available: {
            type: Boolean,
            default: false,
        },
        start_time: {
            type: String,
            required: function () {
                return this.is_available;
            },
            validate: {
                validator: function (v) {
                    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
                },
                message: props => `${props.value} is not a valid time format! Use HH:MM (24-hour format)`,
            },
        },
        end_time: {
            type: String,
            required: function () {
                return this.is_available;
            },
            validate: {
                validator: function (v) {
                    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
                },
                message: props => `${props.value} is not a valid time format! Use HH:MM (24-hour format)`,
            },
        },
    }],
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
transportationOptionsSchema.index({ garage_id: 1 }, { unique: true });
const transportationOptions = mongoose.model('transportationOptions', transportationOptionsSchema);

export default transportationOptions;
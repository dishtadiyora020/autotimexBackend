import mongoose, { Schema } from 'mongoose';

const serviceSchedulerModelsSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage',
    },
    services: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Service',
    }],
    appointment_type: {
        type: String,
        required: true,
        enum: ['waiter', 'dropoff', 'all']
    },
    mode: {
        type: {
            type: String,
            required: true,
            enum: ['date_only', 'preference_timeslots']
        },
        timeslots: [{
            label: {
                type: String,
                required: function () { return this.type === 'preference_timeslots'; },
                trim: true
            },
            time: {
                type: String,
                required: function () { return this.type === 'preference_timeslots'; },
                validate: {
                    validator: function (time) {
                        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
                    },
                    message: 'Time must be in HH:MM format'
                }
            }
        }]
    },
    calendar_note: {
        type: String,
        trim: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});



const ServiceScheduler = mongoose.model('ServiceScheduler', serviceSchedulerModelsSchema);

export default ServiceScheduler;
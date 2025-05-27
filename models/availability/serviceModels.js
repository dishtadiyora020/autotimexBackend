import mongoose, { Schema } from 'mongoose';

const serviceModelsSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage',
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    estimated_minutes: {
        type: Number,
        required: true,
        min: 0
    },
    is_waiter: {
        type: Boolean,
        default: true
    },
    is_dropoff: {
        type: Boolean,
        default: true
    },
    is_pickup: {
        type: Boolean,
        default: false
    },
    internal_notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Service = mongoose.model('Service', serviceModelsSchema);

export default Service;
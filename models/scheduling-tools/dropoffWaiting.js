import mongoose, { Schema } from 'mongoose';

const dropoffWaitingSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage',
    },
    waiter: {
        type: String,
        trim: true
    },
    waiter_disabled: {
        type: String,
        trim: true
    },
    drop_off: {
        type: String,
        trim: true
    },
    drop_off_disabled: {
        type: String,
        trim: true
    },
    pickup: {
        type: String,
        trim: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
dropoffWaitingSchema.index({ garage_id: 1 }, { unique: true });
const DropoffWaiting = mongoose.model('DropoffWaiting', dropoffWaitingSchema);

export default DropoffWaiting;
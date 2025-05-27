import mongoose, { Schema } from "mongoose";

const customerExceptionsForPickup = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage',
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    first_name: {
        type: String,
        trim: true
    },
    last_name: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    exception_type: {
        type: String,
        required: true,
        enum: ['allow', 'block']
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const CustomerExceptionsForPickup = mongoose.model('CustomerExceptionsForPickup', customerExceptionsForPickup);

export default CustomerExceptionsForPickup;


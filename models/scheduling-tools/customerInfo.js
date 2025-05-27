import mongoose, { Schema } from 'mongoose';

const customerInfoSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage',
    },
    phone: {
        type: String,
        required: false,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    first_name: {
        type: String,
        trim: true
    },
    last_name: {
        type: String,
        trim: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
const CustomerInfo = mongoose.model('CustomerInfo', customerInfoSchema);

export default CustomerInfo;
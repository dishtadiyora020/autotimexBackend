import mongoose, { Schema } from 'mongoose';

const customerToolSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage',
    },
    is_collect_email: {
        type: Boolean,
        default: true
    },
    is_require_email: {
        type: Boolean,
        default: true
    },
    is_ask_customer_address: {
        type: Boolean,
        default: false
    },
    is_verify_phone_new_customer: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
customerToolSchema.index({ garage_id: 1 }, { unique: true });
const CustomerTool = mongoose.model('CustomerTool', customerToolSchema);

export default CustomerTool;
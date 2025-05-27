import mongoose, { Schema } from 'mongoose';

const apiKeysSchema = new mongoose.Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        ref: 'Garage',
        required: true
    },
    api_key: {
        type: String,
        required: true
    },
    is_enabled: {
        type: Boolean,
        required: false,
        default: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const ApiKeys = mongoose.model('ApiKeys', apiKeysSchema);

export default ApiKeys;
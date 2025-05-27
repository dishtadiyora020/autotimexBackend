import mongoose, { Schema } from 'mongoose';

const userSchema = new mongoose.Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        ref: 'Garage',
        required: true
    },
    first_name: {
        type: String,
        trim: true,
    },
    last_name: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User
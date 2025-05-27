import mongoose from 'mongoose';

const userRolesSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    permissions: {
        type: Array,
        required: false,
        default: []
    }
}, {
    timestamps: true
});

const UserRoles = mongoose.model('UserRoles', userRolesSchema);

export default UserRoles
import mongoose, { Schema } from 'mongoose';
const customFieldSchema = new Schema({
    custom_field: {
        type: Schema.Types.ObjectId,
        ref: 'CustomField',
    },
    value: {
        type: Schema.Types.Mixed,
        required: false
    }
}, { _id: false });

const vehicleSchema = new mongoose.Schema({
    user_id: {
        ref: 'User',
        type: Schema.Types.ObjectId
    },
    garage_id: {
        type: Schema.Types.ObjectId,
        ref: 'Garage',
        required: true
    },
    year: {
        type: String,
        trim: true
    },
    make: {
        type: String,
        trim: true
    },
    model: {
        type: String,
        trim: true
    },
    license_plate: {
        type: String,
        trim: true
    },
    license_region: {
        type: String,
        trim: true
    },
    VIN: {
        type: String,
        trim: true
    },

    custom_field_values: [customFieldSchema]
}, {
    timestamps: true
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle
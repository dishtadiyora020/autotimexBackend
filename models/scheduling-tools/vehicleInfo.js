import mongoose, { Schema } from 'mongoose';

const vehicleInfoSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage',
    },
    show_license_plate_field: {
        type: Boolean,
        default: false,
    },
    show_vin_field: {
        type: Boolean,
        default: false,
    },
    serviced_years_start: {
        type: Number,
        default: 1950,
    },
    serviced_years_end: {
        type: Number,
        default: new Date().getFullYear(),
    },
    excluded_models: [{
        make_id: {
            type: String,
            required: true,
        },
        make_name: {
            type: String,
            required: true,
            trim: true,
        },
        models: [{
            model_id: {
                type: String,
                required: true,
            },
            model_name: {
                type: String,
                required: true,
                trim: true,
            },
        }],
    }],
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
vehicleInfoSchema.index({ garage_id: 1 }, { unique: true });
const VehicleInfo = mongoose.model('VehicleInfo', vehicleInfoSchema);

export default VehicleInfo;

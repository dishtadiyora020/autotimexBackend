import mongoose, { Schema } from "mongoose";

const allowedVehicleModelForPickupSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage',
    },
    make: {
        type: String,
        required: true,
        trim: true
    },
    models: {
        type: [String],
        required: false,
        default: null
    }
});

allowedVehicleModelForPickupSchema.index({ garage_id: 1 });

const AllowedVehicleModelForPickup = mongoose.model('AllowedVehicleModelForPickup', allowedVehicleModelForPickupSchema);

export default AllowedVehicleModelForPickup;


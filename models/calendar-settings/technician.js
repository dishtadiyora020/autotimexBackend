import mongoose, { Schema } from "mongoose";

const technicianSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage'
    },
    first_name: {
        type: String,
        required: true,
        trim: true
    },
    last_name: {
        type: String,
        required: true,
        trim: true
    },
    display_color: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
            },
            message: props => `${props.value} is not a valid hex color!`
        }
    },
    sms_id: {
        type: String,
        trim: true,
        default: null
    }
});

// Compound index to ensure one settings document per garage
technicianSchema.index({ garage_id: 1 });

const Technician = mongoose.model('Technician', technicianSchema);

export default Technician;
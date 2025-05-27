import mongoose, { Schema } from "mongoose";

const serviceAdvisorSchema = new Schema({
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
}, { timestamps: true });

serviceAdvisorSchema.index({ garage_id: 1 });

const ServiceAdvisor = mongoose.model('ServiceAdvisor', serviceAdvisorSchema);

export default ServiceAdvisor;
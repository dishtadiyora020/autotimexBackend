import mongoose from "mongoose";
import { Schema } from "mongoose";

const jobLabelSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage'
    },
    label: {
        type: String,
        required: true,
        trim: true
    },
    label_color: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
            },
            message: props => `${props.value} is not a valid hex color!`
        }
    },
    description: {
        type: String,
        trim: true,
        default: null
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

jobLabelSchema.index({ garage_id: 1 });

const JobLabel = mongoose.model('JobLabel', jobLabelSchema);

export default JobLabel;
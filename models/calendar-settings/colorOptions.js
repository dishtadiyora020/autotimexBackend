import mongoose, { Schema } from "mongoose";

const colorOptionsSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage'
    },
    color: {
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
    },
    text_color: {
        type: String,
        validate: {
            validator: function (v) {
                if (!v) return true; // Allow empty
                return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
            },
            message: props => `${props.value} is not a valid hex color!`
        },
        default: '#000000'
    },
    border_color: {
        type: String,
        validate: {
            validator: function (v) {
                if (!v) return true; // Allow empty
                return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
            },
            message: props => `${props.value} is not a valid hex color!`
        },
        default: '#000000'
    }
}, { timestamps: true });

colorOptionsSchema.index({ garage_id: 1 });

const ColorOptions = mongoose.model('ColorOptions', colorOptionsSchema);

export default ColorOptions;
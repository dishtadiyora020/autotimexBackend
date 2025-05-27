import mongoose, { Schema } from "mongoose";

const appointmentConditionSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage'
    },
    field: {
        type: String,
        required: false,
        default: null
    },
    operator: {
        type: String,
        required: false,
        default: null,
        enum: ['equals', 'contains', 'one_contains', 'not_equals', 'greater_than', 'less_than', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty']
    },
    index: {
        type: Number,
        required: true
    },
    is_default_condition: {
        type: Boolean,
        default: false
    },
    value: {
        type: Schema.Types.Mixed,
        required: function () {
            return !['is_empty', 'is_not_empty'].includes(this.operator);
        },
        default: null
    },
    color_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'ColorOptions'
    }
}, { timestamps: true });

appointmentConditionSchema.index({ garage_id: 1 });

const AppointmentColorCondition = mongoose.model('AppointmentColorCondition', appointmentConditionSchema);

export default AppointmentColorCondition;
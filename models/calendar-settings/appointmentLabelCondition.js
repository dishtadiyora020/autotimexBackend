import mongoose, { Schema } from "mongoose";

const appointmentLabelConditionSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage'
    },
    type: {
        type: String,
        required: true,
        enum: ['appointment', 'customer', 'vehicle']
    },
    field: {
        type: String,
        required: true
    },
    operator: {
        type: String,
        required: true,
        enum: ['equals', 'contains', 'one_contains', 'not_equals', 'greater_than', 'less_than', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty']
    },
    value: {
        type: Schema.Types.Mixed,
        required: function () {
            return !['is_empty', 'is_not_empty'].includes(this.operator);
        }
    },
    label_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'JobLabel'
    }
});

appointmentLabelConditionSchema.index({ garage_id: 1 });

const AppointmentLabelCondition = mongoose.model('AppointmentLabelCondition', appointmentLabelConditionSchema);

export default AppointmentLabelCondition;
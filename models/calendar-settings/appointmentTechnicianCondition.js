import mongoose, { Schema } from "mongoose";

const appointmentTechnicianConditionSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage'
    },
    index: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['appointment', 'customer', 'vehicle']
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
        enum: ['equals', 'contains', 'not_equals', 'greater_than', 'less_than', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty']
    },
    value: {
        type: Schema.Types.Mixed,
        required: function () {
            return !['is_empty', 'is_not_empty'].includes(this.operator);
        }
    },
    is_default_condition: {
        type: Boolean,
        default: false
    },
    technician_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Technician'
    }
});

appointmentTechnicianConditionSchema.index({ garage_id: 1 });

const AppointmentTechnicianCondition = mongoose.model('AppointmentTechnicianCondition', appointmentTechnicianConditionSchema);

export default AppointmentTechnicianCondition;
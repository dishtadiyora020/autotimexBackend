import mongoose, { Schema } from 'mongoose';

const calendarSettingsSchema = new Schema({
  garage_id: {
    type: Schema.Types.ObjectId,
    ref: 'Garage',
    required: true
  },
  color_options: [{
    type: Schema.Types.ObjectId,
    ref: 'ColorOption'
  }],
  appointment_color_conditions: [{
    type: Schema.Types.ObjectId,
    ref: 'AppointmentColorCondition'
  }],
  job_label: [{
    type: Schema.Types.ObjectId,
    ref: 'JobLabel'
  }],
  appointment_lbl_condition: [{
    type: Schema.Types.ObjectId,
    ref: 'AppointmentLabelCondition'
  }],
  progress_options: [{
    type: Schema.Types.ObjectId,
    ref: 'ProgressOption'
  }],
  technician: [{
    type: Schema.Types.ObjectId,
    ref: 'Technician'
  }],
  appointment_tcn_condition: [{
    type: Schema.Types.ObjectId,
    ref: 'AppointmentTechnicianCondition'
  }],
  service_advisor: [{
    type: Schema.Types.ObjectId,
    ref: 'ServiceAdvisor'
  }],
  general_settings: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index to ensure one settings document per garage
calendarSettingsSchema.index({ garage_id: 1 }, { unique: true });

const CalendarSettings = mongoose.model('CalendarSettings', calendarSettingsSchema);

export default CalendarSettings;
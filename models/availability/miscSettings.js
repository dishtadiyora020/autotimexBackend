import mongoose, { Schema } from 'mongoose';

const miscellaneousSettingsSchema = new Schema({
  garage_id: {
    type: Schema.Types.ObjectId,
    ref: 'Garage',
    required: true
  },
  is_use_single_service_duration: {
    type: Boolean,
    default: false
  },
  is_use_deferred_work_estimated_minutes: {
    type: Boolean,
    default: false
  },
  booking_window: {
    type: Number,
    min: 1,
    default: 30,
    description: 'Number of days into the future that appointments can be booked'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

miscellaneousSettingsSchema.index({ garage_id: 1 }, { unique: true });

const MiscellaneousSettings = mongoose.model('MiscellaneousSettings', miscellaneousSettingsSchema);

export default MiscellaneousSettings;
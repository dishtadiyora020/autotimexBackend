import mongoose, { Schema } from 'mongoose';

const notificationSchema = new Schema({
  garage_id: {
    type: Schema.Types.ObjectId,
    ref: 'Garage',
    required: true
  },
  status: {
    type: String,
    required: true
  },
  appointment_id: {
    type: Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  failure_reason: {
    type: String,
    required: false
  },
  notification_content: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
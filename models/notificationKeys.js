import mongoose, { Schema } from 'mongoose';

const notificationKeysSchema = new Schema({
  key: {
    type: String,
    required: true
  },
  has_tooltip: {
    type: Boolean,
    default: false
  },
  tooltip_text: {
    type: String,
    required: function() {
      return !this.has_tooltip;
    },
  },
  example: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const NotificationKeys = mongoose.model('NotificationKeys', notificationKeysSchema);

export default NotificationKeys;
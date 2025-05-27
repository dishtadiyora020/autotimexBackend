import mongoose, { Schema } from 'mongoose';

const shopHoursSchema = new Schema({
  day: {
    type: String,
    required: true,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  start: {
    type: String,
    required: function() {
      return !this.is_closed;
    },
    validate: {
      validator: function(v) {
        return /^([1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:MM (12-hour format) with AM/PM`
    }
  },
  end: {
    type: String,
    required: function() {
      return !this.is_closed;
    },
    validate: {
      validator: function(v) {
        return /^([1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:MM (12-hour format) with AM/PM`
    }
  },
  is_closed: {
    type: Boolean,
    default: false
  }
});

const notificationSchema = new Schema({
  type: {
    type: String,
    required: true,
    // enum: ['sms', 'email', 'push']
  },
  key: {
    type: String,
  },
  waiter: {
    type: String,
    trim: true
  },
  dropoff: {
    type: String,
    trim: true
  },
  pickup: {
    type: String,
    trim: true
  }
});

const emailNotificationsSchema = new Schema({
  new_appointment_emails: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  }],
  new_lead_emails: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  }],
  is_send_email_alerts: {
    type: Boolean,
    default: true
  },
  is_add_appointment_detail_subject: {
    type: Boolean,
    default: true
  },
  is_send_to_admin_when_book_internally: {
    type: Boolean,
    default: false
  }
});

const garageSettingsSchema = new Schema({
  garage_id: {
    type: Schema.Types.ObjectId,
    ref: 'Garage',
    required: true
  },
  shop_hours: {
    type: [shopHoursSchema],
    validate: {
      validator: function(v) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const submittedDays = v.map(hour => hour.day);
        return days.every(day => submittedDays.includes(day));
      },
      message: 'All days of the week must be included in shop hours'
    }
  },
  notifications: [notificationSchema],
  email_notifications: {
    type: emailNotificationsSchema,
    default: {}
  }
}, {
  timestamps: true
});

garageSettingsSchema.index({ garage_id: 1 }, { unique: true });

const GarageSettings = mongoose.model('GarageSettings', garageSettingsSchema);

export default GarageSettings;
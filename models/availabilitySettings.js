import mongoose, { Schema } from 'mongoose';

const schedulingHoursSchema = new Schema({
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
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:MM (24-hour format)`
    }
  },
  end: {
    type: String,
    required: function() {
      return !this.is_closed;
    },
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:MM (24-hour format)`
    }
  },
  is_closed: {
    type: Boolean,
    default: false
  }
});

const textTimeslotSchema = new Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  timeslot: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:MM (24-hour format)`
    }
  },
  is_always_show: {
    type: Boolean,
    default: false
  }
});

const manualSchedulingHoursSchema = new Schema({
  day: {
    type: String,
    required: true,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  start: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:MM (24-hour format)`
    }
  },
  label: {
    type: String,
    trim: true
  },
  max_duration: {
    type: Number,
    min: 0
  }
});

const pickupTimeslotSchema = new Schema({
  time_in_sms: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:MM (24-hour format)`
    }
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  max_pickup_during_timeslot: {
    type: Number,
    required: true,
    min: 0
  }
});

const allowedVehicleModelSchema = new Schema({
  make: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  }
});

const exceptionCustomerSchema = new Schema({
  phone: {
    type: String,
    required: true,
    trim: true
  },
  first_name: {
    type: String,
    trim: true
  },
  last_name: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  exception_type: {
    type: String,
    required: true,
    enum: ['allow', 'block']
  }
});

const pickupAppointmentSchema = new Schema({
  max_pickup_per_day: {
    type: Number,
    min: 0
  },
  max_distance_from_garage: {
    type: Number,
    min: 0
  },
  earliest_pickup_time: {
    type: {
      type: String,
      enum: ['fixed', 'relative'],
      required: true,
      default: 'fixed'
    },
    value: {
      type: Schema.Types.Mixed,
      required: true
    }
  },
  timeslots: [pickupTimeslotSchema],
  allowed_vehicle_years: {
    start_year: {
      type: Number,
      min: 1900,
      max: function() {
        return new Date().getFullYear() + 1;
      }
    },
    end_year: {
      type: Number,
      min: 1900,
      max: function() {
        return new Date().getFullYear() + 1;
      },
      validate: {
        validator: function(v) {
          return v >= this.start_year;
        },
        message: 'End year must be greater than or equal to start year'
      }
    }
  },
  allowed_vehicle_models: [allowedVehicleModelSchema],
  allowed_customer_types: {
    type: String,
    enum: ['all', 'new', 'existing'],
    default: 'all'
  },
  exception_customer: [exceptionCustomerSchema]
});

const availabilitySettingsSchema = new Schema({
  garage_id: {
    type: Schema.Types.ObjectId,
    ref: 'Garage',
    required: true
  },
  waiter_auto_appointment: {
    scheduling_hours: [schedulingHoursSchema],
    timeslot_interval: {
      type: Number,
      min: 5,
      default: 30,
      validate: {
        validator: function(v) {
          return v % 5 === 0; // Must be multiple of 5
        },
        message: 'Timeslot interval must be a multiple of 5 minutes'
      }
    }
  },
  dropoff_auto_appointment: {
    scheduling_hours: [schedulingHoursSchema],
    timeslot_interval: {
      type: Number,
      min: 5,
      default: 30,
      validate: {
        validator: function(v) {
          return v % 5 === 0; // Must be multiple of 5
        },
        message: 'Timeslot interval must be a multiple of 5 minutes'
      }
    },
    is_show_dropoff: {
      type: Boolean,
      default: true
    },
    text_timeslot: [textTimeslotSchema]
  },
  waiter_manual_appointment: {
    scheduling_hours: [manualSchedulingHoursSchema]
  },
  dropoff_manual_appointment: {
    scheduling_hours: [manualSchedulingHoursSchema]
  },
  is_pickup: {
    type: Boolean,
    default: false
  },
  capacity_blocker: {
    type: capacityBlockerSchema,
    default: { is_enable: false }
  },
  pickup_appointment: {
    type: pickupAppointmentSchema,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index to ensure one settings document per garage
availabilitySettingsSchema.index({ garage_id: 1 }, { unique: true });

const AvailabilitySettings = mongoose.model('AvailabilitySettings', availabilitySettingsSchema);

export default AvailabilitySettings;
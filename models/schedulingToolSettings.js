import mongoose, { Schema } from 'mongoose';





// Vehicle Info Schemas
const vehicleModelSchema = new Schema({
  make: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  is_block: {
    type: Boolean,
    default: false
  }
});

const vehicleYearsSchema = new Schema({
  start_year: {
    type: Number,
    min: 1900,
    max: function () {
      return new Date().getFullYear() + 1;
    },
    validate: {
      validator: function (v) {
        return v <= this.end_year;
      },
      message: 'Start year must be less than or equal to end year'
    }
  },
  end_year: {
    type: Number,
    min: 1900,
    max: function () {
      return new Date().getFullYear() + 1;
    }
  }
});

const vehicleInfoSchema = new Schema({
  is_show_optional_license_plate: {
    type: Boolean,
    default: true
  },
  is_show_vin: {
    type: Boolean,
    default: false
  },
  serviced_years: {
    type: vehicleYearsSchema,
    default: {
      start_year: 1990,
      end_year: () => new Date().getFullYear() + 1
    }
  },
  serviced_models: [vehicleModelSchema]
});




// Transportation Schemas
const transportationOptionSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  customer_warning: {
    type: String,
    trim: true
  }
});

const transportationRequestHoursSchema = new Schema({
  day: {
    type: String,
    required: true,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  start: {
    type: String,
    required: function () {
      return !this.is_closed;
    },
    validate: {
      validator: function (v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:MM (24-hour format)`
    }
  },
  end: {
    type: String,
    required: function () {
      return !this.is_closed;
    },
    validate: {
      validator: function (v) {
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

// Confirmation & Success Schemas
const confirmBookingSchema = new Schema({
  waiter_mobile_repair: [{
    type: String,
    trim: true
  }],
  drop_off: [{
    type: String,
    trim: true
  }],
  pickup: [{
    type: String,
    trim: true
  }],
  destination_url: {
    type: String,
    trim: true
  },
  is_open_url_new_tab: {
    type: Boolean,
    default: true
  }
});

const animationSchema = new Schema({
  confetti: {
    type: Boolean,
    default: false
  },
  fireworks: {
    type: Boolean,
    default: false
  },
  text_explosion: {
    type: Boolean,
    default: false
  },
  text_explosion_text: {
    type: String,
    trim: true
  }
});

const successfulBookingSchema = new Schema({
  is_show_extended_appointment_info: {
    type: Boolean,
    default: true
  },
  waiter_success_msg: {
    type: String,
    trim: true
  },
  drop_off_success_msg: {
    type: String,
    trim: true
  },
  pickup_success_msg: {
    type: String,
    trim: true
  },
  waiter_instruction_msg: {
    type: String,
    trim: true
  },
  drop_off_instruction_msg: {
    type: String,
    trim: true
  },
  pickup_instruction_msg: {
    type: String,
    trim: true
  },
  animation: {
    type: animationSchema,
    default: {}
  }
});

// Source Tracking Schema
const sourceTrackingSchema = new Schema({
  source: {
    type: Boolean,
    default: true
  },
  marketingSource: {
    type: Boolean,
    default: true
  },
  bookingPage: {
    type: Boolean,
    default: true
  },
  clientReferrer: {
    type: Boolean,
    default: true
  },
  gclid: {
    type: Boolean,
    default: true
  },
  gcsrc: {
    type: Boolean,
    default: true
  },
  fbclid: {
    type: Boolean,
    default: true
  },
  wbraid: {
    type: Boolean,
    default: true
  },
  gbraid: {
    type: Boolean,
    default: true
  },
  yclid: {
    type: Boolean,
    default: true
  },
  msclkid: {
    type: Boolean,
    default: true
  },
  ttclid: {
    type: Boolean,
    default: true
  },
  ao_link: {
    type: Boolean,
    default: true
  },
  ao_source: {
    type: Boolean,
    default: true
  },
  ao_camgaign: {
    type: Boolean,
    default: true
  },
  ao_promo: {
    type: Boolean,
    default: true
  },
  ao_coupon: {
    type: Boolean,
    default: true
  },
  ao_affiliate: {
    type: Boolean,
    default: true
  },
  ao_leadSource: {
    type: Boolean,
    default: true
  },
  ao_custom_1: {
    type: Boolean,
    default: true
  },
  ao_custom_2: {
    type: Boolean,
    default: true
  },
  ao_custom_3: {
    type: Boolean,
    default: true
  },
  utm_source: {
    type: Boolean,
    default: true
  },
  utm_medium: {
    type: Boolean,
    default: true
  },
  utm_campaign: {
    type: Boolean,
    default: true
  },
  utm_content: {
    type: Boolean,
    default: true
  },
  utm_term: {
    type: Boolean,
    default: true
  }
});




// Custom Fields Schemas
const customFieldBaseSchema = {
  type: {
    type: String,
    required: true,
    enum: ['text', 'number', 'date', 'boolean', 'select', 'radio', 'checkbox', 'textarea']
  },
  field_name: {
    type: String,
    required: true,
    trim: true
  },
  field_label: {
    type: String,
    required: true,
    trim: true
  },
  is_required: {
    type: Boolean,
    default: false
  },
  is_show_in_sms: {
    type: Boolean,
    default: false
  }
};

const appointmentCustomFieldIssueTreeSchema = new Schema({
  ...customFieldBaseSchema
});

const appointmentCustomFieldDedicatedSchema = new Schema({
  ...customFieldBaseSchema,
  is_active: {
    type: Boolean,
    default: true
  }
});

const customerCustomFieldSchema = new Schema({
  ...customFieldBaseSchema,
  is_active: {
    type: Boolean,
    default: true
  },
  when_to_collect: {
    type: String,
    enum: ['new', 'existing', 'all'],
    default: 'all'
  }
});

const vehicleCustomFieldSchema = new Schema({
  ...customFieldBaseSchema,
  is_active: {
    type: Boolean,
    default: true
  },
  when_to_collect: {
    type: String,
    enum: ['new', 'existing', 'all'],
    default: 'all'
  }
});




import mongoose, { Schema } from 'mongoose';

const membersSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  last_name: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email address must be in valid format']
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true
  },
  roles: {
    type: [Schema.Types.ObjectId],
    required: [true, 'Role is required'],
    trim: true,
    ref: 'UserRole'
  },
  propel_auth_user_id: {
    type: String,
    required: [true, 'Propel auth user id is required'],
    trim: true
  }
}, {
  timestamps: true
})

const garageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Garage name is required'],
    trim: true
  },
  key: {
    type: String,
    required: [true, 'Garage key is required'],
    unique: true,
    trim: true
  },
  status: {
    type: String,
    required: [true, 'Garage status is required'],
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  domain_slug: {
    type: String,
    required: [true, 'Domain slug is required'],
    trim: true,
    unique: true
  },
  domain_id: {
    type: String,
    // required: [true, 'Domain id is required'],
    trim: true,
    unique: true
  },
  address_line_1: {
    type: String,
    required: [true, 'Address line 1 is required'],
    trim: true
  },
  address_line_2: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  zip: {
    type: String,
    required: [true, 'Zip code is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    default: 'USA'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function (v) {
          return v.length === 2;
        },
        message: 'Coordinates must be [longitude, latitude]'
      }
    }
  },
  timezone: {
    type: String,
    required: [true, 'Timezone is required'],
    default: 'America/New_York'
  },
  propel_auth_org_id: {
    type: String,
    trim: true,
    required: [true, 'Propel auth org id is required']
  },
  propel_auth_owner_id: {
    type: String,
    trim: true,
    required: [true, 'Propel auth owner id is required']
  },
  members: [membersSchema],
  stripe_customer_id: { type: String }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

garageSchema.index({ location: '2dsphere' });

const Garage = mongoose.model('Garage', garageSchema);

export default Garage;
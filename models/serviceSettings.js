import mongoose, { Schema } from 'mongoose';




const serviceSettingsSchema = new Schema({
  garage_id: {
    type: Schema.Types.ObjectId,
    ref: 'Garage',
    required: true
  },
  services: {
    type: [serviceSchema],
    validate: {
      validator: function(v) {
        if (v.length === 0) {
          return false;
        }
        
        // Check for duplicate service names
        const serviceNames = v.map(service => service.name);
        return new Set(serviceNames).size === serviceNames.length;
      },
      message: 'At least one service is required and service names must be unique'
    }
  },
  service_schedule_modes: [serviceScheduleModeSchema]
}, {
  timestamps: true
});

// Compound index to ensure one settings document per garage
serviceSettingsSchema.index({ garage_id: 1 }, { unique: true });

const ServiceSettings = mongoose.model('ServiceSettings', serviceSettingsSchema);

export default ServiceSettings;
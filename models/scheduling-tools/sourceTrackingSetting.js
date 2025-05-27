import mongoose, { Schema } from 'mongoose';

const sourceTrackingSettingSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage',
    },
    source: {
        type: Boolean,
        default: false,
    },
    marketingSource: {
        type: Boolean,
        default: false,
    },
    bookingPage: {
        type: Boolean,
        default: false,
    },
    clientReferrer: {
        type: Boolean,
        default: false,
    },
    gclid: {
        type: Boolean,
        default: false,
    },
    gcsrc: {
        type: Boolean,
        default: false,
    },
    fbclid: {
        type: Boolean,
        default: false,
    },
    wbraid: {
        type: Boolean,
        default: false,
    },
    gbraid: {
        type: Boolean,
        default: false,
    },
    yclid: {
        type: Boolean,
        default: false,
    },
    msclkid: {
        type: Boolean,
        default: false,
    },
    ttclid: {
        type: Boolean,
        default: false,
    },

    at_link: {
        type: Boolean,
        default: false,
    },
    at_source: {
        type: Boolean,
        default: false,
    },
    at_campaign: {
        type: Boolean,
        default: false,
    },
    at_promo: {
        type: Boolean,
        default: false,
    },
    at_coupon: {
        type: Boolean,
        default: false,
    },
    at_affiliate: {
        type: Boolean,
        default: false,
    },
    at_leadSource: {
        type: Boolean,
        default: false,
    },
    at_custom_1: {
        type: Boolean,
        default: false,
    },
    at_custom_2: {
        type: Boolean,
        default: false,
    },
    at_custom_3: {
        type: Boolean,
        default: false
    },
    utm_source: {
        type: Boolean,
        default: false,
    },
    utm_medium: {
        type: Boolean,
        default: false,
    },
    utm_campaign: {
        type: Boolean,
        default: false,
    },
    utm_content: {
        type: Boolean,
        default: false,
    },
    utm_term: {
        type: Boolean,
        default: false,
    },
    locationTracking: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
sourceTrackingSettingSchema.index({ garage_id: 1 }, { unique: true });
const SourceTrackingSetting = mongoose.model('SourceTrackingSetting', sourceTrackingSettingSchema);

export default SourceTrackingSetting;
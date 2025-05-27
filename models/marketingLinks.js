import mongoose, { Schema } from 'mongoose';

const marketingLinksSchema = new mongoose.Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        ref: 'Garage',
        required: true
    },
    role: {
        type: String,
        trim: true
    },
    name: {
        type: String,
        required: true
    },
    link: {
        type: String,
        trim: true
    },
    code: {
        type: String,
        trim: true
    },
    url_destination: {
        type: String,
        trim: true
    },
    source_tracking: [{
        type: Schema.Types.Mixed,
    }],
    use_query_parameter: {
        type: Boolean,
        default: false
    },
    online_scheduling_tools: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['link', 'qrcode']
    },
    scan: {
        click: [{
            date: {
                type: Date
            },
            ip: {
                type: String
            },
            lat: {
                type: Number,
                required: function () { return this.locationEnabled; }
            },
            lon: {
                type: Number,
                required: function () { return this.locationEnabled; }
            }
        }],
        lead: [{
            date: {
                type: Date
            },
            ip: {
                type: String
            },
            lead_id: {
                type: Schema.Types.ObjectId,
                ref: 'Leads'
            }
        }],
        booking: [{
            date: {
                type: Date
            },
            ip: {
                type: String
            },
            booking_id: {
                type: Schema.Types.ObjectId,
                ref: 'Appointments'
            }
        }]
    },
    locationEnabled: {
        type: Boolean,
        default: false
    },
    lat: {
        type: Number,
        required: function () { return this.locationEnabled; }
    },
    long: {
        type: Number,
        required: function () { return this.locationEnabled; }
    }

}, {
    timestamps: true
});

const MarketingLinks = mongoose.model('MarketingLinks', marketingLinksSchema);

export default MarketingLinks
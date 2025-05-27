import mongoose, { Schema } from 'mongoose';

const confirmBookingSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage',
    },
    waiter_mobile_repair: [
        {
            title: {
                type: String,
                trim: true
            }
        }
    ],
    drop_off: [
        {
            title: { 
                type: String,
                trim: true
            }
        }
    ],
    pickup: [
        {
            title: {
                type: String,
                trim: true
            }
        }
    ],
    destination_url: {
        type: String,
        trim: true
    },
    is_open_url_new_tab: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
confirmBookingSchema.index({ garage_id: 1 }, { unique: true });
const ConfirmBooking = mongoose.model('ConfirmBooking', confirmBookingSchema);

export default ConfirmBooking;
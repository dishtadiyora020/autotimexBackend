import mongoose, { Schema } from 'mongoose';

const successBookingSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage',
    },
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
    animation: 
        {
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
        }
    
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
successBookingSchema.index({ garage_id: 1 }, { unique: true });
const SuccessBooking = mongoose.model('SuccessBooking', successBookingSchema);

export default SuccessBooking;
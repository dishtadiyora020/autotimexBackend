import mongoose, { Schema } from 'mongoose';

const calendarNoteSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage',
    },
    waiter: {
        type: String,
        trim: true
    },
    drop_off: {
        type: String,
        trim: true
    },
    pickup: {
        type: String,
        trim: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
calendarNoteSchema.index({ garage_id: 1 }, { unique: true });
const CalendarNote = mongoose.model('CalendarNote', calendarNoteSchema);

export default CalendarNote;
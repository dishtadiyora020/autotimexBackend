import mongoose, { Schema } from 'mongoose';

const exitLeadsSchema = new mongoose.Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        ref: 'Garage',
        required: true
    },
    first_name: {
        type: String,
        trim: true,
    },
    last_name: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        trim: true
    },
    question: {
        type: String,
        trim: true
    },
    followUp: {
        type: Boolean,
        default: false
    },
    followUp_notes: {
        type: String,
        trim: true
    },
}, {
    timestamps: true
});

const ExitLeads = mongoose.model('ExitLeads', exitLeadsSchema);

export default ExitLeads
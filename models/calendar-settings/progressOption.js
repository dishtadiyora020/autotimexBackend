import mongoose, { Schema } from "mongoose";

const progressOptionsSchema = new Schema({
  garage_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Garage'
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  progress_percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, { timestamps: true });

progressOptionsSchema.index({ garage_id: 1 });

const ProgressOptions = mongoose.model('ProgressOptions', progressOptionsSchema);

export default ProgressOptions;
import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, index: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  startsAt: { type: Date, required: true },
  durationMinutes: { type: Number, min: 15, max: 240, default: 45 },
  format: { type: String, enum: ["Video call", "On site", "Phone call"], default: "Video call" },
  interviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["Scheduled", "Completed", "Cancelled"], default: "Scheduled" },
  feedback: { type: String, maxlength: 4000, default: "" }
}, { timestamps: true });

export default mongoose.model("Interview", interviewSchema);

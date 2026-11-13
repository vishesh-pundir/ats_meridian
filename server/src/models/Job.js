import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  prompt: { type: String, required: true, trim: true, maxlength: 240 },
  type: { type: String, enum: ["text", "yesno", "choice"], default: "text" },
  required: { type: Boolean, default: true },
  options: [{ type: String, trim: true }]
}, { _id: true });

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  department: { type: String, required: true, trim: true, maxlength: 80 },
  location: { type: String, required: true, trim: true, maxlength: 120 },
  employmentType: { type: String, enum: ["Full time", "Part time", "Contract", "Internship"], default: "Full time" },
  description: { type: String, required: true, trim: true, maxlength: 12000 },
  headcount: { type: Number, min: 1, max: 100, default: 1 },
  status: { type: String, enum: ["draft", "review", "approved", "live", "paused", "closed"], default: "draft" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  coordinator: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  recruiters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  r1Questions: [questionSchema],
  r2Questions: [questionSchema],
  publishedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("Job", jobSchema);

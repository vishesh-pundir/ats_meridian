import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  prompt: { type: String, required: true },
  answer: { type: String, default: "" }
}, { _id: false });

const noteSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  authorName: { type: String, required: true },
  text: { type: String, required: true, maxlength: 2000 }
}, { timestamps: true });

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  resume: {
    storedName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }
  },
  coverLetter: { type: String, maxlength: 4000, default: "" },
  source: { type: String, trim: true, default: "Candidate portal" },
  r1Answers: [answerSchema],
  r2Answers: [answerSchema],
  reviewFeedback: { type: String, maxlength: 4000, default: "" },
  matchScore: { type: Number, min: 0, max: 100, default: null },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  status: { type: String, enum: ["Applied", "Screening", "Interview", "Shortlisted", "Rejected", "Hired"], default: "Applied" },
  notes: [noteSchema],
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);

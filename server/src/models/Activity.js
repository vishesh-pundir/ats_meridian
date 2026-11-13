import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  actorName: { type: String, required: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true, maxlength: 140 },
  subject: { type: String, required: true, maxlength: 180 },
  detail: { type: String, default: "", maxlength: 300 },
  workspace: { type: String, default: "Northstar Studio" }
}, { timestamps: true });

export default mongoose.model("Activity", activitySchema);

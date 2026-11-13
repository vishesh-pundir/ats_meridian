import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["candidate", "employer", "coordinator", "recruiter"], required: true },
  title: { type: String, trim: true, default: "" },
  avatarColor: { type: String, default: "sage" }
}, { timestamps: true });

userSchema.set("toJSON", {
  transform(_document, value) {
    delete value.passwordHash;
    delete value.__v;
    return value;
  }
});

export default mongoose.model("User", userSchema);

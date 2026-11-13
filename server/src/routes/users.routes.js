import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";
import { recordActivity } from "../lib/activity.js";

const router = Router();

router.get("/recruiters", requireAuth, allowRoles("coordinator"), async (_req, res) => {
  const recruiters = await User.find({ role: "recruiter" }).select("name email title avatarColor").sort({ name: 1 });
  res.json({ recruiters });
});

router.get("/team", requireAuth, allowRoles("coordinator"), async (_req, res) => {
  const members = await User.find({ role: { $in: ["employer", "recruiter"] } })
    .select("name email role title avatarColor createdAt").sort({ role: 1, name: 1 });
  res.json({ members });
});

router.post("/team", requireAuth, allowRoles("coordinator"), async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const role = String(req.body.role || "");
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || !["employer", "recruiter"].includes(role)) {
    return res.status(400).json({ message: "Enter a name, valid email, temporary password of 8+ characters, and team role." });
  }
  if (await User.exists({ email })) return res.status(409).json({ message: "An account already exists with that email." });
  const member = await User.create({
    name, email, role, title: String(req.body.title || "").trim(),
    passwordHash: await bcrypt.hash(password, 12),
    avatarColor: role === "recruiter" ? "lavender" : "sage"
  });
  await recordActivity(req.user, "added a team member", member.name, roleNames[role]);
  res.status(201).json({ member });
});

const roleNames = { employer: "Employer", recruiter: "Recruiter" };

export default router;

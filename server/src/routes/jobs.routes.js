import { Router } from "express";
import Job from "../models/Job.js";
import User from "../models/User.js";
import Application from "../models/Application.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";
import { recordActivity } from "../lib/activity.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const query = req.user.role === "candidate" ? { status: "live" } :
    req.user.role === "employer" ? { owner: req.user._id } :
    req.user.role === "recruiter" ? { recruiters: req.user._id } : {};
  const jobs = req.user.role === "candidate" ?
    await Job.find(query).select("-r2Questions -recruiters -owner -coordinator").sort({ createdAt: -1 }).lean() :
    await Job.find(query)
      .populate("owner", "name email")
      .populate("coordinator", "name")
      .populate("recruiters", "name email title avatarColor")
      .sort({ createdAt: -1 }).lean();
  const counts = await Application.aggregate([
    { $match: { job: { $in: jobs.map((job) => job._id) } } },
    { $group: { _id: "$job", applicants: { $sum: 1 }, shortlisted: { $sum: { $cond: [{ $in: ["$status", ["Interview", "Shortlisted", "Offer"]] }, 1, 0] } } } }
  ]);
  const countById = new Map(counts.map((item) => [String(item._id), item]));
  res.json({ jobs: jobs.map((job) => ({ ...job, applicants: countById.get(String(job._id))?.applicants || 0, shortlisted: countById.get(String(job._id))?.shortlisted || 0 })) });
});

router.post("/", requireAuth, allowRoles("employer"), async (req, res) => {
  const { title, department, location, employmentType, description, headcount, r1Questions } = req.body;
  if (!title || !department || !location || !description) return res.status(400).json({ message: "Add a title, department, location, and role description." });
  const job = await Job.create({
    title, department, location, employmentType, description,
    headcount: Number(headcount) || 1,
    owner: req.user._id,
    status: "draft",
    r1Questions: Array.isArray(r1Questions) ? r1Questions.filter((item) => item.prompt?.trim()) : []
  });
  await recordActivity(req.user, "created a role", job.title, "Submitted for coordinator review");
  res.status(201).json({ job });
});

router.patch("/:id", requireAuth, allowRoles("employer"), async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, owner: req.user._id });
  if (!job) return res.status(404).json({ message: "Role not found." });
  if (!["draft", "review"].includes(job.status)) return res.status(409).json({ message: "This role can no longer be edited." });
  const fields = ["title", "department", "location", "employmentType", "description", "headcount", "r1Questions"];
  fields.forEach((field) => { if (req.body[field] !== undefined) job[field] = req.body[field]; });
  job.status = "review";
  await job.save();
  await recordActivity(req.user, "updated a role", job.title, "Ready for coordinator review");
  res.json({ job });
});

router.post("/:id/approve", requireAuth, allowRoles("coordinator"), async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Role not found." });
  if (!["draft", "review", "approved"].includes(job.status)) return res.status(409).json({ message: "This role cannot be approved in its current state." });
  const questions = Array.isArray(req.body.r2Questions) ? req.body.r2Questions.filter((item) => item.prompt?.trim()) : [];
  if (!questions.length) return res.status(400).json({ message: "Add at least one recruiter review question before approving." });
  job.r2Questions = questions;
  job.coordinator = req.user._id;
  job.status = "approved";
  await job.save();
  await recordActivity(req.user, "approved", job.title, "Recruiter review form is ready");
  res.json({ job });
});

router.post("/:id/assign", requireAuth, allowRoles("coordinator"), async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Role not found." });
  const ids = Array.isArray(req.body.recruiterIds) ? req.body.recruiterIds : [];
  const recruiters = await User.find({ _id: { $in: ids }, role: "recruiter" }).select("_id");
  if (!recruiters.length) return res.status(400).json({ message: "Assign at least one recruiter to this role." });
  job.recruiters = recruiters.map((item) => item._id);
  job.coordinator = req.user._id;
  await job.save();
  await recordActivity(req.user, "assigned recruiters to", job.title, recruiters.length + " recruiter(s) assigned");
  res.json({ job: await job.populate("recruiters", "name email title avatarColor") });
});

router.post("/:id/publish", requireAuth, allowRoles("coordinator"), async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Role not found." });
  if (job.status !== "approved" || !job.recruiters.length || !job.r2Questions.length) {
    return res.status(409).json({ message: "Approve the role, add R2 questions, and assign a recruiter before publishing." });
  }
  job.status = "live";
  job.publishedAt = new Date();
  await job.save();
  await recordActivity(req.user, "published", job.title, "Candidates can now apply");
  res.json({ job });
});

router.post("/:id/pause", requireAuth, allowRoles("employer", "coordinator"), async (req, res) => {
  const job = req.user.role === "employer" ?
    await Job.findOne({ _id: req.params.id, owner: req.user._id }) :
    await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Role not found." });
  if (!["live", "paused"].includes(job.status)) return res.status(409).json({ message: "Only a live role can be paused or reopened." });
  job.status = job.status === "live" ? "paused" : "live";
  await job.save();
  await recordActivity(req.user, job.status === "paused" ? "paused" : "reopened", job.title, "Role visibility updated");
  res.json({ job });
});

router.post("/:id/close", requireAuth, allowRoles("employer", "coordinator"), async (req, res) => {
  const job = req.user.role === "employer" ?
    await Job.findOne({ _id: req.params.id, owner: req.user._id }) :
    await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Role not found." });
  if (job.status === "closed") return res.status(409).json({ message: "This role is already closed." });
  job.status = "closed";
  await job.save();
  await recordActivity(req.user, "closed", job.title, "Role is no longer accepting applications");
  res.json({ job });
});

export default router;

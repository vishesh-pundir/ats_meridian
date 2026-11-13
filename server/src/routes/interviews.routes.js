import { Router } from "express";
import Interview from "../models/Interview.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";
import { recordActivity } from "../lib/activity.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  let query = {};
  if (req.user.role === "candidate") query.candidate = req.user._id;
  if (req.user.role === "recruiter") {
    const jobs = await Job.find({ recruiters: req.user._id }).select("_id");
    query = { $or: [{ interviewer: req.user._id }, { job: { $in: jobs.map((job) => job._id) } }] };
  }
  if (req.user.role === "employer") {
    const jobs = await Job.find({ owner: req.user._id }).select("_id");
    query.job = { $in: jobs.map((job) => job._id) };
  }
  const interviews = await Interview.find(query)
    .populate("candidate", "name email title avatarColor")
    .populate("job", "title department")
    .populate("interviewer", "name")
    .populate({ path: "application", select: "status" })
    .sort({ startsAt: 1 });
  res.json({ interviews });
});

router.post("/", requireAuth, allowRoles("recruiter", "coordinator", "employer"), async (req, res) => {
  const application = await Application.findById(req.body.applicationId).populate("job").populate("candidate");
  if (!application) return res.status(404).json({ message: "Application not found." });
  const allowed = req.user.role === "coordinator" ||
    (req.user.role === "employer" && String(application.job.owner) === String(req.user._id)) ||
    (req.user.role === "recruiter" && application.job.recruiters.some((id) => String(id) === String(req.user._id)));
  if (!allowed) return res.status(403).json({ message: "You cannot schedule an interview for this application." });
  const startsAt = new Date(req.body.startsAt);
  if (Number.isNaN(startsAt.valueOf()) || startsAt < new Date()) return res.status(400).json({ message: "Choose a future interview date and time." });
  const interview = await Interview.create({
    application: application._id,
    job: application.job._id,
    candidate: application.candidate._id,
    title: String(req.body.title || "Interview").trim(),
    startsAt,
    durationMinutes: Number(req.body.durationMinutes) || 45,
    format: req.body.format,
    interviewer: req.user._id
  });
  if (application.status === "Shortlisted" || application.status === "Screening") application.status = "Interview";
  await application.save();
  await recordActivity(req.user, "scheduled a conversation with", application.candidate.name, interview.title);
  res.status(201).json({ interview });
});

router.patch("/:id/complete", requireAuth, allowRoles("recruiter", "coordinator", "employer"), async (req, res) => {
  const interview = await Interview.findById(req.params.id).populate("job").populate("candidate");
  if (!interview) return res.status(404).json({ message: "Interview not found." });
  const allowed = req.user.role === "coordinator" ||
    (req.user.role === "employer" && String(interview.job.owner) === String(req.user._id)) ||
    (req.user.role === "recruiter" && (String(interview.interviewer) === String(req.user._id) || interview.job.recruiters.some((id) => String(id) === String(req.user._id))));
  if (!allowed) return res.status(403).json({ message: "You cannot update this interview." });
  interview.status = "Completed";
  interview.feedback = String(req.body.feedback || "").slice(0, 4000);
  await interview.save();
  await recordActivity(req.user, "completed an interview with", interview.candidate.name, interview.title);
  res.json({ interview });
});

export default router;

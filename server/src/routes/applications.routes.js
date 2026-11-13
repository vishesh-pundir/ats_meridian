import { Router } from "express";
import path from "node:path";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";
import { resumeDirectory, resumeUpload } from "../middleware/upload.js";
import { recordActivity } from "../lib/activity.js";

const router = Router();
const stages = ["Applied", "Screening", "Interview", "Shortlisted", "Rejected", "Hired"];

async function findAccessibleApplication(req, res) {
  const application = await Application.findById(req.params.id)
    .populate("job").populate("candidate", "name email title avatarColor").populate("recruiter", "name");
  if (!application) { res.status(404).json({ message: "Application not found." }); return null; }
  const role = req.user.role;
  const allowed = role === "coordinator" ||
    (role === "candidate" && String(application.candidate._id) === String(req.user._id)) ||
    (role === "employer" && String(application.job.owner) === String(req.user._id)) ||
    (role === "recruiter" && application.job.recruiters.some((id) => String(id) === String(req.user._id)));
  if (!allowed) { res.status(403).json({ message: "You do not have access to this application." }); return null; }
  return application;
}

function responseForRole(application, user) {
  const data = application.toObject ? application.toObject() : application;
  if (user.role === "candidate") {
    delete data.r2Answers;
    delete data.reviewFeedback;
    delete data.matchScore;
    delete data.notes;
    delete data.recruiter;
    if (data.job) {
      delete data.job.r2Questions;
      delete data.job.recruiters;
      delete data.job.owner;
    }
  }
  return data;
}

router.get("/", requireAuth, async (req, res) => {
  let applications;
  if (req.user.role === "candidate") {
    applications = await Application.find({ candidate: req.user._id });
  } else if (req.user.role === "employer") {
    const jobs = await Job.find({ owner: req.user._id }).select("_id");
    applications = await Application.find({ job: { $in: jobs.map((job) => job._id) } });
  } else if (req.user.role === "recruiter") {
    const jobs = await Job.find({ recruiters: req.user._id }).select("_id");
    applications = await Application.find({ job: { $in: jobs.map((job) => job._id) } });
  } else {
    applications = await Application.find({});
  }
  await Application.populate(applications, [
    { path: "candidate", select: "name email title avatarColor" },
    { path: "job", select: "title department location status owner recruiters r1Questions r2Questions", populate: [
      { path: "owner", select: "name" }, { path: "recruiters", select: "name" }
    ] },
    { path: "recruiter", select: "name" }
  ]);
  applications.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  res.json({ applications: applications.map((application) => responseForRole(application, req.user)) });
});

router.post("/jobs/:jobId", requireAuth, allowRoles("candidate"), resumeUpload, async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Attach a resume to submit your application." });
  const job = await Job.findOne({ _id: req.params.jobId, status: "live" });
  if (!job) return res.status(404).json({ message: "This role is no longer accepting applications." });
  if (await Application.exists({ job: job._id, candidate: req.user._id })) {
    return res.status(409).json({ message: "You have already applied for this role." });
  }
  let answers = [];
  try { answers = req.body.r1Answers ? JSON.parse(req.body.r1Answers) : []; }
  catch { return res.status(400).json({ message: "The application answers could not be read." }); }
  const byId = new Map(answers.map((answer) => [String(answer.questionId), String(answer.answer || "").trim()]));
  const missingRequired = job.r1Questions.some((question) => question.required && !byId.get(String(question._id)));
  if (missingRequired) return res.status(400).json({ message: "Complete each required screening question." });
  const r1Answers = job.r1Questions.map((question) => ({
    questionId: question._id,
    prompt: question.prompt,
    answer: byId.get(String(question._id)) || ""
  }));
  const application = await Application.create({
    job: job._id, candidate: req.user._id,
    resume: { storedName: req.file.filename, originalName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size },
    coverLetter: String(req.body.coverLetter || "").slice(0, 4000),
    r1Answers, status: "Applied"
  });
  await recordActivity(req.user, "applied for", job.title, "Application submitted");
  res.status(201).json({ application });
});

router.get("/:id", requireAuth, async (req, res) => {
  const application = await findAccessibleApplication(req, res);
  if (application) res.json({ application: responseForRole(application, req.user) });
});

router.get("/:id/resume", requireAuth, async (req, res) => {
  const application = await findAccessibleApplication(req, res);
  if (!application) return;
  const filePath = path.join(resumeDirectory, path.basename(application.resume.storedName));
  res.download(filePath, application.resume.originalName);
});

router.post("/:id/review", requireAuth, allowRoles("recruiter", "coordinator"), async (req, res) => {
  const application = await findAccessibleApplication(req, res);
  if (!application) return;
  const answers = Array.isArray(req.body.r2Answers) ? req.body.r2Answers : [];
  const submitted = new Map(answers.map((answer) => [String(answer.questionId), String(answer.answer || "").trim()]));
  const missing = application.job.r2Questions.some((question) => question.required && !submitted.get(String(question._id)));
  if (missing) return res.status(400).json({ message: "Complete each required recruiter review question." });
  application.r2Answers = application.job.r2Questions.map((question) => ({
    questionId: question._id, prompt: question.prompt, answer: submitted.get(String(question._id)) || ""
  }));
  application.reviewFeedback = String(req.body.feedback || "").slice(0, 4000);
  const score = Number(req.body.matchScore);
  application.matchScore = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : null;
  const recommendation = req.body.recommendation === "shortlist" ? "Shortlisted" : application.status === "Interview" ? "Interview" : "Screening";
  application.status = recommendation;
  application.recruiter = req.user._id;
  await application.save();
  await recordActivity(req.user, recommendation === "Shortlisted" ? "shortlisted" : "reviewed", application.candidate.name, application.job.title);
  res.json({ application });
});

router.patch("/:id/stage", requireAuth, allowRoles("recruiter", "coordinator", "employer"), async (req, res) => {
  const application = await findAccessibleApplication(req, res);
  if (!application) return;
  const nextStage = String(req.body.status || "");
  if (!stages.includes(nextStage)) return res.status(400).json({ message: "Choose a valid application stage." });
  if (req.user.role === "employer" && (!(["Shortlisted", "Interview"].includes(application.status)) || !["Hired", "Rejected"].includes(nextStage))) {
    return res.status(403).json({ message: "Employers can make a final decision on shortlisted candidates." });
  }
  if (req.user.role === "recruiter" && nextStage === "Hired") {
    return res.status(403).json({ message: "Recruiters can recommend candidates; the employer records the final hire decision." });
  }
  application.status = nextStage;
  if (req.user.role === "recruiter") application.recruiter = req.user._id;
  await application.save();
  await recordActivity(req.user, "moved", application.candidate.name, "to " + nextStage + " · " + application.job.title);
  res.json({ application });
});

router.post("/:id/notes", requireAuth, allowRoles("employer", "coordinator", "recruiter"), async (req, res) => {
  const application = await findAccessibleApplication(req, res);
  if (!application) return;
  const text = String(req.body.text || "").trim();
  if (!text) return res.status(400).json({ message: "Write a note before saving." });
  application.notes.push({ author: req.user._id, authorName: req.user.name, text });
  await application.save();
  await recordActivity(req.user, "added a private note for", application.candidate.name, application.job.title);
  res.status(201).json({ application });
});

export default router;

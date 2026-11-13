import { Router } from "express";
import Activity from "../models/Activity.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Interview from "../models/Interview.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const role = req.user.role;
  let jobQuery = role === "employer" ? { owner: req.user._id } :
    role === "recruiter" ? { recruiters: req.user._id } :
    role === "candidate" ? { status: "live" } : {};
  let jobs = await Job.find(jobQuery).select("_id status title");
  const ids = jobs.map((job) => job._id);
  let applicationQuery = role === "candidate" ? { candidate: req.user._id } : { job: { $in: ids } };
  const [applicationCount, shortlistedCount, interviewCount, pendingRoles, recentActivity] = await Promise.all([
    Application.countDocuments(applicationQuery),
    Application.countDocuments({ ...applicationQuery, status: "Shortlisted" }),
    role === "candidate" ? Interview.countDocuments({ candidate: req.user._id, status: "Scheduled" }) :
      Interview.countDocuments({ job: { $in: ids }, status: "Scheduled" }),
    role === "coordinator" ? Job.countDocuments({ status: { $in: ["draft", "review"] } }) : Promise.resolve(0),
    role === "candidate" ? [] : Activity.find({}).sort({ createdAt: -1 }).limit(6).lean()
  ]);
  const openCount = role === "candidate" ? jobs.length : jobs.filter((job) => ["live", "approved", "review", "draft"].includes(job.status)).length;
  res.json({
    metrics: { openRoles: openCount, applications: applicationCount, shortlisted: shortlistedCount, interviews: interviewCount, pendingRoles },
    recentActivity,
    pendingApplications: role === "recruiter" ? await Application.find({ job: { $in: ids }, status: { $in: ["Applied", "Screening"] } }).countDocuments() : 0
  });
});

export default router;

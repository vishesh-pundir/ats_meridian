import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import User from "./models/User.js";
import Job from "./models/Job.js";
import Application from "./models/Application.js";
import Interview from "./models/Interview.js";
import Activity from "./models/Activity.js";
import { resumeDirectory } from "./middleware/upload.js";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../.env") });
await mongoose.connect(process.env.MONGODB_URI);

const demoPassword = "Meridian!2026";
const passwordHash = await bcrypt.hash(demoPassword, 12);
const accounts = [
  { name: "Aarav Mehta", email: "employer@meridian.demo", role: "employer", title: "People & Talent Lead", avatarColor: "sage" },
  { name: "Neha Kapoor", email: "coordinator@meridian.demo", role: "coordinator", title: "Recruiting Coordinator", avatarColor: "blue" },
  { name: "Arjun Malhotra", email: "recruiter@meridian.demo", role: "recruiter", title: "Senior Recruiter", avatarColor: "lavender" },
  { name: "Priya Nair", email: "recruiter2@meridian.demo", role: "recruiter", title: "Talent Partner", avatarColor: "peach" },
  { name: "Ananya Sharma", email: "candidate@meridian.demo", role: "candidate", title: "Product Designer", avatarColor: "mint" },
  { name: "Ishaan Verma", email: "phoenix@meridian.demo", role: "candidate", title: "Product Designer", avatarColor: "peach" },
  { name: "Kavya Iyer", email: "lana@meridian.demo", role: "candidate", title: "Senior Product Designer", avatarColor: "lavender" }
];
const users = {};
for (const account of accounts) {
  const key = account.email.split("@")[0].replace("recruiter2", "recruiterTwo");
  users[key] = await User.findOneAndUpdate({ email: account.email }, { ...account, passwordHash }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });
}

const previousNames = [
  ["Aisha Rahman", users.employer], ["Theo Martin", users.coordinator],
  ["Marcus Chen", users.recruiter], ["Sophie Turner", users.recruiterTwo],
  ["Olivia Rhye", users.candidate], ["Phoenix Baker", users.phoenix], ["Lana Steiner", users.lana]
];
for (const [previousName, user] of previousNames) {
  await Activity.updateMany({ actor: user._id }, { $set: { actorName: user.name } });
  await Activity.updateMany({ subject: previousName }, { $set: { subject: user.name } });
}

const sampleJobs = [
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote · US",
    employmentType: "Full time",
    description: "Shape thoughtful product experiences across our core collaboration tools. Partner with product and engineering from early discovery through launch.",
    headcount: 2,
    status: "live",
    owner: users.employer._id,
    coordinator: users.coordinator._id,
    recruiters: [users.recruiter._id],
    r1Questions: [
      { prompt: "Share a product experience you helped improve and the part you owned.", type: "text", required: true },
      { prompt: "Are you currently authorized to work in the United States?", type: "yesno", required: true }
    ],
    r2Questions: [
      { prompt: "How clearly did the candidate explain their design decisions?", type: "choice", options: ["Very clearly", "Clearly", "Somewhat clearly", "Needs more evidence"], required: true },
      { prompt: "What is one strength you would bring into the debrief?", type: "text", required: true }
    ]
  },
  {
    title: "Senior Software Engineer",
    department: "Engineering",
    location: "New York, NY",
    employmentType: "Full time",
    description: "Build reliable product infrastructure and work closely with a small, collaborative engineering team.",
    headcount: 2,
    status: "review",
    owner: users.employer._id,
    r1Questions: [
      { prompt: "Which part of the stack do you most enjoy working in?", type: "text", required: true },
      { prompt: "Can you work from New York at least two days per week?", type: "yesno", required: true }
    ]
  },
  {
    title: "Marketing Manager",
    department: "Marketing",
    location: "Remote · US",
    employmentType: "Full time",
    description: "Lead the programs and stories that introduce our product to more teams.",
    headcount: 1,
    status: "draft",
    owner: users.employer._id,
    r1Questions: [{ prompt: "What kind of team or product do you do your best work with?", type: "text", required: true }]
  }
];

for (const jobData of sampleJobs) {
  await Job.findOneAndUpdate(
    { title: jobData.title, owner: users.employer._id },
    { ...jobData },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
}

const productRole = await Job.findOne({ title: "Product Designer", owner: users.employer._id });
const sampleResume = async (filename) => {
  const stream = "BT /F1 18 Tf 72 720 Td (Meridian ATS fictional sample resume) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Length " + Buffer.byteLength(stream) + " >>\nstream\n" + stream + "\nendstream"
  ];
  let document = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(document));
    document += (index + 1) + " 0 obj\n" + object + "\nendobj\n";
  });
  const crossReferenceOffset = Buffer.byteLength(document);
  document += "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => { document += String(offset).padStart(10, "0") + " 00000 n \n"; });
  document += "trailer\n<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\nstartxref\n" + crossReferenceOffset + "\n%%EOF";
  const target = path.join(resumeDirectory, filename);
  await fs.writeFile(target, document);
  return { storedName: filename, originalName: filename, mimeType: "application/pdf", size: Buffer.byteLength(document) };
};

const demoApplications = [
  { candidate: users.candidate, status: "Interview", score: 94, resumeFile: "ananya-sharma-demo-resume.pdf", source: "Referral", coverLetter: "I care about thoughtful product craft and would love to help shape the next chapter of Northstar Studio." },
  { candidate: users.phoenix, status: "Screening", score: 88, resumeFile: "ishaan-verma-demo-resume.pdf", source: "LinkedIn", coverLetter: "I enjoy untangling complex workflows and making them feel clear and human." },
  { candidate: users.lana, status: "Shortlisted", score: 96, resumeFile: "kavya-iyer-demo-resume.pdf", source: "Portfolio", coverLetter: "My work sits at the intersection of product strategy, design systems, and close team collaboration." }
];
for (const item of demoApplications) {
  const resume = await sampleResume(item.resumeFile);
  const r1Answers = productRole.r1Questions.map((question, index) => ({
    questionId: question._id,
    prompt: question.prompt,
    answer: index === 0 ? "I led a product redesign from research through launch and built a reusable interaction pattern library." : "Yes"
  }));
  const r2Answers = productRole.r2Questions.map((question, index) => ({
    questionId: question._id,
    prompt: question.prompt,
    answer: index === 0 ? "Very clearly" : "Strong systems thinking and well-evidenced design decisions."
  }));
  const record = await Application.findOneAndUpdate(
    { job: productRole._id, candidate: item.candidate._id },
    { $set: { resume }, $setOnInsert: {
      job: productRole._id, candidate: item.candidate._id, recruiter: users.recruiter._id,
      r1Answers, r2Answers, source: item.source, coverLetter: item.coverLetter,
      reviewFeedback: "Thoughtful portfolio and a clear explanation of the work. Good fit for the next conversation.",
      matchScore: item.score, status: item.status, submittedAt: new Date(Date.now() - (item.status === "Interview" ? 2 : 4) * 86400000)
    } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
  if (item.status === "Interview") {
    await Interview.findOneAndUpdate(
      { application: record._id, title: "Portfolio review" },
      { $setOnInsert: {
        application: record._id, job: productRole._id, candidate: item.candidate._id,
        title: "Portfolio review", startsAt: new Date(Date.now() + 86400000),
        durationMinutes: 45, format: "Video call", interviewer: users.recruiter._id,
        status: "Scheduled"
      } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }
}

for (const filename of ["olivia-rhye-demo-resume.pdf", "phoenix-baker-demo-resume.pdf", "lana-steiner-demo-resume.pdf"]) {
  await fs.unlink(path.join(resumeDirectory, filename)).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}

if (!await Activity.exists({ actor: users.coordinator._id, subject: "Product Designer" })) {
  await Activity.create([
    { actor: users.employer._id, actorName: users.employer.name, actorRole: "employer", action: "created a role", subject: "Senior Software Engineer", detail: "Submitted for coordinator review" },
    { actor: users.coordinator._id, actorName: users.coordinator.name, actorRole: "coordinator", action: "published", subject: "Product Designer", detail: "Candidates can now apply" },
    { actor: users.recruiter._id, actorName: users.recruiter.name, actorRole: "recruiter", action: "shortlisted", subject: users.lana.name, detail: "Product Designer" }
  ]);
}

console.log("Demo workspace is ready.");
console.log("Demo password for all accounts: " + demoPassword);
console.log("Employer: employer@meridian.demo");
console.log("Coordinator: coordinator@meridian.demo");
console.log("Recruiter: recruiter@meridian.demo");
console.log("Second recruiter: recruiter2@meridian.demo");
console.log("Candidate: candidate@meridian.demo");
await mongoose.disconnect();

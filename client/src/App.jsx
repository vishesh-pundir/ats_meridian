import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight, ArrowUpRight, BarChart3, Bell, Briefcase, Building2, CalendarDays,
  Check, CheckCircle2, ChevronDown, CircleHelp, ClipboardCheck, Clock3, Download, FileText,
  Filter, LayoutDashboard, LogOut, MapPin, Menu, MessageSquare, MoreHorizontal,
  Pause, Pencil, Play, Plus, Search, Send, ShieldCheck, Sparkles, Upload, UserRound,
  UsersRound, X
} from "lucide-react";
import { api, downloadCsv } from "./api.js";

const roleNames = {
  employer: "Employer",
  coordinator: "Coordinator",
  recruiter: "Recruiter",
  candidate: "Candidate"
};

const roleNav = {
  candidate: [
    ["overview", "Overview", LayoutDashboard],
    ["jobs", "Explore roles", Briefcase],
    ["applications", "My applications", FileText],
    ["interviews", "Interviews", CalendarDays]
  ],
  employer: [
    ["overview", "Overview", LayoutDashboard],
    ["jobs", "Open roles", Briefcase],
    ["applications", "Candidates", UsersRound],
    ["interviews", "Interviews", CalendarDays],
    ["reports", "Team insights", BarChart3]
  ],
  coordinator: [
    ["overview", "Overview", LayoutDashboard],
    ["jobs", "Role approvals", Briefcase],
    ["applications", "Candidates", UsersRound],
    ["interviews", "Interviews", CalendarDays],
    ["reports", "Team insights", BarChart3],
    ["team", "Team access", ShieldCheck]
  ],
  recruiter: [
    ["overview", "Overview", LayoutDashboard],
    ["jobs", "My roles", Briefcase],
    ["applications", "Candidates", UsersRound],
    ["interviews", "Interviews", CalendarDays],
    ["reports", "Team insights", BarChart3]
  ]
};

const pageNames = {
  overview: "Overview", jobs: "Roles", applications: "Candidates",
  interviews: "Interviews", reports: "Team insights"
};

const stages = ["Applied", "Screening", "Interview", "Shortlisted", "Rejected", "Hired"];
const demoAccounts = [
  ["employer@meridian.demo", "Employer"],
  ["coordinator@meridian.demo", "Coordinator"],
  ["recruiter@meridian.demo", "Recruiter"],
  ["recruiter2@meridian.demo", "Recruiter 2"],
  ["candidate@meridian.demo", "Candidate"]
];

function slug(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "-");
}

function initials(person) {
  return String(person?.name || "?").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function dateLabel(value, options = { month: "short", day: "numeric" }) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : new Intl.DateTimeFormat("en-US", options).format(date);
}

function timeLabel(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function Avatar({ person, large = false }) {
  return <span className={"avatar avatar-" + slug(person?.avatarColor || "sage") + (large ? " avatar-large" : "")}>{initials(person)}</span>;
}

function StatusBadge({ status }) {
  const labels = { live: "Hiring", draft: "Draft", review: "In review", approved: "Ready to publish", paused: "Paused", closed: "Closed" };
  return <span className={"status-badge status-" + slug(status)}><i />{labels[status] || status}</span>;
}

function StageBadge({ status }) {
  return <span className={"stage-badge stage-" + slug(status)}><i />{status || "Applied"}</span>;
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading">
    <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
    {action && <div className="heading-actions">{action}</div>}
  </div>;
}

function Button({ children, kind = "secondary", onClick, type = "button", disabled, className = "", title }) {
  return <button className={"button button-" + kind + " " + className} type={type} onClick={onClick} disabled={disabled} title={title}>{children}</button>;
}

function useToast() {
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);
  return [toast, setToast];
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api("/auth/" + (mode === "login" ? "login" : "register"), {
        method: "POST",
        body: mode === "login" ? { email, password } : { name, email, password }
      });
      onAuth(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-screen">
    <section className="auth-story">
      <a className="auth-brand" href="#"><img src="/brand-mark.svg" alt="" /><strong>meridian<span>.</span></strong></a>
      <div className="auth-story-copy">
        <span className="eyebrow">A MORE HUMAN WAY TO HIRE</span>
        <h1>Good work starts<br />with good people.</h1>
        <p>A considered hiring workspace for the conversations and decisions that move your team forward.</p>
      </div>
      <div className="auth-art" aria-hidden="true"><div className="auth-art-sun">✳</div><i /><i /><i /><span>thoughtful by design</span></div>
      <div className="auth-story-foot"><span>Northstar Studio</span><span>Made for better work, together</span></div>
    </section>
    <section className="auth-panel">
      <div className="auth-form-wrap">
        <span className="eyebrow">{mode === "login" ? "WELCOME BACK" : "START YOUR SEARCH"}</span>
        <h2>{mode === "login" ? "Sign in to Meridian" : "Create your candidate account"}</h2>
        <p className="auth-subtitle">{mode === "login" ? "Your team’s next great conversation is waiting." : "A clear, thoughtful way to keep track of your applications."}</p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={submit} className="auth-form">
          {mode === "register" && <label className="field">Full name<input required minLength="2" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoComplete="name" /></label>}
          <label className="field">Work email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" /></label>
          <label className="field">Password<input required minLength="8" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
          {mode === "login" && <div className="auth-form-note"><ShieldCheck size={14} /> Secure access for your hiring workspace</div>}
          <Button kind="primary" type="submit" disabled={busy} className="auth-submit">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"} <ArrowRight size={15} /></Button>
        </form>
        <div className="auth-toggle">{mode === "login" ? "Looking for a role?" : "Already have an account?"} <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}> {mode === "login" ? "Create a candidate account" : "Sign in"}</button></div>
        {mode === "login" && <div className="demo-access">
          <div className="demo-heading"><span>EXPLORE THE WORKSPACE</span><small>Demo access</small></div>
          <div className="demo-grid">{demoAccounts.map(([account, label]) => <button key={account} onClick={() => { setEmail(account); setPassword("Meridian!2026"); }}><span>{label}</span><ArrowUpRight size={13} /></button>)}</div>
          <p>Demo password for each account: <strong>Meridian!2026</strong></p>
        </div>}
      </div>
      <span className="auth-copyright">MERIDIAN TALENT WORKSPACE · 2026</span>
    </section>
  </main>;
}

function MetricCard({ icon: Icon, label, value, detail, tone = "sage" }) {
  return <article className="metric-card">
    <div className="metric-top"><span>{label}</span><span className={"metric-icon tone-" + tone}><Icon size={15} strokeWidth={1.8} /></span></div>
    <strong className="metric-value">{value}</strong><span className="metric-detail">{detail}</span>
  </article>;
}

function ApplicationTable({ applications, onOpen, showEmail = false }) {
  if (!applications.length) return <div className="empty-state"><span className="empty-state-icon"><UsersRound size={20} /></span><strong>No applications yet</strong><p>New candidates will show here as they move through the process.</p></div>;
  return <div className="table-scroll"><table className="candidate-table">
    <thead><tr><th>Candidate</th><th>Role</th><th>Stage</th><th>Recruiter</th><th>Applied</th><th /></tr></thead>
    <tbody>{applications.map((application) => <tr key={application._id} onClick={() => onOpen(application)} tabIndex="0" onKeyDown={(event) => event.key === "Enter" && onOpen(application)}>
      <td><div className="table-person"><Avatar person={application.candidate} /><span><strong>{application.candidate?.name}</strong><small>{showEmail ? application.candidate?.email : application.candidate?.title || "Candidate"}</small></span></div></td>
      <td>{application.job?.title || "—"}</td>
      <td><StageBadge status={application.status} /></td>
      <td>{application.recruiter?.name || <span className="muted">Unassigned</span>}</td>
      <td>{dateLabel(application.submittedAt)}</td>
      <td><button className="row-arrow" aria-label={"Open " + application.candidate?.name}><ArrowUpRight size={15} /></button></td>
    </tr>)}</tbody>
  </table></div>;
}

function JobCard({ job, role, applied, onApply, onOpen, onPause, onCloseRole, onPublish, onPrepare, onEdit }) {
  const isCandidate = role === "candidate";
  return <article className="job-card">
    <div className="job-card-top">
      <span className={"department-icon dept-" + slug(job.department)}><Building2 size={17} /></span>
      {!isCandidate && <button className="icon-plain" title="More role actions" onClick={() => role === "employer" ? onEdit(job) : onOpen(job)}><MoreHorizontal size={18} /></button>}
    </div>
    <div className="job-status-row"><StatusBadge status={job.status} /><span className="job-date">{dateLabel(job.createdAt)}</span></div>
    <h3>{job.title}</h3>
    <p className="job-meta">{job.department}<span>·</span>{job.location}</p>
    {job.description && <p className="job-description">{job.description}</p>}
    <div className="job-stats">
      <div><strong>{job.applicants || 0}</strong><span>Applicants</span></div>
      <div><strong>{job.shortlisted || 0}</strong><span>In review</span></div>
      <div><strong>{job.headcount || 1}</strong><span>Headcount</span></div>
    </div>
    {!!job.recruiters?.length && <div className="assigned-recruiters"><UsersRound size={13} /><span>{job.recruiters.map((person) => person.name).join(", ")}</span></div>}
    <div className="job-card-foot">
      {isCandidate ? <Button kind={applied ? "subtle" : "primary"} disabled={applied} onClick={() => onApply(job)}>{applied ? "Application sent" : "View role & apply"} {!applied && <ArrowRight size={14} />}</Button> :
        role === "coordinator" ? <>
          {["draft", "review", "approved"].includes(job.status) && <Button onClick={() => onPrepare(job)}><Pencil size={13} /> Review & assign</Button>}
          {job.status === "approved" && <Button kind="primary" onClick={() => onPublish(job)}><Send size={13} /> Publish role</Button>}
          {job.status === "live" && <span className="small-muted"><CheckCircle2 size={13} /> Candidate-ready</span>}
        </> :
        role === "employer" ? <>
          {["draft", "review"].includes(job.status) && <Button onClick={() => onEdit(job)}><Pencil size={13} /> Edit role</Button>}
          {["live", "paused"].includes(job.status) && <Button onClick={() => onPause(job)}>{job.status === "live" ? <><Pause size={13} /> Pause role</> : <><Play size={13} /> Reopen role</>}</Button>}
          {job.status !== "closed" && <Button kind="subtle" onClick={() => onCloseRole(job)}>Close role</Button>}
        </> : <Button onClick={() => onOpen(job)}>View pipeline <ArrowRight size={14} /></Button>}
    </div>
  </article>;
}

function ApplicationDrawer({ application, user, onClose, onRefresh, notify, onSchedule }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const job = application.job || {};
  const candidate = application.candidate || {};
  const canReview = user.role === "recruiter" || user.role === "coordinator";
  const canDecide = user.role === "coordinator";
  const canEmployerDecide = user.role === "employer" && ["Shortlisted", "Interview"].includes(application.status);
  const canNote = ["recruiter", "coordinator", "employer"].includes(user.role);
  const r2Answers = new Map((application.r2Answers || []).map((answer) => [String(answer.questionId), answer.answer]));

  async function saveReview(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const answers = (job.r2Questions || []).map((question) => ({
      questionId: question._id,
      answer: String(form.get("r2-" + question._id) || "")
    }));
    setBusy(true); setError("");
    try {
      await api("/applications/" + application._id + "/review", {
        method: "POST",
        body: { r2Answers: answers, feedback: form.get("feedback"), matchScore: form.get("matchScore"), recommendation: form.get("recommendation") }
      });
      notify("Recruiter review saved.");
      await onRefresh();
      onClose();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  async function changeStage(status) {
    setBusy(true); setError("");
    try {
      await api("/applications/" + application._id + "/stage", { method: "PATCH", body: { status } });
      notify("Candidate moved to " + status + ".");
      await onRefresh();
      onClose();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  async function addNote(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      await api("/applications/" + application._id + "/notes", { method: "POST", body: { text: form.get("text") } });
      notify("Private team note added.");
      await onRefresh();
      onClose();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  const canSeeResume = user.role !== "candidate" || String(candidate._id) === String(user._id);
  return <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="candidate-drawer" role="dialog" aria-modal="true" aria-labelledby="candidate-name">
      <div className="drawer-header"><span className="eyebrow">APPLICATION PROFILE</span><button className="round-close" onClick={onClose} aria-label="Close"><X size={17} /></button></div>
      <div className="profile-heading"><Avatar person={candidate} large /><div><StageBadge status={application.status} /><h2 id="candidate-name">{candidate.name}</h2><p>{candidate.title || "Candidate"}{candidate.email ? " · " + candidate.email : ""}</p></div></div>
      <div className="profile-meta"><span><Briefcase size={14} />{job.title}</span><span><MapPin size={14} />{job.location}</span><span><Clock3 size={14} />Applied {dateLabel(application.submittedAt)}</span></div>
      {canSeeResume && <a className="resume-link" href={"/api/applications/" + application._id + "/resume"} target="_blank" rel="noreferrer"><FileText size={16} /><span><strong>{application.resume?.originalName || "Resume"}</strong><small>Securely stored · {application.resume?.size ? Math.max(1, Math.round(application.resume.size / 1024)) + " KB" : "Attached"}</small></span><Download size={15} /></a>}
      {!!application.coverLetter && <section className="profile-section"><div className="panel-title-sm">Cover letter</div><p className="profile-text">{application.coverLetter}</p></section>}
      {!!application.r1Answers?.length && <section className="profile-section"><div className="panel-title-sm">Candidate screening · R1</div><div className="answer-list">{application.r1Answers.map((answer, index) => <div key={String(answer.questionId || index)}><small>{answer.prompt}</small><p>{answer.answer || "No answer provided"}</p></div>)}</div></section>}
      {canReview && <section className="profile-section review-section"><div className="panel-title-sm">Recruiter review · R2</div>
        <form onSubmit={saveReview}>
          {(job.r2Questions || []).map((question) => <QuestionField key={question._id} question={question} name={"r2-" + question._id} defaultValue={r2Answers.get(String(question._id)) || ""} />)}
          <label className="field">Match score <span className="field-help">A consistent, job-related assessment</span><div className="score-input"><input type="range" name="matchScore" min="0" max="100" defaultValue={application.matchScore || 75} /><strong>{application.matchScore || 75}%</strong></div></label>
          <label className="field">Recruiter feedback<textarea name="feedback" rows="3" defaultValue={application.reviewFeedback || ""} placeholder="Share evidence and context for the hiring team." /></label>
          <label className="field">Recommendation<select name="recommendation" defaultValue={application.status === "Shortlisted" ? "shortlist" : "continue"}><option value="continue">Continue in process</option><option value="shortlist">Shortlist for the next stage</option></select></label>
          {error && <div className="form-error">{error}</div>}
          <Button kind="primary" type="submit" disabled={busy} className="full-button"><Check size={15} /> {busy ? "Saving…" : "Save recruiter review"}</Button>
        </form>
      </section>}
      {!canReview && !!application.r2Answers?.length && <section className="profile-section"><div className="panel-title-sm">Recruiter review · R2</div><div className="answer-list">{application.r2Answers.map((answer, index) => <div key={String(answer.questionId || index)}><small>{answer.prompt}</small><p>{answer.answer || "No answer provided"}</p></div>)}</div>{application.reviewFeedback && <p className="profile-text">{application.reviewFeedback}</p>}</section>}
      {canNote && <section className="profile-section"><div className="panel-title-row"><div><div className="panel-title-sm">Private team notes</div><small>Only your hiring team can see these.</small></div><MessageSquare size={15} /></div>
        <div className="note-list">{(application.notes || []).slice().reverse().map((note) => <div className="note-entry" key={note._id}><Avatar person={{ name: note.authorName, avatarColor: "sage" }} /><div><p>{note.text}</p><small>{note.authorName} · {dateLabel(note.createdAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</small></div></div>)}</div>
        <form className="note-form" onSubmit={addNote}><textarea name="text" rows="2" required placeholder="Add a thoughtful note…" /><Button kind="primary" type="submit" disabled={busy} title="Add note"><Send size={14} /></Button></form>
      </section>}
      {(canDecide || canEmployerDecide) && <section className="profile-section"><div className="panel-title-sm">Hiring decision</div><div className="decision-buttons">
        {canDecide && <><Button onClick={() => changeStage("Interview")} disabled={busy}>Move to interview</Button><Button kind="primary" onClick={() => changeStage("Shortlisted")} disabled={busy}>Shortlist</Button></>}
        {canEmployerDecide && <><Button onClick={() => changeStage("Rejected")} disabled={busy}>Decline</Button><Button kind="primary" onClick={() => changeStage("Hired")} disabled={busy}>Mark hired <Check size={14} /></Button></>}
      </div></section>}
      {user.role !== "candidate" && <div className="drawer-actions"><Button onClick={() => onSchedule(application)}><CalendarDays size={14} /> Schedule interview</Button><label className="stage-select-label">Move stage<select value={application.status} onChange={(event) => changeStage(event.target.value)} disabled={busy || user.role === "employer"}>{stages.filter((stage) => user.role !== "recruiter" || stage !== "Hired").map((stage) => <option key={stage}>{stage}</option>)}</select></label></div>}
      {error && !canReview && <div className="form-error">{error}</div>}
    </aside>
  </div>;
}

function QuestionField({ question, name, defaultValue = "" }) {
  const required = question.required !== false;
  if (question.type === "yesno") return <label className="field">{question.prompt}{required && <span className="required">*</span>}<select name={name} required={required} defaultValue={defaultValue}><option value="">Choose an answer</option><option>Yes</option><option>No</option></select></label>;
  if (question.type === "choice") return <label className="field">{question.prompt}{required && <span className="required">*</span>}<select name={name} required={required} defaultValue={defaultValue}><option value="">Choose an answer</option>{(question.options || []).map((option) => <option key={option}>{option}</option>)}</select></label>;
  return <label className="field">{question.prompt}{required && <span className="required">*</span>}<textarea name={name} rows="2" required={required} defaultValue={defaultValue} placeholder="Add your response…" /></label>;
}

function MeridianApp() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState("overview");
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [activity, setActivity] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("All stages");
  const [modal, setModal] = useState(null);
  const [notice, notify] = useToast();
  const [pageError, setPageError] = useState("");
  const [modalError, setModalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setPageError("");
    try {
      const [jobsResult, applicationsResult, interviewsResult, dashboardResult] = await Promise.all([
        api("/jobs"), api("/applications"), api("/interviews"), api("/dashboard")
      ]);
      setJobs(jobsResult.jobs || []);
      setApplications(applicationsResult.applications || []);
      setInterviews(interviewsResult.interviews || []);
      setMetrics(dashboardResult.metrics || {});
      setActivity(dashboardResult.recentActivity || []);
      if (user.role === "coordinator") {
        const [usersResult, teamResult] = await Promise.all([api("/users/recruiters"), api("/users/team")]);
        setRecruiters(usersResult.recruiters || []);
        setTeamMembers(teamResult.members || []);
      }
    } catch (error) {
      setPageError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    api("/auth/me").then((result) => setUser(result.user)).catch(() => setUser(null)).finally(() => setReady(true));
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);
  useEffect(() => { setModalError(""); }, [modal?.kind]);

  const appliedJobIds = useMemo(() => new Set(applications.map((item) => String(item.job?._id))), [applications]);
  const filteredApplications = useMemo(() => applications.filter((item) => {
    const matchesStage = stageFilter === "All stages" || item.status === stageFilter;
    const target = [item.candidate?.name, item.candidate?.email, item.candidate?.title, item.job?.title, item.job?.department].join(" ").toLowerCase();
    return matchesStage && (!query || target.includes(query.toLowerCase()));
  }), [applications, stageFilter, query]);
  const filteredJobs = useMemo(() => jobs.filter((job) => !query || [job.title, job.department, job.location, job.description].join(" ").toLowerCase().includes(query.toLowerCase())), [jobs, query]);

  async function signOut() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null); setJobs([]); setApplications([]); setInterviews([]); setPage("overview");
    notify("You have signed out.");
  }

  function openApplication(application) { setModal({ kind: "application", application }); }

  async function publishJob(job) {
    try {
      await api("/jobs/" + job._id + "/publish", { method: "POST", body: {} });
      notify(job.title + " is now open for applications.");
      await loadData();
    } catch (error) { setPageError(error.message); }
  }

  async function pauseJob(job) {
    try {
      await api("/jobs/" + job._id + "/pause", { method: "POST", body: {} });
      notify(job.status === "live" ? "Role paused." : "Role reopened.");
      await loadData();
    } catch (error) { setPageError(error.message); }
  }

  async function closeJob(job) {
    if (!window.confirm("Close " + job.title + "? Candidates will no longer be able to apply.")) return;
    try {
      await api("/jobs/" + job._id + "/close", { method: "POST", body: {} });
      notify("Role closed. Existing applications are still available to your team.");
      await loadData();
    } catch (error) { setPageError(error.message); }
  }

  async function completeInterview(interview) {
    const feedback = window.prompt("Add a short interview note for the hiring team (optional):", "");
    if (feedback === null) return;
    try {
      await api("/interviews/" + interview._id + "/complete", { method: "PATCH", body: { feedback } });
      notify("Interview marked complete.");
      await loadData();
    } catch (error) { setPageError(error.message); }
  }

  function openSchedule(application) {
    setModal({ kind: "schedule", application });
  }

  async function handleJobSubmit(event, editJob) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parseQuestions = (value) => String(value || "").split("\n").map((prompt) => prompt.trim()).filter(Boolean).map((prompt) => ({ prompt, type: "text", required: true }));
    const body = {
      title: String(form.get("title")).trim(),
      department: String(form.get("department")).trim(),
      location: String(form.get("location")).trim(),
      employmentType: String(form.get("employmentType")),
      description: String(form.get("description")).trim(),
      headcount: Number(form.get("headcount")) || 1,
      r1Questions: parseQuestions(form.get("r1Questions"))
    };
    try {
      if (editJob) await api("/jobs/" + editJob._id, { method: "PATCH", body });
      else await api("/jobs", { method: "POST", body });
      setModal(null);
      notify(editJob ? "Role details updated." : "Role added to coordinator review.");
      await loadData();
    } catch (error) { setModalError(error.message); }
  }

  async function handlePrepareJob(event, job) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const r2Questions = String(form.get("r2Questions") || "").split("\n").map((prompt) => prompt.trim()).filter(Boolean).map((prompt) => ({ prompt, type: "text", required: true }));
    const recruiterIds = form.getAll("recruiterIds").map(String);
    if (!r2Questions.length) { setModalError("Add at least one recruiter review question."); return; }
    if (!recruiterIds.length) { setModalError("Assign at least one recruiter to continue."); return; }
    try {
      await api("/jobs/" + job._id + "/approve", { method: "POST", body: { r2Questions } });
      await api("/jobs/" + job._id + "/assign", { method: "POST", body: { recruiterIds } });
      setModal(null);
      notify("Role approved and recruiter assignment saved. Publish it when ready.");
      await loadData();
    } catch (error) { setModalError(error.message); }
  }

  async function handleApplicationSubmit(event, job) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const r1Answers = (job.r1Questions || []).map((question) => ({
      questionId: question._id,
      answer: String(form.get("r1-" + question._id) || "")
    }));
    const payload = new FormData();
    payload.set("resume", form.get("resume"));
    payload.set("coverLetter", String(form.get("coverLetter") || ""));
    payload.set("r1Answers", JSON.stringify(r1Answers));
    try {
      await api("/applications/jobs/" + job._id, { method: "POST", body: payload });
      setModal(null);
      notify("Your application has been sent. You can follow its progress in My applications.");
      await loadData();
      setPage("applications");
    } catch (error) { setModalError(error.message); }
  }

  async function handleScheduleSubmit(event, selectedApplication) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const applicationId = selectedApplication?._id || String(form.get("applicationId"));
    const startsAt = new Date(String(form.get("startsAt"))).toISOString();
    try {
      await api("/interviews", {
        method: "POST",
        body: { applicationId, title: form.get("title"), startsAt, durationMinutes: Number(form.get("durationMinutes")), format: form.get("format") }
      });
      setModal(null);
      notify("The conversation has been added to the interview calendar.");
      await loadData();
    } catch (error) { setModalError(error.message); }
  }

  async function handleTeamSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/users/team", {
        method: "POST",
        body: { name: form.get("name"), email: form.get("email"), role: form.get("role"), title: form.get("title"), password: form.get("password") }
      });
      setModal(null);
      notify("Team account created. Share its temporary password with the teammate.");
      await loadData();
    } catch (error) { setModalError(error.message); }
  }

  if (!ready) return <div className="boot-screen"><img src="/brand-mark.svg" alt="" /><span>Opening your workspace…</span></div>;
  if (!user) return <AuthScreen onAuth={(nextUser) => { setUser(nextUser); setPage("overview"); }} />;

  const nav = roleNav[user.role] || roleNav.candidate;
  const currentPage = nav.find((item) => item[0] === page)?.[1] || pageNames[page] || "Overview";
  const visibleApplications = user.role === "employer" ? filteredApplications.filter((item) => ["Interview", "Shortlisted", "Hired"].includes(item.status)) : filteredApplications;

  let content;
  if (page === "overview") content = <Overview user={user} jobs={jobs} applications={applications} interviews={interviews} metrics={metrics} activity={activity} onPage={setPage} onOpen={openApplication} loading={loading} />;
  else if (page === "jobs") content = <JobsPage user={user} jobs={filteredJobs} applications={applications} recruiters={recruiters} appliedJobIds={appliedJobIds} onCreate={() => setModal({ kind: "job" })} onEdit={(job) => setModal({ kind: "job", job })} onPrepare={(job) => setModal({ kind: "prepare", job })} onPublish={publishJob} onPause={pauseJob} onCloseRole={closeJob} onApply={(job) => setModal({ kind: "apply", job })} onOpen={(job) => setPage("applications")} />;
  else if (page === "applications") content = <ApplicationsPage user={user} applications={visibleApplications} query={query} setQuery={setQuery} stageFilter={stageFilter} setStageFilter={setStageFilter} onOpen={openApplication} onExport={() => downloadCsv("meridian-candidate-pipeline.csv", [["Candidate", "Email", "Role", "Stage", "Recruiter", "Applied"], ...visibleApplications.map((item) => [item.candidate?.name, item.candidate?.email, item.job?.title, item.status, item.recruiter?.name, dateLabel(item.submittedAt)])])} onBrowse={() => setPage("jobs")} onRefresh={loadData} />;
  else if (page === "interviews") content = <InterviewsPage user={user} interviews={interviews} applications={applications} onSchedule={(application) => openSchedule(application)} onComplete={completeInterview} />;
  else if (page === "team" && user.role === "coordinator") content = <TeamPage members={teamMembers} onCreate={() => setModal({ kind: "team" })} />;
  else content = <ReportsPage user={user} jobs={jobs} applications={applications} interviews={interviews} onExport={() => downloadCsv("meridian-hiring-report.csv", [["Role", "Department", "Status", "Applicants", "Shortlisted"], ...jobs.map((job) => [job.title, job.department, job.status, job.applicants || 0, job.shortlisted || 0])])} />;

  return <div className="app-shell">
    <aside className={"sidebar " + (sidebarOpen ? "sidebar-open" : "")}>
      <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage("overview"); }}><img src="/brand-mark.svg" alt="" /><span className="brand-name">meridian<span className="brand-period">.</span></span></a>
      <button className="workspace-switcher"><span className="workspace-avatar">N</span><span className="workspace-copy"><small>WORKSPACE</small><strong>Northstar Studio</strong></span><ChevronDown size={14} /></button>
      <div className="nav-label">WORKSPACE</div>
      <nav className="main-nav">{nav.map(([key, label, Icon]) => <button key={key} className={"nav-item " + (page === key ? "is-active" : "")} onClick={() => { setPage(key); setQuery(""); setStageFilter("All stages"); setSidebarOpen(false); }}><Icon size={17} strokeWidth={1.7} /><span>{label}</span>{key === "applications" && <small>{user.role === "candidate" ? applications.length : applications.filter((item) => ["Applied", "Screening"].includes(item.status)).length}</small>}</button>)}</nav>
      {user.role !== "candidate" && <><div className="nav-label nav-spacer-label">QUICK FILTERS</div><div className="shortcut-list"><button onClick={() => { setPage("applications"); setStageFilter("Shortlisted"); }}> <span className="shortcut-dot dot-lilac" />Shortlisted</button><button onClick={() => { setPage("applications"); setStageFilter("Applied"); }}><span className="shortcut-dot dot-mint" />New applications</button></div></>}
      <div className="sidebar-spacer" />
      <div className="sidebar-note"><div className="note-icon"><Sparkles size={14} /></div><strong>Hiring, with intention.</strong><p>Thoughtful steps help your team and candidates do their best work.</p><button onClick={() => setPage("reports")}>Explore team insights <ArrowUpRight size={12} /></button></div>
      <button className="profile-card" onClick={signOut}><Avatar person={user} /><span className="profile-copy"><strong>{user.name}</strong><small>{roleNames[user.role]}</small></span><LogOut size={15} /></button>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={18} /></button>
        <div className="breadcrumb"><span>Northstar Studio</span><span className="crumb-separator">/</span><strong>{currentPage}</strong></div>
        <div className="topbar-actions">
          <label className="global-search"><Search size={15} /><input value={query} onChange={(event) => { setQuery(event.target.value); if (page !== "applications" && page !== "jobs") setPage(user.role === "candidate" ? "jobs" : "applications"); }} placeholder={user.role === "candidate" ? "Search open roles…" : "Search candidates or roles…"} aria-label="Search workspace" /><kbd>⌘ K</kbd></label>
          <button className="icon-button notification-button" aria-label="Notifications" onClick={() => notify("You are all caught up on team notifications.")}><Bell size={17} /><i /></button>
          <button className="help-button" onClick={() => notify("Choose a role from the demo sign-in screen to explore each workflow.")}><CircleHelp size={15} /> Help center</button>
        </div>
      </header>
      <div className="page-content">
        {pageError && <div className="page-alert"><span>{pageError}</span><button onClick={() => setPageError("")}><X size={15} /></button></div>}
        {content}
        <footer className="workspace-footer"><span>Meridian Talent Workspace</span><span>Thoughtful hiring, by design</span></footer>
      </div>
    </main>
    {modal?.kind === "application" && <ApplicationDrawer application={modal.application} user={user} onClose={() => setModal(null)} onRefresh={loadData} notify={notify} onSchedule={openSchedule} />}
    {modal?.kind === "job" && <Modal title={modal.job ? "Edit role details" : "Create a role"} subtitle={modal.job ? "Keep the role brief clear and up to date." : "Add a new position to your hiring workspace."} error={modalError} onClose={() => setModal(null)}>
      <form className="modal-form" onSubmit={(event) => handleJobSubmit(event, modal.job)}>
        <div className="form-grid">
          <label className="field field-wide">Role title<input name="title" required defaultValue={modal.job?.title || ""} placeholder="e.g. Senior Product Designer" /></label>
          <label className="field">Department<input name="department" required defaultValue={modal.job?.department || ""} placeholder="e.g. Product" /></label>
          <label className="field">Location<input name="location" required defaultValue={modal.job?.location || ""} placeholder="Remote · US" /></label>
          <label className="field">Employment type<select name="employmentType" defaultValue={modal.job?.employmentType || "Full time"}><option>Full time</option><option>Part time</option><option>Contract</option><option>Internship</option></select></label>
          <label className="field">Headcount<input name="headcount" type="number" min="1" max="100" defaultValue={modal.job?.headcount || 1} required /></label>
          <label className="field field-wide">Role description<textarea name="description" rows="4" defaultValue={modal.job?.description || ""} required placeholder="What will this person work on? What will success look like?" /></label>
          <label className="field field-wide">Candidate screening questions · R1<span className="field-help">One question per line. Candidates answer these when applying.</span><textarea name="r1Questions" rows="3" defaultValue={(modal.job?.r1Questions || []).map((question) => question.prompt).join("\n")} placeholder={"What product experience are you most proud of?\nAre you authorized to work in the listed location?"} /></label>
        </div>
        <ModalActions onCancel={() => setModal(null)} submit={modal.job ? "Save role" : "Submit for review"} />
      </form>
    </Modal>}
    {modal?.kind === "prepare" && <Modal title="Review & assign" subtitle={"Prepare the recruiter screen for " + modal.job.title + ". The role will be ready to publish after you save the review form and recruiter assignment."} error={modalError} onClose={() => setModal(null)}>
      <form className="modal-form" onSubmit={(event) => handlePrepareJob(event, modal.job)}>
        <label className="field">Recruiter review questions · R2<span className="field-help">One question per line. Recruiters answer these before making a recommendation.</span><textarea name="r2Questions" rows="4" defaultValue={(modal.job.r2Questions || []).map((question) => question.prompt).join("\n")} placeholder={"What evidence supports the candidate's experience?\nWhat would you like the hiring team to explore next?"} required /></label>
        <div className="field"><span>Assign recruiters<span className="required">*</span></span><div className="recruiter-check-list">{recruiters.map((recruiter) => <label key={recruiter._id} className="recruiter-check"><input type="checkbox" name="recruiterIds" value={recruiter._id} defaultChecked={(modal.job.recruiters || []).some((item) => String(item._id || item) === recruiter._id)} /><Avatar person={recruiter} /><span><strong>{recruiter.name}</strong><small>{recruiter.title || "Recruiter"}</small></span></label>)}</div>{!recruiters.length && <div className="inline-hint">No recruiter accounts found. Create recruiter accounts with the demo seed command.</div>}</div>
        <ModalActions onCancel={() => setModal(null)} submit="Approve & assign" />
      </form>
    </Modal>}
    {modal?.kind === "apply" && <Modal title={"Apply for " + modal.job.title} subtitle="Share your experience and a resume. Your application stays private to the hiring team." error={modalError} onClose={() => setModal(null)}>
      <form className="modal-form" onSubmit={(event) => handleApplicationSubmit(event, modal.job)}>
        <label className="upload-field"><Upload size={18} /><strong>Attach your resume</strong><span>PDF, DOC, or DOCX · up to 8 MB</span><input name="resume" type="file" accept=".pdf,.doc,.docx" required /></label>
        <label className="field">A note for the hiring team<textarea name="coverLetter" rows="3" maxLength="4000" placeholder="Tell us what interested you about this role…" /></label>
        {!!modal.job.r1Questions?.length && <div className="form-section"><span className="panel-kicker">CANDIDATE SCREENING · R1</span>{modal.job.r1Questions.map((question) => <QuestionField key={question._id} question={question} name={"r1-" + question._id} />)}</div>}
        <ModalActions onCancel={() => setModal(null)} submit="Send application" />
      </form>
    </Modal>}
    {modal?.kind === "schedule" && <Modal title="Schedule an interview" subtitle="Add a conversation to the shared team calendar." error={modalError} onClose={() => setModal(null)}>
      <form className="modal-form" onSubmit={(event) => handleScheduleSubmit(event, modal.application)}>
        {!modal.application && <label className="field">Candidate and role<select name="applicationId" required defaultValue=""><option value="" disabled>Choose an application</option>{applications.filter((item) => !["Hired", "Rejected"].includes(item.status)).map((item) => <option key={item._id} value={item._id}>{item.candidate?.name} · {item.job?.title}</option>)}</select></label>}
        <label className="field">Conversation title<input name="title" required placeholder="e.g. Portfolio review" defaultValue="Hiring team conversation" /></label>
        <div className="form-grid"><label className="field">Date and time<input name="startsAt" type="datetime-local" required min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} /></label><label className="field">Duration<select name="durationMinutes" defaultValue="45"><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option></select></label></div>
        <label className="field">Format<select name="format"><option>Video call</option><option>On site</option><option>Phone call</option></select></label>
        <ModalActions onCancel={() => setModal(null)} submit="Add to calendar" />
      </form>
    </Modal>}
    {modal?.kind === "team" && <Modal title="Add a teammate" subtitle="Create an employer or recruiter account for this workspace." error={modalError} onClose={() => setModal(null)}>
      <form className="modal-form" onSubmit={handleTeamSubmit}>
        <div className="form-grid"><label className="field field-wide">Full name<input name="name" required minLength="2" placeholder="e.g. Jordan Lee" /></label><label className="field field-wide">Email address<input name="email" type="email" required placeholder="jordan@company.com" /></label><label className="field">Team role<select name="role"><option value="recruiter">Recruiter</option><option value="employer">Employer</option></select></label><label className="field">Job title<input name="title" placeholder="e.g. Talent partner" /></label><label className="field field-wide">Temporary password<input name="password" type="password" required minLength="8" autoComplete="new-password" placeholder="At least 8 characters" /></label></div>
        <div className="inline-hint">The teammate can sign in with this email and password. Share the password privately.</div>
        <ModalActions onCancel={() => setModal(null)} submit="Create account" />
      </form>
    </Modal>}
    {notice && <div className="toast"><span><Check size={13} /></span>{notice}<button onClick={() => notify("")} aria-label="Dismiss"><X size={14} /></button></div>}
    {loading && <div className="sync-indicator"><span /> Syncing workspace</div>}
  </div>;
}

function Modal({ title, subtitle, onClose, children, error }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="round-close modal-x" onClick={onClose} aria-label="Close"><X size={17} /></button><div className="modal-mark"><Sparkles size={16} /></div><span className="eyebrow">MERIDIAN WORKSPACE</span><h2 id="modal-title">{title}</h2><p className="modal-description">{subtitle}</p>{error && <div className="form-error modal-error">{error}</div>}{children}</section></div>;
}

function ModalActions({ onCancel, submit }) {
  return <div className="modal-actions"><Button onClick={onCancel}>Cancel</Button><Button kind="primary" type="submit">{submit} <ArrowRight size={14} /></Button></div>;
}

function Overview({ user, jobs, applications, interviews, metrics, activity, onPage, onOpen, loading }) {
  const isCandidate = user.role === "candidate";
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  const inProgress = applications.filter((item) => !["Hired", "Rejected"].includes(item.status));
  const stagesCount = ["Applied", "Screening", "Interview", "Shortlisted", "Hired"].map((stage) => ({ stage, count: applications.filter((item) => item.status === stage).length }));
  const maximum = Math.max(1, ...stagesCount.map((item) => item.count));
  const topApps = applications.slice().sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)).slice(0, 5);
  const topJobs = jobs.filter((job) => isCandidate ? job.status === "live" : true).slice(0, 3);
  const attention = user.role === "coordinator" ? jobs.filter((job) => ["draft", "review"].includes(job.status)).length :
    user.role === "recruiter" ? applications.filter((item) => ["Applied", "Screening"].includes(item.status)).length :
    user.role === "employer" ? applications.filter((item) => item.status === "Shortlisted").length :
    applications.filter((item) => ["Interview", "Shortlisted"].includes(item.status)).length;
  const attentionText = user.role === "coordinator" ? "roles waiting for review" : user.role === "recruiter" ? "applications ready to review" : user.role === "employer" ? "shortlisted candidates to decide on" : "applications moving forward";

  return <>
    <section className="welcome-strip"><div className="welcome-copy"><div className="welcome-date">{today}</div><h1>{isCandidate ? "Welcome back, " : "Good morning, "}{user.name.split(" ")[0]} <span>✳</span></h1><p>{isCandidate ? "Your next opportunity could be one thoughtful application away." : "Your team is building great momentum. Here’s what’s moving today."}</p></div><div className="welcome-illustration" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="sun-disc">✳</div><span className="orbit-dot dot-a" /><span className="orbit-dot dot-b" /><span className="orbit-dot dot-c" /></div></section>
    <div className="metric-grid">
      <MetricCard icon={Briefcase} label={isCandidate ? "Open roles" : "Active roles"} value={isCandidate ? jobs.length : metrics.openRoles || 0} detail={isCandidate ? "Find your next opportunity" : "Across your hiring workspace"} tone="sage" />
      <MetricCard icon={UsersRound} label={isCandidate ? "Applications" : "Candidates"} value={isCandidate ? applications.length : metrics.applications || 0} detail={isCandidate ? "Your submitted applications" : "In your team's pipeline"} tone="lilac" />
      <MetricCard icon={CalendarDays} label="Interviews" value={metrics.interviews || 0} detail={isCandidate ? "Upcoming conversations" : "Scheduled conversations"} tone="blue" />
      <MetricCard icon={user.role === "coordinator" ? ClipboardCheck : CheckCircle2} label={user.role === "coordinator" ? "Needs review" : isCandidate ? "Moving forward" : "Shortlisted"} value={user.role === "coordinator" ? metrics.pendingRoles || 0 : isCandidate ? applications.filter((item) => ["Interview", "Shortlisted"].includes(item.status)).length : metrics.shortlisted || 0} detail={user.role === "coordinator" ? "Roles to approve and route" : isCandidate ? "Applications in later stages" : "Candidates for the next step"} tone="yellow" />
    </div>
    {isCandidate ? <div className="dashboard-grid">
      <section className="panel pipeline-panel"><PanelHeader eyebrow="YOUR SEARCH" title="Application progress" action={<button className="text-button" onClick={() => onPage("applications")}>View applications <ArrowUpRight size={13} /></button>} />
        {applications.length ? <div className="candidate-progress-list">{applications.slice(0, 4).map((item) => <button key={item._id} className="candidate-progress" onClick={() => onOpen(item)}><span className="progress-company">{(item.job?.department || "M").slice(0, 1)}</span><span className="queue-copy"><strong>{item.job?.title}</strong><small>{item.job?.department} · {item.job?.location}</small></span><StageBadge status={item.status} /><ArrowRight size={14} /></button>)}</div> : <div className="empty-state"><span className="empty-state-icon"><FileText size={20} /></span><strong>Your applications will appear here</strong><p>Browse open roles and submit your first application.</p><Button kind="primary" onClick={() => onPage("jobs")}>Explore roles <ArrowRight size={14} /></Button></div>}
      </section>
      <section className="panel queue-panel"><PanelHeader eyebrow="A GOOD PLACE TO START" title="Roles to explore" action={<button className="text-button" onClick={() => onPage("jobs")}>Browse all <ArrowUpRight size={13} /></button>} />
        {topJobs.map((job) => <button key={job._id} className="suggested-job" onClick={() => onPage("jobs")}><span className={"department-icon dept-" + slug(job.department)}><Building2 size={15} /></span><span className="queue-copy"><strong>{job.title}</strong><small>{job.department} · {job.location}</small></span><ArrowUpRight size={14} /></button>)}
      </section>
    </div> : <div className="dashboard-grid">
      <section className="panel pipeline-panel"><PanelHeader eyebrow="HIRING AT A GLANCE" title="Pipeline health" action={<button className="text-button" onClick={() => onPage("reports")}>View insights <ArrowUpRight size={13} /></button>} />
        <div className="pipeline-summary"><strong>{inProgress.length}<small> candidates in progress</small></strong><span className="trend-chip">{applications.length} total</span></div>
        <div className="pipeline-chart">{stagesCount.map(({ stage, count }) => <div className="pipeline-row" key={stage}><div className="pipeline-label"><span>{stage}</span><strong>{count}</strong></div><div className="pipeline-track"><i className={"pipeline-fill fill-" + slug(stage)} style={{ width: Math.max(count ? 7 : 0, Math.round(count / maximum * 100)) + "%" }} /></div></div>)}</div>
        <div className="pipeline-foot"><span><i className="legend-dot legend-active" />Active stages</span><span><i className="legend-dot legend-hired" />Hired</span><span className="pipeline-period">Current workspace</span></div>
      </section>
      <section className="panel queue-panel"><PanelHeader eyebrow="KEEP THINGS MOVING" title="Needs your attention" action={<span className="count-bubble">{attention}</span>} />
        <p className="attention-caption">{attention ? "There " + (attention === 1 ? "is " : "are ") + attention + " " + attentionText + "." : "You are all caught up. Take a moment to enjoy the breathing room."}</p>
        {user.role === "coordinator" ? jobs.filter((job) => ["draft", "review"].includes(job.status)).slice(0, 3).map((job) => <button className="queue-row" key={job._id} onClick={() => onPage("jobs")}><span className="queue-symbol"><Briefcase size={14} /></span><span className="queue-copy"><strong>{job.title}</strong><small>Waiting for role approval</small></span><ArrowRight size={14} /></button>) :
          applications.filter((item) => user.role === "recruiter" ? ["Applied", "Screening"].includes(item.status) : user.role === "employer" ? item.status === "Shortlisted" : ["Interview", "Shortlisted"].includes(item.status)).slice(0, 3).map((item) => <button className="queue-row" key={item._id} onClick={() => onOpen(item)}><Avatar person={item.candidate} /><span className="queue-copy"><strong>{item.candidate?.name}</strong><small>{item.job?.title}</small></span><StageBadge status={item.status} /></button>)}
        <button className="panel-footer-link" onClick={() => onPage(user.role === "coordinator" ? "jobs" : "applications")}>Open your work queue <ArrowRight size={14} /></button>
      </section>
    </div>}
    {!isCandidate && <div className="dashboard-grid lower-grid">
      <section className="panel recent-panel"><PanelHeader eyebrow="FRESH PROFILES" title="Recent applications" action={<button className="text-button" onClick={() => onPage("applications")}>View all <ArrowUpRight size={13} /></button>} /><ApplicationTable applications={topApps} onOpen={onOpen} /></section>
      <section className="panel activity-panel"><PanelHeader eyebrow="TEAM PULSE" title="Recent activity" action={<span className="live-indicator"><i /> LIVE</span>} />
        <div className="activity-list">{activity.length ? activity.slice(0, 5).map((item) => <div className="activity-row" key={item._id}><Avatar person={{ name: item.actorName, avatarColor: item.actorRole === "coordinator" ? "blue" : item.actorRole === "recruiter" ? "lavender" : "sage" }} /><p><strong>{item.actorName}</strong> {item.action} <b>{item.subject}</b><small>{item.detail} · {dateLabel(item.createdAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</small></p></div>) : <div className="empty-inline">Team activity will show here as work moves forward.</div>}</div>
        <div className="activity-footer"><span>YOUR TEAM</span>{["AR", "MC", "TM"].map((name, index) => <i className={"team-avatar team-" + index} key={name}>{name}</i>)}<small>Recruiting team</small></div>
      </section>
    </div>}
    {isCandidate && <section className="panel recent-panel candidate-interview-panel"><PanelHeader eyebrow="MAKE SPACE FOR GOOD CONVERSATIONS" title="Your upcoming interviews" action={<button className="text-button" onClick={() => onPage("interviews")}>Open calendar <ArrowUpRight size={13} /></button>} />{interviews.filter((item) => item.status === "Scheduled").slice(0, 3).map((item) => <InterviewRow key={item._id} interview={item} />)}{!interviews.some((item) => item.status === "Scheduled") && <div className="empty-inline">When interviews are scheduled, you’ll find them here.</div>}</section>}
  </>;
}

function PanelHeader({ eyebrow, title, action }) {
  return <div className="panel-heading"><div><span className="panel-kicker">{eyebrow}</span><h2>{title}</h2></div>{action}</div>;
}

function JobsPage({ user, jobs, applications, appliedJobIds, onCreate, onEdit, onPrepare, onPublish, onPause, onCloseRole, onApply, onOpen }) {
  const isCandidate = user.role === "candidate";
  const isCoordinator = user.role === "coordinator";
  const title = isCandidate ? "Explore roles" : isCoordinator ? "Role approvals" : user.role === "recruiter" ? "My assigned roles" : "Open roles";
  const eyebrow = isCandidate ? "FIND YOUR NEXT STEP" : isCoordinator ? "KEEP THE PROCESS MOVING" : "BUILD YOUR TEAM";
  const description = isCandidate ? "Explore opportunities and apply with a clear view of each role." : isCoordinator ? "Review employer briefs, assign recruiters, and publish approved roles." : user.role === "recruiter" ? "Roles routed to you and the candidates moving through each one." : "A clear view of the work ahead and the people in motion.";
  const createAction = user.role === "employer" ? <Button kind="primary" onClick={onCreate}><Plus size={15} /> Create a role</Button> : null;
  const [filter, setFilter] = useState(isCoordinator ? "Needs review" : "All roles");
  const filtered = jobs.filter((job) => {
    if (isCandidate) return job.status === "live";
    if (filter === "Needs review") return ["draft", "review"].includes(job.status);
    if (filter === "Live") return job.status === "live";
    if (filter === "Paused") return job.status === "paused";
    return true;
  });
  const appCount = (id) => applications.filter((application) => String(application.job?._id) === String(id)).length;
  return <>
    <PageHeading eyebrow={eyebrow} title={title} description={description} action={createAction} />
    {!isCandidate && <div className="list-toolbar"><div><strong>{filtered.length} roles</strong><span> · </span><span>{jobs.filter((job) => job.status === "live").length} open to candidates</span></div><label className="select-filter"><Filter size={14} /><select value={filter} onChange={(event) => setFilter(event.target.value)}>{(isCoordinator ? ["Needs review", "All roles", "Live", "Paused"] : ["All roles", "Live", "Paused"]).map((value) => <option key={value}>{value}</option>)}</select></label></div>}
    {isCoordinator && <div className="workflow-banner"><span className="workflow-icon"><ClipboardCheck size={17} /></span><div><strong>Three steps to a live role</strong><p>Review the brief and R2 questions, assign a recruiter, then publish for candidates.</p></div><span className="workflow-steps"><i className="done-step">1</i><i>2</i><i>3</i></span></div>}
    <div className="job-grid">{filtered.map((job) => <JobCard key={job._id} job={{ ...job, applicants: job.applicants ?? appCount(job._id) }} role={user.role} applied={appliedJobIds.has(String(job._id))} onApply={onApply} onOpen={onOpen} onPause={onPause} onCloseRole={onCloseRole} onPublish={onPublish} onPrepare={onPrepare} onEdit={onEdit} />)}</div>
    {!filtered.length && <div className="panel empty-state page-empty"><span className="empty-state-icon"><Briefcase size={20} /></span><strong>{isCandidate ? "No open roles yet" : isCoordinator ? "No roles need review" : "No roles found"}</strong><p>{isCandidate ? "Check again soon as the team publishes new opportunities." : isCoordinator ? "New employer briefs will appear here when they are submitted." : "Create or adjust a role to get your pipeline moving."}</p>{user.role === "employer" && <Button kind="primary" onClick={onCreate}><Plus size={14} /> Create a role</Button>}</div>}
  </>;
}

function TeamPage({ members, onCreate }) {
  const recruiters = members.filter((member) => member.role === "recruiter");
  const employers = members.filter((member) => member.role === "employer");
  return <>
    <PageHeading eyebrow="PEOPLE BEHIND THE PROCESS" title="Team access" description="Give employers and recruiters the access they need for their part of hiring." action={<Button kind="primary" onClick={onCreate}><Plus size={15} /> Add teammate</Button>} />
    <div className="metric-grid team-metrics"><MetricCard icon={UsersRound} label="Team members" value={members.length} detail="Across this workspace" tone="sage" /><MetricCard icon={UserRound} label="Recruiters" value={recruiters.length} detail="Available for assignment" tone="lilac" /><MetricCard icon={Building2} label="Employers" value={employers.length} detail="Role owners" tone="blue" /><MetricCard icon={ShieldCheck} label="Access model" value="Role based" detail="Candidate data stays scoped" tone="yellow" /></div>
    <section className="panel team-panel"><div className="panel-heading"><div><span className="panel-kicker">WORKSPACE MEMBERS</span><h2>People and permissions</h2></div><span className="count-bubble">{members.length}</span></div><div className="team-member-list">{members.map((member) => <div className="team-member-row" key={member._id}><Avatar person={member} /><span className="team-member-copy"><strong>{member.name}</strong><small>{member.email}</small></span><span className={"role-label role-label-" + member.role}>{member.role}</span><span className="team-member-title">{member.title || "Team member"}</span><span className="team-member-date">Added {dateLabel(member.createdAt)}</span></div>)}</div>{!members.length && <div className="empty-state"><span className="empty-state-icon"><UsersRound size={20} /></span><strong>No team members yet</strong><p>Add a recruiter or employer to get your hiring workflow started.</p><Button kind="primary" onClick={onCreate}><Plus size={14} /> Add teammate</Button></div>}</section>
  </>;
}

function ApplicationsPage({ user, applications, query, setQuery, stageFilter, setStageFilter, onOpen, onExport, onBrowse, onRefresh }) {
  const isCandidate = user.role === "candidate";
  const isEmployer = user.role === "employer";
  const title = isCandidate ? "My applications" : isEmployer ? "Shortlisted candidates" : "Candidates";
  const eyebrow = isCandidate ? "YOUR SEARCH, IN ONE PLACE" : isEmployer ? "FINAL-STAGE CANDIDATES" : user.role === "recruiter" ? "YOUR SCREENING PIPELINE" : "PEOPLE, FIRST";
  const description = isCandidate ? "Follow each application and see what happens next." : isEmployer ? "Candidates recommended by your recruiters for a final decision." : "Review applications, share context, and keep each next step clear.";
  const candidateList = isEmployer ? applications.filter((item) => ["Interview", "Shortlisted", "Hired"].includes(item.status)) : applications;
  const availableStages = ["All stages", ...stages.filter((stage) => candidateList.some((item) => item.status === stage))];
  const filtered = candidateList.filter((item) => {
    const text = [item.candidate?.name, item.candidate?.email, item.job?.title, item.job?.department].join(" ").toLowerCase();
    return (stageFilter === "All stages" || item.status === stageFilter) && (!query || text.includes(query.toLowerCase()));
  });
  const shortlistCount = candidateList.filter((item) => item.status === "Shortlisted").length;
  return <>
    <PageHeading eyebrow={eyebrow} title={title} description={description} action={isCandidate ? <Button kind="primary" onClick={onBrowse}><Briefcase size={15} /> Explore roles</Button> : !isEmployer && <Button onClick={onExport}><Download size={14} /> Export CSV</Button>} />
    {isCandidate && <div className="application-tracker"><span className="tracker-icon"><ShieldCheck size={18} /></span><div><strong>Your information stays with the hiring team.</strong><p>Application updates appear here as the team reviews your experience.</p></div></div>}
    {isEmployer && <div className="employer-shortlist-banner"><span><Sparkles size={16} /></span><div><strong>{shortlistCount} candidate{shortlistCount === 1 ? "" : "s"} recommended for a final conversation</strong><p>Review recruiter notes, schedule a conversation, or record your decision.</p></div></div>}
    <section className="panel directory-panel">
      <div className="directory-toolbar"><div className="directory-summary"><strong>{filtered.length} {isCandidate ? "applications" : "candidates"}</strong><span>·</span><span>{isCandidate ? "Your application history" : "Shared hiring workspace"}</span></div>
        <div className="directory-controls">{!isCandidate && <label className="table-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or role…" /></label>}
          <label className="select-filter"><Filter size={13} /><select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}>{availableStages.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
          {!isCandidate && <Button onClick={onExport} className="export-button"><Download size={13} /> Export</Button>}
        </div>
      </div>
      {isCandidate ? <CandidateApplicationList applications={filtered} onOpen={onOpen} /> : <ApplicationTable applications={filtered} onOpen={onOpen} showEmail={user.role === "coordinator"} />}
      <div className="table-pagination"><span>Showing <strong>{filtered.length}</strong> of <strong>{candidateList.length}</strong> records</span><span>Updated as your team works</span></div>
    </section>
  </>;
}

function CandidateApplicationList({ applications, onOpen }) {
  if (!applications.length) return <div className="empty-state"><span className="empty-state-icon"><FileText size={20} /></span><strong>No applications to show</strong><p>Explore open roles to find a good fit.</p></div>;
  return <div className="candidate-app-list">{applications.map((application) => <button key={application._id} className="candidate-app-card" onClick={() => onOpen(application)}><span className="company-monogram">{(application.job?.department || "M").slice(0, 1)}</span><span className="queue-copy"><strong>{application.job?.title}</strong><small>{application.job?.department} · {application.job?.location}</small></span><StageBadge status={application.status} /><span className="candidate-app-date">Applied {dateLabel(application.submittedAt)}</span><ArrowUpRight size={15} /></button>)}</div>;
}

function InterviewsPage({ user, interviews, applications, onSchedule, onComplete }) {
  const isCandidate = user.role === "candidate";
  const scheduled = interviews.filter((item) => item.status === "Scheduled");
  const today = scheduled.filter((item) => new Date(item.startsAt).toDateString() === new Date().toDateString());
  const other = scheduled.filter((item) => new Date(item.startsAt).toDateString() !== new Date().toDateString());
  return <>
    <PageHeading eyebrow="MAKE SPACE FOR GOOD CONVERSATIONS" title={isCandidate ? "Your interviews" : "Interviews"} description={isCandidate ? "Your upcoming conversations and the people you’ll meet." : "A calm, organized view of the conversations ahead."} action={!isCandidate && <Button kind="primary" onClick={() => onSchedule(null)}><Plus size={15} /> Schedule interview</Button>} />
    <div className="interview-stats"><div><span className="metric-icon tone-lilac"><CalendarDays size={16} /></span><strong>{scheduled.length}</strong><small>Upcoming conversations</small></div><div><span className="metric-icon tone-peach"><Clock3 size={16} /></span><strong>{today.length}</strong><small>Happening today</small></div><div><span className="metric-icon tone-sage"><CheckCircle2 size={16} /></span><strong>{interviews.filter((item) => item.status === "Completed").length}</strong><small>Completed</small></div></div>
    <InterviewSection title="Today" eyebrow={dateLabel(new Date(), { weekday: "long", month: "short", day: "numeric" })} items={today} user={user} onComplete={onComplete} />
    <InterviewSection title="Coming up" eyebrow="LATER THIS WEEK" items={other} user={user} onComplete={onComplete} />
    {interviews.filter((item) => item.status === "Completed").length > 0 && <InterviewSection title="Recently completed" eyebrow="CLOSED LOOP" items={interviews.filter((item) => item.status === "Completed").slice(0, 5)} user={user} />}
    {!interviews.length && <div className="panel empty-state page-empty"><span className="empty-state-icon"><CalendarDays size={20} /></span><strong>No interviews on the calendar</strong><p>{isCandidate ? "Your recruiter will let you know when a conversation is scheduled." : "Schedule a conversation from a candidate profile or here."}</p></div>}
  </>;
}

function InterviewSection({ title, eyebrow, items, user, onComplete }) {
  return <section className="interview-section"><div className="section-title-row"><div><span className="panel-kicker">{eyebrow}</span><h2>{title}</h2></div></div>
    <div className="interview-list">{items.map((interview) => <InterviewRow key={interview._id} interview={interview} onComplete={onComplete} canManage={user.role !== "candidate"} />)}</div>
    {!items.length && <div className="empty-inline">No conversations scheduled here.</div>}
  </section>;
}

function InterviewRow({ interview, onComplete, canManage = false }) {
  const candidate = interview.candidate || {};
  return <article className="interview-card"><div className="interview-time"><span>{dateLabel(interview.startsAt, { weekday: "short", month: "short", day: "numeric" })}</span><strong>{timeLabel(interview.startsAt)}</strong><small>{interview.durationMinutes} min</small></div><i className={"interview-color-bar color-" + slug(candidate.avatarColor || "sage")} /><div className="interview-main"><span className="interview-type">{interview.format}</span><h3>{interview.title}</h3><div className="interview-person"><Avatar person={candidate} /><span><strong>{candidate.name}</strong><small>{interview.job?.title}</small></span></div></div><div className="interview-actions">{interview.status === "Completed" ? <span className="completed-label"><CheckCircle2 size={14} /> Completed</span> : canManage && <Button onClick={() => onComplete(interview)}>Mark complete <Check size={14} /></Button>}</div></article>;
}

function ReportsPage({ user, jobs, applications, interviews, onExport }) {
  const counts = ["Applied", "Screening", "Interview", "Shortlisted", "Hired"].map((stage) => ({ stage, count: applications.filter((item) => item.status === stage).length }));
  const max = Math.max(1, ...counts.map((item) => item.count));
  const sources = new Map();
  applications.forEach((item) => { const source = item.source || "Direct"; sources.set(source, (sources.get(source) || 0) + 1); });
  const sourceRows = [...sources.entries()].sort((a, b) => b[1] - a[1]);
  const averageScore = applications.filter((item) => item.matchScore != null).length ?
    Math.round(applications.reduce((sum, item) => sum + (item.matchScore || 0), 0) / applications.filter((item) => item.matchScore != null).length) : 0;
  return <>
    <PageHeading eyebrow="BETTER DECISIONS, TOGETHER" title="Team insights" description="A clear read on role activity, candidate flow, and the next steps." action={<Button onClick={onExport}><Download size={14} /> Download report</Button>} />
    <div className="report-date-line"><span className="report-live-dot" /> Updated from your workspace <span>·</span> {applications.length} application{applications.length === 1 ? "" : "s"}</div>
    <div className="metric-grid"><MetricCard icon={Briefcase} label="Open roles" value={jobs.filter((job) => job.status === "live").length} detail="Accepting applications" tone="sage" /><MetricCard icon={UsersRound} label="Active pipeline" value={applications.filter((item) => !["Hired", "Rejected"].includes(item.status)).length} detail="Across all visible roles" tone="lilac" /><MetricCard icon={ShieldCheck} label="Average match" value={averageScore ? averageScore + "%" : "—"} detail="From recruiter reviews" tone="blue" /><MetricCard icon={CalendarDays} label="Interviews scheduled" value={interviews.filter((item) => item.status === "Scheduled").length} detail="Upcoming conversations" tone="yellow" /></div>
    <div className="dashboard-grid reports-grid"><section className="panel report-panel"><PanelHeader eyebrow="FROM APPLICATION TO OFFER" title="Hiring funnel" action={<span className="report-select">All roles <ChevronDown size={12} /></span>} /><div className="report-funnel">{counts.map(({ stage, count }, index) => <div className="report-funnel-row" key={stage}><span className="funnel-index">0{index + 1}</span><span>{stage}</span><div className="funnel-track"><i className={"funnel-" + slug(stage)} style={{ width: Math.max(count ? 7 : 0, Math.round(count / max * 100)) + "%" }} /></div><strong>{count}</strong></div>)}</div><div className="report-note"><Sparkles size={14} />Structured reviews and timely feedback help keep candidates informed at every step.</div></section>
      <section className="panel report-panel source-panel"><PanelHeader eyebrow="YOUR TEAM’S WORK" title="Role activity" /><div className="source-list">{jobs.slice(0, 6).map((job, index) => <div className="source-row role-report-row" key={job._id}><span className="source-number">0{index + 1}</span><span className="source-name">{job.title}</span><span className="source-track"><i style={{ width: Math.max(6, Math.min(100, (job.applicants || 0) * 14)) + "%" }} /></span><strong>{job.applicants || 0}</strong></div>)}</div><div className="source-footer"><span>Roles in workspace</span><strong>{jobs.length}</strong><small>total</small></div></section></div>
    <section className="panel insight-strip"><span className="insight-icon"><ShieldCheck size={17} /></span><div><span className="panel-kicker">A THOUGHTFUL NEXT STEP</span><h2>Keep interview feedback specific and useful</h2><p>Capture job-related evidence while the conversation is fresh, then share it with the people making the decision.</p></div><button className="text-button" onClick={() => downloadCsv("meridian-hiring-report.csv", [["Role", "Stage", "Candidate"], ...applications.map((item) => [item.job?.title, item.status, item.candidate?.name])])}>Export pipeline <ArrowRight size={14} /></button></section>
  </>;
}

if (typeof window !== "undefined") {
  window.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      document.querySelector(".global-search input")?.focus();
    }
  });
}

export default MeridianApp;

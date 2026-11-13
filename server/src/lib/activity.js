import Activity from "../models/Activity.js";

export async function recordActivity(user, action, subject, detail = "") {
  await Activity.create({
    actor: user._id,
    actorName: user.name,
    actorRole: user.role,
    action,
    subject,
    detail
  });
}

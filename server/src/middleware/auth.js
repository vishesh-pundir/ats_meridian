import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.meridian_session;
    if (!token) return res.status(401).json({ message: "Sign in to continue." });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: "Your session has expired. Please sign in again." });
    req.user = user;
    next();
  } catch {
    res.clearCookie("meridian_session", { path: "/" });
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: "You do not have permission to do that." });
    next();
  };
}

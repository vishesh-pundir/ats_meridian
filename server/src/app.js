import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import jobRoutes from "./routes/jobs.routes.js";
import applicationRoutes from "./routes/applications.routes.js";
import interviewRoutes from "./routes/interviews.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(here, "../../client/dist");

app.disable("x-powered-by");
app.use(helmet({
  crossOriginResourcePolicy: { policy: "same-site" },
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());
app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "Meridian ATS" }));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", (_req, res) => res.status(404).json({ message: "API route not found." }));

app.use(express.static(clientDist));
app.get("/{*splat}", (_req, res, next) => {
  res.sendFile(path.join(clientDist, "index.html"), (error) => error && next());
});

app.use((error, _req, res, _next) => {
  if (error.code === "LIMIT_FILE_SIZE") return res.status(413).json({ message: "Resume files must be 8 MB or smaller." });
  if (error.name === "MulterError") return res.status(400).json({ message: error.message });
  if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
  if (error.code === 11000) return res.status(409).json({ message: "That record already exists." });
  if (error.status && error.status < 500) return res.status(error.status).json({ message: error.message });
  console.error(error);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});

export default app;

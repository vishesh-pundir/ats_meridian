import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";

const here = path.dirname(fileURLToPath(import.meta.url));
export const resumeDirectory = path.resolve(here, "../../private-uploads/resumes");
fs.mkdirSync(resumeDirectory, { recursive: true });

const accepted = new Set([".pdf", ".doc", ".docx"]);
const storage = multer.diskStorage({
  destination(_req, _file, done) { done(null, resumeDirectory); },
  filename(_req, file, done) {
    const extension = path.extname(file.originalname).toLowerCase();
    done(null, crypto.randomUUID() + extension);
  }
});

export const resumeUpload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, done) {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!accepted.has(extension)) {
      const error = new Error("Upload a PDF, DOC, or DOCX resume.");
      error.status = 400;
      return done(error);
    }
    done(null, true);
  }
}).single("resume");

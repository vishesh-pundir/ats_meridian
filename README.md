# Meridian ATS

Meridian is a full-stack applicant tracking workspace with separate experiences for candidates, employers, coordinators, and recruiters. The interface and application code are original to this project.

## Run it locally

You will need Node.js 22.12 or newer and a MongoDB database. A local MongoDB Community Server or a MongoDB Atlas connection both work.

1. Open this folder in VS Code.
2. In the integrated terminal, run: npm install
3. Copy server/.env.example to server/.env.
4. Set MONGODB_URI to your local or Atlas database URL. Replace JWT_SECRET with a random secret of at least 32 characters.
5. Run: npm run seed
6. Run: npm run dev
7. Open the Local URL printed by Vite (usually http://localhost:5173). If that port is already in use, Vite selects the next available one.

The web app uses the Vite development server and forwards its API requests to the Express server on port 4000. The root npm run dev command starts both.

## Demo accounts

The seed command creates these accounts. They all use the password Meridian!2026.

- Employer: employer@meridian.demo
- Coordinator: coordinator@meridian.demo
- Recruiter: recruiter@meridian.demo
- Recruiter 2: recruiter2@meridian.demo
- Candidate: candidate@meridian.demo

You can also register a new candidate account from the sign-in screen. Coordinators can create employer and recruiter accounts from Team access; public sign-up cannot grant internal roles.

## Hiring workflow

1. **Employer:** create a role, write the description, and add candidate screening questions (R1). A new role enters coordinator review.
2. **Coordinator:** review the brief, add recruiter questions (R2), assign one or more recruiters, and publish the approved role.
3. **Candidate:** browse live roles, attach a PDF/DOC/DOCX resume, answer R1, and track each application.
4. **Recruiter:** see applications for assigned roles, securely open resumes, complete R2, add private notes, set a match score, and recommend candidates for shortlisting.
5. **Employer and coordinator:** review candidate profiles and recruiter feedback. Employers can make the final hire or decline decision on shortlisted candidates.

## Additional workspace features

- Interview scheduling, interview completion, and shared feedback.
- Role and candidate dashboards, stage counts, recruiter assignment, and recent team activity.
- Coordinator-managed employer and recruiter accounts with role-based access.
- Hiring funnel and role reports with CSV exports.
- Responsive workspace layout, private team notes, and secure role-based application access.
- Resume files stay outside the public web directory and are delivered through an access-checked route.

## Project layout

- client/ — React application, Vite setup, page components, and styles.
- server/ — Express API, MongoDB models, authentication, role checks, and private resume storage.
- server/src/routes/ — authentication, roles, applications, interviews, and dashboard endpoints.
- server/src/models/ — user, job, application, interview, and activity records.
- PROVENANCE.md — source background and implementation notes.

## Data and production notes

All names and sample hiring records are fictional. The demo stores records in MongoDB and resumes on the server's local disk. It does not send emails or connect to an external calendar. Before deploying for a real hiring team, configure HTTPS, backups, durable private file storage, email/calendar services, and your organization’s retention and access policies.

See server/.env.example for the required settings. Do not commit a real .env file or candidate resumes.

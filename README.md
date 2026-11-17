# CIS 3339 Homework 1 — Student Management

A Vue 3 Composition API application with Vue Router, Pinia, an Express REST API, and local MongoDB storage for students, courses, and enrollments.

## Required software

- Node.js 24.12 or newer (tested with Node.js 24.19.0), including npm
- MongoDB Community Edition installed locally
- A modern web browser
- Git to clone the repository

## Install and run

Clone the repository and open its main directory:

```powershell
git clone https://github.com/TovliHTX/cis3339-homework1.git
cd cis3339-homework1
```

On Windows, confirm the MongoDB service is running:

```powershell
Get-Service MongoDB
```

If stopped, run the following in an administrator PowerShell window:

```powershell
Start-Service MongoDB
```

This assumes MongoDB was installed with its Windows service. MongoDB must be running before starting the app.

The submitted `backend/.env` contains the local configuration:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/cis3339_homework1
PORT=3000
```

`MONGODB_URI` is required. `PORT` defaults to 3000. The local `.env` must be committed and contain no passwords or cloud credentials. PowerShell environment variables take precedence over `.env`; remove any temporary override to return to the submitted configuration.

From the repository root, run these commands separately:

```powershell
npm install
npm run build
npm start
```

The root installation automatically installs backend and frontend dependencies. The build creates `frontend/dist`. Express serves those production files and the API from the same server.

Open **http://localhost:3000**. Navigation is available at `/students`, `/courses`, and `/enrollments`; refreshing these pages is supported. Do not open the old HTML files directly.

Collections and indexes are initialized automatically during startup. No database creation, migration, seed, import, or rebuild command is required. An empty database initially displays no records; add them through the app.

## Features

- Students: add name, unique student ID, phone, and ZIP; search by exact name including capitalization; display and delete the selected record.
- Courses: add a unique course ID and name, list courses, and delete courses.
- Enrollments: select existing students and courses, enroll students, reject duplicate pairs, and display a course roster.
- Deleting a student or course removes associated enrollments.
- MongoDB retains records when the server restarts.

Identifiers in API URL parameters are MongoDB `_id` values. Displayed student/course IDs are separate fields. Enrollment creation validates that both referenced records exist. A queue coordinates enrollment creation and parent deletion within one server process; this is not a multi-server locking mechanism or an atomic database transaction.

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/students` | List students |
| POST | `/api/add-student` | Add a student |
| POST | `/api/find-student` | Search by name |
| DELETE | `/api/students/:id` | Delete student and enrollments |
| GET | `/api/courses` | List courses |
| POST | `/api/courses` | Add a course |
| DELETE | `/api/courses/:id` | Delete course and enrollments |
| POST | `/api/enrollments` | Enroll using `studentId` and `courseId` |
| GET | `/api/courses/:id/students` | Read course roster |

## Development

Start the backend from the root:

```powershell
npm start
```

In a separate terminal at the root:

```powershell
npm run dev --prefix frontend
```

Open the address Vite prints, normally http://localhost:5173. Vite proxies `/api` requests to port 3000. Rebuild the frontend before testing changes at port 3000.

## Verification

Browser checks covered student/course operations, duplicate rejection, enrollment creation and rosters, page refreshes, and deletion behavior. `backend/check-enrollments.js` checks record counts and orphan enrollments:

```powershell
node backend/check-enrollments.js
```

`backend/check-db.js` checks MongoDB connectivity:

```powershell
node backend/check-db.js
```

These are optional read-only diagnostics, not database setup steps.

Fresh-database startup and persistence were tested using a separate local database: create a student, course, and enrollment through the app, stop and restart the server, then verify the roster remains. The normal database was restored afterward.

An isolated copy with no existing dependencies successfully installed the backend and frontend packages from the local npm cache and completed `npm run build`. This cache-based check is not a fresh download from the npm registry.

## Troubleshooting

- Connection failure: check the MongoDB service and `backend/.env`.
- Address already in use: stop the other server using port 3000 before `npm start`.
- Missing production files: run `npm run build` from the root.
- Changes absent in production: rebuild and restart as needed.
- Unexpected database contents: check for a temporary `MONGODB_URI` override in the terminal environment.

Do not commit `node_modules/` or `dist/`. Commit package files and lockfiles along with the required local `backend/.env`.

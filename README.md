# CreatorOS AI

CreatorOS AI is a React/Vite creator workspace backed by an Express REST API. It includes JWT authentication, JSON-file persistence for local development, Gemini generation with a local fallback, Socket.IO collaboration messaging, PDF reports, and a backend-protected KRYNX admin dashboard.

## Requirements and local startup

Use Node.js 20 or newer and npm. From the project root in Windows Command Prompt or a VS Code terminal:

```text
npm install
npm run install:all
npm run dev
```

If PowerShell blocks the `npm.ps1` script, run `npm.cmd` in the same commands instead. The client is served at `http://localhost:5173`; the API and Socket.IO server use `http://localhost:5000`.

The root `install:all` script installs the client and server dependencies. The root `dev` script starts both development servers.

## Environment

Copy `server/.env.example` to `server/.env` if configuring local secrets. On a fresh database, the server seeds the KRYNX administrator using a backend-only scrypt hash; an `ADMIN_PASSWORD` environment value can optionally replace it and is itself hashed. Set a private, strong `JWT_SECRET` before exposing the API beyond local development. `GEMINI_API_KEY` is optional: with no key or an unavailable Gemini service, the server returns a local fallback response and an engagement score.

The admin password, Gemini key, and JWT secret are read only by the backend. Do not place them in client-side variables or commit `server/.env`.

## KRYNX administrator

The server creates/repairs exactly one admin-role account at startup:

- Email: `sreeramdassk@gmail.com`
- Name: `KRYNX`
- Role: `admin`

The server stores the admin password in `data/db.json` as a scrypt hash. Do not publish the password in this repository. The admin dashboard APIs independently enforce the account role; hiding the route in the client is not the security boundary.

## Render deployment

This repository includes a Render Blueprint at [`render.yaml`](./render.yaml). In Render, create a new Blueprint instance and connect this GitHub repository. Render generates `JWT_SECRET` automatically. Add `GEMINI_API_KEY` in the service's environment settings only if Gemini is wanted.

The Node service builds the Vite client and serves it alongside the REST and Socket.IO APIs on the same origin. Once Render finishes the first deploy, copy its assigned `https://….onrender.com` service URL into [`LIVE-LINK.txt`](./LIVE-LINK.txt).

The Blueprint uses Render's free plan as requested. Free instances have ephemeral storage and may sleep; the JSON database can reset on redeploy/restart. Use a paid persistent disk or a managed database for durable live accounts and content.

## Implemented features

- Creator signup, login, logout, protected APIs, project/draft CRUD, analytics, collaboration invites and authenticated realtime messages.
- A full-viewport AI Studio with tool selection, conversation history, focus mode, copy/regenerate/save actions, scoring, and improvement suggestions.
- Admin totals, creator usage and join/last-active details, recent projects, generations, collaborations, and activity.
- PDF report generation through PDFKit.

## Persistence and limitations

Local development data is stored in `data/db.json`. Firebase Authentication, Firestore, and Firebase Storage are not implemented. The JSON store is intended for local/demo use, not concurrent or production deployments. Realtime messages currently use a per-account room; collaborator invitations do not yet grant another account access to that room.

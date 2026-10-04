import crypto from "node:crypto";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import PDFDocument from "pdfkit";
import { Server } from "socket.io";
import { generate, score } from "./ai.js";
import { id, read, write } from "./store.js";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(serverDirectory, "../.env") });
dotenv.config();

const app = express();
const server = http.createServer(app);
const clientUrl =
  process.env.CLIENT_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  "http://localhost:5173";
const io = new Server(server, { cors: { origin: clientUrl } });
const jwtSecret = process.env.JWT_SECRET || "creatoros-dev-secret";
const ADMIN_EMAIL = "sreeramdassk@gmail.com";
const ADMIN_NAME = "KRYNX";
const SEEDED_ADMIN_HASH =
  "scrypt:d6fcc062cc44b082b1dcd6718082f968:6d427216e397006b16ca93826c3636a4da2b8135c54ee245d406eafe5e1bbab8ffb0dffdd6d187a04803da25d192347f0e37ef2de03047fb259c760225817b8a";
const AI_TYPES = new Set([
  "caption",
  "hook",
  "script",
  "hashtag",
  "idea",
  "analyze",
]);

app.use(cors({ origin: clientUrl }));
app.use(express.json({ limit: "1mb" }));

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (typeof password !== "string" || typeof stored !== "string") return false;
  const [, salt, hash] = stored.split(":");
  if (!salt || !/^[a-f0-9]{128}$/i.test(hash || "")) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    actual.length === expected.length &&
    crypto.timingSafeEqual(actual, expected)
  );
}

function ensureAdmin() {
  const db = read();
  const configuredPassword = process.env.ADMIN_PASSWORD;
  let admin = db.users.find(
    (user) => String(user.email).toLowerCase() === ADMIN_EMAIL,
  );
  if (!admin) {
    admin = {
      id: "krynx-admin",
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash: configuredPassword
        ? hashPassword(configuredPassword)
        : SEEDED_ADMIN_HASH,
      role: "admin",
      createdAt: new Date().toISOString(),
    };
    db.users.push(admin);
  } else {
    admin.name = ADMIN_NAME;
    admin.email = ADMIN_EMAIL;
    admin.role = "admin";
    if (
      configuredPassword &&
      !verifyPassword(configuredPassword, admin.passwordHash)
    ) {
      admin.passwordHash = hashPassword(configuredPassword);
    }
    if (!admin.passwordHash?.startsWith("scrypt:")) {
      admin.passwordHash = configuredPassword
        ? hashPassword(configuredPassword)
        : SEEDED_ADMIN_HASH;
    }
  }
  for (const user of db.users) {
    if (user.id !== admin.id && user.role === "admin") user.role = "creator";
  }
  write(db);
  return admin;
}

ensureAdmin();

function createToken(user) {
  return jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "7d" });
}

function auth(req, res, next) {
  const header = req.get("authorization") || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const claims = jwt.verify(header.slice(7), jwtSecret);
    const user = read().users.find((entry) => entry.id === claims.id);
    if (!user)
      return res.status(401).json({ error: "Account no longer exists" });
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "creator",
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

function recordActivity(db, userId, event, type) {
  db.analytics.push({
    id: id(),
    userId,
    event,
    type,
    createdAt: new Date().toISOString(),
  });
}

function validText(value, maxLength) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.post("/api/auth/signup", (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password = req.body.password;
  if (!validText(name, 80) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res
      .status(400)
      .json({ error: "Enter a valid creator name and email address" });
  }
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 200
  ) {
    return res
      .status(400)
      .json({ error: "Password must be between 8 and 200 characters" });
  }
  const db = read();
  if (db.users.some((user) => String(user.email).toLowerCase() === email)) {
    return res
      .status(409)
      .json({ error: "An account with this email already exists" });
  }
  const user = {
    id: id(),
    name,
    email,
    passwordHash: hashPassword(password),
    role: "creator",
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };
  db.users.push(user);
  write(db);
  return res.status(201).json({
    token: createToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

app.post("/api/auth/login", (req, res) => {
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password = req.body.password;
  const db = read();
  const user = db.users.find(
    (entry) =>
      String(entry.email).toLowerCase() === email &&
      verifyPassword(password, entry.passwordHash),
  );
  if (!user)
    return res.status(401).json({ error: "Invalid email or password" });
  user.lastActiveAt = new Date().toISOString();
  write(db);
  return res.json({
    token: createToken(user),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "creator",
    },
  });
});

app.get("/api/me", auth, (req, res) => res.json({ user: req.user }));

app.patch("/api/me/profile", auth, (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (!validText(name, 80)) {
    return res
      .status(400)
      .json({ error: "Creator name must be between 1 and 80 characters" });
  }
  const db = read();
  const user = db.users.find((entry) => entry.id === req.user.id);
  if (!user) return res.status(404).json({ error: "Account no longer exists" });
  user.name = name;
  write(db);
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "creator",
    },
  });
});

app.get("/api/projects", auth, (req, res) => {
  const projects = read().projects.filter(
    (project) => project.userId === req.user.id,
  );
  res.json({ projects });
});

app.post("/api/projects", auth, (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const niche =
    typeof req.body.niche === "string" ? req.body.niche.trim() : "Content";
  if (!validText(name, 120) || niche.length > 100) {
    return res.status(400).json({
      error: "Project name is required and must be 120 characters or fewer",
    });
  }
  const db = read();
  const now = new Date().toISOString();
  const project = {
    id: id(),
    userId: req.user.id,
    name,
    niche: niche || "Content",
    status: "Active",
    createdAt: now,
    updatedAt: now,
  };
  db.projects.unshift(project);
  recordActivity(
    db,
    req.user.id,
    "project_created",
    `Project created: ${project.name}`,
  );
  write(db);
  res.status(201).json({ project });
});

app.patch("/api/projects/:id", auth, (req, res) => {
  const db = read();
  const project = db.projects.find(
    (entry) => entry.id === req.params.id && entry.userId === req.user.id,
  );
  if (!project) return res.status(404).json({ error: "Project not found" });
  const { name, niche, status } = req.body;
  if (name !== undefined && !validText(name, 120)) {
    return res
      .status(400)
      .json({ error: "Project name must be between 1 and 120 characters" });
  }
  if (
    niche !== undefined &&
    (typeof niche !== "string" || niche.trim().length > 100)
  ) {
    return res
      .status(400)
      .json({ error: "Project niche must be 100 characters or fewer" });
  }
  if (
    status !== undefined &&
    !["Active", "Archived", "Completed"].includes(status)
  ) {
    return res.status(400).json({ error: "Invalid project status" });
  }
  if (name !== undefined) project.name = name.trim();
  if (niche !== undefined) project.niche = niche.trim();
  if (status !== undefined) project.status = status;
  project.updatedAt = new Date().toISOString();
  write(db);
  res.json({ project });
});

app.delete("/api/projects/:id", auth, (req, res) => {
  const db = read();
  const index = db.projects.findIndex(
    (entry) => entry.id === req.params.id && entry.userId === req.user.id,
  );
  if (index < 0) return res.status(404).json({ error: "Project not found" });
  db.projects.splice(index, 1);
  write(db);
  res.json({ ok: true });
});

app.get("/api/drafts", auth, (req, res) => {
  const drafts = read().drafts.filter((draft) => draft.userId === req.user.id);
  res.json({ drafts });
});

app.post("/api/drafts", auth, (req, res) => {
  const title =
    typeof req.body.title === "string"
      ? req.body.title.trim()
      : "Untitled Draft";
  const content = typeof req.body.content === "string" ? req.body.content : "";
  const type =
    typeof req.body.type === "string" ? req.body.type.trim() : "AI Generation";
  const scoreValue = Number(req.body.score ?? 0);
  if (
    !validText(title, 160) ||
    !validText(content, 30000) ||
    type.length > 80
  ) {
    return res.status(400).json({
      error:
        "Draft needs a title and content; title must be 160 characters or fewer",
    });
  }
  if (!Number.isFinite(scoreValue) || scoreValue < 0 || scoreValue > 100) {
    return res
      .status(400)
      .json({ error: "Draft score must be between 0 and 100" });
  }
  const db = read();
  const draft = {
    id: id(),
    userId: req.user.id,
    title,
    type: type || "AI Generation",
    content,
    score: scoreValue,
    createdAt: new Date().toISOString(),
  };
  db.drafts.unshift(draft);
  recordActivity(db, req.user.id, "draft_saved", `Draft saved: ${draft.title}`);
  write(db);
  res.status(201).json({ draft });
});

app.patch("/api/drafts/:id", auth, (req, res) => {
  const db = read();
  const draft = db.drafts.find(
    (entry) => entry.id === req.params.id && entry.userId === req.user.id,
  );
  if (!draft) return res.status(404).json({ error: "Draft not found" });
  const { title, content, type, score: scoreValue } = req.body;
  if (title !== undefined && !validText(title, 160)) {
    return res
      .status(400)
      .json({ error: "Draft title must be between 1 and 160 characters" });
  }
  if (content !== undefined && !validText(content, 30000)) {
    return res.status(400).json({
      error: "Draft content is required and must be 30,000 characters or fewer",
    });
  }
  if (type !== undefined && (typeof type !== "string" || type.length > 80)) {
    return res.status(400).json({ error: "Invalid draft type" });
  }
  if (
    scoreValue !== undefined &&
    (!Number.isFinite(Number(scoreValue)) ||
      Number(scoreValue) < 0 ||
      Number(scoreValue) > 100)
  ) {
    return res
      .status(400)
      .json({ error: "Draft score must be between 0 and 100" });
  }
  if (title !== undefined) draft.title = title.trim();
  if (content !== undefined) draft.content = content;
  if (type !== undefined) draft.type = type;
  if (scoreValue !== undefined) draft.score = Number(scoreValue);
  write(db);
  res.json({ draft });
});

app.delete("/api/drafts/:id", auth, (req, res) => {
  const db = read();
  const index = db.drafts.findIndex(
    (entry) => entry.id === req.params.id && entry.userId === req.user.id,
  );
  if (index < 0) return res.status(404).json({ error: "Draft not found" });
  db.drafts.splice(index, 1);
  write(db);
  res.json({ ok: true });
});

app.post("/api/ai/generate", auth, async (req, res, next) => {
  const type = typeof req.body.type === "string" ? req.body.type : "idea";
  const prompt =
    typeof req.body.prompt === "string" ? req.body.prompt.trim() : "";
  if (!AI_TYPES.has(type)) {
    return res
      .status(400)
      .json({ error: "Choose a supported AI generation type" });
  }
  if (!validText(prompt, 4000)) {
    return res
      .status(400)
      .json({ error: "Prompt must be between 1 and 4,000 characters" });
  }
  try {
    const output = await generate(type, prompt);
    const engagement = score(output.text);
    const db = read();
    db.generations.unshift({
      id: id(),
      userId: req.user.id,
      type,
      prompt,
      text: output.text,
      score: engagement,
      provider: output.provider,
      createdAt: new Date().toISOString(),
    });
    recordActivity(db, req.user.id, "generation", `Generated ${type}`);
    write(db);
    res.json({ ...output, score: engagement });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/overview", auth, adminOnly, (req, res) => {
  const db = read();
  const creators = db.users.filter((user) => user.role !== "admin");
  const usersById = new Map(creators.map((user) => [user.id, user]));
  const recentCreators = [...creators]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt || null,
      projects: db.projects.filter((project) => project.userId === user.id)
        .length,
      drafts: db.drafts.filter((draft) => draft.userId === user.id).length,
      generations: db.generations.filter((entry) => entry.userId === user.id)
        .length,
    }));
  const recentProjects = [...db.projects]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0),
    )
    .slice(0, 30)
    .map((project) => ({
      ...project,
      userName: usersById.get(project.userId)?.name || "Unknown",
      userEmail: usersById.get(project.userId)?.email || "",
    }));
  const recentGenerations = [...db.generations]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 20)
    .map((entry) => ({
      id: entry.id,
      type: entry.type,
      createdAt: entry.createdAt,
      userName: usersById.get(entry.userId)?.name || "Unknown",
      userEmail: usersById.get(entry.userId)?.email || "",
    }));
  const recentCollaborations = [...db.collaborations]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 20)
    .map((entry) => ({
      ...entry,
      userName: usersById.get(entry.userId)?.name || "Unknown",
      userEmail: usersById.get(entry.userId)?.email || "",
    }));
  res.json({
    admin: { name: req.user.name, email: req.user.email },
    totals: {
      users: creators.length,
      projects: db.projects.length,
      drafts: db.drafts.length,
      generations: db.generations.length,
      collaborations: db.collaborations.length,
    },
    recentUsers: recentCreators,
    recentProjects,
    recentGenerations,
    recentCollaborations,
  });
});

app.get("/api/admin/activity", auth, adminOnly, (req, res) => {
  const db = read();
  const users = new Map(db.users.map((user) => [user.id, user]));
  const activity = [...db.analytics]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 60)
    .map((entry) => ({
      ...entry,
      userName: users.get(entry.userId)?.name || "Unknown",
      userEmail: users.get(entry.userId)?.email || "",
    }));
  res.json({ activity });
});

app.get("/api/analytics", auth, (req, res) => {
  const db = read();
  const userId = req.user.id;
  res.json({
    projects: db.projects.filter((entry) => entry.userId === userId).length,
    drafts: db.drafts.filter((entry) => entry.userId === userId).length,
    generations: db.generations.filter((entry) => entry.userId === userId)
      .length,
    collaborations: db.collaborations.filter((entry) => entry.userId === userId)
      .length,
    activity: db.analytics
      .filter((entry) => entry.userId === userId)
      .slice(-30)
      .reverse(),
  });
});

app.get("/api/collaborations", auth, (req, res) => {
  const collaborations = read().collaborations.filter(
    (entry) => entry.userId === req.user.id,
  );
  res.json({ collaborations });
});

app.get("/api/collaborations/messages", auth, (req, res) => {
  const messages = read()
    .messages.filter((message) => message.userId === req.user.id)
    .slice(-100);
  res.json({ messages });
});

app.post("/api/collaborations/invite", auth, (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
  if (
    !validText(name, 80) ||
    (email !== "" &&
      (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
  ) {
    return res
      .status(400)
      .json({ error: "Enter a collaborator name and a valid email" });
  }
  const db = read();
  const collaboration = {
    id: id(),
    userId: req.user.id,
    name,
    email,
    role: "Editor",
    status: "Invited",
    createdAt: new Date().toISOString(),
  };
  db.collaborations.push(collaboration);
  recordActivity(
    db,
    req.user.id,
    "collaboration_invited",
    `Invited teammate: ${collaboration.name}`,
  );
  write(db);
  res.status(201).json({ collaboration });
});

app.get("/api/reports/pdf", auth, (req, res, next) => {
  try {
    const db = read();
    const userId = req.user.id;
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="CreatorOS-Report.pdf"',
    );
    doc.on("error", next);
    doc.pipe(res);
    doc.fontSize(26).fillColor("#ef1d2d").text("CreatorOS AI");
    doc.fillColor("#111111").fontSize(14).text("Creator Report");
    doc.moveDown();
    doc.fontSize(11).text(`Creator: ${req.user.name}`);
    doc.text(
      `Projects: ${db.projects.filter((entry) => entry.userId === userId).length}`,
    );
    doc.text(
      `Drafts: ${db.drafts.filter((entry) => entry.userId === userId).length}`,
    );
    doc.text(
      `AI Generations: ${db.generations.filter((entry) => entry.userId === userId).length}`,
    );
    doc.moveDown();
    doc.fontSize(16).text("Recent Drafts");
    db.drafts
      .filter((entry) => entry.userId === userId)
      .slice(0, 10)
      .forEach((draft) =>
        doc
          .fillColor("#111111")
          .fontSize(11)
          .text(`${draft.title} — score ${draft.score}`),
      );
    doc.end();
  } catch (error) {
    next(error);
  }
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const claims = jwt.verify(token, jwtSecret);
    const user = read().users.find((entry) => entry.id === claims.id);
    if (!user) return next(new Error("Authentication required"));
    socket.data.user = { id: user.id, name: user.name };
    next();
  } catch {
    next(new Error("Invalid or expired session"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.user.id;
  socket.join(userId);
  socket.on("chat-message", (data, acknowledge = () => {}) => {
    const text = typeof data?.text === "string" ? data.text.trim() : "";
    if (!validText(text, 2000)) {
      acknowledge({ error: "Message must be between 1 and 2,000 characters" });
      return;
    }
    const message = {
      id: id(),
      userId,
      userName: socket.data.user.name,
      text,
      createdAt: new Date().toISOString(),
    };
    const db = read();
    db.messages.push(message);
    recordActivity(
      db,
      userId,
      "collaboration_message",
      "Sent a collaboration message",
    );
    write(db);
    io.to(userId).emit("chat-message", message);
    acknowledge({ ok: true });
  });
});

if (process.env.NODE_ENV === "production") {
  const clientBuild = path.resolve(serverDirectory, "../../client/dist");
  app.use(express.static(clientBuild));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(clientBuild, "index.html"));
  });
}
app.use((req, res) => res.status(404).json({ error: "API route not found" }));
app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  const status =
    Number.isInteger(error.status) && error.status >= 400 && error.status < 500
      ? error.status
      : 500;
  res.status(status).json({
    error:
      status === 400
        ? "Invalid request body"
        : "The server could not complete the request",
  });
});

const port = Number(process.env.PORT) || 5000;
server.listen(port, () => {
  console.log(`CreatorOS API running on http://localhost:${port}`);
});

import React, {
  useEffect,
  useState,
  useContext,
  createContext,
  useRef,
} from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  useNavigate,
  useLocation,
  Routes,
  Route,
  Navigate,
  Link,
  useParams,
} from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  BarChart3,
  Users,
  Settings as SettingsIcon,
  UserCircle,
  LogOut,
  Sun,
  Moon,
  Plus,
  ArrowRight,
  Send,
  Copy,
  Trash2,
  Download,
  Search,
  Save,
  Menu,
  X,
  TrendingUp,
  ShieldCheck,
  Activity,
  FolderKanban,
  UserPlus,
  RefreshCw,
  Command,
} from "lucide-react";
import "./styles.css";

const API =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? "http://localhost:5000" : window.location.origin);
const api = axios.create({ baseURL: API });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("cos_token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      "CreatorOS could not reach the backend. Make sure the server is running on port 5000.";
    window.dispatchEvent(new CustomEvent("cos-api-error", { detail: message }));
    return Promise.reject(error);
  },
);
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);
function Provider({ children }) {
  const [apiError, setApiError] = useState("");
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("cos_user") || "null"),
  );
  const [dark, setDark] = useState(
    () => localStorage.getItem("cos_theme") !== "light",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("cos_theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    const showError = (event) => {
      setApiError(event.detail);
      window.setTimeout(() => setApiError(""), 6000);
    };
    window.addEventListener("cos-api-error", showError);
    return () => window.removeEventListener("cos-api-error", showError);
  }, []);
  return (
    <Ctx.Provider
      value={{ user, setUser, dark, setDark, apiError, setApiError }}
    >
      {children}
    </Ctx.Provider>
  );
}

function Brand({ admin = false }) {
  return (
    <Link
      className={"brand " + (admin ? "brand-admin" : "")}
      to={admin ? "/admin" : "/"}
    >
      <span>✦</span> {admin ? "KRYNX" : "CreatorOS"}{" "}
      <i>{admin ? "TEAM" : "AI"}</i>
    </Link>
  );
}
function Landing() {
  const nav = useNavigate();
  return (
    <div className="landing">
      <nav>
        <Brand />
        <div className="links">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#ai">AI</a>
        </div>
        <div>
          <button className="ghost" onClick={() => nav("/login")}>
            Log in
          </button>
          <button onClick={() => nav("/signup")}>
            Get Started <ArrowRight size={15} />
          </button>
        </div>
      </nav>
      <section className="hero">
        <div>
          <label>✦ AI OPERATING SYSTEM FOR CREATORS</label>
          <h1>
            Create. <span>Optimize.</span>
            <br />
            Grow with AI.
          </h1>
          <p>
            One intelligent workspace for captions, hooks, scripts, projects,
            analytics and collaboration.
          </p>
          <div className="actions">
            <button className="big" onClick={() => nav("/signup")}>
              Start Creating <ArrowRight size={17} />
            </button>
            <button
              className="ghost big"
              onClick={() =>
                document.getElementById("features").scrollIntoView()
              }
            >
              Explore Features
            </button>
          </div>
        </div>
        <div className="hero-card">
          <div className="mock-top">
            CreatorOS AI Workspace · illustrative preview
          </div>
          <div className="mock-stat">
            <div>
              Projects<strong>12</strong>
            </div>
            <div>
              AI Generations<strong>148</strong>
            </div>
            <div>
              Drafts<strong>35</strong>
            </div>
          </div>
          <div className="mock-chat">
            <b>✦ CreatorOS AI</b>
            <p>“Give me 5 hooks for my college vlog.”</p>
            <p className="ai">
              POV: You finally start taking college seriously… for 24 hours.
            </p>
          </div>
        </div>
      </section>
      <section id="features" className="section">
        <label>ONE WORKSPACE</label>
        <h2>Everything your content needs.</h2>
        <div className="grid">
          {[
            [
              "AI Content Studio",
              "Generate captions, hooks, scripts, hashtags and ideas.",
            ],
            [
              "Creator Workspace",
              "Projects, prompts, chats and drafts in one place.",
            ],
            [
              "Engagement Intelligence",
              "Score hook, emotion, readability and CTA quality.",
            ],
            [
              "Realtime Collaboration",
              "Team chat and shared creator workflows.",
            ],
            ["Analytics", "Track projects, drafts, AI usage and productivity."],
            ["PDF Reports", "Export creator reports for documentation."],
          ].map((x) => (
            <article key={x[0]}>
              <Sparkles size={20} />
              <h3>{x[0]}</h3>
              <p>{x[1]}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="workflow" className="section">
        <label>WORKFLOW</label>
        <h2>Idea → publish without the chaos.</h2>
        <div className="workflow">
          {[
            "Create Project",
            "Generate AI Content",
            "Analyze",
            "Save Draft",
            "Collaborate",
            "Export Report",
          ].map((x, i) => (
            <div key={x}>
              <small>0{i + 1}</small>
              <b>{x}</b>
            </div>
          ))}
        </div>
      </section>
      <section id="ai" className="cta">
        <div>
          <label>READY TO CREATE?</label>
          <h2>Your next great piece of content starts here.</h2>
        </div>
        <button className="big" onClick={() => nav("/signup")}>
          Launch CreatorOS <ArrowRight size={17} />
        </button>
      </section>
      <footer>© 2026 CreatorOS AI · Final Year Full-Stack Project</footer>
    </div>
  );
}

function Auth({ mode }) {
  const { setUser } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const r = await api.post("/auth/" + mode, f);
      localStorage.setItem("cos_token", r.data.token);
      localStorage.setItem("cos_user", JSON.stringify(r.data.user));
      setUser(r.data.user);
      nav(r.data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (e) {
      setErr(
        e.response?.data?.error ||
          "Cannot reach the CreatorOS server. Start the backend and try again.",
      );
    }
  };
  return (
    <div className="auth">
      <div className="auth-left">
        <Brand />
        <h1>
          Turn ideas into
          <br />
          <span>content.</span>
        </h1>
        <p>AI-powered creation, workflow and analytics for modern creators.</p>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <h2>
          {mode === "login" ? "Welcome back" : "Create your creator account"}
        </h2>
        <p>
          {mode === "login"
            ? "Continue your creator workflow."
            : "Start building your content system."}
        </p>
        {mode === "signup" && (
          <input
            placeholder="Creator name"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={f.password}
          onChange={(e) => setF({ ...f, password: e.target.value })}
          required
        />
        {err && <div className="error">{err}</div>}
        <button type="submit">
          {mode === "login" ? "Log in" : "Create account"}{" "}
          <ArrowRight size={15} />
        </button>
        <p className="switch">
          {mode === "login" ? (
            <>
              New here? <Link to="/signup">Create account</Link>
            </>
          ) : (
            <>
              Already registered? <Link to="/login">Log in</Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}

function Shell() {
  const { user, dark, setDark, setUser } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const logout = () => {
    localStorage.removeItem("cos_token");
    localStorage.removeItem("cos_user");
    setUser(null);
    nav("/");
  };
  const creatorItems = [
    ["/dashboard", "Dashboard", LayoutDashboard],
    ["/workspace", "AI Workspace", Sparkles],
    ["/drafts", "Drafts", FileText],
    ["/analytics", "Analytics", BarChart3],
    ["/collaborations", "Collaborate", Users],
    ["/profile", "Profile", UserCircle],
    ["/settings", "Settings", SettingsIcon],
  ];
  const isAdmin = user?.role === "admin";
  const isWorkspace = loc.pathname.startsWith("/workspace");
  return (
    <div
      className={
        "shell " +
        (isAdmin ? "admin-shell " : "") +
        (isWorkspace ? "workspace-shell" : "")
      }
    >
      <aside className={open ? "open" : ""}>
        <div className="side-brand">
          <Brand admin={isAdmin} />
          <button className="x" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <small>{isAdmin ? "KRYNX COMMAND CENTER" : "CREATOR WORKSPACE"}</small>
        {isAdmin && (
          <Link
            className={loc.pathname.startsWith("/admin") ? "active" : ""}
            onClick={() => setOpen(false)}
            to="/admin"
          >
            <ShieldCheck size={17} />
            Admin Command Center
          </Link>
        )}
        {creatorItems.map(([p, t, I]) => (
          <Link
            key={p}
            className={loc.pathname.startsWith(p) ? "active" : ""}
            onClick={() => setOpen(false)}
            to={p}
          >
            <I size={17} />
            {t}
          </Link>
        ))}
        <div className="bottom">
          <button onClick={() => setDark(!dark)}>
            {dark ? <Sun size={17} /> : <Moon size={17} />}{" "}
            {dark ? "Light Mode" : "Dark Mode"}
          </button>
          <button onClick={logout}>
            <LogOut size={17} />
            Logout
          </button>
          <div className="user">
            <span>{user?.name?.[0]?.toUpperCase()}</span>
            <div>
              <b>{user?.name}</b>
              <small>{user?.email}</small>
            </div>
          </div>
        </div>
      </aside>
      <main>
        <header>
          <button className="menu" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <span>
            {isAdmin ? "KRYNX / " : "CreatorOS / "}
            <b>{loc.pathname.split("/")[1]}</b>
          </span>
          <div>
            <button className="icon" onClick={() => setDark(!dark)}>
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <span className="avatar">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
        </header>
        <div className={isWorkspace ? "content workspace-content" : "content"}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/workspace/:id" element={<Workspace />} />
            <Route path="/drafts" element={<Drafts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/collaborations" element={<Collab />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/admin"
              element={
                isAdmin ? <Admin /> : <Navigate to="/dashboard" replace />
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function Head({ title, desc, children }) {
  return (
    <div className="head">
      <div>
        <label>CREATOROS AI</label>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      {children}
    </div>
  );
}
function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const nav = useNavigate();
  useEffect(() => {
    api.get("/projects").then((r) => setProjects(r.data.projects));
    api.get("/analytics").then((r) => setStats(r.data));
  }, []);
  const create = async () => {
    if (!name.trim()) return;
    const r = await api.post("/projects", { name, niche: "Creator Content" });
    setProjects([r.data.project, ...projects]);
    setName("");
    setShow(false);
  };
  return (
    <>
      <Head
        title="Your creator workspace."
        desc="Plan, create, analyze and collaborate in one place."
      >
        <button onClick={() => setShow(true)}>
          <Plus size={16} /> Create Project
        </button>
      </Head>
      {show && (
        <Modal title="Create project" close={() => setShow(false)}>
          <input
            autoFocus
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="full" onClick={create}>
            Create Project
          </button>
        </Modal>
      )}
      <div className="stats">
        {[
          ["Projects", projects.length],
          ["Drafts", stats?.drafts ?? 0],
          ["AI Generations", stats?.generations ?? 0],
          ["Collaborations", stats?.collaborations ?? 0],
        ].map((x) => (
          <div key={x[0]}>
            <span>{x[0]}</span>
            <strong>{x[1]}</strong>
            <small>Live from your account</small>
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Recent Projects</h3>
              <p>Continue creating.</p>
            </div>
            <button className="text" onClick={() => nav("/workspace")}>
              Open Workspace <ArrowRight size={14} />
            </button>
          </div>
          {projects.length === 0 ? (
            <div className="empty">Create your first project.</div>
          ) : (
            projects.map((p) => (
              <div
                className="row"
                key={p.id}
                onClick={() => nav("/workspace/" + p.id)}
              >
                <span className="project-icon">✦</span>
                <div>
                  <b>{p.name}</b>
                  <small>
                    {p.niche} · {new Date(p.updatedAt).toLocaleDateString()}
                  </small>
                </div>
                <em>{p.status}</em>
                <ArrowRight size={15} />
              </div>
            ))
          )}
        </section>
        <section className="panel ai-box">
          <label>AI ASSISTANT</label>
          <h2>What are you creating today?</h2>
          <p>Start with an idea and turn it into publish-ready content.</p>
          <button onClick={() => nav("/workspace")}>
            Open Full-Screen AI <Sparkles size={16} />
          </button>
        </section>
      </div>
    </>
  );
}

function Workspace() {
  const { id: projectId } = useParams();
  const { setUser } = useApp();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hey! I’m CreatorOS AI. Tell me what you want to create and I’ll generate a creator-ready direction. ✨",
    },
  ]);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("idea");
  const [focusMode, setFocusMode] = useState(false);
  const [projectName, setProjectName] = useState("New project");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!projectId) {
      setProjectName("New project");
      return;
    }
    api
      .get("/projects")
      .then((response) => {
        const project = response.data.projects.find(
          (entry) => entry.id === projectId,
        );
        setProjectName(project?.name || "Project not found");
      })
      .catch(() => setProjectName("Project unavailable"));
  }, [projectId]);
  const generateResponse = async (prompt, addUserMessage = true) => {
    if (!prompt.trim() || loading) return;
    if (addUserMessage) {
      setMessages((items) => [...items, { role: "user", text: prompt }]);
      setInput("");
    }
    setNotice("");
    setLoading(true);
    try {
      const r = await api.post("/ai/generate", { type, prompt });
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: r.data.text,
          score: r.data.score,
          warning: r.data.warning,
        },
      ]);
      setScore(r.data.score);
      if (r.data.warning) setNotice(r.data.warning);
      else if (r.data.provider === "local-fallback") {
        setNotice(
          "Gemini API key is not configured; a local fallback response was used.",
        );
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: e.response?.data?.error || "AI generation failed. Try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  const generate = () => generateResponse(input);
  const clearConversation = () => {
    setMessages([
      {
        role: "ai",
        text: "Conversation cleared. What would you like to create next?",
      },
    ]);
    setScore(null);
    setNotice("");
  };
  const logout = () => {
    localStorage.removeItem("cos_token");
    localStorage.removeItem("cos_user");
    setUser(null);
    navigate("/");
  };
  const regenerate = () => {
    const lastPrompt = [...messages]
      .reverse()
      .find((item) => item.role === "user");
    if (lastPrompt) generateResponse(lastPrompt.text, false);
  };
  const save = async () => {
    const last = [...messages].reverse().find((x) => x.role === "ai");
    if (!last || loading) return;
    try {
      await api.post("/drafts", {
        title:
          projectName === "New project" ? "AI Workspace Draft" : projectName,
        type,
        content: last.text,
        score: last.score?.overall || score?.overall || 0,
      });
      setNotice("Draft saved to your library.");
    } catch (e) {
      setNotice(e.response?.data?.error || "Could not save the draft.");
    }
  };
  return (
    <div className="ai-studio">
      <div className="studio-top">
        <div className="studio-project">
          <button
            className="studio-brand"
            onClick={() => navigate("/dashboard")}
            title="Back to dashboard"
          >
            <Sparkles size={18} /> CreatorOS AI Studio
          </button>
          <span className="studio-project-name">{projectName}</span>
        </div>
        <div className="studio-actions">
          <button className="secondary" onClick={save}>
            <Save size={14} />{" "}
            <span className="studio-action-label">Save Draft</span>
          </button>
          <button
            className="icon"
            onClick={clearConversation}
            title="Clear conversation"
            aria-label="Clear conversation"
          >
            <Trash2 size={16} />
          </button>
          <button
            className="secondary focus-toggle"
            onClick={() => setFocusMode((enabled) => !enabled)}
          >
            <Command size={15} />
            <span className="studio-action-label">
              {focusMode ? "Exit Focus" : "Focus Mode"}
            </span>
          </button>
          <button
            className="icon"
            onClick={logout}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
      <div className={"studio-body " + (focusMode ? "focus-mode" : "")}>
        {!focusMode && (
          <aside className="studio-tools">
            <div className="studio-section">
              <label>AI TOOLS</label>
              {[
                ["idea", "Content Ideas"],
                ["hook", "Hook Generator"],
                ["caption", "Caption Generator"],
                ["script", "Script Generator"],
                ["hashtag", "Hashtag Generator"],
                ["analyze", "Engagement Analysis"],
              ].map((x) => (
                <button
                  key={x[0]}
                  className={type === x[0] ? "selected" : ""}
                  onClick={() => setType(x[0])}
                >
                  <Sparkles size={14} />
                  {x[1]}
                </button>
              ))}
            </div>
            <div className="studio-tip">
              <b>Prompt tip</b>
              <p>Be specific about your audience, platform, tone and goal.</p>
            </div>
          </aside>
        )}
        <section className="studio-chat">
          <div className="chat-title">
            <div>
              <b>{projectName}</b>
              <small>CreatorOS AI conversation</small>
            </div>
            <span className="online">
              <i /> AI ONLINE
            </span>
          </div>
          {notice && (
            <div className="studio-notice" role="status">
              {notice}
            </div>
          )}
          <div className="messages">
            {(() => {
              const lastAi = messages.reduce(
                (lastIndex, item, index) =>
                  item.role === "ai" ? index : lastIndex,
                -1,
              );
              const hasPrompt = messages.some((item) => item.role === "user");
              return messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "msg user" : "msg"}>
                  <span>{m.role === "user" ? "You" : "✦"}</span>
                  <div className="message-content">
                    <p>{m.text}</p>
                    {m.warning && (
                      <small className="message-warning">{m.warning}</small>
                    )}
                    {m.role === "ai" && (
                      <div className="message-actions">
                        <button
                          className="copy"
                          onClick={() => navigator.clipboard?.writeText(m.text)}
                        >
                          <Copy size={12} /> Copy
                        </button>
                        {i === lastAi && hasPrompt && (
                          <>
                            <button
                              className="copy"
                              onClick={regenerate}
                              disabled={loading}
                            >
                              <RefreshCw size={12} /> Regenerate
                            </button>
                            <button
                              className="copy"
                              onClick={save}
                              disabled={loading}
                            >
                              <Save size={12} /> Save draft
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ));
            })()}
            {loading && (
              <div className="msg">
                <span>✦</span>
                <p className="typing">
                  Thinking<span>...</span>
                </p>
              </div>
            )}
          </div>
          <div className="composer-wrap">
            <div className="composer">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    generate();
                  }
                }}
                placeholder="Tell CreatorOS AI what you want to create…"
              />
              <button onClick={generate} disabled={loading}>
                <Send size={17} />
              </button>
            </div>
            <small>Enter to generate · Shift + Enter for a new line</small>
          </div>
        </section>
        {!focusMode && (
          <aside className="studio-insights">
            <section className="insight-card">
              <label>ENGAGEMENT INTELLIGENCE</label>
              <h3>Content Score</h3>
              <div className="score">
                {score?.overall || "—"}
                <small>/100</small>
              </div>
              {score &&
                [
                  ["Hook Strength", score.hook],
                  ["Emotion", score.emotion],
                  ["Readability", score.readability],
                  ["CTA", score.cta],
                ].map((x) => (
                  <div className="metric" key={x[0]}>
                    <span>{x[0]}</span>
                    <b>{x[1]}%</b>
                    <i>
                      <em style={{ width: x[1] + "%" }} />
                    </i>
                  </div>
                ))}
              {score && (
                <div className="insight">
                  <b>Improvement suggestions</b>
                  <ul>
                    {(score.improvementSuggestions || [score.suggestion]).map(
                      (suggestion) => (
                        <li key={suggestion}>{suggestion}</li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            </section>
            <section className="insight-card">
              <label>QUICK PROMPT</label>
              <p>“Give me 5 hooks for my daily college vlog.”</p>
              <button
                className="secondary full"
                onClick={() =>
                  setInput("Give me 5 hooks for my daily college vlog.")
                }
              >
                Use Prompt
              </button>
            </section>
          </aside>
        )}
      </div>
    </div>
  );
}

function Drafts() {
  const [drafts, setDrafts] = useState([]);
  const [q, setQ] = useState("");
  const load = () => api.get("/drafts").then((r) => setDrafts(r.data.drafts));
  useEffect(load, []);
  const del = async (id) => {
    await api.delete("/drafts/" + id);
    load();
  };
  return (
    <>
      <Head
        title="Draft library"
        desc="Save, search and refine everything you create."
      >
        <button onClick={() => (location.href = "/workspace")}>
          <Plus size={16} /> New Draft
        </button>
      </Head>
      <div className="search">
        <Search size={15} />
        <input
          placeholder="Search drafts…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="cards">
        {drafts
          .filter((d) =>
            (d.title + d.content).toLowerCase().includes(q.toLowerCase()),
          )
          .map((d) => (
            <article className="draft" key={d.id}>
              <div>
                <label>{d.type}</label>
                <button className="icon" onClick={() => del(d.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
              <h3>{d.title}</h3>
              <p>{d.content}</p>
              <footer>
                <span>Score {d.score}</span>
                <button
                  className="secondary"
                  onClick={() => navigator.clipboard?.writeText(d.content)}
                >
                  <Copy size={13} /> Copy
                </button>
              </footer>
            </article>
          ))}
      </div>
    </>
  );
}
function Analytics() {
  const [a, setA] = useState(null);
  useEffect(() => {
    api.get("/analytics").then((r) => setA(r.data));
  }, []);
  const pdf = async () => {
    const r = await api.get("/reports/pdf", { responseType: "blob" });
    const u = URL.createObjectURL(r.data);
    const el = document.createElement("a");
    el.href = u;
    el.download = "CreatorOS-Report.pdf";
    el.click();
    URL.revokeObjectURL(u);
  };
  return (
    <>
      <Head
        title="Creator analytics"
        desc="Understand your workflow and content performance."
      >
        <button onClick={pdf}>
          <Download size={15} /> Export PDF
        </button>
      </Head>
      <div className="stats">
        {[
          ["Projects", a?.projects || 0],
          ["Drafts", a?.drafts || 0],
          ["AI Generations", a?.generations || 0],
          ["Collaborations", a?.collaborations || 0],
        ].map((x) => (
          <div key={x[0]}>
            <span>{x[0]}</span>
            <strong>{x[1]}</strong>
            <small>Live from API</small>
          </div>
        ))}
      </div>
      <section className="panel">
        <h3>Creator Activity</h3>
        <div className="activity">
          {a?.activity
            ?.slice()
            .reverse()
            .map((x, i) => (
              <div key={i}>
                <TrendingUp size={15} />
                <span>{x.type || x.event}</span>
                <small>{new Date(x.createdAt).toLocaleString()}</small>
              </div>
            ))}
        </div>
      </section>
    </>
  );
}
function Collab() {
  const [members, setMembers] = useState([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [socketError, setSocketError] = useState("");
  const socketRef = useRef(null);
  useEffect(() => {
    api.get("/collaborations").then((r) => setMembers(r.data.collaborations));
    api.get("/collaborations/messages").then((r) => setMsgs(r.data.messages));
    const socket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem("cos_token") },
    });
    socketRef.current = socket;
    socket.on("connect", () => setSocketError(""));
    socket.on("connect_error", (error) => {
      setSocketError(error.message || "Realtime collaboration is unavailable.");
    });
    socket.on("chat-message", (message) =>
      setMsgs((current) => [...current, message]),
    );
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);
  const invite = async () => {
    if (!name) return;
    const r = await api.post("/collaborations/invite", { name });
    setMembers([...members, r.data.collaboration]);
    setName("");
  };
  const sendMessage = () => {
    const text = msg.trim();
    if (!text) return;
    const socket = socketRef.current;
    if (!socket?.connected) {
      setSocketError("Realtime collaboration is not connected. Retry shortly.");
      return;
    }
    socket.emit("chat-message", { text }, (result) => {
      if (result?.error) setSocketError(result.error);
      else setSocketError("");
    });
    setMsg("");
  };
  return (
    <>
      <Head
        title="Collaboration"
        desc="Invite teammates and keep creator conversations together."
      >
        <div className="invite">
          <input
            placeholder="Member name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={invite}>
            <Plus size={15} /> Invite
          </button>
        </div>
      </Head>
      <div className="collab">
        <section className="panel">
          <h3>Team members</h3>
          {members.map((m) => (
            <div className="member" key={m.id}>
              <span>{m.name[0]}</span>
              <div>
                <b>{m.name}</b>
                <small>
                  {m.role} · {m.status}
                </small>
              </div>
            </div>
          ))}
          {!members.length && (
            <div className="empty">No collaborators yet.</div>
          )}
        </section>
        <section className="panel chat-room">
          <h3>Creator Room</h3>
          <div>
            {msgs.map((message) => (
              <p key={message.id}>
                <b>{message.userName || "Creator"}:</b> {message.text}
              </p>
            ))}
          </div>
          {socketError && (
            <div className="error" role="alert">
              {socketError}
            </div>
          )}
          <div className="room">
            <input
              placeholder="Message your team…"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>
              <Send size={15} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
function Profile() {
  const { user, setUser } = useApp();
  const [name, setName] = useState(user?.name || "");
  const [error, setError] = useState("");
  return (
    <>
      <Head title="Creator profile" desc="Manage your creator identity." />
      <section className="panel profile">
        <span className="profile-avatar">{name[0]}</span>
        <h2>{name}</h2>
        <p>{user?.email}</p>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <button
          onClick={async () => {
            setError("");
            try {
              const response = await api.patch("/me/profile", { name });
              localStorage.setItem(
                "cos_user",
                JSON.stringify(response.data.user),
              );
              setUser(response.data.user);
            } catch (e) {
              setError(
                e.response?.data?.error || "Could not save your profile.",
              );
            }
          }}
        >
          <Save size={15} /> Save Profile
        </button>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
      </section>
    </>
  );
}
function Settings() {
  const { dark, setDark } = useApp();
  return (
    <>
      <Head title="Settings" desc="Control your CreatorOS experience." />
      <section className="panel settings">
        <div>
          <h3>Appearance</h3>
          <p>Switch between dark and light mode.</p>
        </div>
        <button className="secondary" onClick={() => setDark(!dark)}>
          {dark ? <Sun size={15} /> : <Moon size={15} />}{" "}
          {dark ? "Light" : "Dark"} Mode
        </button>
      </section>
    </>
  );
}

function Admin() {
  const [data, setData] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const [o, a] = await Promise.all([
        api.get("/admin/overview"),
        api.get("/admin/activity"),
      ]);
      setData(o.data);
      setActivity(a.data.activity);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <div className="admin-page">
      <div className="admin-hero">
        <div>
          <div className="admin-kicker">
            <ShieldCheck size={16} /> KRYNX ADMIN CONTROL
          </div>
          <h1>Team Command Center</h1>
          <p>
            See who joined, what they are creating, and how the platform is
            being used.
          </p>
        </div>
        <button className="admin-refresh" onClick={load}>
          <RefreshCw size={15} /> {loading ? "Refreshing…" : "Refresh data"}
        </button>
      </div>
      <div className="admin-stats">
        {[
          ["People Joined", data?.totals.users || 0, Users],
          ["Projects", data?.totals.projects || 0, FolderKanban],
          ["AI Generations", data?.totals.generations || 0, Sparkles],
          ["Drafts", data?.totals.drafts || 0, FileText],
          ["Collaborations", data?.totals.collaborations || 0, UserPlus],
        ].map(([label, value, I]) => (
          <div className="admin-stat" key={label}>
            <span>
              <I size={17} />
              {label}
            </span>
            <strong>{value}</strong>
            <small>Live platform data</small>
          </div>
        ))}
      </div>
      <div className="admin-grid">
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <label>CREATOR TEAM</label>
              <h2>People using CreatorOS</h2>
            </div>
            <span className="live-pill">
              <i /> LIVE
            </span>
          </div>
          <div className="team-table">
            <div className="table-head">
              <span>Creator</span>
              <span>Projects</span>
              <span>Drafts</span>
              <span>AI Uses</span>
              <span>Joined</span>
              <span>Last Active</span>
            </div>
            {data?.recentUsers?.map((u) => (
              <div className="table-row" key={u.id}>
                <div className="creator-cell">
                  <span>{u.name?.[0]?.toUpperCase()}</span>
                  <div>
                    <b>{u.name}</b>
                    <small>{u.email}</small>
                  </div>
                </div>
                <b>{u.projects}</b>
                <b>{u.drafts}</b>
                <b>{u.generations}</b>
                <small>
                  {u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString()
                    : "—"}
                </small>
                <small>
                  {u.lastActiveAt
                    ? new Date(u.lastActiveAt).toLocaleString()
                    : "—"}
                </small>
              </div>
            ))}
            {!data?.recentUsers?.length && (
              <div className="empty">No creators have joined yet.</div>
            )}
          </div>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <label>PROJECT MONITOR</label>
              <h2>What creators are building</h2>
            </div>
            <FolderKanban size={18} />
          </div>
          <div className="admin-projects">
            {data?.recentProjects?.map((p) => (
              <div key={p.id}>
                <span className="project-dot">✦</span>
                <div>
                  <b>{p.name}</b>
                  <small>
                    {p.userName} · {p.userEmail}
                  </small>
                </div>
                <em>{p.status}</em>
              </div>
            ))}
            {!data?.recentProjects?.length && (
              <div className="empty">
                Projects will appear here as creators start building.
              </div>
            )}
          </div>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <label>AI USAGE</label>
              <h2>Recent generations</h2>
            </div>
            <Sparkles size={18} />
          </div>
          <div className="admin-projects">
            {data?.recentGenerations?.map((generation) => (
              <div key={generation.id}>
                <span className="project-dot">
                  <Sparkles size={14} />
                </span>
                <div>
                  <b>{generation.type}</b>
                  <small>
                    {generation.userName} · {generation.userEmail}
                  </small>
                </div>
                <em>{new Date(generation.createdAt).toLocaleDateString()}</em>
              </div>
            ))}
            {!data?.recentGenerations?.length && (
              <div className="empty">AI generations will appear here.</div>
            )}
          </div>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <label>COLLABORATION</label>
              <h2>Recent team activity</h2>
            </div>
            <Users size={18} />
          </div>
          <div className="admin-projects">
            {data?.recentCollaborations?.map((collaboration) => (
              <div key={collaboration.id}>
                <span className="project-dot">
                  <UserPlus size={14} />
                </span>
                <div>
                  <b>{collaboration.name}</b>
                  <small>
                    {collaboration.userName} · {collaboration.userEmail}
                  </small>
                </div>
                <em>{collaboration.status}</em>
              </div>
            ))}
            {!data?.recentCollaborations?.length && (
              <div className="empty">Invitations will appear here.</div>
            )}
          </div>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <label>LIVE ACTIVITY</label>
              <h2>What is happening</h2>
            </div>
            <Activity size={18} />
          </div>
          <div className="admin-activity">
            {activity.slice(0, 18).map((x, i) => (
              <div key={i}>
                <span className="activity-dot" />
                <div>
                  <b>{x.userName}</b> <span>{x.type || x.event}</span>
                  <small>
                    {x.userEmail} · {new Date(x.createdAt).toLocaleString()}
                  </small>
                </div>
              </div>
            ))}
            {!activity.length && (
              <div className="empty">
                Activity will appear as creators use AI tools.
              </div>
            )}
          </div>
        </section>
      </div>
      <div className="admin-note">
        <ShieldCheck size={18} />
        <div>
          <b>Admin access</b>
          <p>
            This command center is visible only to the KRYNX admin account.
            Creator accounts cannot access these platform-wide metrics.
          </p>
        </div>
      </div>
    </div>
  );
}
function Modal({ title, close, children }) {
  return (
    <div className="modal-bg" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div>
          <h3>{title}</h3>
          <button className="icon" onClick={close}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function App() {
  const { user, apiError, setApiError } = useApp();
  return (
    <>
      {apiError && (
        <div className="api-error-banner" role="alert">
          <span>{apiError}</span>
          <button onClick={() => setApiError("")} aria-label="Dismiss error">
            <X size={15} />
          </button>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/signup" element={<Auth mode="signup" />} />
        <Route
          path="/*"
          element={user ? <Shell /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </>
  );
}
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Provider>
      <App />
    </Provider>
  </BrowserRouter>,
);

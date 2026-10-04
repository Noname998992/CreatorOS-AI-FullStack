import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(
  process.env.CREATOROS_DATA_FILE ||
    path.resolve(__dirname, "../../data/db.json"),
);
const seed = {
  users: [],
  projects: [],
  drafts: [],
  messages: [],
  generations: [],
  analytics: [],
  collaborations: [],
};
export function read() {
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(seed, null, 2));
  }
  const stored = JSON.parse(fs.readFileSync(file, "utf8"));
  return Object.fromEntries(
    Object.entries(seed).map(([key, defaultValue]) => [
      key,
      Array.isArray(stored[key]) ? stored[key] : defaultValue,
    ]),
  );
}
export function write(db) {
  fs.writeFileSync(file, JSON.stringify(db, null, 2));
}
export function id() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

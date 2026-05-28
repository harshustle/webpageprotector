import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { ShortenedUrl, ShortenedUrlPublicInfo } from "./src/types";

export const app = express();
const PORT = 3000;
const DB_FILE = process.env.VERCEL
  ? "/tmp/db.json"
  : path.join(process.cwd(), "db.json");

app.use(express.json());

// Simple Local JSON DB Loader/Saver
function readDb(): Record<string, ShortenedUrl> {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading database file:", err);
  }
  return {};
}

function writeDb(data: Record<string, ShortenedUrl>) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// Reserved paths that cannot be used as Custom Short IDs to make sure system routing survives perfectly
const RESERVED_IDS = new Set([
  "api",
  "assets",
  "src",
  "index.html",
  "main.tsx",
  "favicon.ico",
  "vite",
  "package.json",
  "db.json",
  "static",
]);

// Alphanumeric Short ID Generator
function generateRandomId(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(crypto.randomInt(chars.length));
  }
  return result;
}

// Hashing Helpers using Node standard cryptographically secure scryptSync
function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const checkHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return checkHash === hash;
}

// Ensure DB file exists
if (!fs.existsSync(DB_FILE)) {
  writeDb({});
}

// ==========================================
// API Endpoints
// ==========================================

// 1. Create Short URL
app.post("/api/shorten", (req, res) => {
  const { originalUrl, password, customId, title } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: "Original URL is required." });
  }

  // Basic URL validation
  let sanitizedUrl = originalUrl.trim();
  if (!/^https?:\/\//i.test(sanitizedUrl)) {
    sanitizedUrl = "http://" + sanitizedUrl;
  }

  try {
    new URL(sanitizedUrl); // Parse test
  } catch {
    return res.status(400).json({ error: "Invalid URL format provided." });
  }

  const db = readDb();
  let shortId = "";

  if (customId) {
    const cleanedCustom = customId.trim().toLowerCase();
    
    // Validation for custom name
    if (!/^[a-zA-Z0-9\-_]{3,20}$/.test(cleanedCustom)) {
      return res.status(400).json({
        error: "Custom alias must be 3-20 characters long and contain only alphanumeric, hyphens or underscores.",
      });
    }

    if (RESERVED_IDS.has(cleanedCustom)) {
      return res.status(400).json({ error: "This alias is a reserved path name. Please choose another one." });
    }

    if (db[cleanedCustom]) {
      return res.status(400).json({ error: "This custom alias is already in use. Try something else." });
    }

    shortId = cleanedCustom;
  } else {
    // Keep generating random ID until a unique one is found
    let attempts = 0;
    do {
      shortId = generateRandomId();
      attempts++;
    } while (db[shortId] && attempts < 100);

    if (attempts >= 100) {
      return res.status(500).json({ error: "Could not generate a unique short ID. Please try again." });
    }
  }

  // Process Password
  let passwordHash = "";
  let salt = "";
  if (password && password.trim().length > 0) {
    const passInfo = hashPassword(password);
    passwordHash = passInfo.hash;
    salt = passInfo.salt;
  }

  // Build the record
  const record: ShortenedUrl = {
    id: shortId,
    originalUrl: sanitizedUrl,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
    visitCount: 0,
    title: title?.trim() || `Link to ${new URL(sanitizedUrl).hostname}`,
  };

  db[shortId] = record;
  writeDb(db);

  const publicInfo: ShortenedUrlPublicInfo = {
    id: record.id,
    createdAt: record.createdAt,
    visitCount: record.visitCount,
    title: record.title,
    hasPassword: !!passwordHash,
  };

  return res.status(201).json({
    success: true,
    data: publicInfo,
  });
});

// 2. Fetch Short URL Public Status Info
app.get("/api/info/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const record = db[id];

  if (!record) {
    return res.status(404).json({ error: "Shortened link not found." });
  }

  const publicInfo: ShortenedUrlPublicInfo = {
    id: record.id,
    createdAt: record.createdAt,
    visitCount: record.visitCount,
    title: record.title,
    hasPassword: !!record.passwordHash,
  };

  return res.json(publicInfo);
});

// 3. Verify Password and retrieve Original URL for redirection
app.post("/api/verify", (req, res) => {
  const { id, password } = req.body;
  const db = readDb();
  const record = db[id];

  if (!record) {
    return res.status(404).json({ error: "Shortened link not found." });
  }

  // If password-protected
  if (record.passwordHash) {
    if (!password) {
      return res.status(401).json({ error: "Password is required for this protected link." });
    }

    const isValid = verifyPassword(password, record.passwordHash, record.salt);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid password. Access denied." });
    }
  }

  // Success - increment and save
  record.visitCount += 1;
  db[id] = record;
  writeDb(db);

  return res.json({
    success: true,
    originalUrl: record.originalUrl,
  });
});

// ==========================================
// Local / Dev server start logic
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const viteMod = "vite";
    const { createServer: createViteServer } = await import(viteMod);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Password-Protected URL Shortener is running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

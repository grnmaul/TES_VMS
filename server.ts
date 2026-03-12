import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("vms.db");
const JWT_SECRET = process.env.JWT_SECRET || "vms-secret-key-2024";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user',
    full_name TEXT
  );

  CREATE TABLE IF NOT EXISTS cameras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    location TEXT,
    ip_address TEXT,
    status TEXT DEFAULT 'online',
    stream_url TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    message TEXT,
    type TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0
  );
`);

// Seed initial admin if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)").run(
    "admin",
    hashedPassword,
    "admin",
    "System Administrator"
  );
}

// Seed initial user if not exists
const userExists = db.prepare("SELECT * FROM users WHERE username = ?").get("user");
if (!userExists) {
  const hashedPassword = bcrypt.hashSync("user123", 10);
  db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)").run(
    "user",
    hashedPassword,
    "user",
    "Regular User"
  );
}

// Seed some cameras if empty
const cameraCount = db.prepare("SELECT COUNT(*) as count FROM cameras").get() as { count: number };
if (cameraCount.count === 0) {
  const cameras = [
    { name: "Jembatan Lawu", location: "Jl. Lawu", ip_address: "192.168.1.101", status: "online" },
    { name: "Sleko Arah Tugu", location: "Jl. Sleko", ip_address: "192.168.1.102", status: "online" },
    { name: "MT Haryono Sumber Karya", location: "Jl. MT Haryono", ip_address: "192.168.1.103", status: "offline" },
    { name: "Penyebrangan Kasih Sayang PSC", location: "Pahlawan Street Center", ip_address: "192.168.1.104", status: "online" },
  ];
  const insert = db.prepare("INSERT INTO cameras (name, location, ip_address, status) VALUES (?, ?, ?, ?)");
  cameras.forEach(c => insert.run(c.name, c.location, c.ip_address, c.status));
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  app.use(express.json());

  // Socket.io connection
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("disconnect", () => console.log("Client disconnected"));
  });

  // Auth Routes
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name } });
  });

  app.post("/api/auth/register", (req, res) => {
    const { username, password, full_name } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare("INSERT INTO users (username, password, full_name) VALUES (?, ?, ?)").run(
        username,
        hashedPassword,
        full_name
      );
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.post("/api/auth/forgot-password", (req, res) => {
    const { username } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // In a real app, you would send an email here.
    // For this demo, we just return success.
    res.json({ success: true, message: "Recovery instructions sent" });
  });

  // Camera Routes
  app.get("/api/cameras", (req, res) => {
    const cameras = db.prepare("SELECT * FROM cameras").all();
    res.json(cameras);
  });

  app.post("/api/cameras", (req, res) => {
    const { name, location, ip_address, status } = req.body;
    const result = db.prepare("INSERT INTO cameras (name, location, ip_address, status) VALUES (?, ?, ?, ?)").run(
      name, location, ip_address, status || 'online'
    );
    const newCamera = { id: result.lastInsertRowid, name, location, ip_address, status: status || 'online' };
    io.emit("camera:created", newCamera);
    res.json(newCamera);
  });

  app.put("/api/cameras/:id", (req, res) => {
    const { id } = req.params;
    const { name, location, ip_address, status } = req.body;
    db.prepare("UPDATE cameras SET name = ?, location = ?, ip_address = ?, status = ? WHERE id = ?").run(
      name, location, ip_address, status, id
    );
    const updatedCamera = { id: parseInt(id), name, location, ip_address, status };
    io.emit("camera:updated", updatedCamera);
    res.json(updatedCamera);
  });

  app.delete("/api/cameras/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM cameras WHERE id = ?").run(id);
    io.emit("camera:deleted", { id: parseInt(id) });
    res.json({ success: true });
  });

  // Notification Routes
  app.get("/api/notifications", (req, res) => {
    const notifications = db.prepare("SELECT * FROM notifications ORDER BY timestamp DESC").all();
    res.json(notifications);
  });

  app.post("/api/notifications", (req, res) => {
    const { title, message, type } = req.body;
    const result = db.prepare("INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)").run(
      title, message, type
    );
    const newNotification = db.prepare("SELECT * FROM notifications WHERE id = ?").get(result.lastInsertRowid);
    io.emit("notification:new", newNotification);
    res.json(newNotification);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Serve index.html for SPA routing
    app.get("*", async (req, res) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        res.status(500).end((e as Error).message);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

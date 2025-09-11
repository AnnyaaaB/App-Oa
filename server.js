const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");
const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcrypt"); // optional for password hashing

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ====== DATABASE CONNECTION ======
const pool = new Pool({
  user: "riyabasak_15",
  host: "localhost",
  database: "apple_oats",
  password: "",
  port: 5433,
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL on port 5433"))
  .catch(err => console.error("❌ DB connection error:", err));

// ====== GOOGLE AUTH CONFIG ======
const GOOGLE_CLIENT_ID = "64957875744-057g1qrth22vllpmvgobf4untdfhhela.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// ====== AUTH MIDDLEWARE ======
async function authMiddleware(req, res, next) {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE id=$1", [userId]);
    if (result.rows.length === 0) return res.status(401).json({ success: false, error: "User not found" });
    req.user = result.rows[0];
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ====== AUTH ENDPOINTS ======

// Normal signup
app.post("/signup", async (req, res) => {
  try {
    const { name, email, pw, avatar } = req.body;

    const existing = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (existing.rows.length > 0) return res.status(400).json({ success: false, error: "Email already exists" });

    // Optional: hash password
    const hashedPw = pw ? await bcrypt.hash(pw, 10) : null;

    const result = await pool.query(
      `INSERT INTO users (name, email, pw, avatar)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, avatar`,
      [name, email, hashedPw, avatar || "./assets/plants.png"]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Normal signin
app.post("/signin", async (req, res) => {
  try {
    const { email, pw } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const user = result.rows[0];

    if (user.pw) {
      const match = await bcrypt.compare(pw, user.pw);
      if (!match) return res.status(401).json({ success: false, message: "Invalid credentials" });
    } else {
      return res.status(401).json({ success: false, message: "Sign in using Google" });
    }

    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Google OAuth - LOGIN ONLY if already signed up
app.post("/google-auth", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ success: false, error: "Missing Google credential" });

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const email = payload.email;

    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: "You must sign up with Google first" });
    }

    const user = result.rows[0];
    if (user.pw !== null) {
      return res.status(401).json({ success: false, error: "Please sign in using email/password" });
    }

    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(400).json({ success: false, error: "Google authentication failed" });
  }
});

// Profile update
app.post("/update-profile", authMiddleware, async (req, res) => {
  try {
    const { name, email, pw, avatar } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (name) { updates.push(`name=$${idx++}`); values.push(name); }
    if (email) { updates.push(`email=$${idx++}`); values.push(email); }
    if (pw) { 
      const hashedPw = await bcrypt.hash(pw, 10);
      updates.push(`pw=$${idx++}`); 
      values.push(hashedPw);
    }
    if (avatar) { updates.push(`avatar=$${idx++}`); values.push(avatar); }

    if (updates.length === 0) return res.status(400).json({ success: false, error: "Nothing to update" });

    values.push(req.user.id);

    const query = `UPDATE users SET ${updates.join(", ")} WHERE id=$${idx} RETURNING id, name, email, avatar`;
    const result = await pool.query(query, values);
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ====== PLANTS ======
app.get("/plants/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    if (parseInt(userId) !== req.user.id) return res.status(403).json({ success: false, error: "Access denied" });
    const result = await pool.query("SELECT * FROM plants WHERE user_id=$1 ORDER BY created_at DESC", [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/plants", authMiddleware, async (req, res) => {
  try {
    const { name, species, seed, disease, status, description, image, date, key } = req.body;
    const result = await pool.query(
      `INSERT INTO plants (user_id, name, species, seed, disease, status, description, image, date, key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user.id, name, species, seed, disease, status, description, image, date, key]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/plants/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const plant = await pool.query("SELECT * FROM plants WHERE id=$1", [id]);
    if (plant.rows.length === 0 || plant.rows[0].user_id !== req.user.id)
      return res.status(403).json({ success: false, error: "Not allowed" });

    await pool.query("DELETE FROM plants WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ====== CHATS ======
app.get("/chats/:plantId", authMiddleware, async (req, res) => {
  try {
    const { plantId } = req.params;
    const plant = await pool.query("SELECT * FROM plants WHERE id=$1", [plantId]);
    if (plant.rows.length === 0 || plant.rows[0].user_id !== req.user.id)
      return res.status(403).json({ success: false, error: "Access denied" });

    const result = await pool.query("SELECT * FROM chats WHERE plant_id=$1 ORDER BY created_at", [plantId]);
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/chats", authMiddleware, async (req, res) => {
  try {
    const { plant_id, sender, text, time } = req.body;
    const plant = await pool.query("SELECT * FROM plants WHERE id=$1", [plant_id]);
    if (plant.rows.length === 0 || plant.rows[0].user_id !== req.user.id)
      return res.status(403).json({ success: false, error: "Not allowed" });

    const result = await pool.query(
      "INSERT INTO chats (plant_id, sender, text, time) VALUES ($1,$2,$3,$4) RETURNING *",
      [plant_id, sender, text, time]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ====== STATIC FRONTEND ======
app.use(express.static(path.join(__dirname, "public")));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ====== START SERVER ======
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

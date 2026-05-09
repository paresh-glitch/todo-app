// ─────────────────────────────────────────────
// server.js — The main entry point of our backend
// Think of this as the "front door" of our API
// ─────────────────────────────────────────────

const express = require("express"); // Express is the web framework
const mongoose = require("mongoose"); // Mongoose talks to MongoDB
const cors = require("cors"); // CORS lets our frontend talk to this backend

const todoRoutes = require("./routes/todos"); // Our todo API routes (CRUD)

const app = express(); // Create the Express app
const PORT = process.env.PORT || 5000; // Port to listen on (5000 by default)

// ── Middleware ──────────────────────────────
// Middleware = code that runs on every request before it hits your routes

app.use(cors()); // Allow requests from the frontend
app.use(express.json()); // Parse incoming JSON body (so we can read req.body)

// ── Routes ─────────────────────────────────
// Any request to /api/todos is handled by our todoRoutes file
app.use("/api/todos", todoRoutes);

// ── Health Check ────────────────────────────
// ECS uses this to know if the container is alive and healthy
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ── Connect to MongoDB, then start server ───
// MONGO_URI comes from environment variable (set in ECS Task Definition)
// In local Docker: mongodb://127.0.0.1:27017/tododb
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tododb")
  .then(() => {
    console.log("✅ Connected to MongoDB");
    // Only start listening AFTER DB is connected
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // Exit so ECS knows something went wrong
  });

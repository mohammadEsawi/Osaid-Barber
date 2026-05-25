require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();
app.set("trust proxy", 1);

// Security & logging middleware
app.use(helmet());
app.use(morgan("combined"));
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://osaid-barber.vercel.app",
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",").map(o => o.trim()) : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Render health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow any vercel.app preview deployments
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
      success: false,
      message: "محاولات كثيرة جداً، يرجى المحاولة لاحقاً",
    },
  }),
);
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// Static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/services", require("./routes/services"));
app.use("/api/barbers", require("./routes/barbers"));
app.use("/api/appointments", require("./routes/appointments"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/settings", require("./routes/settings"));

app.get("/api/health", async (req, res) => {
  const { query } = require("./config/database");
  try {
    await query("SELECT 1");
    res.json({ success: true, message: "Server is running", db: "connected", timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ success: false, message: "DB error", error: err.message, DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET" });
  }
});

// Error handling
app.use(notFound);
app.use(errorHandler);

async function startServer() {
  const { query } = require("./config/database");
  const fs = require("fs");

  try {
    let schema = fs.readFileSync(path.join(__dirname, "..", "database", "schema.sql"), "utf8");
    schema = schema
      .split("\n")
      .filter(line => !line.startsWith("CREATE DATABASE") && !line.startsWith("\\c"))
      .join("\n");
    await query(schema);
    console.log("✅ Migrations applied.");
  } catch (err) {
    console.error("Migration error:", err.message);
  }

  // تشغيل مهمة تذكيرات WhatsApp
  const { startReminderJob } = require("./jobs/reminderJob");
  await startReminderJob();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Osaid Barber API running on http://localhost:${PORT}`);
  });
}

startServer();
module.exports = app;

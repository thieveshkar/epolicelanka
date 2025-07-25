const express = require("express");
const cors = require("cors");
const session = require("express-session");
require("dotenv").config();
const path = require("path");
const { sequelize } = require("./models");

const app = express();

// CORS config
const corsOptions = {
  origin: process.env.FRONTEND_URL, // e.g., http://localhost:3000 or your Azure domain
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "thisIsASuperSecretJWTKey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 2,
    },
  })
);

// Static files for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/complaints", require("./routes/complaints"));
app.use("/auth", require("./routes/auth"));
app.use("/slots", require("./routes/slots"));
app.use("/police", require("./routes/police"));

// ✅ Serve frontend build files
const clientBuildPath = path.join(__dirname, "dist");
if (process.env.NODE_ENV === "production" && require("fs").existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));

  // React fallback route
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("EPoliceLanka backend is running ✅ (DEV)");
  });
}

const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected successfully.");
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  } catch (err) {
    console.error("❌ Unable to connect to the DB:", err);
  }
});

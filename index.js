const express = require("express");
const cors = require("cors");
const session = require("express-session");
require("dotenv").config();
const path = require("path");
const { sequelize } = require("./models");

const app = express();

// CORS config with credentials for frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL,  
  credentials: true,
};
app.use(cors(corsOptions));

// JSON body parser middleware
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

// Static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/complaints", require("./routes/complaints"));
app.use("/auth", require("./routes/auth"));
app.use("/slots", require("./routes/slots"));
app.use("/police", require("./routes/police"));

const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected successfully.");
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  } catch (err) {
    console.error("❌ Unable to connect to the DB:", err);
  }
});

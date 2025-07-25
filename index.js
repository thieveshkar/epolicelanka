const express = require("express");
const cors = require("cors");
const session = require("express-session");
require("dotenv").config();
const path = require("path");
const { sequelize } = require("./models");

const app = express();

// CORS config with credentials for frontend
const corsOptions = {
  origin: "http://localhost:5173", 
  credentials: true,              
};
app.use(cors(corsOptions));

// jSON body parser middleware
app.use(express.json());

// Session setup 
app.use(
  session({
    secret: process.env.SESSION_SECRET || "thisIsASuperSecretJWTKey", 
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, 
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 2, 
    },
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));


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

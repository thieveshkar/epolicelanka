const express = require("express");
const router = express.Router();
const multer = require("multer");
const bcrypt = require("bcrypt");
const { User, Citizen } = require("../models");

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Utility validators
function isValidPhone(phone) {
  return /^\+94\d{9}$/.test(phone);
}
function isValidPassport(passportNumber) {
  return /^[A-Za-z0-9]+$/.test(passportNumber);
}


// Citizen Signup Route

router.post(
  "/signup-citizen",
  upload.fields([
    { name: "identity_photo_front", maxCount: 1 },
    { name: "identity_photo_back", maxCount: 1 },
    { name: "live_photo", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        first_name,
        second_name,
        date_of_birth,
        username,
        password,
        email,
        mobile_number,
        identity_type,
        identity_number,
        address,
        marital_status,
      } = req.body;

      if (
        !username ||
        !password ||
        !first_name ||
        !second_name ||
        !date_of_birth ||
        !email ||
        !mobile_number ||
        !identity_type ||
        !identity_number ||
        !address ||
        !marital_status
      ) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!isValidPhone(mobile_number)) {
        return res
          .status(400)
          .json({ message: "Invalid mobile number format. Must be +94XXXXXXXXX" });
      }

      if (identity_type === "Passport" && !isValidPassport(identity_number)) {
        return res
          .status(400)
          .json({ message: "Passport number contains invalid characters" });
      }

      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(409).json({ message: "Username already taken." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ username, password: hashedPassword, role: "citizen" });

      const identity_photo_front = req.files["identity_photo_front"]?.[0]?.filename || null;
      const identity_photo_back = req.files["identity_photo_back"]?.[0]?.filename || null;
      const live_photo = req.files["live_photo"]?.[0]?.filename || null;

      if (!identity_photo_front) {
        return res.status(400).json({ message: "Front identity photo is required." });
      }
      if (identity_type === "NIC" && !identity_photo_back) {
        return res.status(400).json({ message: "Back identity photo is required for NIC." });
      }
      if (!live_photo) {
        return res.status(400).json({ message: "Live photo is required." });
      }

      await Citizen.create({
        user_id: user.id,
        first_name,
        second_name,
        date_of_birth,
        username,
        email,
        mobile_number,
        identity_type,
        identity_number,
        address,
        marital_status,
        identity_photo_front,
        identity_photo_back,
        live_photo,
      });

      return res.status(201).json({ message: "Citizen signup successful" });
    } catch (err) {
      console.error("Signup error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

//  Login Route (Updated)

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt:", username);

    const user = await User.findOne({ where: { username } });
    if (!user) {
      console.log("No such user found");
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    console.log("Password match result:", match);

    if (!match) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Save session data
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.username = user.username; 

    console.log("Login successful for:", user.username);

    return res.json({ message: "Login successful", role: user.role });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});



//  Current user info (for auth check)

router.get("/me", (req, res) => {
  if (req.session.userId) {
    return res.json({
      user: {
        id: req.session.userId,
        role: req.session.role,
        username: req.session.username,
      },
    });
  }
  return res.json({ user: null });
});


// Logout Route
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid"); // clear session cookie
    return res.json({ message: "Logged out" });
  });
});

module.exports = router;
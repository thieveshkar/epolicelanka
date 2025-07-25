const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  Complaint,
  Slot,
  SlotOfficer,
  PoliceOfficer,
  User,
  Citizen,
} = require("../models");
const { verifyToken } = require("../middleware/auth");

//  Multer setup: save uploaded files to 'uploads/' folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + "-" + file.originalname);
  },
});
const upload = multer({ storage });

//  Reusable complaint submission handler
async function handleComplaintSubmission(req, res, incidentTypeFromRoute) {
  try {
    const {
      full_name,
      age,
      gender,
      home_address,
      id_number,
      phone_number,
      religion,
      nationality,
      occupation,
      work_address,
      marital_status,
      grama_division,
      what_happened,
      when,
      where,
      how_occurred,
      damage_value,
      evidence,
      slot_id,
    } = req.body;

    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Validate selected slot
    const slot = await Slot.findByPk(slot_id);
    if (!slot || slot.available_slots <= 0) {
      return res.status(400).json({ error: "Slot not available" });
    }

    // Get officers assigned to slot
    const slotOfficers = await SlotOfficer.findAll({
      where: { slot_id },
      order: [["assigned_order", "ASC"]],
    });
    if (slotOfficers.length === 0) {
      return res.status(400).json({ error: "No officers assigned to this slot" });
    }

    // Round-robin officer assignment
    const complaintCount = await Complaint.count({ where: { slot_id } });
    const assignedOfficer = slotOfficers[complaintCount % slotOfficers.length];

    // Get citizen ID
    const user = await User.findOne({ where: { username } });
    const citizen = await Citizen.findOne({ where: { user_id: user.id } });

    // Create complaint with current submission date
    const complaint = await Complaint.create({
      full_name,
      age,
      gender,
      home_address,
      id_number,
      phone_number,
      religion,
      nationality,
      occupation,
      work_address,
      marital_status,
      grama_division,
      incident_type: incidentTypeFromRoute,
      what_happened,
      when,
      where,
      how_occurred,
      damage_value,
      evidence,
      slot_id,
      submitted_by: username,
      citizen_id: citizen?.id || null,
      attachment_file: req.file ? req.file.filename : null,
      officer_id: assignedOfficer.officer_id,
      submitted_at: new Date(), // Corrected from `submitted_date`
    });

    // Decrease slot availability
    slot.available_slots -= 1;
    await slot.save();

    return res.status(201).json({ message: "Complaint submitted", complaint });
  } catch (err) {
    console.error("❌ Complaint submission failed:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

//  POST /complaints/crime
router.post(
  "/crime",
  verifyToken,
  upload.single("attachment_file"),
  async (req, res) => {
    return handleComplaintSubmission(req, res, "Crime");
  }
);

// POST /complaints/traffic
router.post(
  "/traffic",
  verifyToken,
  upload.single("attachment_file"),
  async (req, res) => {
    return handleComplaintSubmission(req, res, "Traffic");
  }
);

// POST /complaints/minor-offense
router.post(
  "/minor-offense",
  verifyToken,
  upload.single("attachment_file"),
  async (req, res) => {
    return handleComplaintSubmission(req, res, "Minor Offense");
  }
);

// GET /complaints/my-complaints
router.get("/my-complaints", verifyToken, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const complaints = await Complaint.findAll({
      where: { submitted_by: username },
      order: [["submitted_at", "DESC"]], 
    });

    res.json(complaints);
  } catch (error) {
    console.error("Error fetching user's complaints:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

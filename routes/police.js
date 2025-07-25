const express = require("express");
const router = express.Router();
const { Complaint, PoliceOfficer, Slot } = require("../models"); // ⬅️ Include Slot model
const { Op } = require("sequelize");

// Middleware to check if police officer is logged in
function policeOfficerAuth(req, res, next) {
  if (req.session && req.session.username && req.session.role === "police_officer") {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}

// Helper to get officer ID by username (name)
async function getOfficerIdByUsername(username) {
  const officer = await PoliceOfficer.findOne({
    where: { name: username },
  });
  return officer ? officer.id : null;
}

// Get all complaints assigned to this police officer
router.get("/complaints", policeOfficerAuth, async (req, res) => {
  try {
    const username = req.session.username;
    const officerId = await getOfficerIdByUsername(username);
    if (!officerId) return res.status(404).json({ message: "Officer not found" });

    const complaints = await Complaint.findAll({
      where: { officer_id: officerId },
      order: [["id", "DESC"]],
    });

    res.json({ complaints });
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get complaints assigned to this officer filtered by appointment date (slot.date)
// GET /police/complaints/by-date?date=YYYY-MM-DD
router.get("/complaints/by-date", policeOfficerAuth, async (req, res) => {
  try {
    const username = req.session.username;
    const officerId = await getOfficerIdByUsername(username);
    if (!officerId) return res.status(404).json({ message: "Officer not found" });

    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date query parameter is required" });
    }

    const complaints = await Complaint.findAll({
      where: {
        officer_id: officerId,
      },
      include: [
        {
          model: Slot,
          as: "slot",
          where: {
            date: date,
          },
          required: true,  // Ensures inner join on Slot with matching date
        },
      ],
      order: [["when", "ASC"]],
    });

    res.json({ complaints });
  } catch (error) {
    console.error("Error fetching complaints by date:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single complaint by ID (only if assigned to this officer)
router.get("/complaints/:id", policeOfficerAuth, async (req, res) => {
  try {
    const username = req.session.username;
    const officerId = await getOfficerIdByUsername(username);
    if (!officerId) return res.status(404).json({ message: "Officer not found" });

    const complaint = await Complaint.findOne({
      where: {
        id: req.params.id,
        officer_id: officerId,
      },
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json({ complaint });
  } catch (err) {
    console.error("Error fetching complaint:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update complaint status (only if assigned to this officer)
router.put("/complaints/:id/status", policeOfficerAuth, async (req, res) => {
  try {
    const username = req.session.username;
    const officerId = await getOfficerIdByUsername(username);
    if (!officerId) return res.status(404).json({ message: "Officer not found" });

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const complaint = await Complaint.findOne({
      where: {
        id: req.params.id,
        officer_id: officerId,
      },
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.status = status;
    await complaint.save();

    res.json({ message: "Status updated", complaint });
  } catch (err) {
    console.error("Error updating complaint status:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

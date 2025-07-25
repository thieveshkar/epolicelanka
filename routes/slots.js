const express = require("express");
const router = express.Router();
const { Slot, PoliceOfficer, SlotOfficer } = require("../models");
const { verifyToken, checkAdminRole } = require("../middleware/auth");
const { Op } = require("sequelize");

// Create a new slot
router.post("/", verifyToken, checkAdminRole, async (req, res) => {
  const { date, time_from, time_to, available_slots } = req.body;
  try {
    const slot = await Slot.create({ date, time_from, time_to, available_slots });
    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ message: "Error creating slot", error: err.message });
  }
});

// Get slots by date, include assigned officers
router.get("/", verifyToken, checkAdminRole, async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: "Date query parameter is required" });
  try {
    const slots = await Slot.findAll({
      where: { date },
      include: [
        {
          model: SlotOfficer,
          include: [{ model: PoliceOfficer }],
        },
      ],
      order: [["time_from", "ASC"]],
    });

    // Transform slot data to attach officers directly for frontend convenience
    const formattedSlots = slots.map((slot) => ({
      id: slot.id,
      date: slot.date,
      time_from: slot.time_from,
      time_to: slot.time_to,
      available_slots: slot.available_slots,
      officers: slot.SlotOfficers.map((so) => so.PoliceOfficer),
    }));

    res.json(formattedSlots);
  } catch (err) {
    res.status(500).json({ message: "Error fetching slots", error: err.message });
  }
});

// Delete a slot by ID
router.delete("/:id", verifyToken, checkAdminRole, async (req, res) => {
  const { id } = req.params;
  try {
    const slot = await Slot.findByPk(id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });
    await slot.destroy();
    res.json({ message: "Slot deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting slot", error: err.message });
  }
});

// Assign police officer to a slot
router.post("/:slotId/assign-officer", verifyToken, checkAdminRole, async (req, res) => {
  const { slotId } = req.params;
  const { officerId } = req.body;

  try {
    const slot = await Slot.findByPk(slotId);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    const officer = await PoliceOfficer.findByPk(officerId);
    if (!officer) return res.status(404).json({ message: "Officer not found" });

    const exists = await SlotOfficer.findOne({ where: { slot_id: slotId, officer_id: officerId } });
    if (exists) return res.status(400).json({ message: "Officer already assigned to this slot" });

    const assignment = await SlotOfficer.create({ slot_id: slotId, officer_id: officerId });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ message: "Error assigning officer", error: err.message });
  }
});

// Remove police officer from a slot
router.delete("/:slotId/remove-officer/:officerId", verifyToken, checkAdminRole, async (req, res) => {
  const { slotId, officerId } = req.params;

  try {
    const assignment = await SlotOfficer.findOne({ where: { slot_id: slotId, officer_id: officerId } });
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    await assignment.destroy();
    res.json({ message: "Officer removed from slot" });
  } catch (err) {
    res.status(500).json({ message: "Error removing officer", error: err.message });
  }
});

// Search officers by name (live search)
router.get("/police-officers/search", verifyToken, checkAdminRole, async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ message: "Name parameter required" });

  try {
    const officers = await PoliceOfficer.findAll({
      where: { name: { [Op.iLike]: `%${name}%` } },
      limit: 10,
      order: [["name", "ASC"]],
    });
    res.json(officers);
  } catch (err) {
    res.status(500).json({ message: "Error searching officers", error: err.message });
  }
});

router.get("/public", async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: "Date query parameter is required" });

  try {
    const today = new Date().toISOString().split("T")[0];
    const whereClause = {
      date,
      available_slots: {
        [Op.gt]: 0,
      },
    };

    // If the selected date is today, filter out past time slots
    if (date === today) {
      const now = new Date();
      const currentTime = now.toTimeString().split(" ")[0]; // format: HH:MM:SS

      whereClause.time_from = {
        [Op.gt]: currentTime,
      };
    }

    const slots = await Slot.findAll({
      where: whereClause,
      order: [["time_from", "ASC"]],
    });

    res.json(slots);
  } catch (err) {
    console.error("Error fetching public slots:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

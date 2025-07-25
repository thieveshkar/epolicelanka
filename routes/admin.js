const express = require("express");
const router = express.Router();
const { Slot, PoliceOfficer, SlotOfficer } = require("../models");
const { verifyToken, checkAdminRole } = require("../middleware/auth");
const { Op } = require("sequelize");

// Create a new slot
router.post("/slots", verifyToken, checkAdminRole, async (req, res) => {
  const { date, time_from, time_to, available_slots } = req.body;
  try {
    const slot = await Slot.create({ date, time_from, time_to, available_slots });
    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ message: "Error creating slot", error: err.message });
  }
});

// Get all slots by date with assigned officers included
router.get("/slots", verifyToken, checkAdminRole, async (req, res) => {
  const { date } = req.query;
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
    if (slots.length === 0) {
      return res.status(404).json({ message: "No slots found for this date" });
    }
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: "Error fetching slots", error: err.message });
  }
});

// Update a slot
router.put("/slots/:id", verifyToken, checkAdminRole, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const slot = await Slot.findByPk(id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    await slot.update(updates);
    res.json(slot);
  } catch (err) {
    res.status(500).json({ message: "Error updating slot", error: err.message });
  }
});

// Delete a slot (and all assigned officers via cascade)
router.delete("/slots/:id", verifyToken, checkAdminRole, async (req, res) => {
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

// SEARCH police officers by name (for live suggestions)
router.get("/police-officers/search", verifyToken, checkAdminRole, async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ message: "Name query parameter is required" });

  try {
    const officers = await PoliceOfficer.findAll({
      where: {
        name: {
          [Op.iLike]: `%${name}%`, // Case-insensitive partial match
        },
      },
      limit: 10,
      order: [["name", "ASC"]],
    });
    res.json(officers);
  } catch (err) {
    res.status(500).json({ message: "Error searching police officers", error: err.message });
  }
});

// ASSIGN police officer to a slot
router.post("/slots/:slotId/assign-officer", verifyToken, checkAdminRole, async (req, res) => {
  const { slotId } = req.params;
  const { officerId } = req.body;

  try {
    // Check if slot exists
    const slot = await Slot.findByPk(slotId);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    // Check if officer exists
    const officer = await PoliceOfficer.findByPk(officerId);
    if (!officer) return res.status(404).json({ message: "Police officer not found" });

    // Check if assignment already exists
    const existingAssignment = await SlotOfficer.findOne({
      where: { slot_id: slotId, officer_id: officerId },
    });
    if (existingAssignment) {
      return res.status(400).json({ message: "Officer already assigned to this slot" });
    }

    // Create assignment
    const slotOfficer = await SlotOfficer.create({ slot_id: slotId, officer_id: officerId });
    res.status(201).json(slotOfficer);
  } catch (err) {
    res.status(500).json({ message: "Error assigning officer", error: err.message });
  }
});

// REMOVE police officer from a slot
router.delete(
  "/slots/:slotId/remove-officer/:officerId",
  verifyToken,
  checkAdminRole,
  async (req, res) => {
    const { slotId, officerId } = req.params;

    try {
      const assignment = await SlotOfficer.findOne({
        where: { slot_id: slotId, officer_id: officerId },
      });

      if (!assignment) {
        return res.status(404).json({ message: "Officer assignment not found" });
      }

      await assignment.destroy();
      res.json({ message: "Officer removed from slot" });
    } catch (err) {
      res.status(500).json({ message: "Error removing officer", error: err.message });
    }
  }
);

module.exports = router;

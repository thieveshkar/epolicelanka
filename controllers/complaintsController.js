const { Complaint } = require("../models");

// POST /complaints
exports.createComplaint = async (req, res) => {
  try {
    const newComplaint = await Complaint.create(req.body);
    return res.status(201).json(newComplaint);
  } catch (error) {
    console.error("Error creating complaint:", error);
    return res.status(500).json({ message: "Failed to create complaint" });
  }
};

// GET /complaints/by-nic/:nic
exports.getComplaintsByNIC = async (req, res) => {
  try {
    const nic = req.params.nic;
    const complaints = await Complaint.findAll({ where: { id_number: nic } });

    if (complaints.length === 0) {
      return res.status(404).json({ message: "No complaints found for this NIC" });
    }

    return res.json(complaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = (sequelize, DataTypes) => {
  const SlotOfficer = sequelize.define("SlotOfficer", {
    slot_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "slots", key: "id" },
    },
    officer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "police_officers", key: "id" },
    },
  }, {
    tableName: "slot_officers",
    timestamps: false,
  });

  SlotOfficer.associate = (models) => {
    SlotOfficer.belongsTo(models.Slot, { foreignKey: "slot_id" });
    SlotOfficer.belongsTo(models.PoliceOfficer, { foreignKey: "officer_id" });
  };

  return SlotOfficer;
};

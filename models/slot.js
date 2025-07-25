module.exports = (sequelize, DataTypes) => {
  const Slot = sequelize.define(
    "Slot",
    {
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      time_from: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      time_to: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      available_slots: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
    },
    {
      tableName: "slots",
      timestamps: false,
    }
  );

  Slot.associate = (models) => {
    Slot.hasMany(models.SlotOfficer, {
      foreignKey: "slot_id",
      onDelete: "CASCADE",
    });
   
    Slot.hasMany(models.Complaint, {
      foreignKey: "slot_id",
    });
  };

  return Slot;
};

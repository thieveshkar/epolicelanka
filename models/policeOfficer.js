module.exports = (sequelize, DataTypes) => {
  const PoliceOfficer = sequelize.define(
    "PoliceOfficer",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      rank: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: "police_officers",
      timestamps: false,
    }
  );

  PoliceOfficer.associate = (models) => {
    PoliceOfficer.hasMany(models.SlotOfficer, { foreignKey: "officer_id", onDelete: "CASCADE" });
  };

  return PoliceOfficer;
};

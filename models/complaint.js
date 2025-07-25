module.exports = (sequelize, DataTypes) => {
  const Complaint = sequelize.define(
    "Complaint",
    {
      full_name: DataTypes.STRING,
      age: DataTypes.INTEGER,
      gender: DataTypes.STRING,
      home_address: DataTypes.STRING,
      id_number: DataTypes.STRING,
      phone_number: DataTypes.STRING,
      religion: DataTypes.STRING,
      nationality: DataTypes.STRING,
      occupation: DataTypes.STRING,
      work_address: DataTypes.STRING,
      marital_status: DataTypes.STRING,
      grama_division: DataTypes.STRING,
      incident_type: DataTypes.STRING,
      what_happened: DataTypes.STRING,
      when: DataTypes.DATE,
      where: DataTypes.STRING,
      how_occurred: DataTypes.STRING,
      damage_value: DataTypes.STRING,
      evidence: DataTypes.STRING,
      slot_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      attachment_file: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      submitted_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      citizen_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      officer_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "police_officers", key: "id" },
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "complaints",
      timestamps: false,
    }
  );

  
  Complaint.associate = (models) => {
    Complaint.belongsTo(models.Slot, {
      foreignKey: "slot_id",
      as: "slot",
    });
  };

  return Complaint;
};

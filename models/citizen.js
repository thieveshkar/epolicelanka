module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Citizen",
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: "users", key: "id" },
      },
      first_name: { type: DataTypes.STRING, allowNull: false },
      second_name: { type: DataTypes.STRING, allowNull: false },
      date_of_birth: { type: DataTypes.DATEONLY, allowNull: false },
      username: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      mobile_number: { type: DataTypes.STRING, allowNull: false },
      identity_type: { type: DataTypes.ENUM("NIC", "Passport"), allowNull: false },
      identity_number: { type: DataTypes.STRING, allowNull: false },
      identity_photo_front: { type: DataTypes.STRING, allowNull: false },
      identity_photo_back: { type: DataTypes.STRING, allowNull: true }, // Nullable for Passport
      live_photo: { type: DataTypes.STRING, allowNull: false },
      address: { type: DataTypes.TEXT, allowNull: false },
      marital_status: { type: DataTypes.STRING, allowNull: false },
    },
    {
      tableName: "citizens",
      timestamps: false,
    }
  );
};
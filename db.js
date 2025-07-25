
const { Sequelize } = require("sequelize");


const sequelize = new Sequelize("epolice_lanka_db", "postgres", "EPOLICELANKA", {
  host: "localhost",
  dialect: "postgres",
  logging: false, 
});

module.exports = sequelize;

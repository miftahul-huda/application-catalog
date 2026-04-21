const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApplicationFunction = sequelize.define('ApplicationFunction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
});

module.exports = ApplicationFunction;

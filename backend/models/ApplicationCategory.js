const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApplicationCategory = sequelize.define('ApplicationCategory', {
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

module.exports = ApplicationCategory;

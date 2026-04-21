const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BacklogStatus = sequelize.define('BacklogStatus', {
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

module.exports = BacklogStatus;

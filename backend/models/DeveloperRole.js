const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeveloperRole = sequelize.define('DeveloperRole', {
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

module.exports = DeveloperRole;

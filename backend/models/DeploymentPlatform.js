const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeploymentPlatform = sequelize.define('DeploymentPlatform', {
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

module.exports = DeploymentPlatform;

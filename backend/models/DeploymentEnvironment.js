const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeploymentEnvironment = sequelize.define('DeploymentEnvironment', {
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

module.exports = DeploymentEnvironment;

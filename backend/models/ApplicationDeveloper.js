const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApplicationDeveloper = sequelize.define('ApplicationDeveloper', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  applicationId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING
  },
  roleId: {
    type: DataTypes.INTEGER
  }
});

module.exports = ApplicationDeveloper;

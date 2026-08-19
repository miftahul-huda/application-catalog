const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExternalUserApplication = sequelize.define('ExternalUserApplication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  applicationId: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'ExternalUserApplications',
  timestamps: true,
  updatedAt: false
});

module.exports = ExternalUserApplication;

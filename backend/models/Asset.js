const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Asset = sequelize.define('Asset', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  module: {
    type: DataTypes.STRING, // e.g., 'Backlog', 'AppGroup', 'Documentation'
    allowNull: false
  },
  moduleId: {
    type: DataTypes.STRING, // ID of the related item
    allowNull: false
  },
  type: {
    type: DataTypes.STRING // 'image', 'video', 'audio', 'document'
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING
  },
  uploadedBy: {
    type: DataTypes.UUID
  }
});

module.exports = Asset;

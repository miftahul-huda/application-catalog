const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BacklogStatusHistory = sequelize.define('BacklogStatusHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  backlogId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fromStatusId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  toStatusId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  changedBy: {
    type: DataTypes.UUID,
    allowNull: false
  },
  changedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'BacklogStatusHistories',
  timestamps: false
});

module.exports = BacklogStatusHistory;

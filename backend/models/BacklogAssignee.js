const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BacklogAssignee = sequelize.define('BacklogAssignee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  backlogId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'BacklogAssignees',
  timestamps: true,
  updatedAt: false
});

module.exports = BacklogAssignee;

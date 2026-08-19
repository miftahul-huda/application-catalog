const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING
  },
  picture: {
    type: DataTypes.STRING
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'User'
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  theme: {
    type: DataTypes.STRING,
    defaultValue: 'dark'
  }
});

module.exports = User;

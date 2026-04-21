const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const Backlog = sequelize.define('Backlog', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  applicationId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  statusId: {
    type: DataTypes.INTEGER
  },
  hoursSpent: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  createdBy: {
    type: DataTypes.UUID
  }
}, {
  hooks: {
    beforeCreate: async (backlog, options) => {
      if (!backlog.id) {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `BKLG-${backlog.applicationId}-${dateStr}`;
        
        const lastBacklog = await Backlog.findOne({
          where: {
            id: {
              [Op.like]: `${prefix}-%`
            }
          },
          order: [['createdAt', 'DESC']]
        });
        
        let nextNumber = 1;
        if (lastBacklog) {
          const parts = lastBacklog.id.split('-');
          const lastNum = parseInt(parts[parts.length - 1]);
          if (!isNaN(lastNum)) nextNumber = lastNum + 1;
        }
        backlog.id = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
      }
    }
  }
});

module.exports = Backlog;

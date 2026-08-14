const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const BugHistory = sequelize.define('BugHistory', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  applicationId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  screenshots: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  reportedBy: {
    type: DataTypes.STRING
  },
  causesAndTroubleshoot: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('Open', 'Investigating', 'Resolved', 'Closed'),
    defaultValue: 'Open'
  },
  createdBy: {
    type: DataTypes.UUID
  }
}, {
  hooks: {
    beforeCreate: async (bug) => {
      if (!bug.id) {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `BUG-${bug.applicationId}-${dateStr}`;
        
        const last = await BugHistory.findOne({
          where: {
            id: {
              [Op.like]: `${prefix}-%`
            }
          },
          order: [['createdAt', 'DESC']]
        });
        
        let nextNumber = 1;
        if (last) {
          const parts = last.id.split('-');
          const lastNum = parseInt(parts[parts.length - 1]);
          if (!isNaN(lastNum)) nextNumber = lastNum + 1;
        }
        bug.id = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
      }
    }
  }
});

module.exports = BugHistory;

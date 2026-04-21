const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApplicationGroup = sequelize.define('ApplicationGroup', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  projectId: {
    type: DataTypes.INTEGER
  },
  ownerName: {
    type: DataTypes.STRING
  },
  ownerEmail: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  documents: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  createdBy: {
    type: DataTypes.UUID
  }
}, {
  hooks: {
    beforeCreate: async (group, options) => {
      if (!group.id) {
        const lastGroup = await ApplicationGroup.findOne({
          order: [['createdAt', 'DESC']]
        });
        let nextNumber = 1;
        if (lastGroup && lastGroup.id.startsWith('APPG-')) {
          const lastNum = parseInt(lastGroup.id.split('-')[1]);
          if (!isNaN(lastNum)) nextNumber = lastNum + 1;
        }
        group.id = `APPG-${nextNumber.toString().padStart(4, '0')}`;
      }
    }
  }
});

module.exports = ApplicationGroup;

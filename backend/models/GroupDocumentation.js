const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const GroupDocumentation = sequelize.define('GroupDocumentation', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  groupId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shortDescription: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  },
  createdBy: {
    type: DataTypes.UUID
  }
}, {
  hooks: {
    beforeCreate: async (doc) => {
      if (!doc.id) {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `GDOC-${doc.groupId}-${dateStr}`;

        const last = await GroupDocumentation.findOne({
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
        doc.id = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
      }
    }
  }
});

module.exports = GroupDocumentation;

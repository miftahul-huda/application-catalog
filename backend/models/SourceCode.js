const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const SourceCode = sequelize.define('SourceCode', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  applicationId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  hooks: {
    beforeCreate: async (sourceCode) => {
      if (!sourceCode.id) {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `SRC-${sourceCode.applicationId}-${dateStr}`;
        
        const last = await SourceCode.findOne({
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
        sourceCode.id = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
      }
    }
  }
});

module.exports = SourceCode;

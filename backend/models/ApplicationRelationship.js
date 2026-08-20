const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const ApplicationRelationship = sequelize.define('ApplicationRelationship', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  applicationId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  deploymentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  externalSystemType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  externalSystemProduct: {
    type: DataTypes.STRING,
    allowNull: false
  },
  relatedApplicationId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  relatedDeploymentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  manualSystemName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  communicationProtocol: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dataDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID
  }
}, {
  hooks: {
    beforeCreate: async (rel) => {
      if (!rel.id) {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `REL-${rel.applicationId}-${dateStr}`;

        const last = await ApplicationRelationship.findOne({
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
        rel.id = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
      }
    }
  }
});

module.exports = ApplicationRelationship;

const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const Deployment = sequelize.define('Deployment', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  applicationId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING
  },
  instructions: {
    type: DataTypes.TEXT
  },
  testingInstructions: {
    type: DataTypes.TEXT
  },
  platform: {
    type: DataTypes.ENUM('VM', 'Managed VM Group', 'Kubernetes', 'Docker Swarm', 'Cloud Run', 'App Engine')
  }
}, {
  hooks: {
    beforeCreate: async (deployment, options) => {
      if (!deployment.id) {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `DEPL-${deployment.applicationId}-${dateStr}`;
        
        const lastDepl = await Deployment.findOne({
          where: {
            id: {
              [Op.like]: `${prefix}-%`
            }
          },
          order: [['createdAt', 'DESC']]
        });
        
        let nextNumber = 1;
        if (lastDepl) {
          const parts = lastDepl.id.split('-');
          const lastNum = parseInt(parts[parts.length - 1]);
          if (!isNaN(lastNum)) nextNumber = lastNum + 1;
        }
        deployment.id = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
      }
    }
  }
});

module.exports = Deployment;

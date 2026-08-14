const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  groupId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  categoryId: {
    type: DataTypes.INTEGER
  },
  functionId: {
    type: DataTypes.INTEGER
  },
  description: {
    type: DataTypes.TEXT
  },
  githubLink: {
    type: DataTypes.STRING
  },
  startDate: {
    type: DataTypes.DATEONLY
  },
  endDate: {
    type: DataTypes.DATEONLY
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active'
  },
  createdBy: {
    type: DataTypes.UUID
  },
  techStack: {
    type: DataTypes.JSONB,
    defaultValue: {
      languages: [],
      frameworks: [],
      libraries: [],
      tools: []
    }
  },
  documentation: {
    type: DataTypes.TEXT
  },
  icon: {
    type: DataTypes.STRING
  }
}, {
  hooks: {
    beforeCreate: async (app, options) => {
      if (!app.id) {
        const lastApp = await Application.findOne({
          where: {
            id: {
              [Op.like]: `APPI-${app.groupId}-%`
            }
          },
          order: [['createdAt', 'DESC']]
        });
        let nextNumber = 1;
        if (lastApp) {
          const parts = lastApp.id.split('-');
          const lastNum = parseInt(parts[parts.length - 1]);
          if (!isNaN(lastNum)) nextNumber = lastNum + 1;
        }
        app.id = `APPI-${app.groupId}-${nextNumber.toString().padStart(3, '0')}`;
      }
    }
  }
});

module.exports = Application;

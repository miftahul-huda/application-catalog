const sequelize = require('../config/database');
const User = require('./User');
const ApplicationProject = require('./ApplicationProject');
const ApplicationCategory = require('./ApplicationCategory');
const ApplicationFunction = require('./ApplicationFunction');
const DeveloperRole = require('./DeveloperRole');
const BacklogStatus = require('./BacklogStatus');
const ApplicationGroup = require('./ApplicationGroup');
const Application = require('./Application');
const ApplicationDeveloper = require('./ApplicationDeveloper');
const Backlog = require('./Backlog');
const Deployment = require('./Deployment');
const Asset = require('./Asset');

// Associations

// ApplicationGroup
ApplicationGroup.belongsTo(ApplicationProject, { foreignKey: 'projectId', as: 'project' });
ApplicationGroup.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
ApplicationGroup.hasMany(Application, { foreignKey: 'groupId', as: 'applications' });

// Application
Application.belongsTo(ApplicationGroup, { foreignKey: 'groupId', as: 'group' });
Application.belongsTo(ApplicationCategory, { foreignKey: 'categoryId', as: 'category' });
Application.belongsTo(ApplicationFunction, { foreignKey: 'functionId', as: 'function' });
Application.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Application.hasMany(ApplicationDeveloper, { foreignKey: 'applicationId', as: 'developers' });
Application.hasMany(Backlog, { foreignKey: 'applicationId', as: 'backlogs' });
Application.hasMany(Deployment, { foreignKey: 'applicationId', as: 'deployments' });

// ApplicationDeveloper
ApplicationDeveloper.belongsTo(Application, { foreignKey: 'applicationId' });
ApplicationDeveloper.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ApplicationDeveloper.belongsTo(DeveloperRole, { foreignKey: 'roleId', as: 'role' });

// Backlog
Backlog.belongsTo(Application, { foreignKey: 'applicationId' });
Backlog.belongsTo(BacklogStatus, { foreignKey: 'statusId', as: 'status' });
Backlog.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Deployment
Deployment.belongsTo(Application, { foreignKey: 'applicationId' });

const models = {
  sequelize,
  User,
  ApplicationProject,
  ApplicationCategory,
  ApplicationFunction,
  DeveloperRole,
  BacklogStatus,
  ApplicationGroup,
  Application,
  ApplicationDeveloper,
  Backlog,
  Deployment,
  Asset
};

module.exports = models;

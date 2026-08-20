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
const BacklogAssignee = require('./BacklogAssignee');
const BacklogStatusHistory = require('./BacklogStatusHistory');
const Deployment = require('./Deployment');
const Asset = require('./Asset');
const SourceCode = require('./SourceCode');
const BugHistory = require('./BugHistory');
const Documentation = require('./Documentation');
const ExternalUserApplication = require('./ExternalUserApplication');
const DeploymentPlatform = require('./DeploymentPlatform');
const DeploymentEnvironment = require('./DeploymentEnvironment');

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
Application.hasMany(SourceCode, { foreignKey: 'applicationId', as: 'sourceCodes' });
Application.hasMany(BugHistory, { foreignKey: 'applicationId', as: 'bugHistories' });

// ApplicationDeveloper
ApplicationDeveloper.belongsTo(Application, { foreignKey: 'applicationId' });
ApplicationDeveloper.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ApplicationDeveloper.belongsTo(DeveloperRole, { foreignKey: 'roleId', as: 'role' });

// Backlog
Backlog.belongsTo(Application, { foreignKey: 'applicationId' });
Backlog.belongsTo(BacklogStatus, { foreignKey: 'statusId', as: 'status' });
Backlog.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Backlog.belongsToMany(User, { through: BacklogAssignee, foreignKey: 'backlogId', otherKey: 'userId', as: 'assignees' });
User.belongsToMany(Backlog, { through: BacklogAssignee, foreignKey: 'userId', otherKey: 'backlogId', as: 'assignedBacklogs' });
BacklogAssignee.belongsTo(User, { foreignKey: 'userId', as: 'user' });
BacklogAssignee.belongsTo(Backlog, { foreignKey: 'backlogId' });
Backlog.hasMany(BacklogStatusHistory, { foreignKey: 'backlogId', as: 'statusHistory' });
BacklogStatusHistory.belongsTo(Backlog, { foreignKey: 'backlogId' });
BacklogStatusHistory.belongsTo(BacklogStatus, { foreignKey: 'fromStatusId', as: 'fromStatus' });
BacklogStatusHistory.belongsTo(BacklogStatus, { foreignKey: 'toStatusId', as: 'toStatus' });
BacklogStatusHistory.belongsTo(User, { foreignKey: 'changedBy', as: 'changedByUser' });

// Deployment
Deployment.belongsTo(Application, { foreignKey: 'applicationId' });
Deployment.belongsTo(DeploymentPlatform, { foreignKey: 'platformId', as: 'platformData' });
DeploymentPlatform.hasMany(Deployment, { foreignKey: 'platformId' });
Deployment.belongsTo(DeploymentEnvironment, { foreignKey: 'environmentId', as: 'environmentData' });
DeploymentEnvironment.hasMany(Deployment, { foreignKey: 'environmentId' });

// SourceCode
SourceCode.belongsTo(Application, { foreignKey: 'applicationId' });

// BugHistory
BugHistory.belongsTo(Application, { foreignKey: 'applicationId' });
BugHistory.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Documentation
Application.hasMany(Documentation, { foreignKey: 'applicationId', as: 'documentations', onDelete: 'CASCADE' });
Documentation.belongsTo(Application, { foreignKey: 'applicationId' });
Documentation.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// ExternalUserApplication
User.belongsToMany(Application, { through: ExternalUserApplication, foreignKey: 'userId', otherKey: 'applicationId', as: 'allowedApplications' });
Application.belongsToMany(User, { through: ExternalUserApplication, foreignKey: 'applicationId', otherKey: 'userId', as: 'externalUsers' });
ExternalUserApplication.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ExternalUserApplication.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

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
  BacklogAssignee,
  BacklogStatusHistory,
  Deployment,
  Asset,
  SourceCode,
  BugHistory,
  Documentation,
  ExternalUserApplication,
  DeploymentPlatform,
  DeploymentEnvironment
};

module.exports = models;



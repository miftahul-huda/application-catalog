const { ApplicationGroup, Application, ApplicationProject, User, ApplicationDeveloper, Backlog, Deployment, SourceCode, BugHistory, Documentation, ExternalUserApplication } = require('../models');

const getGroups = async (req, res) => {
  try {
    const groups = await ApplicationGroup.findAll({
      include: [
        { model: ApplicationProject, as: 'project' },
        { model: User, as: 'creator', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getGroup = async (req, res) => {
  try {
    const group = await ApplicationGroup.findByPk(req.params.id, {
      include: [
        { model: ApplicationProject, as: 'project' },
        { model: Application, as: 'applications' }
      ]
    });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createGroup = async (req, res) => {
  try {
    const group = await ApplicationGroup.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateGroup = async (req, res) => {
  try {
    const group = await ApplicationGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    await group.update(req.body);
    res.json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const duplicateGroup = async (req, res) => {
  try {
    const sourceGroup = await ApplicationGroup.findByPk(req.params.id);
    if (!sourceGroup) return res.status(404).json({ message: 'Group not found' });

    const newGroupData = sourceGroup.toJSON();
    delete newGroupData.id;
    delete newGroupData.createdAt;
    delete newGroupData.updatedAt;
    newGroupData.name = `${newGroupData.name} (Copy)`;
    newGroupData.createdBy = req.user.id;

    const newGroup = await ApplicationGroup.create(newGroupData);
    res.status(201).json(newGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const group = await ApplicationGroup.findByPk(req.params.id, {
      include: [{ model: Application, as: 'applications' }]
    });
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const appIds = group.applications.map(app => app.id);
    if (appIds.length > 0) {
      await ApplicationDeveloper.destroy({ where: { applicationId: appIds } });
      await Backlog.destroy({ where: { applicationId: appIds } });
      await Deployment.destroy({ where: { applicationId: appIds } });
      await SourceCode.destroy({ where: { applicationId: appIds } });
      await BugHistory.destroy({ where: { applicationId: appIds } });
      await Documentation.destroy({ where: { applicationId: appIds } });
      await ExternalUserApplication.destroy({ where: { applicationId: appIds } });
      await Application.destroy({ where: { id: appIds } });
    }

    await group.destroy();
    res.json({ message: 'Application group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  duplicateGroup,
  deleteGroup
};

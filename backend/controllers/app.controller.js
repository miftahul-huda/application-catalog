const { Application, ApplicationGroup, ApplicationCategory, ApplicationFunction, ApplicationDeveloper, DeveloperRole, ApplicationProject, User } = require('../models');

const getApps = async (req, res) => {
  const { groupId, categoryId, functionId, search } = req.query;
  const where = {};
  if (groupId) where.groupId = groupId;
  if (categoryId) where.categoryId = categoryId;
  if (functionId) where.functionId = functionId;
  
  if (search) {
    const { Op } = require('sequelize');
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Restrict for External users
  if (req.user && req.user.role === 'External') {
    const { ExternalUserApplication } = require('../models');
    const { Op } = require('sequelize');
    const allowed = await ExternalUserApplication.findAll({
      where: { userId: req.user.id },
      attributes: ['applicationId']
    });
    const allowedIds = allowed.map(a => a.applicationId);
    where.id = { [Op.in]: allowedIds };
  }

  try {
    const apps = await Application.findAll({
      where,
      include: [
        { model: ApplicationCategory, as: 'category' },
        { model: ApplicationFunction, as: 'function' },
        { model: ApplicationGroup, as: 'group' }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(apps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getApp = async (req, res) => {
  try {
    if (req.user && req.user.role === 'External') {
      const { ExternalUserApplication } = require('../models');
      const hasAccess = await ExternalUserApplication.findOne({
        where: { userId: req.user.id, applicationId: req.params.id }
      });
      if (!hasAccess) {
        return res.status(403).json({ message: 'Forbidden. You do not have access to this application.' });
      }
    }

    console.log('GET /api/apps/:id - ID:', req.params.id);
    const app = await Application.findByPk(req.params.id, {
      include: [
        { model: ApplicationCategory, as: 'category' },
        { model: ApplicationFunction, as: 'function' },
        { 
          model: ApplicationGroup, 
          as: 'group',
          include: [{ model: ApplicationProject, as: 'project' }]
        },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'picture'] },
        { 
          model: ApplicationDeveloper, 
          as: 'developers',
          include: [
            { model: DeveloperRole, as: 'role' },
            { model: User, as: 'user', attributes: ['id', 'name', 'email', 'picture'] }
          ]
        }
      ]
    });
    if (!app) {
      console.log('Application not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json(app);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ message: error.message });
  }
};

const createApp = async (req, res) => {
  try {
    const { developers, ...appData } = req.body;
    const app = await Application.create({
      ...appData,
      createdBy: req.user.id
    });

    if (developers && Array.isArray(developers)) {
      for (const dev of developers) {
        await ApplicationDeveloper.create({
          ...dev,
          applicationId: app.id
        });
      }
    }

    // Reload to get associations
    const fullApp = await Application.findByPk(app.id, {
      include: [
        { model: ApplicationCategory, as: 'category' },
        { model: ApplicationFunction, as: 'function' },
        { model: ApplicationGroup, as: 'group' }
      ]
    });

    res.status(201).json(fullApp);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateApp = async (req, res) => {
  try {
    const app = await Application.findByPk(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const { developers, ...appData } = req.body;
    await app.update(appData);

    if (developers && Array.isArray(developers)) {
      await ApplicationDeveloper.destroy({ where: { applicationId: app.id } });
      for (const dev of developers) {
        await ApplicationDeveloper.create({
          ...dev,
          applicationId: app.id
        });
      }
    }

    res.json(app);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const addDeveloper = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const dev = await ApplicationDeveloper.create({
      ...req.body,
      applicationId
    });
    
    const fullDev = await ApplicationDeveloper.findByPk(dev.id, {
      include: [
        { model: DeveloperRole, as: 'role' },
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'picture'] }
      ]
    });
    
    res.status(201).json(fullDev);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const removeDeveloper = async (req, res) => {
  try {
    const { devId } = req.params;
    await ApplicationDeveloper.destroy({ where: { id: devId } });
    res.json({ message: 'Developer removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const duplicateApp = async (req, res) => {
  try {
    const sourceApp = await Application.findByPk(req.params.id, {
      include: [{ model: ApplicationDeveloper, as: 'developers' }]
    });
    if (!sourceApp) return res.status(404).json({ message: 'Application not found' });

    const newAppData = sourceApp.toJSON();
    const developers = newAppData.developers;
    delete newAppData.id;
    delete newAppData.createdAt;
    delete newAppData.updatedAt;
    delete newAppData.developers;
    newAppData.name = `${newAppData.name} (Copy)`;
    newAppData.createdBy = req.user.id;

    const newApp = await Application.create(newAppData);

    if (developers) {
      for (const dev of developers) {
        delete dev.id;
        await ApplicationDeveloper.create({
          ...dev,
          applicationId: newApp.id
        });
      }
    }

    res.status(201).json(newApp);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getApps,
  getApp,
  createApp,
  updateApp,
  duplicateApp,
  addDeveloper,
  removeDeveloper
};

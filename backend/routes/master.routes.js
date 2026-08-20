const express = require('express');
const router = express.Router();
const { protect, approvedOnly, adminOnly } = require('../middleware/auth');
const {
  ApplicationProject,
  ApplicationCategory,
  ApplicationFunction,
  DeveloperRole,
  BacklogStatus,
  DeploymentPlatform,
  DeploymentEnvironment
} = require('../models');

// Generic CRUD factory
const crudFor = (Model) => ({
  list: async (req, res) => {
    try { res.json(await Model.findAll({ order: [['name', 'ASC']] })); }
    catch (e) { res.status(500).json({ message: e.message }); }
  },
  create: async (req, res) => {
    try { res.status(201).json(await Model.create(req.body)); }
    catch (e) { res.status(400).json({ message: e.message }); }
  },
  update: async (req, res) => {
    try {
      const item = await Model.findByPk(req.params.id);
      if (!item) return res.status(404).json({ message: 'Not found' });
      await item.update(req.body);
      res.json(item);
    } catch (e) { res.status(400).json({ message: e.message }); }
  },
  remove: async (req, res) => {
    try {
      const item = await Model.findByPk(req.params.id);
      if (!item) return res.status(404).json({ message: 'Not found' });
      await item.destroy();
      res.json({ message: 'Deleted' });
    } catch (e) { res.status(500).json({ message: e.message }); }
  }
});

// Projects
const proj = crudFor(ApplicationProject);
router.get('/projects', protect, approvedOnly, proj.list);
router.post('/projects', protect, adminOnly, proj.create);
router.put('/projects/:id', protect, adminOnly, proj.update);
router.delete('/projects/:id', protect, adminOnly, proj.remove);

// Categories
const cat = crudFor(ApplicationCategory);
router.get('/categories', protect, approvedOnly, cat.list);
router.post('/categories', protect, adminOnly, cat.create);
router.put('/categories/:id', protect, adminOnly, cat.update);
router.delete('/categories/:id', protect, adminOnly, cat.remove);

// Functions
const fn = crudFor(ApplicationFunction);
router.get('/functions', protect, approvedOnly, fn.list);
router.post('/functions', protect, adminOnly, fn.create);
router.put('/functions/:id', protect, adminOnly, fn.update);
router.delete('/functions/:id', protect, adminOnly, fn.remove);

// Developer Roles
const role = crudFor(DeveloperRole);
router.get('/roles', protect, approvedOnly, role.list);
router.post('/roles', protect, adminOnly, role.create);
router.put('/roles/:id', protect, adminOnly, role.update);
router.delete('/roles/:id', protect, adminOnly, role.remove);

// Backlog Statuses
const status = crudFor(BacklogStatus);
router.get('/statuses', protect, approvedOnly, status.list);
router.post('/statuses', protect, adminOnly, status.create);
router.put('/statuses/:id', protect, adminOnly, status.update);
router.delete('/statuses/:id', protect, adminOnly, status.remove);

// Deployment Platforms
const platform = crudFor(DeploymentPlatform);
router.get('/platforms', protect, approvedOnly, platform.list);
router.post('/platforms', protect, adminOnly, platform.create);
router.put('/platforms/:id', protect, adminOnly, platform.update);
router.delete('/platforms/:id', protect, adminOnly, platform.remove);

// Deployment Environments
const environment = crudFor(DeploymentEnvironment);
router.get('/environments', protect, approvedOnly, environment.list);
router.post('/environments', protect, adminOnly, environment.create);
router.put('/environments/:id', protect, adminOnly, environment.update);
router.delete('/environments/:id', protect, adminOnly, environment.remove);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, internalOnly } = require('../middleware/auth');
const { Deployment, DeploymentPlatform, DeploymentEnvironment, Application } = require('../models');

const genDeploymentId = async (applicationId) => {
  const { Op } = require('sequelize');
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `DEPL-${applicationId}-${dateStr}`;
  const last = await Deployment.findOne({
    where: { id: { [Op.like]: `${prefix}-%` } },
    order: [['createdAt', 'DESC']]
  });
  const next = last ? parseInt(last.id.split('-').pop()) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
};

router.get('/', protect, internalOnly, async (req, res) => {
  const { appId, environmentId, search } = req.query;
  const { Op } = require('sequelize');
  
  const where = {};
  if (appId) {
    where.applicationId = appId;
  }
  if (environmentId) {
    where.environmentId = environmentId;
  }
  if (search) {
    where[Op.or] = [
      { id: { [Op.iLike]: `%${search}%` } },
      { title: { [Op.iLike]: `%${search}%` } },
      { url: { [Op.iLike]: `%${search}%` } },
      { instructions: { [Op.iLike]: `%${search}%` } }
    ];
  }

  try {
    const deployments = await Deployment.findAll({
      where,
      include: [
        { model: DeploymentPlatform, as: 'platformData' },
        { model: DeploymentEnvironment, as: 'environmentData' },
        { model: Application, attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(deployments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, internalOnly, async (req, res) => {
  try {
    const id = await genDeploymentId(req.body.applicationId);
    const deployment = await Deployment.create({ ...req.body, id });
    res.status(201).json(deployment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', protect, internalOnly, async (req, res) => {
  try {
    const deployment = await Deployment.findByPk(req.params.id);
    if (!deployment) return res.status(404).json({ message: 'Deployment not found' });
    await deployment.update(req.body);
    const updated = await Deployment.findByPk(req.params.id, {
      include: [
        { model: DeploymentPlatform, as: 'platformData' },
        { model: DeploymentEnvironment, as: 'environmentData' }
      ]
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', protect, internalOnly, async (req, res) => {
  try {
    const deployment = await Deployment.findByPk(req.params.id);
    if (!deployment) return res.status(404).json({ message: 'Deployment not found' });
    await deployment.destroy();
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

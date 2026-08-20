const express = require('express');
const router = express.Router();
const { protect, internalOnly } = require('../middleware/auth');
const { ApplicationRelationship, Deployment, Application, User } = require('../models');

const relationshipInclude = [
  { model: Deployment, as: 'deployment' },
  { model: Application, attributes: ['id', 'name'] },
  { model: Application, as: 'relatedApplication', attributes: ['id', 'name'] },
  { model: Deployment, as: 'relatedDeployment' },
  { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'picture'] }
];

// GET all relationships for an application or a specific deployment
router.get('/', protect, internalOnly, async (req, res) => {
  const { appId, deploymentId } = req.query;
  const where = {};
  if (appId) where.applicationId = appId;
  if (deploymentId) where.deploymentId = deploymentId;

  try {
    const relationships = await ApplicationRelationship.findAll({
      where,
      include: relationshipInclude,
      order: [['createdAt', 'DESC']]
    });
    res.json(relationships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create relationship
router.post('/', protect, internalOnly, async (req, res) => {
  try {
    const {
      applicationId, deploymentId, externalSystemType, externalSystemProduct,
      relatedApplicationId, relatedDeploymentId, manualSystemName, url,
      communicationProtocol, dataDescription
    } = req.body;

    if (!applicationId || !externalSystemType || !externalSystemProduct) {
      return res.status(400).json({ message: 'Application, External System Type, and Product are required' });
    }

    const relationship = await ApplicationRelationship.create({
      applicationId,
      deploymentId: deploymentId || null,
      externalSystemType,
      externalSystemProduct,
      relatedApplicationId: relatedApplicationId || null,
      relatedDeploymentId: relatedDeploymentId || null,
      manualSystemName: manualSystemName || null,
      url: url || null,
      communicationProtocol: communicationProtocol || null,
      dataDescription: dataDescription || null,
      createdBy: req.user.id
    });

    const full = await ApplicationRelationship.findByPk(relationship.id, { include: relationshipInclude });
    res.status(201).json(full);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update relationship
router.put('/:id', protect, internalOnly, async (req, res) => {
  try {
    const relationship = await ApplicationRelationship.findByPk(req.params.id);
    if (!relationship) return res.status(404).json({ message: 'Relationship not found' });

    const {
      deploymentId, externalSystemType, externalSystemProduct,
      relatedApplicationId, relatedDeploymentId, manualSystemName, url,
      communicationProtocol, dataDescription
    } = req.body;

    await relationship.update({
      ...(deploymentId !== undefined && { deploymentId: deploymentId || null }),
      ...(externalSystemType !== undefined && { externalSystemType }),
      ...(externalSystemProduct !== undefined && { externalSystemProduct }),
      ...(relatedApplicationId !== undefined && { relatedApplicationId: relatedApplicationId || null }),
      ...(relatedDeploymentId !== undefined && { relatedDeploymentId: relatedDeploymentId || null }),
      ...(manualSystemName !== undefined && { manualSystemName: manualSystemName || null }),
      ...(url !== undefined && { url: url || null }),
      ...(communicationProtocol !== undefined && { communicationProtocol: communicationProtocol || null }),
      ...(dataDescription !== undefined && { dataDescription: dataDescription || null })
    });

    const full = await ApplicationRelationship.findByPk(relationship.id, { include: relationshipInclude });
    res.json(full);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE relationship
router.delete('/:id', protect, internalOnly, async (req, res) => {
  try {
    const relationship = await ApplicationRelationship.findByPk(req.params.id);
    if (!relationship) return res.status(404).json({ message: 'Relationship not found' });
    await relationship.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

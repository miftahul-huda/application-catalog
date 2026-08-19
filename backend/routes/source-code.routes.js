const express = require('express');
const router = express.Router();
const { protect, internalOnly } = require('../middleware/auth');
const { SourceCode, Application } = require('../models');

// GET all source codes for an application
router.get('/', protect, internalOnly, async (req, res) => {
  const { appId, search } = req.query;
  const { Op } = require('sequelize');
  
  const where = {};
  if (appId) where.applicationId = appId;
  
  if (search) {
    where[Op.or] = [
      { url: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }

  try {
    const sourceCodes = await SourceCode.findAll({
      where,
      include: [
        { model: Application, attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(sourceCodes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new source code
router.post('/', protect, internalOnly, async (req, res) => {
  try {
    const { applicationId, url, description } = req.body;
    if (!applicationId || !url) {
      return res.status(400).json({ message: 'Application ID and Github Link are required' });
    }
    const sourceCode = await SourceCode.create({
      applicationId,
      url,
      description
    });
    res.status(201).json(sourceCode);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update source code
router.put('/:id', protect, internalOnly, async (req, res) => {
  try {
    const sourceCode = await SourceCode.findByPk(req.params.id);
    if (!sourceCode) return res.status(404).json({ message: 'Source code not found' });
    
    await sourceCode.update(req.body);
    res.json(sourceCode);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE remove source code
router.delete('/:id', protect, internalOnly, async (req, res) => {
  try {
    const sourceCode = await SourceCode.findByPk(req.params.id);
    if (!sourceCode) return res.status(404).json({ message: 'Source code not found' });
    
    await sourceCode.destroy();
    res.json({ message: 'Source code deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

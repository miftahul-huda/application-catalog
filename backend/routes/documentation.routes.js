const express = require('express');
const router = express.Router();
const { protect, approvedOnly } = require('../middleware/auth');
const { Documentation, User, Application } = require('../models');

const genDocumentationId = async (applicationId) => {
  const { Op } = require('sequelize');
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `DOC-${applicationId}-${dateStr}`;
  const last = await Documentation.findOne({
    where: { id: { [Op.like]: `${prefix}-%` } },
    order: [['createdAt', 'DESC']]
  });
  const next = last ? parseInt(last.id.split('-').pop()) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
};

// GET all documentations for an app
router.get('/', protect, approvedOnly, async (req, res) => {
  const { appId, search } = req.query;
  const { Op } = require('sequelize');
  
  const where = {};
  if (appId) where.applicationId = appId;
  
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { content: { [Op.iLike]: `%${search}%` } }
    ];
  }

  try {
    const docs = await Documentation.findAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'picture'] },
        { model: Application, attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single documentation
router.get('/:id', protect, approvedOnly, async (req, res) => {
  try {
    const doc = await Documentation.findByPk(req.params.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email', 'picture'] }]
    });
    if (!doc) return res.status(404).json({ message: 'Documentation not found' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create documentation
router.post('/', protect, approvedOnly, async (req, res) => {
  try {
    const { applicationId, title, content } = req.body;
    const id = await genDocumentationId(applicationId);
    const doc = await Documentation.create({
      id,
      applicationId,
      title: title || 'Untitled Documentation',
      content: content || '',
      createdBy: req.user.id
    });
    const fullDoc = await Documentation.findByPk(doc.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email', 'picture'] }]
    });
    res.status(201).json(fullDoc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update documentation
router.put('/:id', protect, approvedOnly, async (req, res) => {
  try {
    const doc = await Documentation.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Documentation not found' });
    
    // We update fields title, content
    await doc.update(req.body);
    
    const fullDoc = await Documentation.findByPk(doc.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email', 'picture'] }]
    });
    res.json(fullDoc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE documentation
router.delete('/:id', protect, approvedOnly, async (req, res) => {
  try {
    const doc = await Documentation.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Documentation not found' });
    await doc.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

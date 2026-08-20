const express = require('express');
const router = express.Router();
const { protect, internalOnly } = require('../middleware/auth');
const { GroupDocumentation, User } = require('../models');

const creatorInclude = { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'picture'] };

// GET all documentation entries for a group
router.get('/', protect, internalOnly, async (req, res) => {
  const { groupId } = req.query;
  const where = {};
  if (groupId) where.groupId = groupId;

  try {
    const docs = await GroupDocumentation.findAll({
      where,
      include: [creatorInclude],
      order: [['createdAt', 'DESC']]
    });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single documentation entry
router.get('/:id', protect, internalOnly, async (req, res) => {
  try {
    const doc = await GroupDocumentation.findByPk(req.params.id, { include: [creatorInclude] });
    if (!doc) return res.status(404).json({ message: 'Documentation not found' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create documentation entry
router.post('/', protect, internalOnly, async (req, res) => {
  try {
    const { groupId, type, title, shortDescription, content } = req.body;
    if (!groupId || !type || !title) {
      return res.status(400).json({ message: 'Group, Jenis Documentation, and Title are required' });
    }
    const doc = await GroupDocumentation.create({
      groupId,
      type,
      title,
      shortDescription: shortDescription || '',
      content: content || '',
      createdBy: req.user.id
    });
    const full = await GroupDocumentation.findByPk(doc.id, { include: [creatorInclude] });
    res.status(201).json(full);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update documentation entry
router.put('/:id', protect, internalOnly, async (req, res) => {
  try {
    const doc = await GroupDocumentation.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Documentation not found' });

    const { type, title, shortDescription, content } = req.body;
    await doc.update({
      ...(type !== undefined && { type }),
      ...(title !== undefined && { title }),
      ...(shortDescription !== undefined && { shortDescription }),
      ...(content !== undefined && { content })
    });

    const full = await GroupDocumentation.findByPk(doc.id, { include: [creatorInclude] });
    res.json(full);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE documentation entry
router.delete('/:id', protect, internalOnly, async (req, res) => {
  try {
    const doc = await GroupDocumentation.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Documentation not found' });
    await doc.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { Op, fn, col, where: sequelizeWhere } = require('sequelize');
const { protect, internalOnly } = require('../middleware/auth');
const { KnowledgeBase, User } = require('../models');

const creatorInclude = { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'picture'] };

// GET all knowledge base entries, optionally filtered by search keyword
router.get('/', protect, internalOnly, async (req, res) => {
  const { search } = req.query;

  const where = {};
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { shortDescription: { [Op.iLike]: `%${search}%` } },
      { content: { [Op.iLike]: `%${search}%` } },
      sequelizeWhere(fn('array_to_string', col('tags'), ','), { [Op.iLike]: `%${search}%` })
    ];
  }

  try {
    const items = await KnowledgeBase.findAll({
      where,
      include: [creatorInclude],
      order: [['createdAt', 'DESC']]
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single knowledge base entry
router.get('/:id', protect, internalOnly, async (req, res) => {
  try {
    const item = await KnowledgeBase.findByPk(req.params.id, { include: [creatorInclude] });
    if (!item) return res.status(404).json({ message: 'Knowledge base entry not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create knowledge base entry
router.post('/', protect, internalOnly, async (req, res) => {
  try {
    const { title, shortDescription, content, tags } = req.body;
    const item = await KnowledgeBase.create({
      title,
      shortDescription: shortDescription || '',
      content: content || '',
      tags: Array.isArray(tags) ? tags : [],
      createdBy: req.user.id
    });
    const full = await KnowledgeBase.findByPk(item.id, { include: [creatorInclude] });
    res.status(201).json(full);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update knowledge base entry
router.put('/:id', protect, internalOnly, async (req, res) => {
  try {
    const item = await KnowledgeBase.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Knowledge base entry not found' });

    const { title, shortDescription, content, tags } = req.body;
    await item.update({
      ...(title !== undefined && { title }),
      ...(shortDescription !== undefined && { shortDescription }),
      ...(content !== undefined && { content }),
      ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] })
    });

    const full = await KnowledgeBase.findByPk(item.id, { include: [creatorInclude] });
    res.json(full);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE knowledge base entry
router.delete('/:id', protect, internalOnly, async (req, res) => {
  try {
    const item = await KnowledgeBase.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Knowledge base entry not found' });
    await item.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

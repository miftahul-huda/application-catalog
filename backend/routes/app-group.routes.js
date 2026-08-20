const express = require('express');
const router = express.Router();
const { protect, internalOnly } = require('../middleware/auth');
const { getGroups, getGroup, createGroup, updateGroup, duplicateGroup, deleteGroup } = require('../controllers/app-group.controller');

router.get('/', protect, internalOnly, getGroups);
router.get('/:id', protect, internalOnly, getGroup);
router.post('/', protect, internalOnly, createGroup);
router.put('/:id', protect, internalOnly, updateGroup);
router.delete('/:id', protect, internalOnly, deleteGroup);
router.post('/:id/duplicate', protect, internalOnly, duplicateGroup);

// Add document to group
router.post('/:id/documents', protect, internalOnly, async (req, res) => {
  try {
    const { ApplicationGroup } = require('../models');
    const group = await ApplicationGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const docs = [...(group.documents || []), req.body];
    await group.update({ documents: docs });
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Remove document from group by index
router.delete('/:id/documents/:index', protect, internalOnly, async (req, res) => {
  try {
    const { ApplicationGroup } = require('../models');
    const group = await ApplicationGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const docs = [...(group.documents || [])];
    const idx = parseInt(req.params.index);
    if (isNaN(idx) || idx < 0 || idx >= docs.length) return res.status(400).json({ message: 'Invalid index' });
    docs.splice(idx, 1);
    await group.update({ documents: docs });
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

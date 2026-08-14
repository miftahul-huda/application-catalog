const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, approvedOnly } = require('../middleware/auth');
const { getBacklogs, createBacklog, uploadBacklogAsset } = require('../controllers/backlog.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/', protect, approvedOnly, getBacklogs);
router.post('/', protect, approvedOnly, createBacklog);
router.post('/:backlogId/assets', protect, approvedOnly, upload.single('file'), uploadBacklogAsset);

// Update backlog status
router.patch('/:id', protect, approvedOnly, async (req, res) => {
  try {
    const { Backlog } = require('../models');
    const backlog = await Backlog.findByPk(req.params.id);
    if (!backlog) return res.status(404).json({ message: 'Backlog not found' });
    await backlog.update(req.body);
    res.json(backlog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete backlog
router.delete('/:id', protect, approvedOnly, async (req, res) => {
  try {
    const { Backlog } = require('../models');
    const backlog = await Backlog.findByPk(req.params.id);
    if (!backlog) return res.status(404).json({ message: 'Backlog not found' });
    await backlog.destroy();
    res.json({ message: 'Backlog deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;

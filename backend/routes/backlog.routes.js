const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, internalOnly } = require('../middleware/auth');
const { getBacklogs, createBacklog, uploadBacklogAsset, backlogInclude } = require('../controllers/backlog.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/', protect, internalOnly, getBacklogs);
router.post('/', protect, internalOnly, createBacklog);
router.post('/:backlogId/assets', protect, internalOnly, upload.single('file'), uploadBacklogAsset);

// PATCH: update backlog fields, manage assignees & log status changes
router.patch('/:id', protect, internalOnly, async (req, res) => {
  try {
    const { Backlog, BacklogAssignee, BacklogStatusHistory } = require('../models');
    const backlog = await Backlog.findByPk(req.params.id);
    if (!backlog) return res.status(404).json({ message: 'Backlog not found' });

    const { assigneeIds, ...fields } = req.body;

    // Detect status change and log it
    if (fields.statusId && String(fields.statusId) !== String(backlog.statusId)) {
      await BacklogStatusHistory.create({
        backlogId: backlog.id,
        fromStatusId: backlog.statusId,
        toStatusId: fields.statusId,
        changedBy: req.user.id,
        changedAt: new Date()
      });
    }

    await backlog.update(fields);

    // Sync assignees if provided
    if (assigneeIds !== undefined) {
      await BacklogAssignee.destroy({ where: { backlogId: backlog.id } });
      if (assigneeIds.length > 0) {
        const rows = assigneeIds.map(userId => ({ backlogId: backlog.id, userId }));
        await BacklogAssignee.bulkCreate(rows, { ignoreDuplicates: true });
      }
    }

    const full = await Backlog.findByPk(backlog.id, { include: backlogInclude });
    res.json(full);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE backlog
router.delete('/:id', protect, internalOnly, async (req, res) => {
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

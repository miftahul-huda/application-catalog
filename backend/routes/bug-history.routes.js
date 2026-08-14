const express = require('express');
const router = express.Router();
const { protect, approvedOnly } = require('../middleware/auth');
const { BugHistory, User } = require('../models');

// GET all bug reports for an application
router.get('/', protect, approvedOnly, async (req, res) => {
  const { appId } = req.query;
  try {
    const bugs = await BugHistory.findAll({
      where: appId ? { applicationId: appId } : {},
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(bugs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new bug report
router.post('/', protect, approvedOnly, async (req, res) => {
  try {
    const { applicationId, title, description, screenshots, reportedBy, causesAndTroubleshoot, status } = req.body;
    if (!applicationId || !description) {
      return res.status(400).json({ message: 'Application ID and Description are required' });
    }
    const bug = await BugHistory.create({
      applicationId,
      title: title || '',
      description,
      screenshots: Array.isArray(screenshots) ? screenshots : [],
      reportedBy: reportedBy || req.user.name || '',
      causesAndTroubleshoot: causesAndTroubleshoot || '',
      status: status || 'Open',
      createdBy: req.user.id
    });
    res.status(201).json(bug);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update bug report
router.put('/:id', protect, approvedOnly, async (req, res) => {
  try {
    const bug = await BugHistory.findByPk(req.params.id);
    if (!bug) return res.status(404).json({ message: 'Bug record not found' });
    
    await bug.update(req.body);
    res.json(bug);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE remove bug report
router.delete('/:id', protect, approvedOnly, async (req, res) => {
  try {
    const bug = await BugHistory.findByPk(req.params.id);
    if (!bug) return res.status(404).json({ message: 'Bug record not found' });
    
    await bug.destroy();
    res.json({ message: 'Bug record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

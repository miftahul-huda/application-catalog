const express = require('express');
const router = express.Router();
const { protect, approvedOnly } = require('../middleware/auth');
const { BugHistory, User } = require('../models');

const checkAppAccess = async (userId, userRole, applicationId) => {
  if (userRole !== 'External') return true;
  const { ExternalUserApplication } = require('../models');
  const access = await ExternalUserApplication.findOne({
    where: { userId, applicationId }
  });
  return !!access;
};

// GET all bug reports for an application
router.get('/', protect, approvedOnly, async (req, res) => {
  const { appId } = req.query;
  try {
    const { Op } = require('sequelize');
    let where = {};
    
    if (req.user.role === 'External') {
      const { ExternalUserApplication } = require('../models');
      const allowed = await ExternalUserApplication.findAll({
        where: { userId: req.user.id },
        attributes: ['applicationId']
      });
      const allowedIds = allowed.map(a => a.applicationId);
      
      if (appId) {
        if (!allowedIds.includes(appId)) {
          return res.status(403).json({ message: 'Forbidden. You do not have access to this application.' });
        }
        where.applicationId = appId;
      } else {
        where.applicationId = { [Op.in]: allowedIds };
      }
    } else {
      if (appId) where.applicationId = appId;
    }

    const bugs = await BugHistory.findAll({
      where,
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

    const hasAccess = await checkAppAccess(req.user.id, req.user.role, applicationId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Forbidden. You do not have access to this application.' });
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

    // Send email to developers if reported by an external user
    if (req.user.role === 'External') {
      try {
        const { Application, ApplicationDeveloper, User } = require('../models');
        const { sendErrorNotification } = require('../utils/mailer');
        const app = await Application.findByPk(applicationId, {
          include: [{ 
            model: ApplicationDeveloper, 
            as: 'developers',
            include: [{ model: User, as: 'user' }]
          }]
        });
        if (app && app.developers && app.developers.length > 0) {
          await sendErrorNotification(app.developers, bug, app.name);
        }
      } catch (err) {
        console.error('Failed to notify developers:', err);
      }
    }

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
    
    const hasAccess = await checkAppAccess(req.user.id, req.user.role, bug.applicationId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Forbidden. You do not have access to this application.' });
    }

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
    
    const hasAccess = await checkAppAccess(req.user.id, req.user.role, bug.applicationId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Forbidden. You do not have access to this application.' });
    }

    await bug.destroy();
    res.json({ message: 'Bug record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

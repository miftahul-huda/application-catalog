const express = require('express');
const router = express.Router();
const { protect, adminOnly, internalOnly } = require('../middleware/auth');
const { User } = require('../models');

// List all users (admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { Application } = require('../models');
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'picture', 'role', 'isApproved', 'theme', 'createdAt'],
      include: [
        {
          model: Application,
          as: 'allowedApplications',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// List approved users — accessible to all internal approved users (for assignee pickers)
router.get('/approved', protect, internalOnly, async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isApproved: true },
      attributes: ['id', 'name', 'email', 'picture'],
      order: [['name', 'ASC']]
    });
    res.json(users);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Approve user
router.patch('/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.update({ isApproved: true });
    res.json({ message: 'User approved', user });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Reject / deactivate user
router.patch('/:id/revoke', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.update({ isApproved: false });
    res.json({ message: 'User revoked', user });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Update role & allowed apps
router.patch('/:id/role', protect, adminOnly, async (req, res) => {
  try {
    const { ExternalUserApplication, Application } = require('../models');
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    await user.update({ role: req.body.role });
    
    if (req.body.allowedApplicationIds !== undefined) {
      await ExternalUserApplication.destroy({ where: { userId: user.id } });
      if (req.body.allowedApplicationIds.length > 0) {
        const rows = req.body.allowedApplicationIds.map(appId => ({
          userId: user.id,
          applicationId: appId
        }));
        await ExternalUserApplication.bulkCreate(rows);
      }
    }

    const updatedUser = await User.findByPk(user.id, {
      attributes: ['id', 'name', 'email', 'picture', 'role', 'isApproved', 'theme', 'createdAt'],
      include: [
        {
          model: Application,
          as: 'allowedApplications',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ]
    });
    res.json(updatedUser);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// Update theme (self)
router.patch('/me/theme', protect, async (req, res) => {
  try {
    await req.user.update({ theme: req.body.theme });
    res.json({ theme: req.user.theme });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// Search users (for developer picker)
router.get('/search', protect, internalOnly, async (req, res) => {
  const { q } = req.query;
  const { Op } = require('sequelize');
  try {
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { email: { [Op.iLike]: `%${q}%` } }
        ]
      },
      attributes: ['id', 'name', 'email', 'picture'],
      limit: 10
    });
    res.json(users);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;

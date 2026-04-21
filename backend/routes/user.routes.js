const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { User } = require('../models');

// List all users (admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'picture', 'role', 'isApproved', 'theme', 'createdAt']
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

// Update role
router.patch('/:id/role', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.update({ role: req.body.role });
    res.json(user);
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
router.get('/search', protect, async (req, res) => {
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

const express = require('express');
const router = express.Router();
const { protect, approvedOnly } = require('../middleware/auth');
const { getGroups, getGroup, createGroup, updateGroup, duplicateGroup } = require('../controllers/app-group.controller');

router.get('/', protect, approvedOnly, getGroups);
router.get('/:id', protect, approvedOnly, getGroup);
router.post('/', protect, approvedOnly, createGroup);
router.put('/:id', protect, approvedOnly, updateGroup);
router.post('/:id/duplicate', protect, approvedOnly, duplicateGroup);

module.exports = router;

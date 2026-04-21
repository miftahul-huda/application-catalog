const express = require('express');
const router = express.Router();
const { protect, approvedOnly } = require('../middleware/auth');
const { getApps, getApp, createApp, updateApp, duplicateApp, addDeveloper, removeDeveloper } = require('../controllers/app.controller');

router.get('/', protect, approvedOnly, getApps);
router.get('/:id', protect, approvedOnly, getApp);
router.post('/', protect, approvedOnly, createApp);
router.put('/:id', protect, approvedOnly, updateApp);
router.post('/:id/duplicate', protect, approvedOnly, duplicateApp);
router.post('/:id/developers', protect, approvedOnly, addDeveloper);
router.delete('/:id/developers/:devId', protect, approvedOnly, removeDeveloper);

module.exports = router;

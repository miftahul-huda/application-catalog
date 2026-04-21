const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, approvedOnly } = require('../middleware/auth');
const { uploadFile } = require('../services/storage');
const { Asset } = require('../models');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

// Upload asset for any module
router.post('/upload', protect, approvedOnly, upload.single('file'), async (req, res) => {
  try {
    const { module, moduleId, type } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const assetType = type || detectType(req.file.mimetype);
    const result = await uploadFile(req.file.buffer, req.file.originalname, module ? module.toLowerCase() : 'others', assetType);

    let asset = null;
    if (module && moduleId) {
      asset = await Asset.create({
        module,
        moduleId,
        type: assetType,
        url: result.url,
        fileName: result.fileName,
        uploadedBy: req.user.id
      });
    }

    res.status(201).json(asset || result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get assets for a module entity
router.get('/', protect, approvedOnly, async (req, res) => {
  const { module, moduleId } = req.query;
  try {
    const where = {};
    if (module) where.module = module;
    if (moduleId) where.moduleId = moduleId;
    const assets = await Asset.findAll({ where });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function detectType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype === 'application/pdf' || mimetype.includes('document') || mimetype.includes('spreadsheet') || mimetype.includes('presentation')) return 'document';
  return 'others';
}

module.exports = router;

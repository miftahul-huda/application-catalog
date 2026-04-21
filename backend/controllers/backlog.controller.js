const { Backlog, BacklogStatus, Asset, User } = require('../models');
const { uploadFile } = require('../services/storage');

const getBacklogs = async (req, res) => {
  const { appId } = req.query;
  const where = {};
  if (appId) where.applicationId = appId;

  try {
    const backlogs = await Backlog.findAll({
      where,
      include: [
        { model: BacklogStatus, as: 'status' },
        { model: User, as: 'creator', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(backlogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBacklog = async (req, res) => {
  try {
    const backlog = await Backlog.create({
      ...req.body,
      createdBy: req.user.id
    });

    // Handle initial assets if any (though usually uploaded separately)
    res.status(201).json(backlog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const uploadBacklogAsset = async (req, res) => {
  try {
    const { backlogId } = req.params;
    const { type } = req.body; // image, video, audio, document
    
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const result = await uploadFile(req.file.buffer, req.file.originalname, 'backlogs', type || 'others');
    
    const asset = await Asset.create({
      module: 'Backlog',
      moduleId: backlogId,
      type: type || 'others',
      url: result.url,
      fileName: result.fileName,
      uploadedBy: req.user.id
    });

    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBacklogs,
  createBacklog,
  uploadBacklogAsset
};

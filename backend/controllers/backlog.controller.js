const { Backlog, BacklogStatus, BacklogAssignee, BacklogStatusHistory, Asset, User, Application } = require('../models');
const { uploadFile } = require('../services/storage');
const { Op } = require('sequelize');

const backlogInclude = [
  { model: BacklogStatus, as: 'status' },
  { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'picture'] },
  { model: Application, attributes: ['id', 'name'] },
  {
    model: User, as: 'assignees',
    attributes: ['id', 'name', 'email', 'picture'],
    through: { attributes: [] }
  },
  {
    model: BacklogStatusHistory, as: 'statusHistory',
    include: [
      { model: BacklogStatus, as: 'fromStatus', attributes: ['id', 'name'] },
      { model: BacklogStatus, as: 'toStatus', attributes: ['id', 'name'] },
      { model: User, as: 'changedByUser', attributes: ['id', 'name', 'email', 'picture'] }
    ],
    order: [['changedAt', 'ASC']]
  }
];

const getBacklogs = async (req, res) => {
  const { appId, statusId, search, assigneeId } = req.query;
  const { Op, literal } = require('sequelize');
  const where = {};
  if (appId) where.applicationId = appId;
  if (statusId) where.statusId = statusId;
  if (search) where.content = { [Op.iLike]: `%${search}%` };
  if (assigneeId) {
    // Filter backlogs that have this user as an assignee
    where.id = {
      [Op.in]: literal(
        `(SELECT "backlogId" FROM "BacklogAssignees" WHERE "userId" = '${assigneeId}')`
      )
    };
  }

  try {
    const backlogs = await Backlog.findAll({
      where,
      include: backlogInclude,
      order: [['createdAt', 'DESC']]
    });
    res.json(backlogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBacklog = async (req, res) => {
  try {
    const { assigneeIds, ...rest } = req.body;
    const backlog = await Backlog.create({ ...rest, createdBy: req.user.id });

    // Set assignees if provided
    if (assigneeIds && assigneeIds.length > 0) {
      const rows = assigneeIds.map(userId => ({ backlogId: backlog.id, userId }));
      await BacklogAssignee.bulkCreate(rows, { ignoreDuplicates: true });
    }

    // Log initial status history
    if (backlog.statusId) {
      await BacklogStatusHistory.create({
        backlogId: backlog.id,
        fromStatusId: null,
        toStatusId: backlog.statusId,
        changedBy: req.user.id,
        changedAt: new Date()
      });
    }

    const full = await Backlog.findByPk(backlog.id, { include: backlogInclude });
    res.status(201).json(full);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const uploadBacklogAsset = async (req, res) => {
  try {
    const { backlogId } = req.params;
    const { type } = req.body;

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
  uploadBacklogAsset,
  backlogInclude
};

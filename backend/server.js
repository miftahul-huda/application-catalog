const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || process.env.APP_PORT || 5050;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/app-groups', require('./routes/app-group.routes'));
app.use('/api/apps', require('./routes/app.routes'));
app.use('/api/backlogs', require('./routes/backlog.routes'));
app.use('/api/deployments', require('./routes/deployment.routes'));
app.use('/api/master', require('./routes/master.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/assets', require('./routes/asset.routes'));
app.use('/api/source-codes', require('./routes/source-code.routes'));
app.use('/api/bug-histories', require('./routes/bug-history.routes'));
app.use('/api/documentations', require('./routes/documentation.routes'));
app.use('/api/knowledge-base', require('./routes/knowledge-base.routes'));
app.use('/api/relationships', require('./routes/relationship.routes'));
app.use('/api/group-documentations', require('./routes/group-documentation.routes'));



app.get('/api/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID
  });
});

app.get('/', (req, res) => res.json({ message: 'Application Catalog API' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const seedMasterData = async () => {
  const { ApplicationProject, ApplicationCategory, ApplicationFunction, DeveloperRole, BacklogStatus, DeploymentPlatform, DeploymentEnvironment } = require('./models');
  const projectCount = await ApplicationProject.count();
  if (projectCount === 0) {
    await ApplicationProject.bulkCreate([
      { name: 'Core Banking' }, { name: 'Mobile App Revamp' }, { name: 'HR Portal' }, { name: 'Platform Engineering' }
    ]);
  }
  const catCount = await ApplicationCategory.count();
  if (catCount === 0) {
    await ApplicationCategory.bulkCreate([
      { name: 'Web Application' }, { name: 'Mobile Application' }, { name: 'PWA' }, { name: 'Desktop' }
    ]);
  }
  const funcCount = await ApplicationFunction.count();
  if (funcCount === 0) {
    await ApplicationFunction.bulkCreate([
      { name: 'Frontend' }, { name: 'Backend' }, { name: 'Jobs' }, { name: 'Shell Script' }, { name: 'Others' }
    ]);
  }
  const roleCount = await DeveloperRole.count();
  if (roleCount === 0) {
    await DeveloperRole.bulkCreate([
      { name: 'Software Developer' }, { name: 'Data Engineer' }, { name: 'UI/UX Engineer' },
      { name: 'Fullstack' }, { name: 'Backend Engineer' }, { name: 'ML Engineer' },
      { name: 'System Engineer' }, { name: 'QA & Tester' }
    ]);
  }
  const statusCount = await BacklogStatus.count();
  if (statusCount === 0) {
    await BacklogStatus.bulkCreate([
      { name: 'Requested' }, { name: 'In Progress' }, { name: 'Canceled' }, { name: 'Done' }
    ]);
  }
  const platformCount = await DeploymentPlatform.count();
  if (platformCount === 0) {
    await DeploymentPlatform.bulkCreate([
      { name: 'VM' }, { name: 'Managed VM Group' }, { name: 'Kubernetes' },
      { name: 'Docker Swarm' }, { name: 'Cloud Run' }, { name: 'App Engine' }
    ]);
  }
  const envCount = await DeploymentEnvironment.count();
  if (envCount === 0) {
    await DeploymentEnvironment.bulkCreate([
      { name: 'Development' }, { name: 'Staging' }, { name: 'Production' }
    ]);
  }
};

const migrateDocumentationData = async () => {
  const { Application, Documentation } = require('./models');
  const { Op } = require('sequelize');
  try {
    const apps = await Application.findAll({
      where: {
        documentation: {
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.ne]: '' }
          ]
        }
      }
    });
    if (apps.length > 0) {
      console.log(`Running migration for ${apps.length} legacy application documentations...`);
      for (const app of apps) {
        if (app.documentation && app.documentation.trim() !== '') {
          const today = new Date();
          const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
          const prefix = `DOC-${app.id}-${dateStr}`;
          const count = await Documentation.count({
            where: { applicationId: app.id }
          });
          if (count === 0) {
            const last = await Documentation.findOne({
              where: { id: { [Op.like]: `${prefix}-%` } },
              order: [['createdAt', 'DESC']]
            });
            const next = last ? parseInt(last.id.split('-').pop()) + 1 : 1;
            const docId = `${prefix}-${String(next).padStart(3, '0')}`;
            await Documentation.create({
              id: docId,
              applicationId: app.id,
              title: 'General Documentation',
              content: app.documentation,
              createdBy: app.createdBy
            });
            console.log(`Migrated legacy documentation for app: ${app.id}`);
          }
          await app.update({ documentation: null });
        }
      }
      console.log('✅ Legacy documentation migration completed.');
    }
  } catch (error) {
    console.error('❌ Failed to migrate legacy documentation:', error);
  }
};

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    await sequelize.sync({ alter: true });
    console.log('✅ Models synchronized');
    await migrateDocumentationData();
    await seedMasterData();
    console.log('✅ Master data seeded');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

startServer();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.APP_PORT || 5050;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
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

app.get('/', (req, res) => res.json({ message: 'Application Catalog API' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const seedMasterData = async () => {
  const { ApplicationProject, ApplicationCategory, ApplicationFunction, DeveloperRole, BacklogStatus } = require('./models');
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
};

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    await sequelize.sync({ alter: true });
    console.log('✅ Models synchronized');
    await seedMasterData();
    console.log('✅ Master data seeded');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

startServer();

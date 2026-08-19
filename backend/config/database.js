const { Sequelize } = require('sequelize');
const { execSync } = require('child_process');
require('dotenv').config();

let dbHost = process.env.DB_HOST;

if (dbHost && (dbHost.startsWith('http://') || dbHost.startsWith('https://'))) {
  try {
    const responseText = execSync(`curl -s "${dbHost}"`, { timeout: 10000 }).toString().trim();
    const responseJson = JSON.parse(responseText);
    if (responseJson && responseJson.public_ip) {
      dbHost = responseJson.public_ip;
      console.log(`Resolved DB_HOST from URL to IP: ${dbHost}`);
    } else {
      console.error('Invalid response from DB_HOST URL:', responseText);
    }
  } catch (error) {
    console.error('Failed to retrieve IP from DB_HOST URL:', error.message);
  }
}

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: dbHost,
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;

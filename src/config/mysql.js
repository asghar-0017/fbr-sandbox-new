import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Master database configuration
export const masterConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3307,
  username: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_MASTER_DB || 'fbr_master',
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Master database connection
export const masterSequelize = new Sequelize(masterConfig);

// Function to create tenant database connection
export const createTenantConnection = (databaseName) => {
  return new Sequelize({
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3307,
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    database: databaseName,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
};

// Test master database connection
export const testMasterConnection = async () => {
  try {
    await masterSequelize.authenticate();
    console.log('✅ Master database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to master database:', error);
    return false;
  }
};

// Initialize master database
export const initializeMasterDatabase = async () => {
  try {
    await masterSequelize.sync({ alter: true });
    console.log('✅ Master database synchronized successfully.');
    return true;
  } catch (error) {
    console.error('❌ Error synchronizing master database:', error);
    return false;
  }
}; 
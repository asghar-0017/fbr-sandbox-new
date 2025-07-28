import mysqlConnector from './src/dbConnector/mysqlConnector.js';
import TenantDatabaseService from './src/service/TenantDatabaseService.js';
import dotenv from 'dotenv';

dotenv.config();

const setupMySQL = async () => {
  try {
    console.log('🚀 Setting up MySQL multi-tenant system...');
    
    // Initialize MySQL connector
    await mysqlConnector({}, console);
    
    console.log('✅ MySQL multi-tenant system setup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your .env file with MySQL credentials');
    console.log('2. Run the migration script: node scripts/migrateToMySQL.js');
    console.log('3. Update your app.js to use the new MySQL routes');
    console.log('4. Test the system with a sample tenant');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
};

setupMySQL(); 
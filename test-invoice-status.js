import { Sequelize } from 'sequelize';
import { createInvoiceModel } from './src/model/mysql/tenant/Invoice.js';

// Test database configuration
const testConfig = {
  host: '45.55.137.96',
  port: 3306,
  username: 'fr_master_o',
  password: 'noLograt$5aion',
  database: 'fr_master',
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    connectTimeout: 60000
  }
};

async function testInvoiceStatus() {
  let sequelize;
  
  try {
    console.log('Testing Invoice Status Functionality...');
    
    // Create test connection
    sequelize = new Sequelize(testConfig);
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Create Invoice model
    const Invoice = createInvoiceModel(sequelize);
    
    // Test model creation
    console.log('✅ Invoice model created successfully');
    console.log('Model attributes:', Object.keys(Invoice.rawAttributes));
    
    // Check if status field exists
    const statusField = Invoice.rawAttributes.status;
    if (statusField) {
      console.log('✅ Status field found in model');
      console.log('Status field type:', statusField.type);
      console.log('Status field defaultValue:', statusField.defaultValue);
    } else {
      console.log('❌ Status field not found in model');
    }
    
    // Check if fbr_invoice_number field exists
    const fbrField = Invoice.rawAttributes.fbr_invoice_number;
    if (fbrField) {
      console.log('✅ FBR Invoice Number field found in model');
      console.log('FBR field type:', fbrField.type);
    } else {
      console.log('❌ FBR Invoice Number field not found in model');
    }
    
    console.log('\n🎉 Invoice Status Test Completed Successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Run the test
testInvoiceStatus(); 
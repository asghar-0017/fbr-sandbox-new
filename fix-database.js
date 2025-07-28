import { masterSequelize } from './src/config/mysql.js';
import dotenv from 'dotenv';

dotenv.config();

const fixDatabase = async () => {
  try {
    console.log('🔧 Starting database fix...');
    
    // Test connection
    await masterSequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Check if sellerNTNCNIC column exists
    const [results] = await masterSequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.MYSQL_MASTER_DB || 'fbr_master'}' 
      AND TABLE_NAME = 'tenants' 
      AND COLUMN_NAME = 'sellerNTNCNIC'
    `);
    
    if (results.length === 0) {
      console.log('📝 Adding sellerNTNCNIC column...');
      
      // Add the column without unique constraint first
      await masterSequelize.query(`
        ALTER TABLE tenants 
        ADD COLUMN sellerNTNCNIC VARCHAR(50) NOT NULL DEFAULT ''
      `);
      
      console.log('✅ sellerNTNCNIC column added successfully');
      
      // Update existing records with a default value
      await masterSequelize.query(`
        UPDATE tenants 
        SET sellerNTNCNIC = CONCAT('TEMP_', tenant_id) 
        WHERE sellerNTNCNIC = ''
      `);
      
      console.log('✅ Existing records updated with default values');
      
      // Now add unique constraint
      try {
        await masterSequelize.query(`
          ALTER TABLE tenants 
          ADD UNIQUE KEY unique_seller_ntn_cnic (sellerNTNCNIC)
        `);
        console.log('✅ Unique constraint added successfully');
      } catch (error) {
        console.log('⚠️ Could not add unique constraint (may already exist):', error.message);
      }
    } else {
      console.log('✅ sellerNTNCNIC column already exists');
    }
    
    // Check for other missing columns
    const requiredColumns = [
      'sellerBusinessName',
      'sellerProvince', 
      'sellerAddress'
    ];
    
    for (const column of requiredColumns) {
      const [colResults] = await masterSequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '${process.env.MYSQL_MASTER_DB || 'fbr_master'}' 
        AND TABLE_NAME = 'tenants' 
        AND COLUMN_NAME = '${column}'
      `);
      
      if (colResults.length === 0) {
        console.log(`📝 Adding ${column} column...`);
        
        let columnType = 'VARCHAR(255)';
        if (column === 'sellerAddress') {
          columnType = 'TEXT';
        } else if (column === 'sellerProvince') {
          columnType = 'VARCHAR(100)';
        }
        
        await masterSequelize.query(`
          ALTER TABLE tenants 
          ADD COLUMN ${column} ${columnType} NULL
        `);
        
        console.log(`✅ ${column} column added successfully`);
      } else {
        console.log(`✅ ${column} column already exists`);
      }
    }
    
    console.log('🎉 Database fix completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
    process.exit(1);
  }
};

fixDatabase(); 
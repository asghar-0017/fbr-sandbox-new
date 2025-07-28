import { masterSequelize } from './src/config/mysql.js';
import dotenv from 'dotenv';

dotenv.config();

const removeDuplicateIndexes = async () => {
  try {
    console.log('🔧 Starting duplicate index removal...');
    
    // Test connection
    await masterSequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Get all indexes on the tenants table
    const [indexes] = await masterSequelize.query(`
      SHOW INDEX FROM tenants
    `);
    
    console.log('📋 Current indexes on tenants table:');
    indexes.forEach(index => {
      console.log(`  - ${index.Key_name} (${index.Column_name})`);
    });
    
    // Group indexes by column name
    const indexGroups = {};
    indexes.forEach(index => {
      if (!indexGroups[index.Column_name]) {
        indexGroups[index.Column_name] = [];
      }
      indexGroups[index.Column_name].push(index.Key_name);
    });
    
    // Remove duplicate indexes (keep only the first one for each column)
    for (const [columnName, indexNames] of Object.entries(indexGroups)) {
      if (indexNames.length > 1) {
        console.log(`📝 Found ${indexNames.length} indexes for column ${columnName}`);
        
        // Keep the first index, remove the rest
        const indexesToRemove = indexNames.slice(1);
        
        for (const indexName of indexesToRemove) {
          try {
            await masterSequelize.query(`
              DROP INDEX ${indexName} ON tenants
            `);
            console.log(`✅ Removed duplicate index: ${indexName}`);
          } catch (error) {
            console.log(`⚠️ Could not remove index ${indexName}: ${error.message}`);
          }
        }
      }
    }
    
    // Now try to add the unique constraint
    try {
      await masterSequelize.query(`
        ALTER TABLE tenants 
        ADD UNIQUE KEY unique_seller_ntn_cnic (sellerNTNCNIC)
      `);
      console.log('✅ Unique constraint added successfully');
    } catch (error) {
      console.log('⚠️ Still could not add unique constraint:', error.message);
    }
    
    console.log('🎉 Duplicate index removal completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error removing duplicate indexes:', error);
    process.exit(1);
  }
};

removeDuplicateIndexes(); 
import TenantDatabaseService from './src/service/TenantDatabaseService.js';
import mysqlConnector from './src/dbConnector/mysqlConnector.js';
import Tenant from './src/model/mysql/Tenant.js';

const fixAllTenantTables = async () => {
  try {
    console.log('🔍 Fixing buyers table schema for all tenants...');
    
    // Initialize master database connection
    await mysqlConnector({}, {
      info: (msg) => console.log(`INFO: ${msg}`),
      error: (msg) => console.error(`ERROR: ${msg}`)
    });
    
    // Get all active tenants
    const tenants = await Tenant.findAll({
      where: { is_active: true }
    });
    
    console.log(`📋 Found ${tenants.length} active tenants`);
    
    for (const tenant of tenants) {
      try {
        console.log(`\n🔍 Processing tenant: ${tenant.tenant_id} (${tenant.database_name})`);
        
        const tenantDb = await TenantDatabaseService.getTenantDatabase(tenant.tenant_id);
        
        // Check current table structure
        const [results] = await tenantDb.sequelize.query('DESCRIBE buyers');
        const currentColumns = results.map(row => row.Field);
        
        // Define old columns to remove
        const oldColumns = [
          'buyer_ntn_cnic',
          'buyer_business_name',
          'buyer_province',
          'buyer_address',
          'buyer_registration_type'
        ];
        
        // Define new columns that should exist
        const newColumns = [
          'buyerNTNCNIC',
          'buyerBusinessName',
          'buyerProvince',
          'buyerAddress',
          'buyerRegistrationType'
        ];
        
        let hasChanges = false;
        
        // Remove old columns if they exist
        for (const oldColumn of oldColumns) {
          if (currentColumns.includes(oldColumn)) {
            console.log(`  🗑️ Removing old column: ${oldColumn}`);
            await tenantDb.sequelize.query(`ALTER TABLE buyers DROP COLUMN ${oldColumn}`);
            console.log(`  ✅ Removed old column: ${oldColumn}`);
            hasChanges = true;
          }
        }
        
        // Check if new columns exist
        const missingNewColumns = newColumns.filter(col => !currentColumns.includes(col));
        
        if (missingNewColumns.length > 0) {
          console.log(`  ❌ Missing new columns: ${missingNewColumns.join(', ')}`);
          
          // Add missing new columns
          for (const column of missingNewColumns) {
            let columnDefinition = '';
            
            switch (column) {
              case 'buyerNTNCNIC':
                columnDefinition = 'ADD COLUMN buyerNTNCNIC VARCHAR(50)';
                break;
              case 'buyerBusinessName':
                columnDefinition = 'ADD COLUMN buyerBusinessName VARCHAR(255)';
                break;
              case 'buyerProvince':
                columnDefinition = 'ADD COLUMN buyerProvince VARCHAR(100) NOT NULL';
                break;
              case 'buyerAddress':
                columnDefinition = 'ADD COLUMN buyerAddress TEXT';
                break;
              case 'buyerRegistrationType':
                columnDefinition = 'ADD COLUMN buyerRegistrationType VARCHAR(100) NOT NULL';
                break;
            }
            
            if (columnDefinition) {
              console.log(`  🔧 Adding missing column: ${column}`);
              await tenantDb.sequelize.query(`ALTER TABLE buyers ${columnDefinition}`);
              console.log(`  ✅ Added missing column: ${column}`);
              hasChanges = true;
            }
          }
        }
        
        if (hasChanges) {
          console.log(`  ✅ Fixed table structure for tenant: ${tenant.tenant_id}`);
        } else {
          console.log(`  ✅ Table structure already correct for tenant: ${tenant.tenant_id}`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing tenant ${tenant.tenant_id}:`, error.message);
      }
    }
    
    console.log('\n🎉 All tenant tables processed!');
    
  } catch (error) {
    console.error('❌ Error fixing all tenant tables:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  }
};

fixAllTenantTables(); 
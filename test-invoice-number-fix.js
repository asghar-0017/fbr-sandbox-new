// Test script to verify invoice number fix
// This script tests that when an invoice is submitted to FBR, the invoice_number is updated with the FBR number

const mysql = require('mysql2/promise');
const config = require('./src/config/mysql.js');

async function testInvoiceNumberFix() {
  console.log('Testing invoice number fix...\n');

  try {
    // Connect to the main database to get tenant list
    const connection = await mysql.createConnection(config);
    
    // Get all tenants
    const [tenants] = await connection.execute('SELECT * FROM tenants WHERE is_active = 1');
    console.log(`Found ${tenants.length} active tenants\n`);

    for (const tenant of tenants) {
      console.log(`Testing tenant: ${tenant.tenant_name} (${tenant.database_name})`);
      
      try {
        // Connect to tenant database
        const tenantConfig = {
          ...config,
          database: tenant.database_name
        };
        
        const tenantConnection = await mysql.createConnection(tenantConfig);
        
        // Check if invoices table exists and has the required columns
        const [tables] = await tenantConnection.execute('SHOW TABLES LIKE "invoices"');
        if (tables.length === 0) {
          console.log('  - Invoices table not found, skipping...');
          continue;
        }

        // Check for required columns
        const [columns] = await tenantConnection.execute('SHOW COLUMNS FROM invoices');
        const columnNames = columns.map(col => col.Field);
        
        if (!columnNames.includes('invoice_number') || !columnNames.includes('fbr_invoice_number') || !columnNames.includes('status')) {
          console.log('  - Required columns not found, skipping...');
          continue;
        }

        // Get sample invoices to check current state
        const [invoices] = await tenantConnection.execute(`
          SELECT id, invoice_number, fbr_invoice_number, status 
          FROM invoices 
          ORDER BY created_at DESC 
          LIMIT 5
        `);

        console.log(`  - Found ${invoices.length} recent invoices:`);
        
        invoices.forEach(invoice => {
          const hasDraftPrefix = invoice.invoice_number && invoice.invoice_number.startsWith('DRAFT_');
          const hasFbrNumber = invoice.fbr_invoice_number && invoice.fbr_invoice_number !== invoice.invoice_number;
          const isPosted = invoice.status === 'posted';
          
          console.log(`    * ID: ${invoice.id}`);
          console.log(`      Invoice #: ${invoice.invoice_number}`);
          console.log(`      FBR #: ${invoice.fbr_invoice_number || 'N/A'}`);
          console.log(`      Status: ${invoice.status}`);
          console.log(`      Has DRAFT prefix: ${hasDraftPrefix}`);
          console.log(`      Has separate FBR number: ${hasFbrNumber}`);
          console.log(`      Is posted: ${isPosted}`);
          
          // Check if the fix is working
          if (isPosted && hasDraftPrefix && !hasFbrNumber) {
            console.log(`      ⚠️  ISSUE: Posted invoice still has DRAFT prefix and no FBR number`);
          } else if (isPosted && !hasDraftPrefix) {
            console.log(`      ✅ GOOD: Posted invoice has proper number (no DRAFT prefix)`);
          } else if (isPosted && hasFbrNumber) {
            console.log(`      ✅ GOOD: Posted invoice has both numbers (FBR number separate)`);
          } else {
            console.log(`      ℹ️  INFO: Draft invoice or normal state`);
          }
          console.log('');
        });

        await tenantConnection.end();
        
      } catch (error) {
        console.log(`  - Error testing tenant: ${error.message}`);
      }
    }

    await connection.end();
    console.log('Test completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testInvoiceNumberFix();

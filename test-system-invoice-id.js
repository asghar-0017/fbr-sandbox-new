#!/usr/bin/env node

/**
 * Test Script: System Invoice ID Generation
 * 
 * This script tests the system invoice ID generation functionality
 * 
 * Usage: node test-system-invoice-id.js
 */

import TenantDatabaseService from './src/service/TenantDatabaseService.js';

// Test helper function to generate system invoice ID
const generateSystemInvoiceId = async (Invoice) => {
  try {
    // Get the highest existing system invoice ID for this tenant
    const lastInvoice = await Invoice.findOne({
      where: {
        system_invoice_id: {
          [Invoice.sequelize.Sequelize.Op.like]: 'INV-%'
        }
      },
      order: [['system_invoice_id', 'DESC']],
      attributes: ['system_invoice_id']
    });

    let nextNumber = 1;
    
    if (lastInvoice && lastInvoice.system_invoice_id) {
      // Extract the number from the last invoice ID (e.g., "INV-0005" -> 5)
      const match = lastInvoice.system_invoice_id.match(/INV-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Format as INV-0001, INV-0002, etc.
    return `INV-${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating system invoice ID:', error);
    // Fallback to timestamp-based ID if there's an error
    return `INV-${Date.now().toString().slice(-4)}`;
  }
};

async function testSystemInvoiceIdGeneration() {
  try {
    console.log('🧪 Testing System Invoice ID Generation...\n');

    // Get available tenants
    const tenants = await TenantDatabaseService.getAllTenants();
    console.log(`📋 Found ${tenants.length} tenants`);

    if (tenants.length === 0) {
      console.log('⚠️ No tenants found. Please create a tenant first.');
      return;
    }

    // Test with the first tenant
    const tenant = tenants[0];
    console.log(`🔍 Testing with tenant: ${tenant.company_name} (ID: ${tenant.tenant_id})`);

    // Get tenant database connection
    const tenantDb = await TenantDatabaseService.getTenantDatabase(tenant.tenant_id);
    const { Invoice } = tenantDb.models;

    // Test system invoice ID generation
    console.log('\n🔢 Testing System Invoice ID Generation:');
    
    // Generate a few test IDs
    for (let i = 1; i <= 5; i++) {
      const systemInvoiceId = await generateSystemInvoiceId(Invoice);
      console.log(`   Test ${i}: Generated ID: ${systemInvoiceId}`);
    }

    // Check existing invoices
    console.log('\n📊 Checking Existing Invoices:');
    const existingInvoices = await Invoice.findAll({
      attributes: ['id', 'invoice_number', 'system_invoice_id', 'status'],
      limit: 10,
      order: [['created_at', 'DESC']]
    });

    if (existingInvoices.length > 0) {
      console.log(`   Found ${existingInvoices.length} existing invoices:`);
      existingInvoices.forEach((invoice, index) => {
        console.log(`   ${index + 1}. ID: ${invoice.id}, System ID: ${invoice.system_invoice_id || 'Not set'}, Invoice #: ${invoice.invoice_number}, Status: ${invoice.status}`);
      });
    } else {
      console.log('   No existing invoices found.');
    }

    // Test pattern validation
    console.log('\n✅ Testing Pattern Validation:');
    const testIds = ['INV-0001', 'INV-0010', 'INV-0100', 'INV-1000'];
    testIds.forEach(id => {
      const match = id.match(/INV-(\d+)/);
      if (match) {
        const number = parseInt(match[1]);
        console.log(`   ${id} -> Number: ${number}, Next: INV-${(number + 1).toString().padStart(4, '0')}`);
      }
    });

    console.log('\n🎉 System Invoice ID Generation test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testSystemInvoiceIdGeneration()
    .then(() => {
      console.log('✅ Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

export { testSystemInvoiceIdGeneration };

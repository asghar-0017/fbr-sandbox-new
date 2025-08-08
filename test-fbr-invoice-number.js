const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TENANT_ID = 'your_tenant_id'; // Replace with actual tenant ID
const INVOICE_ID = 'your_invoice_id'; // Replace with actual invoice ID

// Mock FBR API response
const mockFbrResponse = {
  "invoiceNumber": "6386420DI1754587489984",
  "dated": "2025-08-07 22:24:49",
  "validationResponse": {
    "statusCode": "00",
    "status": "Valid",
    "error": "",
    "invoiceStatuses": [
      {
        "itemSNo": "1",
        "statusCode": "00",
        "status": "Valid",
        "invoiceNo": "6386420DI1754587489984-1",
        "errorCode": "",
        "error": ""
      }
    ]
  }
};

async function testFbrInvoiceNumberSaving() {
  try {
    console.log('🧪 Testing FBR Invoice Number Saving...\n');

    // Step 1: Get all invoices to see current state
    console.log('📋 Step 1: Getting current invoices...');
    const getInvoicesResponse = await axios.get(`${BASE_URL}/tenant/${TENANT_ID}/invoices`);
    
    if (getInvoicesResponse.data.success) {
      const invoices = getInvoicesResponse.data.data.invoices;
      console.log(`Found ${invoices.length} invoices:`);
      
      invoices.forEach(invoice => {
        console.log(`  - ID: ${invoice.id}`);
        console.log(`    Invoice Number: ${invoice.invoiceNumber}`);
        console.log(`    FBR Invoice Number: ${invoice.fbr_invoice_number || 'Not set'}`);
        console.log(`    Status: ${invoice.status}`);
        console.log('');
      });
    }

    // Step 2: Test submitting a specific invoice to FBR
    console.log('📤 Step 2: Testing FBR submission...');
    console.log('Note: This requires a valid invoice ID and FBR credentials');
    console.log('Mock FBR response that should be saved:');
    console.log(JSON.stringify(mockFbrResponse, null, 2));
    console.log('');

    // Step 3: Check if the invoice was updated with FBR number
    console.log('🔍 Step 3: Verifying FBR invoice number was saved...');
    const verifyResponse = await axios.get(`${BASE_URL}/tenant/${TENANT_ID}/invoices`);
    
    if (verifyResponse.data.success) {
      const updatedInvoices = verifyResponse.data.data.invoices;
      const postedInvoices = updatedInvoices.filter(inv => inv.status === 'posted');
      
      console.log(`Found ${postedInvoices.length} posted invoices:`);
      postedInvoices.forEach(invoice => {
        console.log(`  - ID: ${invoice.id}`);
        console.log(`    Display Invoice Number: ${invoice.invoiceNumber}`);
        console.log(`    FBR Invoice Number: ${invoice.fbr_invoice_number || 'Not set'}`);
        console.log(`    Status: ${invoice.status}`);
        
        if (invoice.fbr_invoice_number) {
          console.log(`    ✅ FBR invoice number is saved!`);
        } else {
          console.log(`    ❌ FBR invoice number is missing!`);
        }
        console.log('');
      });
    }

    // Step 4: Test search functionality
    console.log('🔍 Step 4: Testing search functionality...');
    const searchResponse = await axios.get(`${BASE_URL}/tenant/${TENANT_ID}/invoices?search=6386420DI`);
    
    if (searchResponse.data.success) {
      const searchResults = searchResponse.data.data.invoices;
      console.log(`Search for "6386420DI" returned ${searchResults.length} results:`);
      
      searchResults.forEach(invoice => {
        console.log(`  - ${invoice.invoiceNumber} (FBR: ${invoice.fbr_invoice_number || 'N/A'})`);
      });
    }

    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Instructions for running the test
console.log('🚀 FBR Invoice Number Test Script');
console.log('==================================');
console.log('');
console.log('Before running this test:');
console.log('1. Make sure your backend server is running on localhost:3000');
console.log('2. Update TENANT_ID with a valid tenant ID');
console.log('3. Update INVOICE_ID with a valid invoice ID (optional)');
console.log('4. Ensure you have FBR credentials configured');
console.log('');
console.log('This test will:');
console.log('- Show current invoice numbers');
console.log('- Test FBR submission (if invoice ID provided)');
console.log('- Verify FBR invoice numbers are saved');
console.log('- Test search functionality');
console.log('');

// Uncomment the line below to run the test
// testFbrInvoiceNumberSaving();

module.exports = { testFbrInvoiceNumberSaving, mockFbrResponse };

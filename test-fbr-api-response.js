import { postData } from './src/service/FBRService.js';

// Test FBR API response handling
async function testFBRAPIResponse() {
  try {
    console.log('🧪 Testing FBR API Response Handling...\n');

    // Test data similar to what's being sent
    const testData = {
      "invoiceType": "Sale Invoice",
      "invoiceDate": "2025-01-15",
      "sellerNTNCNIC": "6386420",
      "sellerBusinessName": "Test Company",
      "sellerProvince": "SINDH",
      "sellerAddress": "Test Address",
      "buyerNTNCNIC": "0000000000000",
      "buyerBusinessName": "Test Buyer",
      "buyerProvince": "SINDH",
      "buyerAddress": "Test Buyer Address",
      "buyerRegistrationType": "Unregistered",
      "invoiceRefNo": null,
      "scenarioId": "SN019",
      "items": [
        {
          "hsCode": "0304.7400",
          "productDescription": "Test Product",
          "rate": "18%",
          "uoM": "KG",
          "quantity": 1,
          "unitPrice": 1000,
          "totalValues": 1180,
          "valueSalesExcludingST": 1000,
          "fixedNotifiedValueOrRetailPrice": 1000,
          "salesTaxApplicable": 180,
          "salesTaxWithheldAtSource": 0,
          "furtherTax": 0,
          "sroScheduleNo": null,
          "fedPayable": 0,
          "discount": 0,
          "saleType": "Goods at standard rate (default)",
          "sroItemSerialNo": null,
          "billOfLadingUoM": null,
          "extraTax": 0
        }
      ]
    };

    // You'll need to provide a valid token here
    const token = process.env.FBR_TOKEN || 'your-fbr-token-here';
    
    if (token === 'your-fbr-token-here') {
      console.log('❌ Please set FBR_TOKEN environment variable or update the token in this script');
      console.log('Example: FBR_TOKEN=your-token-here node test-fbr-api-response.js');
      return;
    }

    console.log('📤 Sending test data to FBR API...');
    console.log('Test Data:', JSON.stringify(testData, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

    const response = await postData(
      "di_data/v1/di/postinvoicedata_sb",
      testData,
      "sandbox",
      token
    );

    console.log('\n' + '='.repeat(80) + '\n');
    console.log('📥 FBR API Response Analysis:');
    console.log('Status Code:', response.status);
    console.log('Response Type:', typeof response.data);
    console.log('Response Length:', response.data ? response.data.length : 0);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    // Analyze the response
    console.log('\n🔍 Response Analysis:');
    
    if (response.status === 200) {
      if (response.data && response.data.validationResponse) {
        console.log('✅ Found validationResponse structure');
        console.log('Status Code:', response.data.validationResponse.statusCode);
        console.log('Invoice Number:', response.data.invoiceNumber);
      } else if (response.data && (response.data.invoiceNumber || response.data.success)) {
        console.log('✅ Found direct response structure');
        console.log('Invoice Number:', response.data.invoiceNumber);
        console.log('Success:', response.data.success);
      } else if (response.data && response.data.error) {
        console.log('❌ Found error response structure');
        console.log('Error:', response.data.error);
      } else if (!response.data || response.data === '') {
        console.log('⚠️  Empty response with 200 status');
        console.log('This might be a successful submission with no response body');
      } else {
        console.log('❓ Unexpected response structure');
        console.log('Response keys:', Object.keys(response.data || {}));
      }
    } else {
      console.log('❌ Non-200 status code');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
    }
  }
}

// Run the test
testFBRAPIResponse();

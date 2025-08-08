import fetch from 'node-fetch';

// Test script to verify the new buyer registration type functionality
async function testBuyerRegistrationType() {
  const baseUrl = 'http://localhost:3000'; // Adjust if your server runs on different port
  const testNTN = '4220181848433'; // Test NTN value from your example
  
  console.log('Testing new buyer registration type functionality...\n');
  
  try {
    // Test buyer creation with automatic FBR registration type lookup
    console.log('1. Creating buyer with NTN:', testNTN);
    console.log('   (Registration type will be automatically fetched from FBR)');
    
    const buyerData = {
      buyerNTNCNIC: testNTN,
      buyerBusinessName: 'Test Business Auto-Registration',
      buyerProvince: 'Punjab',
      buyerAddress: 'Test Address for Auto-Registration'
    };
    
    const response = await fetch(`${baseUrl}/api/tenant/1/buyers?environment=production`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TEST_TOKEN_HERE' // Replace with actual token
      },
      body: JSON.stringify(buyerData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Buyer created successfully');
      console.log('   Response:', result.message);
      console.log('   Buyer data:', {
        id: result.data.id,
        buyerNTNCNIC: result.data.buyerNTNCNIC,
        buyerBusinessName: result.data.buyerBusinessName,
        buyerProvince: result.data.buyerProvince,
        buyerAddress: result.data.buyerAddress,
        buyerRegistrationType: result.data.buyerRegistrationType // This should be fetched from FBR
      });
      
      if (result.data.buyerRegistrationType) {
        console.log(`   ✅ Registration type automatically fetched: "${result.data.buyerRegistrationType}"`);
      } else {
        console.log('   ⚠️  Registration type not found in response');
      }
    } else {
      console.log('❌ Failed to create buyer');
      console.log('   Status:', response.status);
      console.log('   Error:', result.message);
      
      if (result.fbrResponse) {
        console.log('   FBR Response:', result.fbrResponse);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testBuyerRegistrationType().then(() => {
  console.log('\nTest completed.');
}).catch(error => {
  console.error('Test failed:', error);
});

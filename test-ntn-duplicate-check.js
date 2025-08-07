import fetch from 'node-fetch';

// Test script to verify NTN duplicate check functionality
async function testNTNDuplicateCheck() {
  const baseUrl = 'http://localhost:3000'; // Adjust if your server runs on different port
  const testNTN = '1234567890123'; // Test NTN value
  
  console.log('Testing NTN duplicate check functionality...\n');
  
  try {
    // First, try to create a buyer with the test NTN
    console.log('1. Creating first buyer with NTN:', testNTN);
    const firstBuyer = {
      buyerNTNCNIC: testNTN,
      buyerBusinessName: 'Test Business 1',
      buyerProvince: 'Punjab',
      buyerAddress: 'Test Address 1',
      buyerRegistrationType: 'Registered'
    };
    
    const firstResponse = await fetch(`${baseUrl}/api/tenant/1/buyers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TEST_TOKEN_HERE' // Replace with actual token
      },
      body: JSON.stringify(firstBuyer)
    });
    
    const firstResult = await firstResponse.json();
    
    if (firstResponse.ok) {
      console.log('✅ First buyer created successfully');
      console.log('   Response:', firstResult.message);
    } else {
      console.log('❌ Failed to create first buyer');
      console.log('   Error:', firstResult.message);
      return;
    }
    
    // Now try to create another buyer with the same NTN
    console.log('\n2. Attempting to create second buyer with same NTN:', testNTN);
    const secondBuyer = {
      buyerNTNCNIC: testNTN,
      buyerBusinessName: 'Test Business 2',
      buyerProvince: 'Sindh',
      buyerAddress: 'Test Address 2',
      buyerRegistrationType: 'Unregistered'
    };
    
    const secondResponse = await fetch(`${baseUrl}/api/tenant/1/buyers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TEST_TOKEN_HERE' // Replace with actual token
      },
      body: JSON.stringify(secondBuyer)
    });
    
    const secondResult = await secondResponse.json();
    
    if (secondResponse.status === 409) {
      console.log('✅ Duplicate NTN check working correctly');
      console.log('   Error message:', secondResult.message);
      console.log('   Status code:', secondResponse.status);
    } else {
      console.log('❌ Duplicate NTN check failed');
      console.log('   Expected status: 409, Got:', secondResponse.status);
      console.log('   Response:', secondResult);
    }
    
    // Test with different NTN
    console.log('\n3. Creating buyer with different NTN');
    const thirdBuyer = {
      buyerNTNCNIC: '9876543210987',
      buyerBusinessName: 'Test Business 3',
      buyerProvince: 'KPK',
      buyerAddress: 'Test Address 3',
      buyerRegistrationType: 'Registered'
    };
    
    const thirdResponse = await fetch(`${baseUrl}/api/tenant/1/buyers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TEST_TOKEN_HERE' // Replace with actual token
      },
      body: JSON.stringify(thirdBuyer)
    });
    
    const thirdResult = await thirdResponse.json();
    
    if (thirdResponse.ok) {
      console.log('✅ Third buyer with different NTN created successfully');
      console.log('   Response:', thirdResult.message);
    } else {
      console.log('❌ Failed to create third buyer');
      console.log('   Error:', thirdResult.message);
    }
    
    console.log('\n🎉 NTN duplicate check test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Note: Make sure to replace YOUR_TEST_TOKEN_HERE with an actual JWT token');
  console.log('You can get a token by logging in through the frontend or using the auth API\n');
  
  testNTNDuplicateCheck()
    .then(() => {
      console.log('\nTest script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test script failed:', error);
      process.exit(1);
    });
}

export default testNTNDuplicateCheck; 
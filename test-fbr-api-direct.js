import fetch from 'node-fetch';

// Test script to directly test FBR API call
async function testFBRAPIDirect() {
  const fbrToken = '6963a140-35f9-3f92-9100-20453a885a9e';
  const testNTN = '4220181848433';
  
  console.log('Testing FBR API directly...\n');
  console.log('Token:', fbrToken);
  console.log('NTN:', testNTN);
  
  try {
    const response = await fetch('https://gw.fbr.gov.pk/dist/v1/Get_Reg_Type', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fbrToken}`,
        'Content-Type': 'application/json',
        'Cookie': 'cookiesession1=678B2A28C1ED45C2F72773B495A993B5'
      },
      body: JSON.stringify({
        Registration_No: testNTN
      })
    });
    
    const result = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response Body:', result);
    
    if (response.ok) {
      console.log('✅ FBR API call successful');
      if (result.statuscode === '00' && result.REGISTRATION_TYPE) {
        console.log(`✅ Registration type: "${result.REGISTRATION_TYPE}"`);
      } else {
        console.log('⚠️  Unexpected response format');
      }
    } else {
      console.log('❌ FBR API call failed');
    }
    
  } catch (error) {
    console.error('❌ Error calling FBR API:', error.message);
  }
}

// Run the test
testFBRAPIDirect().then(() => {
  console.log('\nTest completed.');
}).catch(error => {
  console.error('Test failed:', error);
});

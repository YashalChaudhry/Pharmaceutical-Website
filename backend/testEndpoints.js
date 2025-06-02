const axios = require('axios');

// Function to test the API endpoints
async function testEndpoints() {
  try {
    console.log('Testing /api/medicines endpoint...');
    console.log('Sending request to http://localhost:3001/api/medicines...');
    
    const allMedicines = await axios.get('http://localhost:3001/api/medicines', {
      timeout: 5000 // 5 second timeout
    });
    
    console.log(`Status: ${allMedicines.status}`);
    console.log(`Total medicines returned: ${allMedicines.data.length}`);
    
    if (allMedicines.data.length > 0) {
      const sampleMedicine = allMedicines.data[0];
      console.log('Sample medicine:');
      console.log(`- Name: ${sampleMedicine.name}`);
      console.log(`- Category: ${sampleMedicine.category}`);
      console.log(`- Has image: ${!!sampleMedicine.image}`);
      
      if (sampleMedicine.image) {
        console.log(`- Image content type: ${sampleMedicine.image.contentType}`);
        console.log(`- Image data type: ${typeof sampleMedicine.image.data}`);
        console.log(`- Image data length: ${sampleMedicine.image.data ? sampleMedicine.image.data.length : 'N/A'}`);
      }
    }
    
    // Test category endpoint
    console.log('\nTesting /api/medicines/category/Pain Relief endpoint...');
    const categoryMedicines = await axios.get('http://localhost:3001/api/medicines/category/Pain%20Relief', {
      timeout: 5000 // 5 second timeout
    });
    console.log(`Status: ${categoryMedicines.status}`);
    console.log(`Total medicines in category: ${categoryMedicines.data.length}`);
    
  } catch (error) {
    console.error('Error testing endpoints:', error);
    console.error('Error message:', error.message);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Request details:', error.request._currentUrl);
    }
  }
}

// Run the test function
testEndpoints();

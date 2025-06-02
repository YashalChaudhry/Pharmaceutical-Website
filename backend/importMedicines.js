const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Base URL for API
const API_URL = 'http://localhost:3001/api';

async function importMedicines() {
  try {
    console.log('Starting medicine import process...');
    
    // Call the import endpoint
    const response = await axios.post(`${API_URL}/medicines/import-from-assets`);
    
    console.log('Import response:', response.data);
    console.log(`Successfully imported ${response.data.medicines.length} medicines.`);
    
    if (response.data.errors && response.data.errors.length > 0) {
      console.log('Errors occurred during import:');
      response.data.errors.forEach(error => console.log(`- ${error}`));
    }
    
    return response.data;
  } catch (error) {
    console.error('Error importing medicines:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
}

// Execute the import function
importMedicines()
  .then(() => console.log('Import process completed.'))
  .catch(err => console.error('Import process failed:', err));

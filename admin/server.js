const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3002; // Different port from the main backend

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname)));

// Serve the admin.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Admin server running on http://localhost:${PORT}`);
  console.log('Use the following credentials to login:');
  console.log('Username: admin');
  console.log('Password: admin123');
});

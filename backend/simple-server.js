const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API status route
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', message: 'API is running properly' });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Set up logging
const logStream = fs.createWriteStream(path.join(logsDir, 'server.log'), { flags: 'a' });
const logToFile = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  logStream.write(logMessage);
  console.log(message);
};

// Initialize express app
const app = express();

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logToFile(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Import routes
const userRoutes = require('./routes/userRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/orders', orderRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logToFile(`Error: ${err.stack}`);
  res.status(500).json({
    error: true,
    message: 'An internal server error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404 errors
app.use((req, res) => {
  logToFile(`404: ${req.method} ${req.url}`);
  res.status(404).json({
    error: true,
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logToFile(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logToFile(`Uncaught Exception: ${err}\nStack trace: ${err.stack}`);
});

// Handle process termination
process.on('SIGTERM', () => {
  logToFile('SIGTERM received. Closing server gracefully...');
  server.close(() => {
    logToFile('Server closed gracefully');
    logStream.end();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logToFile('SIGINT received. Closing server gracefully...');
  server.close(() => {
    logToFile('Server closed gracefully');
    logStream.end();
    process.exit(0);
  });
});

// Keep the server running
let server;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    logToFile("✅ MongoDB Compass connected successfully");
    
    // Start server after successful database connection
    const PORT = process.env.PORT || 3001;
    server = app.listen(PORT, () => {
      logToFile(`🚀 Server running on port ${PORT}`);
      logToFile(`Open http://localhost:${PORT} in your browser`);
    });
  })
  .catch((err) => {
    logToFile(`❌ MongoDB connection failed: ${err}`);
  });

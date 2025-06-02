const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.send('Medicine API is running! Use /api/medicines to access the medicine endpoints.');
});

// API status route
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', message: 'API is running properly' });
});

// Import routes
const userRoutes = require("./routes/userRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const orderRoutes = require("./routes/orderRoutes");

// Use routes
app.use("/api/users", userRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/orders", orderRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: 'An internal server error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Import Medicine model for initialization
const Medicine = require('./models/Medicine');
const fs = require('fs');

// Function to check if database has medicines and populate if empty
async function checkAndPopulateDatabase() {
  try {
    const medicineCount = await Medicine.countDocuments();
    console.log(`Database has ${medicineCount} medicines`);
    
    if (medicineCount === 0) {
      console.log('No medicines found in database. Adding sample medicines...');
      
      // Create some sample medicines
      const sampleMedicines = [
        {
          name: 'Panadol Tablets',
          price: 36,
          description: 'Pain relief tablets',
          category: 'Pain Relief'
        },
        {
          name: 'Brufen Tablets',
          price: 40,
          description: 'Anti-inflammatory tablets',
          category: 'Pain Relief'
        },
        {
          name: 'Calpol Syrup',
          price: 110,
          description: 'Fever relief syrup for children',
          category: 'Pain Relief'
        },
        {
          name: 'Dr Koff Cough Syrup',
          price: 830,
          description: 'Cough relief syrup',
          category: 'Cough & Cold'
        },
        {
          name: 'Hydryllin Syrup',
          price: 150,
          description: 'Cough relief syrup',
          category: 'Cough & Cold'
        },
        {
          name: 'Evion Capsules',
          price: 120,
          description: 'Vitamin E capsules',
          category: 'Vitamins'
        },
        {
          name: 'Folic Acid Tablets',
          price: 90,
          description: 'Folic acid supplements',
          category: 'Vitamins'
        },
        {
          name: 'Nebra Eye Drops',
          price: 230,
          description: 'Eye drops for dry eyes',
          category: 'Eye Care'
        },
        {
          name: 'Femicon Eye Drops',
          price: 160,
          description: 'Eye drops for allergies',
          category: 'Eye Care'
        },
        {
          name: 'Gaviscon Syrup',
          price: 190,
          description: 'Antacid for heartburn',
          category: 'Digestive Health'
        },
        {
          name: 'Risek Capsules',
          price: 200,
          description: 'Acid reflux treatment',
          category: 'Digestive Health'
        },
        {
          name: 'Zyrtec Tablets',
          price: 170,
          description: 'Antihistamine for allergies',
          category: 'Allergies'
        },
        {
          name: 'Rigix Tablets',
          price: 150,
          description: 'Allergy relief tablets',
          category: 'Allergies'
        },
        {
          name: 'Arinac Forte Tablets',
          price: 120,
          description: 'Cold and flu relief',
          category: 'Cold & Flu'
        },
        {
          name: 'Panadol Children Liquid',
          price: 140,
          description: 'Cold and flu relief for children',
          category: 'Cold & Flu'
        }
      ];
      
      // Insert the sample medicines into the database
      await Medicine.insertMany(sampleMedicines);
      console.log(`Added ${sampleMedicines.length} sample medicines to the database`);
    }
  } catch (error) {
    console.error('Error checking/populating database:', error);
  }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Compass connected successfully");
    
    // Check and populate database if needed
    await checkAndPopulateDatabase();
    
    // Start server after successful database connection
    const PORT = 3001; // Force port 3001 to match frontend expectations
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1); // Exit with failure
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application continues running
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Exit with failure after logging
  process.exit(1);
});

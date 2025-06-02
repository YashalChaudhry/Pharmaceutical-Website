const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Set up multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get all medicines
router.get('/', async (req, res) => {
  try {
    const medicines = await Medicine.find();
    console.log(`Found ${medicines.length} medicines in database`);
    
    // If no medicines found, check if we need to import them
    if (medicines.length === 0) {
      console.log('No medicines found in database. Consider running the import endpoint.');
      return res.status(200).json([]);
    }
    
    // Process medicines to ensure proper image format
    const processedMedicines = medicines.map(medicine => {
      const medicineObj = medicine.toObject();
      
      // Process image data if it exists
      if (medicineObj.image && medicineObj.image.data) {
        // Convert Buffer to Base64 string for frontend consumption
        const base64 = medicineObj.image.data.toString('base64');
        medicineObj.image = {
          contentType: medicineObj.image.contentType || 'image/jpeg',
          data: base64
        };
      }
      
      return medicineObj;
    });
    
    console.log(`Processed ${processedMedicines.length} medicines for frontend`);
    res.status(200).json(processedMedicines);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a single medicine
router.get('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.status(200).json(medicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new medicine with image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, category } = req.body;
    
    const newMedicine = new Medicine({
      name,
      price,
      description,
      category
    });
    
    if (req.file) {
      newMedicine.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }
    
    const savedMedicine = await newMedicine.save();
    res.status(201).json(savedMedicine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a medicine (including image and price)
router.patch('/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, category } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (price) updateData.price = price;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    
    // Update image if a new one is provided
    if (req.file) {
      updateData.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }
    
    updateData.updatedAt = Date.now();
    
    const updatedMedicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!updatedMedicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    res.status(200).json(updatedMedicine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a medicine
router.delete('/:id', async (req, res) => {
  try {
    const deletedMedicine = await Medicine.findByIdAndDelete(req.params.id);
    
    if (!deletedMedicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    res.status(200).json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Hardcoded price map (name: price) - add all your original medicine names and prices here
const priceMap = {
  'Algae Vit Tablets': 800,
  'Brufen Syrup': 120,
  'Dr Koff Cough Syrup': 830,
  'Brufen Tablets': 40,
  'Nuberol Forte Tablets': 60,
  'Caltrate Tablets': 5300,
  'Cdk Tablets': 280,
  'Femicon Eye Drops': 160,
  'Folic Acid Tablets': 90,
  'Nebra Eye Drops': 230,
  'Folineo Tablets': 170,
  'Get Over Plus Softgel': 570,
  'Evion Capsules': 120,
  'Fefolvit Capsules': 120,
  'deep freeze pain relief': 950,
  'Caflam Tablets': 160,
  'Calpol Syrup': 110,
  'Disprin Tablets': 30,
  'CapsiFlex Cream': 300,
  'Acukat Eye Drops': 460,
  'Amgydex Eye Drops': 240,
  'Cobrinzo Eye Drops': 1100,
  'Curine Eye Drops': 160,
  'Deximox Eye Drops': 400,
  'Neurobion Tablets': 130,
  'Hydryllin Syrup': 150,
  'Latep Eye Drops': 590,
  'Enterogermina Oral Suspension': 100,
  'Gaviscon Syrup': 190,
  'Risek Capsules': 200,
  'Nexum Capsules': 300,
  'Imodium Capsules': 70,
  'Zopent Tablets': 370,
  'Enflor Sachets': 80,
  'Ruling Capsules': 180,
  'Acefyl Cough Syrup': 160,
  'Bronochol Syrup': 130,
  'Coferb Cough Drops': 320,
  'Coferb Cough Syrup': 330,
  'Corex D Cough Syrup': 160,
  'Babynol Syrup': 180,
  'Combinol D Syrup': 100,
  'Arinac Suspension': 180,
  'Arinac Forte Tablets': 120,
  'Osnate D Tablets': 110,
  'Panadol Extend Tablets': 70,
  'Panadol Children Liquid': 140,
  'Norsaline P Nasal Drops': 120,
  'Medics Coldeez Syrup': 300,
  'Rigix Tablets': 150,
  'Bilazest Tablets': 300,
  'Bistavo Tablets': 120,
  'Kestine Tablets': 280,
  'Sedil Syrup': 140,
  'Rigix Syrup': 180,
  'Myteka Tablets': 250,
  'Zyrtec Tablets': 170,
  'Methycobal Tablets': 290,
  'Panadol Tablets': 36,
  'Surbex Z Tablets': 200
};

// Import medicines from assets folder (utility endpoint)
// This endpoint will populate the database with medicines from the assets folder
router.post('/import-from-assets', async (req, res) => {
  try {
    // Get the absolute path to the project root
    const projectRoot = path.resolve(__dirname, '../../');
    const assetsDir = path.join(projectRoot, 'project', 'src', 'assets');
    
    console.log('Project root:', projectRoot);
    console.log('Looking for assets in:', assetsDir);
    
    // Verify the directory exists
    if (!fs.existsSync(projectRoot)) {
      console.error(`Project root not found at: ${projectRoot}`);
      return res.status(404).json({ 
        message: `Project root not found at: ${projectRoot}`,
        error: true
      });
    }
    
    if (!fs.existsSync(assetsDir)) {
      console.error(`Assets directory not found at: ${assetsDir}`);
      return res.status(404).json({ 
        message: `Assets directory not found at: ${assetsDir}`,
        error: true
      });
    }
    
    let files;
    try {
      files = fs.readdirSync(assetsDir);
      console.log('Found files:', files);
    } catch (readError) {
      console.error('Error reading assets directory:', readError);
      return res.status(500).json({ 
        message: 'Error reading assets directory',
        error: true,
        details: readError.message
      });
    }
    
    const medicineImages = files.filter(file => 
      (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) &&
      !['logo.png', 'search.png', 'medics.png', 'Hero.jpg', 'bot.png', 'eyecare.png', 'cough.png', 'vitamins.png', 'digestive.png', 'pain.png', 'allergy.png', 'coldflu.png', 'user.png'].includes(file)
    );
    
    const importedMedicines = [];
    const errors = [];
    
    for (const imageFile of medicineImages) {
      try {
        const imagePath = path.join(assetsDir, imageFile);
        let imageBuffer;
        try {
          imageBuffer = fs.readFileSync(imagePath);
        } catch (readError) {
          console.error(`Error reading file ${imageFile}:`, readError);
          errors.push(`Failed to read ${imageFile}: ${readError.message}`);
          continue;
        }
        
        const name = imageFile.replace(/\.(png|jpg|jpeg)$/i, '').split(/(?=[A-Z])/).join(' ');
        let category = 'General';
        
        // Updated category assignment logic
        if (imageFile.toLowerCase().includes('pain')) category = 'Pain Relief';
        else if (imageFile.toLowerCase().includes('cough') || 
                 imageFile.toLowerCase().includes('cold') || 
                 imageFile.toLowerCase().includes('flu') ||
                 imageFile.toLowerCase().includes('panadol') ||
                 imageFile.toLowerCase().includes('arinac') ||
                 imageFile.toLowerCase().includes('corex') ||
                 imageFile.toLowerCase().includes('coferb') ||
                 imageFile.toLowerCase().includes('bronochol') ||
                 imageFile.toLowerCase().includes('acefyl') ||
                 imageFile.toLowerCase().includes('hydryllin') ||
                 imageFile.toLowerCase().includes('norsaline') ||
                 imageFile.toLowerCase().includes('medics coldeez')) category = 'Cold & Flu';
        else if (imageFile.toLowerCase().includes('vitamin')) category = 'Vitamins';
        else if (imageFile.toLowerCase().includes('allergy')) category = 'Allergies';
        else if (imageFile.toLowerCase().includes('digestive')) category = 'Digestive Health';
        else if (imageFile.toLowerCase().includes('eye')) category = 'Eye Care';
        
        const price = priceMap[name] !== undefined ? priceMap[name] : (Math.floor(Math.random() * 4950) + 50);
        
        try {
          const existingMedicine = await Medicine.findOne({ name });
          if (existingMedicine) {
            // Only update image and category, do NOT change price
            existingMedicine.category = category;
            existingMedicine.image = { data: imageBuffer, contentType: `image/${imageFile.split('.').pop()}` };
            await existingMedicine.save();
            importedMedicines.push(existingMedicine);
            continue;
          }
          
          const newMedicine = new Medicine({
            name,
            price,
            description: `${name} medicine for health and wellness.`,
            category,
            image: {
              data: imageBuffer,
              contentType: `image/${imageFile.split('.').pop()}`
            }
          });
          await newMedicine.save();
          importedMedicines.push(newMedicine);
        } catch (dbError) {
          console.error(`Database error for ${imageFile}:`, dbError);
          errors.push(`Failed to save ${name}: ${dbError.message}`);
        }
      } catch (fileError) {
        console.error(`Error processing ${imageFile}:`, fileError);
        errors.push(`Failed to process ${imageFile}: ${fileError.message}`);
      }
    }
    
    res.status(200).json({ 
      message: `Successfully imported (or updated) ${importedMedicines.length} medicines. ${errors.length} errors occurred.`,
      medicines: importedMedicines,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      message: 'Failed to import medicines',
      error: true,
      details: error.message
    });
  }
});

// Get medicines by category
router.get('/category/:category', async (req, res) => {
  try {
    let category = req.params.category;
    
    // Handle category name variations
    if (category === 'Cold & Flu') {
      // Search for both Cold & Flu and Cough & Cold categories
      const medicines = await Medicine.find({
        category: { $in: ['Cold & Flu', 'Cough & Cold'] }
      });
      console.log(`Found ${medicines.length} medicines in combined Cold & Flu category`);
      res.json(medicines);
    } else {
      const medicines = await Medicine.find({ category });
      console.log(`Found ${medicines.length} medicines in category ${category}`);
      res.json(medicines);
    }
  } catch (error) {
    console.error('Error fetching medicines by category:', error);
    res.status(500).json({ message: 'Error fetching medicines by category' });
  }
});

// Search medicines endpoint
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    console.log(`Searching medicines with query: ${query}`);
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Search in name, description, and category fields
    const medicines = await Medicine.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    });
    
    console.log(`Found ${medicines.length} medicines matching query: ${query}`);
    
    // Process medicines to ensure proper image format
    const processedMedicines = medicines.map(medicine => {
      const medicineObj = medicine.toObject();
      
      // Process image data if it exists
      if (medicineObj.image && medicineObj.image.data) {
        // Convert Buffer to Base64 string for frontend consumption
        const base64 = medicineObj.image.data.toString('base64');
        medicineObj.image = {
          contentType: medicineObj.image.contentType || 'image/jpeg',
          data: base64
        };
      }
      
      return medicineObj;
    });
    
    res.status(200).json(processedMedicines);
  } catch (error) {
    console.error('Error searching medicines:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update the PUT endpoint for admin panel
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, category } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (price) updateData.price = Number(price);
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    
    // Update image if a new one is provided
    if (req.file) {
      updateData.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }
    
    updateData.updatedAt = Date.now();
    
    const updatedMedicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!updatedMedicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    res.status(200).json(updatedMedicine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// (Note: The category listings (e.g. Pain Relief, Cough & Cold, etc.) should reference the existing medicine entries (i.e. no duplication) so that all medicines are stored in the database and fetched dynamically.)

module.exports = router;

const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  }
});

// Bulk import users from Excel
router.post('/users', auth, upload.single('file'), [
  body('file').custom((value, { req }) => {
    if (!req.file) {
      throw new Error('Please upload an Excel file');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Validate headers
    const headers = data[0];
    const requiredHeaders = ['user_id', 'referred_by_user_id', 'balance', 'user_name'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
      return res.status(400).json({ 
        error: `Missing required columns: ${missingHeaders.join(', ')}` 
      });
    }

    // Process data rows
    const results = {
      total: data.length - 1, // Exclude header row
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowData = {};
      
      // Map Excel columns to data
      headers.forEach((header, index) => {
        rowData[header] = row[index];
      });

      try {
        // Validate required fields
        if (!rowData.user_id || !rowData.user_name) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
          $or: [
            { username: rowData.user_name },
            { referralCode: rowData.user_id }
          ]
        });

        if (existingUser) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: User already exists (${rowData.user_name})`);
          continue;
        }

        // Find referrer if provided
        let referrer = null;
        if (rowData.referred_by_user_id) {
          referrer = await User.findOne({ referralCode: rowData.referred_by_user_id });
          if (!referrer) {
            results.failed++;
            results.errors.push(`Row ${i + 1}: Referrer not found (${rowData.referred_by_user_id})`);
            continue;
          }
        }

        // Create user
        const userData = {
          username: rowData.user_name,
          email: `${rowData.user_name}@imported.com`, // Generate email
          firstName: rowData.user_name.split(' ')[0] || rowData.user_name,
          lastName: rowData.user_name.split(' ').slice(1).join(' ') || '',
          referralCode: rowData.user_id,
          referredBy: referrer ? referrer._id : null,
          referralLevel: referrer ? (referrer.referralLevel + 1) : 1,
          balance: {
            coins: parseFloat(rowData.balance) || 0,
            usd: 0
          },
          status: 'active'
        };

        await User.create(userData);
        results.success++;

      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    res.json({
      message: 'Bulk import completed',
      results
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ 
      error: 'Server error during bulk import',
      message: error.message 
    });
  }
});

// Get import template
router.get('/template', auth, (req, res) => {
  try {
    // Create sample data for template
    const templateData = [
      ['user_id', 'referred_by_user_id', 'balance', 'user_name'],
      ['USER001', '', '100', 'John Doe'],
      ['USER002', 'USER001', '50', 'Jane Smith'],
      ['USER003', 'USER001', '75', 'Bob Johnson']
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 15 }, // user_id
      { width: 20 }, // referred_by_user_id
      { width: 12 }, // balance
      { width: 20 }  // user_name
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="bulk_import_template.xlsx"');
    res.send(buffer);

  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// Get import history (optional)
router.get('/history', auth, async (req, res) => {
  try {
    // This could be expanded to store import history in the future
    res.json({ message: 'Import history feature coming soon' });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch import history' });
  }
});

module.exports = router;

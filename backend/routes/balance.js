const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { auth, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get All User Balances
router.get('/users', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sortBy = 'balance.coins', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    let query = { status: 'active' };
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('username firstName lastName email balance status createdAt lastLogin')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Calculate totals
    const totals = await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCoins: { $sum: '$balance.coins' },
          totalUsd: { $sum: '$balance.usd' },
          avgCoins: { $avg: '$balance.coins' },
          avgUsd: { $avg: '$balance.usd' }
        }
      }
    ]);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      totals: totals[0] || { totalCoins: 0, totalUsd: 0, avgCoins: 0, avgUsd: 0 }
    });

  } catch (error) {
    console.error('User balances error:', error);
    res.status(500).json({ error: 'Server error fetching user balances.' });
  }
});

// Get Specific User Balance Details
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Get user transactions
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalTransactions = await Transaction.countDocuments({ userId });

    // Get transaction summary
    const transactionSummary = await Transaction.getUserTransactionSummary(userId);

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        balance: user.balance,
        status: user.status,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      transactions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalTransactions / limit),
        hasNext: page * limit < totalTransactions,
        hasPrev: page > 1
      },
      transactionSummary
    });

  } catch (error) {
    console.error('User balance details error:', error);
    res.status(500).json({ error: 'Server error fetching user balance details.' });
  }
});

// Adjust User Balance (Admin only)
router.put('/user/:userId/adjust', [
  auth,
  requireRole(['admin', 'super_admin']),
  body('amount.coins').optional().isNumeric(),
  body('amount.usd').optional().isNumeric(),
  body('type').isIn(['deposit', 'withdrawal', 'system_adjustment']),
  body('description').trim().isLength({ min: 5, max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { amount, type, description } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Calculate new balance
    const balanceBefore = { ...user.balance };
    const balanceAfter = {
      coins: user.balance.coins + (amount.coins || 0),
      usd: user.balance.usd + (amount.usd || 0)
    };

    // Validate balance won't go negative
    if (balanceAfter.coins < 0 || balanceAfter.usd < 0) {
      return res.status(400).json({ error: 'Balance adjustment would result in negative balance.' });
    }

    // Update user balance
    user.balance = balanceAfter;
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: user._id,
      type,
      amount: {
        coins: amount.coins || 0,
        usd: amount.usd || 0
      },
      balanceBefore,
      balanceAfter,
      description,
      metadata: {
        adminId: req.admin._id,
        notes: `Balance adjustment by ${req.admin.name}`
      }
    });

    await transaction.save();

    res.json({
      message: 'Balance adjusted successfully',
      user: {
        _id: user._id,
        username: user.username,
        balance: user.balance
      },
      transaction: {
        type,
        amount,
        description,
        createdAt: transaction.createdAt
      }
    });

  } catch (error) {
    console.error('Balance adjustment error:', error);
    res.status(500).json({ error: 'Server error adjusting user balance.' });
  }
});

// Get Balance Statistics
router.get('/statistics', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Monthly balance statistics
    const monthlyStats = await Transaction.getMonthlyStats(now.getFullYear(), now.getMonth() + 1);

    // Balance distribution
    const balanceDistribution = await User.aggregate([
      { $match: { status: 'active' } },
      {
        $bucket: {
          groupBy: '$balance.coins',
          boundaries: [0, 100, 500, 1000, 5000, 10000, 50000, Infinity],
          default: 'Above 50000',
          output: {
            count: { $sum: 1 },
            totalCoins: { $sum: '$balance.coins' },
            totalUsd: { $sum: '$balance.usd' }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top balances
    const topBalances = await User.find({ status: 'active' })
      .sort({ 'balance.coins': -1 })
      .limit(10)
      .select('username firstName lastName balance status createdAt');

    // Recent balance changes
    const recentChanges = await Transaction.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'username firstName lastName');

    res.json({
      monthlyStats,
      balanceDistribution,
      topBalances,
      recentChanges
    });

  } catch (error) {
    console.error('Balance statistics error:', error);
    res.status(500).json({ error: 'Server error fetching balance statistics.' });
  }
});

// Export Balance Report
router.get('/export', auth, async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    const users = await User.find({ status: 'active' })
      .select('username firstName lastName email balance status createdAt lastLogin')
      .sort({ 'balance.coins': -1 });

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = users.map(user => ({
        Username: user.username,
        'First Name': user.firstName,
        'Last Name': user.lastName,
        Email: user.email,
        'Coins Balance': user.balance.coins,
        'USD Balance': user.balance.usd,
        Status: user.status,
        'Created Date': user.createdAt.toISOString().split('T')[0],
        'Last Login': user.lastLogin ? user.lastLogin.toISOString().split('T')[0] : 'Never'
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="balance_report.csv"');
      
      // Simple CSV conversion
      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n');
      
      res.send(csv);
    } else {
      res.json({ users });
    }

  } catch (error) {
    console.error('Balance export error:', error);
    res.status(500).json({ error: 'Server error exporting balance report.' });
  }
});

module.exports = router;


const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get Dashboard Statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Total users
    const totalUsers = await User.countDocuments({ status: 'active' });
    
    // New users this month
    const newUsersThisMonth = await User.countDocuments({
      status: 'active',
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Total balance across all users
    const totalBalanceResult = await User.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          totalCoins: { $sum: '$balance.coins' },
          totalUsd: { $sum: '$balance.usd' }
        }
      }
    ]);

    const totalBalance = totalBalanceResult.length > 0 ? totalBalanceResult[0] : { totalCoins: 0, totalUsd: 0 };

    // Monthly growth
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthUsers = await User.countDocuments({
      status: 'active',
      createdAt: { $gte: lastMonth, $lte: lastMonthEnd }
    });

    const growthRate = lastMonthUsers > 0 
      ? ((newUsersThisMonth - lastMonthUsers) / lastMonthUsers * 100).toFixed(2)
      : newUsersThisMonth > 0 ? 100 : 0;

    // Recent activity
    const recentTransactions = await Transaction.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          type: 1,
          amount: 1,
          description: 1,
          createdAt: 1,
          'user.username': 1,
          'user.firstName': 1,
          'user.lastName': 1
        }
      }
    ]);

    // Top users by balance
    const topUsers = await User.find({ status: 'active' })
      .sort({ 'balance.coins': -1 })
      .limit(5)
      .select('username firstName lastName balance status createdAt');

    res.json({
      stats: {
        totalUsers,
        newUsersThisMonth,
        totalBalance,
        growthRate: parseFloat(growthRate),
        lastMonthUsers
      },
      recentActivity: recentTransactions,
      topUsers
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error fetching dashboard statistics.' });
  }
});

// Get User Growth Chart Data
router.get('/user-growth', auth, async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const now = new Date();
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const userCount = await User.countDocuments({
        status: 'active',
        createdAt: { $lte: endDate }
      });

      data.push({
        month: startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        users: userCount,
        date: startDate
      });
    }

    res.json({ data });

  } catch (error) {
    console.error('User growth chart error:', error);
    res.status(500).json({ error: 'Server error fetching user growth data.' });
  }
});

// Get Balance Distribution
router.get('/balance-distribution', auth, async (req, res) => {
  try {
    const distribution = await User.aggregate([
      { $match: { status: 'active' } },
      {
        $bucket: {
          groupBy: '$balance.coins',
          boundaries: [0, 100, 500, 1000, 5000, 10000, Infinity],
          default: 'Above 10000',
          output: {
            count: { $sum: 1 },
            totalCoins: { $sum: '$balance.coins' },
            totalUsd: { $sum: '$balance.usd' }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ distribution });

  } catch (error) {
    console.error('Balance distribution error:', error);
    res.status(500).json({ error: 'Server error fetching balance distribution.' });
  }
});

module.exports = router;


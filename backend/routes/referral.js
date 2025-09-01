const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get All Referral Networks
router.get('/networks', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
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

    const users = await User.find(query)
      .populate('referredBy', 'username firstName lastName')
      .select('username firstName lastName email referralCode referredBy referralLevel balance status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Referral networks error:', error);
    res.status(500).json({ error: 'Server error fetching referral networks.' });
  }
});

// Get Specific User Referral Network
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { levels = 5 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const network = await user.getReferralNetwork(parseInt(levels));
    
    // Calculate referral statistics
    const totalReferrals = network.reduce((sum, level) => sum + level.users.length, 0);
    const totalReferralEarnings = await user.calculateReferralEarnings();

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        referralCode: user.referralCode,
        referralLevel: user.referralLevel,
        balance: user.balance,
        status: user.status,
        createdAt: user.createdAt
      },
      network,
      statistics: {
        totalReferrals,
        totalReferralEarnings,
        networkLevels: network.length
      }
    });

  } catch (error) {
    console.error('User referral network error:', error);
    res.status(500).json({ error: 'Server error fetching user referral network.' });
  }
});

// Get Referral Tree Visualization
router.get('/tree/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { maxLevels = 3 } = req.query;

    const buildTree = async (userId, level = 0, maxLevels = 3) => {
      if (level >= maxLevels) return null;

      const user = await User.findById(userId);
      if (!user) return null;

      const children = await User.find({ referredBy: userId })
        .select('username firstName lastName balance status createdAt')
        .limit(10); // Limit children per node for performance

      const tree = {
        id: user._id,
        username: user.username,
        name: `${user.firstName} ${user.lastName}`,
        balance: user.balance,
        status: user.status,
        level,
        children: []
      };

      for (const child of children) {
        const childTree = await buildTree(child._id, level + 1, maxLevels);
        if (childTree) {
          tree.children.push(childTree);
        }
      }

      return tree;
    };

    const tree = await buildTree(userId, 0, parseInt(maxLevels));
    
    if (!tree) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ tree });

  } catch (error) {
    console.error('Referral tree error:', error);
    res.status(500).json({ error: 'Server error building referral tree.' });
  }
});

// Get Referral Statistics
router.get('/statistics', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Total referrals this month
    const newReferralsThisMonth = await User.countDocuments({
      referredBy: { $exists: true, $ne: null },
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Total referrals overall
    const totalReferrals = await User.countDocuments({
      referredBy: { $exists: true, $ne: null }
    });

    // Referral levels distribution
    const levelDistribution = await User.aggregate([
      { $match: { referredBy: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$referralLevel',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top referrers
    const topReferrers = await User.aggregate([
      { $match: { status: 'active' } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'referredBy',
          as: 'referrals'
        }
      },
      {
        $addFields: {
          referralCount: { $size: '$referrals' }
        }
      },
      { $match: { referralCount: { $gt: 0 } } },
      { $sort: { referralCount: -1 } },
      { $limit: 10 },
      {
        $project: {
          username: 1,
          firstName: 1,
          lastName: 1,
          referralCount: 1,
          balance: 1
        }
      }
    ]);

    res.json({
      monthlyStats: {
        newReferrals: newReferralsThisMonth,
        totalReferrals
      },
      levelDistribution,
      topReferrers
    });

  } catch (error) {
    console.error('Referral statistics error:', error);
    res.status(500).json({ error: 'Server error fetching referral statistics.' });
  }
});

module.exports = router;


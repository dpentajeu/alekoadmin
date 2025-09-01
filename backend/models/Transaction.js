const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'referral_bonus', 'system_adjustment', 'transfer'],
    required: true
  },
  amount: {
    coins: {
      type: Number,
      required: true
    },
    usd: {
      type: Number,
      required: true
    }
  },
  balanceBefore: {
    coins: {
      type: Number,
      required: true
    },
    usd: {
      type: Number,
      required: true
    }
  },
  balanceAfter: {
    coins: {
      type: Number,
      required: true
    },
    usd: {
      type: Number,
      required: true
    }
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  metadata: {
    referralUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    externalId: String,
    notes: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });

// Method to get transaction summary
transactionSchema.statics.getUserTransactionSummary = async function(userId) {
  const summary = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        totalCoins: { $sum: '$amount.coins' },
        totalUsd: { $sum: '$amount.usd' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return summary;
};

// Method to get monthly statistics
transactionSchema.statics.getMonthlyStats = async function(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$type',
        totalCoins: { $sum: '$amount.coins' },
        totalUsd: { $sum: '$amount.usd' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return stats;
};

module.exports = mongoose.model('Transaction', transactionSchema);


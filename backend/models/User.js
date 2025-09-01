const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  referralCode: {
    type: String,
    unique: true,
    required: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referralLevel: {
    type: Number,
    default: 1
  },
  balance: {
    coins: {
      type: Number,
      default: 0,
      min: 0
    },
    usd: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  profilePicture: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for referral queries
userSchema.index({ referredBy: 1, referralLevel: 1 });
userSchema.index({ referralCode: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to get referral network
userSchema.methods.getReferralNetwork = async function(levels = 3) {
  const network = [];
  
  for (let level = 1; level <= levels; level++) {
    const users = await this.constructor.find({
      referredBy: this._id,
      referralLevel: level
    }).select('username firstName lastName email balance status createdAt');
    
    if (users.length > 0) {
      network.push({
        level,
        users
      });
    }
  }
  
  return network;
};

// Method to calculate total referral earnings
userSchema.methods.calculateReferralEarnings = async function() {
  const referrals = await this.constructor.find({ referredBy: this._id });
  return referrals.reduce((total, user) => total + (user.balance.coins * 0.1), 0);
};

module.exports = mongoose.model('User', userSchema);


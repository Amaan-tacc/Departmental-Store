// models/Sale.js
import mongoose from 'mongoose';
import Counter from './Counter.js';

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true
  }
});

const saleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    unique: true,
    required: true
  },
  items: [saleItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile', 'refund'],
    default: 'cash'
  },
  amountPaid: {
    type: Number,
    required: true,
    default: 0
  },
  change: {
    type: Number,
    default: 0,
    min: 0
  },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  isRefund: {
    type: Boolean,
    default: false
  },
  originalSale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  },
  refundReason: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
saleSchema.index({ saleNumber: 1 });
saleSchema.index({ store: 1 });
saleSchema.index({ cashier: 1 });
saleSchema.index({ createdAt: 1 });
saleSchema.index({ paymentMethod: 1 });

// Generate sale number before saving
saleSchema.pre('save', async function(next) {
  if (this.isNew && !this.saleNumber) {
    try {
      // Atomic increment
      const counter = await Counter.findOneAndUpdate(
        { name: 'saleNumber' },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );
      
      this.saleNumber = `SALE-${String(counter.value).padStart(6, '0')}`;
      next();
    } catch (error) {
      console.error('Sale number generation error:', error);
      // Fallback to timestamp if counter fails
      this.saleNumber = `SALE-${Date.now()}`;
      next();
    }
  } else {
    next();
  }
});

// Virtual for items count
saleSchema.virtual('itemsCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Instance method to check if sale can be refunded
saleSchema.methods.canRefund = function() {
  // Can refund if not already a refund and sale is less than 30 days old
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return !this.isRefund && this.createdAt > thirtyDaysAgo;
};

// Static method to get daily sales
saleSchema.statics.getDailySales = function(storeId, date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.aggregate([
    {
      $match: {
        store: storeId,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        isRefund: { $ne: true }
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$total' },
        totalTransactions: { $sum: 1 },
        totalItems: { $sum: { $size: '$items' } }
      }
    }
  ]);
};

export default mongoose.model('Sale', saleSchema);
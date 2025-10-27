// models/Sale.js
import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
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
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile', 'refund'],
    default: 'cash'
  },
  amountPaid: {
    type: Number,
    required: true,
    min: 0
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

// Generate sale number before saving - FIXED VERSION
saleSchema.pre('save', async function(next) {
  if (this.isNew && !this.saleNumber) {
    try {
      // Use a counter collection to generate sequential numbers
      const Counter = mongoose.model('Counter');
      let counter;
      
      try {
        counter = await Counter.findOneAndUpdate(
          { name: 'saleNumber' },
          { $inc: { value: 1 } },
          { new: true, upsert: true }
        );
      } catch (error) {
        // If Counter model doesn't exist, create a simple fallback
        const lastSale = await mongoose.model('Sale')
          .findOne({}, {}, { sort: { createdAt: -1 } })
          .select('saleNumber');
        
        let nextNumber = 1;
        if (lastSale && lastSale.saleNumber) {
          const lastNumber = parseInt(lastSale.saleNumber.split('-')[1]) || 0;
          nextNumber = lastNumber + 1;
        }
        
        this.saleNumber = `SALE-${String(nextNumber).padStart(6, '0')}`;
        return next();
      }
      
      this.saleNumber = `SALE-${String(counter.value).padStart(6, '0')}`;
      next();
    } catch (error) {
      // Fallback to timestamp-based number
      const timestamp = Date.now();
      this.saleNumber = `SALE-${timestamp}`;
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
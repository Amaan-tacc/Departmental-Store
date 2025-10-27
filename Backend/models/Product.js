// models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0.01, 'Price must be greater than 0']
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    required: [true, 'SKU is required'],
    trim: true
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: [1, 'Low stock threshold must be at least 1']
  },
  supplier: {
    type: String,
    trim: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    type: String // URL or path to product image
  }
}, {
  timestamps: true
});

// Index for search functionality
productSchema.index({ name: 'text', category: 'text', brand: 'text', description: 'text' });
productSchema.index({ barcode: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ store: 1 });
productSchema.index({ category: 1 });
productSchema.index({ quantity: 1 });

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.quantity === 0) {
    return 'out-of-stock';
  } else if (this.quantity < this.lowStockThreshold) {
    return 'low-stock';
  } else {
    return 'in-stock';
  }
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.costPrice === 0) return 0;
  return ((this.price - this.costPrice) / this.costPrice) * 100;
});

// Virtual for total value
productSchema.virtual('totalValue').get(function() {
  return this.price * this.quantity;
});

// Instance method to check if product is low stock
productSchema.methods.isLowStock = function() {
  return this.quantity < this.lowStockThreshold;
};

// Instance method to check if product is out of stock
productSchema.methods.isOutOfStock = function() {
  return this.quantity === 0;
};

// Static method to find low stock products
productSchema.statics.findLowStock = function(storeId) {
  return this.find({
    store: storeId,
    isActive: true,
    $expr: { $lt: ['$quantity', '$lowStockThreshold'] }
  });
};

// Static method to find out of stock products
productSchema.statics.findOutOfStock = function(storeId) {
  return this.find({
    store: storeId,
    isActive: true,
    quantity: 0
  });
};

// Static method to search products
productSchema.statics.searchProducts = function(storeId, searchTerm) {
  return this.find({
    store: storeId,
    isActive: true,
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { barcode: searchTerm },
      { sku: searchTerm },
      { category: { $regex: searchTerm, $options: 'i' } },
      { brand: { $regex: searchTerm, $options: 'i' } }
    ]
  });
};

export default mongoose.model('Product', productSchema);
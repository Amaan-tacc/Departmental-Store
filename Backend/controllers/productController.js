// controllers/productController.js
import Product from '../models/Product.js';
import { generateBarcode } from '../utils/generateBarcode.js';

// Simple in-memory/store-based solution for categories
const storeCategories = new Map(); // StoreId -> Categories array

// @desc    Get product categories (combined from products and stored categories)
// @route   GET /api/products/categories
// @access  Private
export const getCategories = async (req, res) => {
  try {
    const storeId = req.user.store;
    
    // Get categories from products (existing functionality)
    const categoriesFromProducts = await Product.distinct('category', { 
      store: storeId, 
      isActive: true 
    });

    // Get additional categories from our storage
    const storedCategories = storeCategories.get(storeId) || [];
    
    // Combine and remove duplicates
    const allCategories = [...new Set([...categoriesFromProducts, ...storedCategories])];

    res.status(200).json({
      status: 'success',
      data: {
        categories: allCategories
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching categories'
    });
  }
};

// @desc    Create new category
// @route   POST /api/products/categories
// @access  Private (Admin only)
export const createCategory = async (req, res) => {
  try {
    const storeId = req.user.store;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Category name is required'
      });
    }

    const categoryName = name.trim();

    // Check if category exists in products
    const existingInProducts = await Product.findOne({
      store: storeId,
      category: categoryName,
      isActive: true
    });

    // Check if category exists in our storage
    const storedCategories = storeCategories.get(storeId) || [];
    if (existingInProducts || storedCategories.includes(categoryName)) {
      return res.status(400).json({
        status: 'error',
        message: 'Category already exists'
      });
    }

    // Add to storage
    storedCategories.push(categoryName);
    storeCategories.set(storeId, storedCategories);

    // Get updated list
    const categoriesFromProducts = await Product.distinct('category', { 
      store: storeId, 
      isActive: true 
    });
    const allCategories = [...new Set([...categoriesFromProducts, ...storedCategories])];

    res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      data: {
        category: categoryName,
        categories: allCategories
      }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error creating category'
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/products/categories/:name
// @access  Private (Admin only)
export const deleteCategory = async (req, res) => {
  try {
    const storeId = req.user.store;
    const { name } = req.params;

    // Check if any products are using this category
    const productsInCategory = await Product.countDocuments({
      store: storeId,
      category: name,
      isActive: true
    });

    if (productsInCategory > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot delete category. ${productsInCategory} product(s) are using it.`
      });
    }

    // Remove from storage
    const storedCategories = storeCategories.get(storeId) || [];
    const updatedStoredCategories = storedCategories.filter(cat => cat !== name);
    storeCategories.set(storeId, updatedStoredCategories);

    // Get updated list
    const categoriesFromProducts = await Product.distinct('category', { 
      store: storeId, 
      isActive: true 
    });
    const allCategories = [...new Set([...categoriesFromProducts, ...updatedStoredCategories])];

    res.status(200).json({
      status: 'success',
      message: 'Category deleted successfully',
      data: {
        categories: allCategories
      }
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting category'
    });
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, lowStock } = req.query;
    const storeId = req.user.store;

    let query = { store: storeId, isActive: true };

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: search },
        { sku: search },
        { category: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (lowStock === 'true') {
      query.$expr = { $lt: ['$quantity', '$lowStockThreshold'] };
    }

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching products'
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.store;

    const product = await Product.findOne({ _id: id, store: storeId });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching product'
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin only)
export const createProduct = async (req, res) => {
  try {
    const storeId = req.user.store;
    const productData = { ...req.body, store: storeId };

    // Generate barcode if not provided
    if (!productData.barcode) {
      productData.barcode = await generateBarcode();
    }

    // Generate SKU if not provided
    if (!productData.sku) {
      const count = await Product.countDocuments({ store: storeId });
      productData.sku = `SKU-${String(count + 1).padStart(6, '0')}`;
    }

    const product = new Product(productData);
    await product.save();

    // Emit real-time update
    req.app.get('io').to(`store-${storeId}`).emit('productCreated', product);

    res.status(201).json({
      status: 'success',
      message: 'Product created successfully',
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        status: 'error',
        message: `Product with this ${field} already exists`
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Error creating product'
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.store;

    const product = await Product.findOneAndUpdate(
      { _id: id, store: storeId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Emit real-time update
    req.app.get('io').to(`store-${storeId}`).emit('productUpdated', product);

    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully',
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Product with this barcode or SKU already exists'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Error updating product'
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.store;

    const product = await Product.findOneAndUpdate(
      { _id: id, store: storeId },
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Emit real-time update
    req.app.get('io').to(`store-${storeId}`).emit('productDeleted', id);

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting product'
    });
  }
};

// @desc    Search products by barcode
// @route   GET /api/products/search/barcode/:barcode
// @access  Private
export const searchByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const storeId = req.user.store;

    const product = await Product.findOne({ 
      barcode, 
      store: storeId, 
      isActive: true 
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Search by barcode error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error searching product'
    });
  }
};
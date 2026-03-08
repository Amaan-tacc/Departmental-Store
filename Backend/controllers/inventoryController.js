// controllers/inventoryController.js
import Product from '../models/Product.js';
import InventoryLog from '../models/InventoryLog.js';

// @desc    Get inventory with filters
// @route   GET /api/inventory
// @access  Private
export const getInventory = async (req, res) => {
  try {
    const { page = 1, limit = 10, lowStock = false, category, search } = req.query;
    const storeId = req.user.store;

    let query = { store: storeId };

    if (lowStock === 'true') {
      query.$expr = { $lt: ['$quantity', '$lowStockThreshold'] };
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: search },
        { sku: search }
      ];
    }

    const inventory = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ quantity: 1 });

    const total = await Product.countDocuments(query);

    // Calculate inventory summary
    const summary = await Product.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          lowStockCount: {
            $sum: {
              $cond: [
                { $lt: ['$quantity', '$lowStockThreshold'] },
                1,
                0
              ]
            }
          },
          outOfStockCount: {
            $sum: {
              $cond: [
                { $eq: ['$quantity', 0] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        inventory,
        summary: summary[0] || {
          totalProducts: 0,
          totalValue: 0,
          lowStockCount: 0,
          outOfStockCount: 0
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching inventory'
    });
  }
};

// @desc    Update product stock
// @route   PUT /api/inventory/:id/stock
// @access  Private (Admin only)
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, action, reason } = req.body;
    const storeId = req.user.store;

    const product = await Product.findOne({ _id: id, store: storeId });
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    let newQuantity = product.quantity;
    
    if (action === 'add') {
      newQuantity += quantity;
    } else if (action === 'subtract') {
      newQuantity -= quantity;
      if (newQuantity < 0) newQuantity = 0;
    } else if (action === 'set') {
      newQuantity = quantity;
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid action. Use "add", "subtract", or "set"'
      });
    }

    // Create inventory log
    const inventoryLog = new InventoryLog({
      product: id,
      previousQuantity: product.quantity,
      newQuantity,
      action,
      reason: reason || 'Manual adjustment',
      performedBy: req.userId,
      store: storeId
    });

    await inventoryLog.save();

    // Update product quantity
    product.quantity = newQuantity;
    await product.save();

    // Emit real-time update
    const io = req.app.get('io');
    const room = `store-${storeId._id || storeId}`;
    io.to(room).emit('inventoryUpdated', product);

    res.status(200).json({
      status: 'success',
      message: 'Stock updated successfully',
      data: {
        product,
        log: inventoryLog
      }
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating stock'
    });
  }
};

// @desc    Get low stock alerts
// @route   GET /api/inventory/low-stock
// @access  Private
export const getLowStockAlerts = async (req, res) => {
  try {
    const storeId = req.user.store;

    const lowStockProducts = await Product.find({
      store: storeId,
      $expr: { $lt: ['$quantity', '$lowStockThreshold'] }
    }).sort({ quantity: 1 });

    res.status(200).json({
      status: 'success',
      data: {
        lowStockProducts,
        count: lowStockProducts.length
      }
    });
  } catch (error) {
    console.error('Get low stock alerts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching low stock alerts'
    });
  }
};

// @desc    Get inventory logs
// @route   GET /api/inventory/logs
// @access  Private
export const getInventoryLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, productId, action, startDate, endDate } = req.query;
    const storeId = req.user.store;

    let query = { store: storeId };

    if (productId) {
      query.product = productId;
    }

    if (action) {
      query.action = action;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const logs = await InventoryLog.find(query)
      .populate('product', 'name barcode sku')
      .populate('performedBy', 'fullname email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await InventoryLog.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalLogs: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get inventory logs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching inventory logs'
    });
  }
};

// @desc    Bulk update inventory
// @route   POST /api/inventory/bulk-update
// @access  Private (Admin only)
export const bulkUpdateInventory = async (req, res) => {
  try {
    const { updates } = req.body;
    const storeId = req.user.store;

    const results = [];
    const logs = [];

    for (const update of updates) {
      const { productId, quantity, action, reason } = update;

      const product = await Product.findOne({ _id: productId, store: storeId });
      if (!product) {
        results.push({ productId, status: 'error', message: 'Product not found' });
        continue;
      }

      let newQuantity = product.quantity;
      
      if (action === 'add') {
        newQuantity += quantity;
      } else if (action === 'subtract') {
        newQuantity -= quantity;
        if (newQuantity < 0) newQuantity = 0;
      } else if (action === 'set') {
        newQuantity = quantity;
      }

      // Create inventory log
      const inventoryLog = new InventoryLog({
        product: productId,
        previousQuantity: product.quantity,
        newQuantity,
        action,
        reason: reason || 'Bulk adjustment',
        performedBy: req.userId,
        store: storeId
      });

      logs.push(inventoryLog);

      // Update product
      product.quantity = newQuantity;
      await product.save();

      results.push({ productId, status: 'success', newQuantity });
    }

    // Save all logs
    await InventoryLog.insertMany(logs);

    // Emit real-time update
    const io = req.app.get('io');
    const room = `store-${storeId._id || storeId}`;
    io.to(room).emit('inventoryUpdated');

    res.status(200).json({
      status: 'success',
      message: 'Bulk update completed',
      data: {
        results
      }
    });
  } catch (error) {
    console.error('Bulk update inventory error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error during bulk update'
    });
  }
};
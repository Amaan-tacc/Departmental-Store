// controllers/saleController.js
import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Counter from '../models/Counter.js';

// Helper function to generate sale number
const generateSaleNumber = async (session) => {
  try {
    // Atomic increment with session support
    const counter = await Counter.findOneAndUpdate(
      { name: 'saleNumber' },
      { $inc: { value: 1 } },
      { new: true, upsert: true, session }
    );
    
    return `SALE-${String(counter.value).padStart(6, '0')}`;
  } catch (error) {
    console.error('Sale number generation error:', error);
    return `SALE-${Date.now()}`;
  }
};

// @desc    Process new sale
// @route   POST /api/sales
// @access  Private (Admin, Cashier)
export const processSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, paymentMethod, amountPaid, customerEmail } = req.body;
    const cashierId = req.userId;
    const storeId = req.user.store;

    // Validate items and check stock
    let subtotal = 0;
    const saleItems = [];
    const productUpdates = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      if (product.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}`);
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      saleItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      });

      // Update product quantity
      productUpdates.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $inc: { quantity: -item.quantity } }
        }
      });
    }

    // Calculate totals
    const taxRate = req.user.store.taxRate || 8.0;
    const tax = (req.body.tax !== undefined) ? parseFloat(req.body.tax) : (subtotal * (taxRate / 100));
    const total = (req.body.total !== undefined) ? parseFloat(req.body.total) : (subtotal + tax);
    const change = amountPaid - total;

    if (change < 0) {
      throw new Error('Insufficient payment');
    }

    // Update all products
    await Product.bulkWrite(productUpdates, { session });

    // Generate sale number
    const saleNumber = await generateSaleNumber(session);

    // Create sale
    const sale = new Sale({
      saleNumber, // Add the generated sale number
      items: saleItems,
      subtotal,
      tax,
      total,
      paymentMethod,
      amountPaid,
      change,
      cashier: cashierId,
      store: storeId,
      customerEmail
    });

    await sale.save({ session });
    await session.commitTransaction();

    // Populate sale data for response
    const populatedSale = await Sale.findById(sale._id)
      .populate('items.product', 'name barcode category brand')
      .populate('cashier', 'fullname email');

    // Emit real-time updates
    const io = req.app.get('io');
    const room = `store-${storeId._id || storeId}`;
    io.to(room).emit('saleProcessed', populatedSale);
    io.to(room).emit('inventoryUpdated');

    res.status(201).json({
      status: 'success',
      message: 'Sale processed successfully',
      data: {
        sale: populatedSale
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Process sale error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
export const getSales = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, cashier } = req.query;
    const storeId = req.user.store;

    // Convert to ObjectId
    const storeObjectId = new mongoose.Types.ObjectId(storeId);
    
    let query = { store: storeObjectId };

    // Date range filter
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Cashier filter
    if (cashier) {
      query.cashier = new mongoose.Types.ObjectId(cashier);
    }

    const sales = await Sale.find(query)
      .populate('items.product', 'name barcode')
      .populate('cashier', 'fullname email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Sale.countDocuments(query);

    // Calculate summary - use aggregate with proper ObjectId
    const summary = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
          totalTax: { $sum: '$tax' },
          totalItems: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] }
              }
            }
          }
        }
      }
    ]);

    console.log('Sales query summary:', {
      query,
      summary,
      salesCount: sales.length,
      total
    });

    res.status(200).json({
      status: 'success',
      data: {
        sales,
        summary: summary[0] || {
          totalSales: 0,
          totalTransactions: 0,
          totalTax: 0,
          totalItems: 0
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalSales: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching sales'
    });
  }
};

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
export const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.store;

    const sale = await Sale.findOne({ _id: id, store: storeId })
      .populate('items.product', 'name barcode category brand price')
      .populate('cashier', 'fullname email')
      .populate('store', 'name address phone taxRate');

    if (!sale) {
      return res.status(404).json({
        status: 'error',
        message: 'Sale not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        sale
      }
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching sale'
    });
  }
};

// @desc    Process refund
// @route   POST /api/sales/:id/refund
// @access  Private (Admin only)
export const refundSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason } = req.body;
    const storeId = req.user.store;

    // Find the original sale
    const originalSale = await Sale.findOne({ _id: id, store: storeId }).session(session);

    if (!originalSale) {
      throw new Error('Sale not found');
    }

    // Generate refund sale number
    const refundSaleNumber = await generateSaleNumber(session);

    // Create refund sale (negative amounts)
    const refundSale = new Sale({
      saleNumber: refundSaleNumber, // Add sale number for refund
      items: originalSale.items.map(item => ({
        product: item.product,
        quantity: -item.quantity,
        price: item.price,
        total: -item.total
      })),
      subtotal: -originalSale.subtotal,
      tax: -originalSale.tax,
      total: -originalSale.total,
      paymentMethod: 'refund',
      amountPaid: 0,
      change: 0,
      cashier: req.userId,
      store: storeId,
      isRefund: true,
      originalSale: id,
      refundReason: reason
    });

    // Restore product quantities
    const productUpdates = originalSale.items.map(item => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: item.quantity } }
      }
    }));

    await Product.bulkWrite(productUpdates, { session });
    await refundSale.save({ session });
    await session.commitTransaction();

    // Emit real-time updates
    const io = req.app.get('io');
    const room = `store-${storeId._id || storeId}`;
    io.to(room).emit('saleRefunded', refundSale);
    io.to(room).emit('inventoryUpdated');

    res.status(200).json({
      status: 'success',
      message: 'Refund processed successfully',
      data: {
        refund: refundSale
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Refund sale error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get today's sales summary
// @route   GET /api/sales/today/summary
// @access  Private
export const getTodaySummary = async (req, res) => {
  try {
    const storeId = req.user.store;
    
    // Convert storeId to ObjectId
    const storeObjectId = new mongoose.Types.ObjectId(storeId);
    
    // Create date range for today - use UTC to match your database
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    console.log('Query details:', {
      storeId: storeObjectId,
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString(),
      now: new Date().toISOString()
    });

    // Debug: Check if any sales exist for this store
    const totalStoreSales = await Sale.countDocuments({ store: storeObjectId });
    console.log('Total sales in store:', totalStoreSales);

    const summary = await Sale.aggregate([
      {
        $match: {
          store: storeObjectId,
          createdAt: {
            $gte: today,
            $lt: tomorrow
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
          totalItems: { 
            $sum: { 
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] }
              }
            }
          },
          averageSale: { $avg: '$total' }
        }
      }
    ]);

    // Cashier performance for today
    const cashierStats = await Sale.aggregate([
      {
        $match: {
          store: storeObjectId,
          createdAt: {
            $gte: today,
            $lt: tomorrow
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'cashier',
          foreignField: '_id',
          as: 'cashierInfo'
        }
      },
      { $unwind: '$cashierInfo' },
      {
        $group: {
          _id: '$cashier',
          cashierName: { $first: '$cashierInfo.fullname' },
          totalSales: { $sum: '$total' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    console.log('Aggregation result:', summary);

    // If you want to test with ALL data (remove date filter for testing):
    const testSummary = await Sale.aggregate([
      {
        $match: {
          store: storeObjectId
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
          totalItems: { 
            $sum: { 
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] }
              }
            }
          },
          averageSale: { $avg: '$total' }
        }
      }
    ]);

    console.log('Test summary (all time):', testSummary);

    res.status(200).json({
      status: 'success',
      data: {
        summary: summary[0] || {
          totalSales: 0,
          totalTransactions: 0,
          totalItems: 0,
          averageSale: 0
        },
        cashierStats: cashierStats || [],
        // Include test data for debugging
        debug: {
          totalStoreSales,
          testSummary: testSummary[0] || null
        }
      }
    });
  } catch (error) {
    console.error('Get today summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching today\'s summary'
    });
  }
};

// @desc    Get monthly sales summary
// @route   GET /api/sales/monthly/summary
// @access  Private
export const getMonthlySummary = async (req, res) => {
  try {
    const storeId = req.user.store;
    const storeObjectId = new mongoose.Types.ObjectId(storeId);
    
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const summary = await Sale.aggregate([
      {
        $match: {
          store: storeObjectId,
          createdAt: {
            $gte: firstDayOfMonth,
            $lte: lastDayOfMonth
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
          totalItems: { 
            $sum: { 
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] }
              }
            }
          },
          averageSale: { $avg: '$total' }
        }
      }
    ]);

    // Daily sales for chart
    const dailyStats = await Sale.aggregate([
      {
        $match: {
          store: storeObjectId,
          createdAt: {
            $gte: firstDayOfMonth,
            $lte: lastDayOfMonth
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$total" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        summary: summary[0] || {
          totalSales: 0,
          totalTransactions: 0,
          totalItems: 0,
          averageSale: 0
        },
        dailyStats
      }
    });
  } catch (error) {
    console.error('Get monthly summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching monthly summary'
    });
  }
};
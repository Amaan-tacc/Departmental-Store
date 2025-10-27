// controllers/reportController.js
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Private (Admin only)
export const getSalesReport = async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate, groupBy = 'day' } = req.query;
    const storeId = req.user.store;

    let dateFilter = {};
    const now = new Date();

    // Set date range based on period
    switch (period) {
      case 'today':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.setHours(0, 0, 0, 0)),
            $lte: new Date(now.setHours(23, 59, 59, 999))
          }
        };
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFilter = {
          createdAt: {
            $gte: new Date(yesterday.setHours(0, 0, 0, 0)),
            $lte: new Date(yesterday.setHours(23, 59, 59, 999))
          }
        };
        break;
      case 'weekly':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        dateFilter = { createdAt: { $gte: startOfWeek, $lte: new Date() } };
        break;
      case 'monthly':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { createdAt: { $gte: startOfMonth, $lte: new Date() } };
        break;
      case 'custom':
        if (startDate && endDate) {
          dateFilter = {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          };
        }
        break;
    }

    // Sales summary
    const salesSummary = await Sale.aggregate([
      {
        $match: {
          store: storeId,
          ...dateFilter,
          isRefund: { $ne: true }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
          averageSale: { $avg: '$total' },
          totalTax: { $sum: '$tax' },
          totalItemsSold: { $sum: { $size: '$items' } }
        }
      }
    ]);

    // Sales trend
    let groupFormat;
    switch (groupBy) {
      case 'hour':
        groupFormat = '%Y-%m-%d %H:00';
        break;
      case 'day':
        groupFormat = '%Y-%m-%d';
        break;
      case 'week':
        groupFormat = '%Y-%U';
        break;
      case 'month':
        groupFormat = '%Y-%m';
        break;
      default:
        groupFormat = '%Y-%m-%d';
    }

    const salesTrend = await Sale.aggregate([
      {
        $match: {
          store: storeId,
          ...dateFilter,
          isRefund: { $ne: true }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: '$createdAt' }
          },
          date: { $first: '$createdAt' },
          dailySales: { $sum: '$total' },
          transactionCount: { $sum: 1 },
          averageSale: { $avg: '$total' }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Top selling products
    const topProducts = await Sale.aggregate([
      {
        $match: {
          store: storeId,
          ...dateFilter,
          isRefund: { $ne: true }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          averagePrice: { $avg: '$items.price' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          category: '$product.category',
          barcode: '$product.barcode',
          totalSold: 1,
          totalRevenue: 1,
          averagePrice: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // Payment method breakdown
    const paymentBreakdown = await Sale.aggregate([
      {
        $match: {
          store: storeId,
          ...dateFilter,
          isRefund: { $ne: true }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$total' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    const report = {
      summary: salesSummary[0] || {
        totalSales: 0,
        totalTransactions: 0,
        averageSale: 0,
        totalTax: 0,
        totalItemsSold: 0
      },
      salesTrend,
      topProducts,
      paymentBreakdown,
      dateRange: {
        period,
        startDate: dateFilter.createdAt?.$gte || new Date(),
        endDate: dateFilter.createdAt?.$lte || new Date()
      }
    };

    res.status(200).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error generating sales report'
    });
  }
};

// @desc    Get inventory report
// @route   GET /api/reports/inventory
// @access  Private (Admin only)
export const getInventoryReport = async (req, res) => {
  try {
    const storeId = req.user.store;

    const inventoryStats = await Product.aggregate([
      {
        $match: { store: storeId, isActive: true }
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          totalCostValue: { $sum: { $multiply: ['$costPrice', '$quantity'] } },
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

    const categoryStats = await Product.aggregate([
      {
        $match: { store: storeId, isActive: true }
      },
      {
        $group: {
          _id: '$category',
          productCount: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          totalQuantity: { $sum: '$quantity' },
          averagePrice: { $avg: '$price' }
        }
      },
      { $sort: { productCount: -1 } }
    ]);

    const lowStockProducts = await Product.find({
      store: storeId,
      isActive: true,
      $expr: { $lt: ['$quantity', '$lowStockThreshold'] }
    }).sort({ quantity: 1 });

    const topValueProducts = await Product.find({
      store: storeId,
      isActive: true
    })
    .sort({ $expr: { $multiply: ['$price', '$quantity'] } })
    .limit(10);

    res.status(200).json({
      status: 'success',
      data: {
        summary: inventoryStats[0] || {
          totalProducts: 0,
          totalValue: 0,
          totalCostValue: 0,
          lowStockCount: 0,
          outOfStockCount: 0
        },
        categoryStats,
        lowStockProducts,
        topValueProducts
      }
    });
  } catch (error) {
    console.error('Get inventory report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error generating inventory report'
    });
  }
};

// @desc    Export report data
// @route   POST /api/reports/export
// @access  Private (Admin only)
export const exportReport = async (req, res) => {
  try {
    const { type, format = 'json', ...queryParams } = req.body;

    let reportData;

    switch (type) {
      case 'sales':
        reportData = await getSalesReportData(queryParams);
        break;
      case 'inventory':
        reportData = await getInventoryReportData(queryParams);
        break;
      default:
        return res.status(400).json({
          status: 'error',
          message: 'Invalid report type'
        });
    }

    if (format === 'csv') {
      const csv = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${Date.now()}.csv`);
      return res.send(csv);
    }

    res.status(200).json({
      status: 'success',
      data: reportData
    });
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error exporting report'
    });
  }
};

// Helper functions
const getSalesReportData = async (params) => {
  // Implementation for detailed sales data
  return { message: 'Detailed sales data' };
};

const getInventoryReportData = async (params) => {
  // Implementation for detailed inventory data
  return { message: 'Detailed inventory data' };
};

const convertToCSV = (data) => {
  // Simple CSV conversion implementation
  const headers = Object.keys(data).join(',');
  const values = Object.values(data).join(',');
  return `${headers}\n${values}`;
};
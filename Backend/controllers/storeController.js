// controllers/storeController.js
import Store from '../models/Store.js';

// @desc    Get store settings
// @route   GET /api/stores/settings
// @access  Private (Admin)
export const getStoreSettings = async (req, res) => {
  try {
    const storeId = req.user.store._id || req.user.store;
    const store = await Store.findById(storeId);

    if (!store) {
      return res.status(404).json({
        status: 'error',
        message: 'Store not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        store
      }
    });
  } catch (error) {
    console.error('Get store settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error retrieving store settings'
    });
  }
};

// @desc    Update store settings
// @route   PATCH /api/stores/settings
// @access  Private (Admin)
export const updateStoreSettings = async (req, res) => {
  try {
    const storeId = req.user.store._id || req.user.store;
    const { name, phone, email, taxRate, currency, address } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can update store settings'
      });
    }

    const updatedStore = await Store.findByIdAndUpdate(
      storeId,
      { name, phone, email, taxRate, currency, address },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedStore) {
      return res.status(404).json({
        status: 'error',
        message: 'Store not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Store settings updated successfully',
      data: {
        store: updatedStore
      }
    });
  } catch (error) {
    console.error('Update store settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating store settings'
    });
  }
};

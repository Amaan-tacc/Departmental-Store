// routes/inventory.js
import express from 'express';
import {
  getInventory,
  updateStock,
  getLowStockAlerts,
  getInventoryLogs,
  bulkUpdateInventory
} from '../controllers/inventoryController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateStockUpdate, validateId, validateBulkInventoryUpdate } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getInventory);
router.get('/low-stock', getLowStockAlerts);
router.get('/logs', getInventoryLogs);
router.put('/:id/stock', authorize('admin'), validateId, validateStockUpdate, updateStock);
router.post('/bulk-update', authorize('admin'), validateBulkInventoryUpdate, bulkUpdateInventory);

export default router;
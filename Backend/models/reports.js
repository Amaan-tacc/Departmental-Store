// routes/reports.js
import express from 'express';
import {
  getSalesReport,
  getInventoryReport,
  exportReport
} from '../controllers/reportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin')); // Only admins can access reports

router.get('/sales', getSalesReport);
router.get('/inventory', getInventoryReport);
router.post('/export', exportReport);

export default router;
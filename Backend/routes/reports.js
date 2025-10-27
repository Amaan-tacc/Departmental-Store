// routes/reports.js
import express from 'express';
import {
  getSalesReport,
  getInventoryReport,
  exportReport
} from '../controllers/reportController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateReportParams } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/sales', getSalesReport);
router.get('/inventory', getInventoryReport);
router.post('/export', validateReportParams, exportReport);

export default router;
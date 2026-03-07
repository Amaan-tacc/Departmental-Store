// routes/sales.js
import express from 'express';
import {
  processSale,
  getSales,
  getSaleById,
  refundSale,
  getTodaySummary,
  getMonthlySummary
} from '../controllers/saleController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateSale, validateId } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('admin', 'cashier'), validateSale, processSale);
router.get('/', getSales);
router.get('/today/summary', getTodaySummary);
router.get('/monthly/summary', getMonthlySummary);
router.get('/:id', validateId, getSaleById);
router.post('/:id/refund', authorize('admin'), validateId, refundSale);

export default router;
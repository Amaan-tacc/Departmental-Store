// routes/stores.js
import express from 'express';
import { getStoreSettings, updateStoreSettings } from '../controllers/storeController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

router.get('/settings', getStoreSettings);

// Only admin can update settings
router.patch('/settings', authorize('admin'), updateStoreSettings);

export default router;

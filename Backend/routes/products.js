// routes/products.js
import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  searchByBarcode,
  createCategory,  // Add this import
  deleteCategory   // Add this import
} from '../controllers/productController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateProduct, validateId } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/search/barcode/:barcode', searchByBarcode);
router.get('/:id', validateId, getProduct);
router.post('/', authorize('admin'), validateProduct, createProduct);
router.put('/:id', authorize('admin'), validateId, validateProduct, updateProduct);
router.delete('/:id', authorize('admin'), validateId, deleteProduct);

// Category management routes
router.post('/categories', authorize('admin'), createCategory);
router.delete('/categories/:name', authorize('admin'), deleteCategory);

export default router;
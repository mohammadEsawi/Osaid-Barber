const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const productsController = require('../controllers/productsController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const productValidation = [
  body('name').notEmpty().withMessage('اسم المنتج مطلوب'),
  body('price').isFloat({ min: 0 }).withMessage('السعر يجب أن يكون رقماً موجباً'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('الكمية يجب أن تكون رقماً موجباً'),
];

router.get('/', productsController.getAll);
router.get('/:id', productsController.getById);
router.post('/', authenticate, authorize('admin'), productValidation, validate, productsController.create);
router.put('/:id', authenticate, authorize('admin'), productsController.update);
router.delete('/:id', authenticate, authorize('admin'), productsController.remove);

module.exports = router;

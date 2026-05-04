const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

router.get('/', authenticate, authorize('admin'), ordersController.getAll);
router.get('/:id', authenticate, authorize('admin'), ordersController.getById);

router.post('/',
  [
    body('customer_name').notEmpty().withMessage('اسم العميل مطلوب'),
    body('customer_phone').notEmpty().withMessage('رقم الهاتف مطلوب'),
    body('items').isArray({ min: 1 }).withMessage('يجب إضافة منتج واحد على الأقل'),
    body('items.*.product_id').isInt().withMessage('معرّف المنتج غير صالح'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('الكمية يجب أن تكون رقماً موجباً'),
  ],
  validate,
  ordersController.create
);

router.put('/:id/status', authenticate, authorize('admin'), ordersController.updateStatus);

module.exports = router;

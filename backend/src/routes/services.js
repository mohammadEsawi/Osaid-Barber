const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const servicesController = require('../controllers/servicesController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const serviceValidation = [
  body('name').notEmpty().withMessage('اسم الخدمة مطلوب'),
  body('price').isFloat({ min: 0 }).withMessage('السعر يجب أن يكون رقماً موجباً'),
  body('duration_minutes').isInt({ min: 1 }).withMessage('مدة الخدمة مطلوبة'),
];

router.get('/', servicesController.getAll);
router.get('/:id', servicesController.getById);
router.post('/', authenticate, authorize('admin'), serviceValidation, validate, servicesController.create);
router.put('/:id', authenticate, authorize('admin'), serviceValidation, validate, servicesController.update);
router.delete('/:id', authenticate, authorize('admin'), servicesController.remove);

module.exports = router;

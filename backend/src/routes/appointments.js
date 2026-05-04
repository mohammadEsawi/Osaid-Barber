const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const appointmentsController = require('../controllers/appointmentsController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

router.get('/availability/check', appointmentsController.checkAvailability);
router.get('/my', appointmentsController.getByPhone);

router.get('/', authenticate, authorize('admin', 'barber'), appointmentsController.getAll);
router.get('/:id', appointmentsController.getById);

router.post('/',
  [
    body('customer_name').notEmpty().withMessage('اسم العميل مطلوب'),
    body('customer_phone').notEmpty().withMessage('رقم هاتف العميل مطلوب'),
    body('barber_id').isInt().withMessage('يجب اختيار الحلاق'),
    body('appointment_date').isDate().withMessage('تاريخ الموعد غير صالح'),
    body('start_time').notEmpty().withMessage('وقت الموعد مطلوب'),
    body('service_ids').isArray({ min: 1 }).withMessage('يجب اختيار خدمة واحدة على الأقل'),
  ],
  validate,
  appointmentsController.create
);

router.put('/:id', authenticate, authorize('admin', 'barber'), appointmentsController.update);
router.put('/:id/status', authenticate, authorize('admin', 'barber'), appointmentsController.updateStatus);
router.delete('/:id', authenticate, authorize('admin'), appointmentsController.remove);
router.put('/:id/cancel', appointmentsController.cancelByPhone);

module.exports = router;

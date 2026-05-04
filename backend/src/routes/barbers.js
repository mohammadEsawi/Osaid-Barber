const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body } = require('express-validator');
const router = express.Router();
const barbersController = require('../controllers/barbersController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'barbers');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `barber-${req.params.id}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('يرجى رفع صورة فقط'));
    cb(null, true);
  },
});

router.get('/', barbersController.getAll);
router.get('/:id', barbersController.getById);
router.get('/:id/availability', barbersController.getAvailability);
router.get('/:id/unavailable-slots', barbersController.getUnavailableSlots);

router.post('/',
  authenticate, authorize('admin'),
  [
    body('full_name').notEmpty().withMessage('الاسم الكامل مطلوب'),
    body('email').isEmail().withMessage('البريد الإلكتروني غير صالح'),
    body('phone').notEmpty().withMessage('رقم الهاتف مطلوب'),
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  ],
  validate,
  barbersController.create
);

router.put('/:id', authenticate, authorize('admin'), barbersController.update);
router.delete('/:id', authenticate, authorize('admin'), barbersController.remove);

router.post('/:id/image', authenticate, authorize('admin', 'barber'), upload.single('image'), barbersController.uploadImage);

router.put('/:id/availability', authenticate, authorize('admin', 'barber'), barbersController.updateAvailability);
router.post('/:id/unavailable-slots', authenticate, authorize('admin', 'barber'), barbersController.addUnavailableSlot);
router.delete('/:id/unavailable-slots/:slotId', authenticate, authorize('admin', 'barber'), barbersController.removeUnavailableSlot);

module.exports = router;

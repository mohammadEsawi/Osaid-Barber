const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body } = require('express-validator');
const router = express.Router();
const productsController = require('../controllers/productsController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'products');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `product-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('يرجى رفع صورة فقط'));
    cb(null, true);
  },
});

const productValidation = [
  body('name').notEmpty().withMessage('اسم المنتج مطلوب'),
  body('price').isFloat({ min: 0 }).withMessage('السعر يجب أن يكون رقماً موجباً'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('الكمية يجب أن تكون رقماً موجباً'),
];

// Image upload must come before /:id routes
router.post('/upload', authenticate, authorize('admin'), upload.single('image'), productsController.uploadImage);

router.get('/', productsController.getAll);
router.get('/:id', productsController.getById);
router.post('/', authenticate, authorize('admin'), productValidation, validate, productsController.create);
router.put('/:id', authenticate, authorize('admin'), productsController.update);
router.delete('/:id', authenticate, authorize('admin'), productsController.remove);

module.exports = router;

const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getAll, updateMany } = require('../controllers/settingsController');

router.get('/', getAll);
router.put('/', authenticate, authorize('admin'), updateMany);

module.exports = router;

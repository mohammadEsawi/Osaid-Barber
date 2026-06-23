const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getAll, create, remove } = require('../controllers/closuresController');

router.get('/', getAll);
router.post('/', authenticate, authorize('admin'), create);
router.delete('/:id', authenticate, authorize('admin'), remove);

module.exports = router;

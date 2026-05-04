const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createMessage, getMessages, markRead, deleteMessage } = require('../controllers/messagesController');

router.post('/', createMessage);
router.get('/', authenticate, authorize('admin'), getMessages);
router.put('/:id/read', authenticate, authorize('admin'), markRead);
router.delete('/:id', authenticate, authorize('admin'), deleteMessage);

module.exports = router;

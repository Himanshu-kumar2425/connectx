const express = require('express');
const { sendMessage, allMessages, deleteMessage, reactToMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').post(protect, sendMessage);
router.route('/:chatId').get(protect, allMessages);
router.route('/:messageId').delete(protect, deleteMessage);
router.route('/:messageId/react').post(protect, reactToMessage);

module.exports = router;

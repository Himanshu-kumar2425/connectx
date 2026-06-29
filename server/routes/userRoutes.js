const express = require('express');
const { allUsers, updateProfilePic } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, allUsers);
router.route('/profile-pic').put(protect, updateProfilePic);

module.exports = router;

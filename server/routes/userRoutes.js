const express = require('express');
const { allUsers, updateProfilePic } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');


const router = express.Router();

router.route('/').get(protect, allUsers);
router.route('/profile-pic').put(protect, upload.single('profilePic'), updateProfilePic);

module.exports = router;

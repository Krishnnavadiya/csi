const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Import the instance directly
const validate = require('../middleware/validationMiddleware');
const { uploadProfileImage } = require('../middleware/uploadMiddleware');

// Routes
router.route('/')
  .get(userController.getAllUsers)
  .post(validate('userCreate'), userController.createUser);

router.route('/:id')
  .get(userController.getUserById)
  .put(validate('userUpdate'), userController.updateUser)
  .delete(userController.deleteUser);

router.route('/:id/profile-image')
  .put(uploadProfileImage, userController.updateProfileImage);

module.exports = router;
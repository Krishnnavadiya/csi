const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController'); // Import the instance directly
const validate = require('../middleware/validationMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');

// Routes
router.route('/')
  .get(postController.getAllPosts)
  .post(uploadSingle, validate('postCreate'), postController.createPost);

router.route('/:id')
  .get(postController.getPostById)
  .put(uploadSingle, validate('postUpdate'), postController.updatePost)
  .delete(postController.deletePost);

router.route('/:id/comments')
  .post(validate('comment'), postController.addComment);

router.route('/:id/like')
  .put(postController.toggleLike);

module.exports = router;
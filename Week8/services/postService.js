const Post = require('../models/Post');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

class PostService {
  async getAllPosts(query = {}) {
    logger.info('Fetching all posts');
    const { page = 1, limit = 10, tag, search } = query;

    // Build query
    const queryObj = {};
    if (tag) queryObj.tags = tag;
    if (search) {
      queryObj.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const posts = await Post.find(queryObj)
      .populate('author', 'name email profileImage')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count
    const total = await Post.countDocuments(queryObj);

    return {
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    };
  }

  async getPostById(id) {
    logger.info(`Fetching post with id: ${id}`);
    const post = await Post.findById(id)
      .populate('author', 'name email profileImage')
      .populate('comments.user', 'name profileImage');

    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }

    return post;
  }

  async createPost(postData, file) {
    logger.info('Creating new post');
    if (file) {
      postData.image = file.filename;
    }

    return await Post.create(postData);
  }

  async updatePost(id, postData, file) {
    logger.info(`Updating post with id: ${id}`);
    const post = await Post.findById(id);
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }

    // Handle file upload if there's a new image
    if (file) {
      // Delete old image if it exists
      if (post.image) {
        const imagePath = path.join(__dirname, '../uploads', post.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      postData.image = file.filename;
    }

    const updatedPost = await Post.findByIdAndUpdate(id, postData, {
      new: true,
      runValidators: true
    }).populate('author', 'name email profileImage');

    return updatedPost;
  }

  async deletePost(id) {
    logger.info(`Deleting post with id: ${id}`);
    const post = await Post.findById(id);
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }

    // Delete image if it exists
    if (post.image) {
      const imagePath = path.join(__dirname, '../uploads', post.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await post.deleteOne();
    return { success: true };
  }

  async addComment(postId, comment) {
    logger.info(`Adding comment to post with id: ${postId}`);
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }

    post.comments.unshift(comment);
    await post.save();

    return post.populate([
      { path: 'author', select: 'name email profileImage' },
      { path: 'comments.user', select: 'name profileImage' }
    ]);
  }

  async toggleLike(postId, userId) {
    logger.info(`Toggling like for post with id: ${postId}`);
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if post is already liked
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike the post
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      // Like the post
      post.likes.unshift(userId);
    }

    await post.save();
    return post.populate('author', 'name email profileImage');
  }
}

module.exports = new PostService();
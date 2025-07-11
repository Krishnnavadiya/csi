const postService = require('../services/postService');

class PostController {
  async getAllPosts(req, res) {
    const result = await postService.getAllPosts(req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  }

  async getPostById(req, res) {
    const post = await postService.getPostById(req.params.id);
    res.status(200).json({
      success: true,
      data: post
    });
  }

  async createPost(req, res) {
    const postData = {
      ...req.body,
      author: req.user.id // Assuming authentication middleware sets req.user
    };

    const post = await postService.createPost(postData, req.file);
    res.status(201).json({
      success: true,
      data: post
    });
  }

  async updatePost(req, res) {
    const post = await postService.updatePost(req.params.id, req.body, req.file);
    res.status(200).json({
      success: true,
      data: post
    });
  }

  async deletePost(req, res) {
    await postService.deletePost(req.params.id);
    res.status(200).json({
      success: true,
      data: {}
    });
  }

  async addComment(req, res) {
    const comment = {
      text: req.body.text,
      user: req.user.id // Assuming authentication middleware sets req.user
    };

    const post = await postService.addComment(req.params.id, comment);
    res.status(200).json({
      success: true,
      data: post
    });
  }

  async toggleLike(req, res) {
    const post = await postService.toggleLike(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      data: post
    });
  }
}

module.exports = new PostController();
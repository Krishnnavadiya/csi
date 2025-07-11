const userService = require('../services/userService');

class UserController {
  async getAllUsers(req, res) {
    const users = await userService.getAllUsers();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  }

  async getUserById(req, res) {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({
      success: true,
      data: user
    });
  }

  async createUser(req, res) {
    const user = await userService.createUser(req.body);
    res.status(201).json({
      success: true,
      data: user
    });
  }

  async updateUser(req, res) {
    const user = await userService.updateUser(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: user
    });
  }

  async deleteUser(req, res) {
    await userService.deleteUser(req.params.id);
    res.status(200).json({
      success: true,
      data: {}
    });
  }

  async updateProfileImage(req, res) {
    if (!req.file) {
      const error = new Error('Please upload a file');
      error.statusCode = 400;
      throw error;
    }

    const userData = {
      profileImage: req.file.filename
    };

    const user = await userService.updateUser(req.params.id, userData);
    res.status(200).json({
      success: true,
      data: user
    });
  }
}

module.exports = new UserController();
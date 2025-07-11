const userService = require('../services/userService');

class AuthController {
  async register(req, res) {
    const user = await userService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  }

  async login(req, res) {
    const { email, password } = req.body;
    const result = await userService.login(email, password);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  }

  async getMe(req, res) {
    const user = await userService.getUserById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  }
}

module.exports = new AuthController();
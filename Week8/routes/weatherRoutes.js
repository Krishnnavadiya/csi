const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// Routes
router.get('/current/:city', weatherController.getWeatherByCity);
router.get('/forecast/:city', weatherController.getForecast);

module.exports = router;
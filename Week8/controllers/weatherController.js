const weatherService = require('../services/weatherService');

class WeatherController {
  async getWeatherByCity(req, res) {
    const { city } = req.params;
    const weatherData = await weatherService.getWeatherByCity(city);
    res.status(200).json({
      success: true,
      data: weatherData
    });
  }

  async getForecast(req, res) {
    const { city } = req.params;
    const { days } = req.query;
    const forecastData = await weatherService.getForecast(city, days ? parseInt(days) : 5);
    res.status(200).json({
      success: true,
      data: forecastData
    });
  }
}

module.exports = new WeatherController();
const axios = require('axios');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Cache with 10 minute TTL
const cache = new NodeCache({ stdTTL: 600 });

class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY;
    this.apiUrl = process.env.WEATHER_API_URL;
  }

  async getWeatherByCity(city) {
    logger.info(`Fetching weather data for city: ${city}`);
    
    // Check cache first
    const cacheKey = `weather_${city}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      logger.debug(`Returning cached weather data for ${city}`);
      return cachedData;
    }
    
    try {
      const response = await axios.get(`${this.apiUrl}/weather`, {
        params: {
          q: city,
          appid: this.apiKey,
          units: 'metric'
        }
      });
      
      const weatherData = {
        city: response.data.name,
        country: response.data.sys.country,
        temperature: response.data.main.temp,
        feels_like: response.data.main.feels_like,
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        weather: response.data.weather[0].main,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        wind_speed: response.data.wind.speed,
        timestamp: new Date()
      };
      
      // Store in cache
      cache.set(cacheKey, weatherData);
      
      return weatherData;
    } catch (error) {
      logger.error(`Error fetching weather data: ${error.message}`);
      if (error.response && error.response.status === 404) {
        const notFoundError = new Error('City not found');
        notFoundError.statusCode = 404;
        throw notFoundError;
      }
      const apiError = new Error('Weather API error');
      apiError.statusCode = 500;
      apiError.details = error.message;
      throw apiError;
    }
  }

  async getForecast(city, days = 5) {
    logger.info(`Fetching ${days}-day forecast for city: ${city}`);
    
    // Check cache first
    const cacheKey = `forecast_${city}_${days}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      logger.debug(`Returning cached forecast data for ${city}`);
      return cachedData;
    }
    
    try {
      const response = await axios.get(`${this.apiUrl}/forecast`, {
        params: {
          q: city,
          appid: this.apiKey,
          units: 'metric',
          cnt: days * 8 // API returns data in 3-hour intervals, so 8 per day
        }
      });
      
      // Process and format the forecast data
      const forecastData = {
        city: response.data.city.name,
        country: response.data.city.country,
        forecast: this._processForecastData(response.data.list, days),
        timestamp: new Date()
      };
      
      // Store in cache
      cache.set(cacheKey, forecastData);
      
      return forecastData;
    } catch (error) {
      logger.error(`Error fetching forecast data: ${error.message}`);
      if (error.response && error.response.status === 404) {
        const notFoundError = new Error('City not found');
        notFoundError.statusCode = 404;
        throw notFoundError;
      }
      const apiError = new Error('Weather API error');
      apiError.statusCode = 500;
      apiError.details = error.message;
      throw apiError;
    }
  }

  // Helper method to process forecast data
  _processForecastData(list, days) {
    const dailyData = {};
    
    // Group by day
    list.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = [];
      }
      dailyData[date].push({
        time: new Date(item.dt * 1000).toISOString(),
        temperature: item.main.temp,
        feels_like: item.main.feels_like,
        weather: item.weather[0].main,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        wind_speed: item.wind.speed,
        humidity: item.main.humidity,
        pressure: item.main.pressure
      });
    });
    
    // Convert to array and limit to requested days
    return Object.keys(dailyData)
      .sort()
      .slice(0, days)
      .map(date => ({
        date,
        intervals: dailyData[date]
      }));
  }
}

module.exports = new WeatherService();
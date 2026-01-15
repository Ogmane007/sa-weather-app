// ============================================
// SOUTH AFRICAN WEATHER APP - PREMIUM VERSION
// ============================================

// API Configuration
const API_KEY = 'ed99bc250ab1ea2f838dc6e924f7d026';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements - Updated for new HTML structure
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');
const currentWeather = document.getElementById('currentWeather');
const forecast = document.getElementById('forecastContainer');
const quickCityButtons = document.querySelectorAll('.city-card');
const retryBtn = document.querySelector('.retry-btn');

// ============================================
// EVENT LISTENERS
// ============================================

// Search button click
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherByCity(city);
    }
});

// Enter key in search box
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherByCity(city);
        }
    }
});

// Location button click
locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoordinates(latitude, longitude);
            },
            (error) => {
                hideLoading();
                showError('Unable to get your location. Please search for a city instead.');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
    }
});

// Quick city buttons
quickCityButtons.forEach(button => {
    button.addEventListener('click', () => {
        const city = button.dataset.city;
        getWeatherByCity(city);
    });
});

// Retry button for errors
if (retryBtn) {
    retryBtn.addEventListener('click', () => {
        error.classList.add('hidden');
        getWeatherByCity('Johannesburg');
    });
}

// ============================================
// API FUNCTIONS
// ============================================

// Get weather by city name
async function getWeatherByCity(city) {
    showLoading();
    hideError();
    
    try {
        // Get current weather
        const currentResponse = await fetch(
            `${API_BASE_URL}/weather?q=${city},ZA&appid=${API_KEY}&units=metric`
        );
        
        if (!currentResponse.ok) {
            throw new Error('City not found in South Africa');
        }
        
        const currentData = await currentResponse.json();
        
        // Get forecast
        const forecastResponse = await fetch(
            `${API_BASE_URL}/forecast?q=${city},ZA&appid=${API_KEY}&units=metric`
        );
        
        const forecastData = await forecastResponse.json();
        
        // Display data
        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        hideLoading();
        
    } catch (err) {
        hideLoading();
        showError(`Error: ${err.message}. Please try another South African city.`);
    }
}

// Get weather by coordinates
async function getWeatherByCoordinates(lat, lon) {
    try {
        // Get current weather
        const currentResponse = await fetch(
            `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        
        if (!currentResponse.ok) {
            throw new Error('Unable to fetch weather data');
        }
        
        const currentData = await currentResponse.json();
        
        // Get forecast
        const forecastResponse = await fetch(
            `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        
        const forecastData = await forecastResponse.json();
        
        // Display data
        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        hideLoading();
        
    } catch (err) {
        hideLoading();
        showError(`Error: ${err.message}`);
    }
}

// ============================================
// DISPLAY FUNCTIONS - UPDATED FOR NEW HTML
// ============================================

// Display current weather
function displayCurrentWeather(data) {
    // Update city name and date
    document.getElementById('cityName').textContent = data.name;
    document.getElementById('currentDate').textContent = formatDate(new Date());
    
    // Update temperature
    document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById('weatherDescription').textContent = data.weather[0].description;
    
    // Update weather icon
    const iconElement = document.getElementById('weatherIcon');
    const weatherCondition = data.weather[0].main;
    iconElement.className = getWeatherIconClass(weatherCondition);
    
    // Update additional details
    document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°C`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
    document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    document.getElementById('clouds').textContent = `${data.clouds.all}%`;
    
    // Update last update time
    document.getElementById('updateTime').textContent = formatTime(new Date());
    
    // Update weather quality text
    updateWeatherQuality(data.weather[0].main, data.main.temp);
    
    // Show current weather section
    currentWeather.classList.remove('hidden');
}

// Display 5-day forecast - UPDATED FOR NEW STRUCTURE
function displayForecast(data) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';
    
    // Get one forecast per day (at 12:00)
    const dailyForecasts = data.list.filter(item => 
        item.dt_txt.includes('12:00:00')
    );
    
    // Take only 5 days
    dailyForecasts.slice(0, 5).forEach(day => {
        const forecastCard = createForecastCard(day);
        forecastContainer.appendChild(forecastCard);
    });
    
    // Show forecast section
    document.querySelector('.forecast-section').classList.remove('hidden');
}

// Create forecast card - UPDATED FOR NEW STRUCTURE
function createForecastCard(data) {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    
    const date = new Date(data.dt * 1000);
    const dayName = date.toLocaleDateString('en-ZA', { weekday: 'short' });
    const temp = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const iconClass = getWeatherIconClass(data.weather[0].main);
    
    card.innerHTML = `
        <div class="forecast-day">${dayName}</div>
        <div class="forecast-icon"><i class="${iconClass}"></i></div>
        <div class="forecast-temp">${temp}°C</div>
        <div class="forecast-desc">${description}</div>
    `;
    
    return card;
}

// Update weather quality text
function updateWeatherQuality(condition, temperature) {
    const qualityElement = document.querySelector('.weather-quality');
    let qualityText = '';
    
    if (condition === 'Clear' && temperature > 25) {
        qualityText = 'Perfect beach weather';
    } else if (condition === 'Clear') {
        qualityText = 'Excellent conditions';
    } else if (condition === 'Clouds') {
        qualityText = 'Partly cloudy';
    } else if (condition === 'Rain' || condition === 'Drizzle') {
        qualityText = 'Rainy conditions';
    } else if (condition === 'Thunderstorm') {
        qualityText = 'Storm warning';
    } else {
        qualityText = 'Good conditions';
    }
    
    qualityElement.textContent = qualityText;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get weather icon class based on condition
function getWeatherIconClass(condition) {
    const iconMap = {
        'Clear': 'fas fa-sun',
        'Clouds': 'fas fa-cloud',
        'Rain': 'fas fa-cloud-rain',
        'Drizzle': 'fas fa-cloud-rain',
        'Thunderstorm': 'fas fa-cloud-bolt',
        'Snow': 'fas fa-snowflake',
        'Mist': 'fas fa-smog',
        'Smoke': 'fas fa-smog',
        'Haze': 'fas fa-smog',
        'Dust': 'fas fa-smog',
        'Fog': 'fas fa-smog',
        'Sand': 'fas fa-smog',
        'Ash': 'fas fa-smog',
        'Squall': 'fas fa-wind',
        'Tornado': 'fas fa-tornado'
    };
    
    return iconMap[condition] || 'fas fa-cloud';
}

// Format date
function formatDate(date) {
    return date.toLocaleDateString('en-ZA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format time
function formatTime(date) {
    return date.toLocaleTimeString('en-ZA', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show loading
function showLoading() {
    loading.classList.remove('hidden');
    currentWeather.classList.add('hidden');
    document.querySelector('.forecast-section')?.classList.add('hidden');
}

// Hide loading
function hideLoading() {
    loading.classList.add('hidden');
}

// Show error
function showError(message) {
    errorMessage.textContent = message;
    error.classList.remove('hidden');
    currentWeather.classList.add('hidden');
    document.querySelector('.forecast-section')?.classList.add('hidden');
}

// Hide error
function hideError() {
    error.classList.add('hidden');
}

// ============================================
// INITIALIZATION
// ============================================

// Load default city on page load
window.addEventListener('DOMContentLoaded', () => {
    // Check if API key is set
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
        showError('Please add your OpenWeatherMap API key in script.js file.');
    } else {
        // Load Johannesburg weather by default
        getWeatherByCity('Johannesburg');
        
        // Set input placeholder based on time of day
        const hour = new Date().getHours();
        let greeting = '';
        if (hour < 12) greeting = 'Morning';
        else if (hour < 18) greeting = 'Afternoon';
        else greeting = 'Evening';
        
        cityInput.placeholder = `Good ${greeting}! Search for a South African city...`;
    }
});

// Add input focus effect
cityInput.addEventListener('focus', () => {
    cityInput.parentElement.classList.add('focused');
});

cityInput.addEventListener('blur', () => {
    cityInput.parentElement.classList.remove('focused');
});

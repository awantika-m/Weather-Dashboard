const API_KEY = "66a784b1f05f4dc784a102423262903"; 
const API_URL = "https://api.weatherapi.com/v1/forecast.json";

const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("city");
const loadingDiv = document.getElementById("loading");
const errorDiv = document.getElementById("error");
const currentWeatherDiv = document.getElementById("currentWeather");
const forecastContainerDiv = document.getElementById("forecastContainer");
const forecastGridDiv = document.getElementById("forecastGrid");


searchBtn.addEventListener("click", searchWeather);
cityInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    searchWeather();
  }
});

function searchWeather() {
  const city = cityInput.value.trim();

  
  if (!city) {
    showError("Please enter a city name");
    return;
  }

  clearResults();
  showLoading(true);


  const url = `${API_URL}?key=${API_KEY}&q=${encodeURIComponent(
    city
  )}&days=7&aqi=no`;

  
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("City not found. Please check the spelling.");
        } else if (response.status === 403) {
          throw new Error(
            "API key is invalid. Please check your configuration."
          );
        } else if (response.status === 429) {
          throw new Error("Too many requests. Please wait and try again.");
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }
      return response.json();
    })
    .then((data) => {
      // Check if the API returned an error
      if (data.error) {
        throw new Error(data.error.message || "City not found");
      }
      showLoading(false);
      displayForecast(data);
    })
    .catch((error) => {
      showLoading(false);
      console.error("Fetch error:", error);
      showError(error.message || "Unable to fetch weather data.");
    });
}

function displayForecast(data) {
 
  displayCurrentWeather(data.current, data.location);


  const forecastDays = data.forecast.forecastday;

  const forecastHTML = forecastDays
    .map((day, index) => createForecastCard(day, index))
    .join("");

  forecastGridDiv.innerHTML = forecastHTML;

 
  forecastContainerDiv.classList.remove("hidden");
  errorDiv.classList.add("hidden");


  cityInput.value = "";
}

function displayCurrentWeather(current, location) {
  const date = new Date();
  const dateString = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `
    <div class="current-weather">
      <!-- Left Section: Location, Date, Icon, Temp, Condition -->
      <div class="weather-left">
        <div class="location-info">
          <h2 class="location-name">${location.name}, ${location.country}</h2>
          <p class="location-date">${dateString}</p>
        </div>
        
        <div class="temp-section">
          <img 
            src="https:${current.condition.icon}" 
            alt="${current.condition.text}"
            class="weather-icon"
          >
          <div class="temp-display">
            <div class="temp-main">${current.temp_c.toFixed(1)}°C</div>
            <div class="temp-condition-text">${current.condition.text}</div>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="weather-divider"></div>

      <!-- Right Section: Additional Details -->
      <div class="weather-right">
        <div class="details-grid">
          <div class="detail-item">
            <div class="detail-label">Feels Like</div>
            <div class="detail-value">${current.feelslike_c.toFixed(1)}°C</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Humidity</div>
            <div class="detail-value">${current.humidity}%</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Wind Speed</div>
            <div class="detail-value">${current.wind_kph.toFixed(1)} km/h</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Pressure</div>
            <div class="detail-value">${current.pressure_mb.toFixed(0)} mb</div>
          </div>
        </div>
      </div>
    </div>
  `;

  currentWeatherDiv.innerHTML = html;
  currentWeatherDiv.classList.remove("hidden");
}

function createForecastCard(day, index) {
  const dateObj = new Date(day.date);
  const dateString = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "long" });

  // Get hourly data and group by period
  const hourlyData = day.hour;

  // Group hours into periods: Morning (6-11), Afternoon (12-17), Night (18-23)
  const morningHours = filterHoursByPeriod(hourlyData, 6, 11);
  const afternoonHours = filterHoursByPeriod(hourlyData, 12, 17);
  const nightHours = filterHoursByPeriod(hourlyData, 18, 23);

  const html = `
    <div class="forecast-card">
      <div class="card-header">
        <div class="card-date">
          <div class="day-name">${dayOfWeek}</div>
          <div class="day-date">${dateString}</div>
        </div>
        <img 
          src="https:${day.day.condition.icon}" 
          alt="${day.day.condition.text}"
          class="card-icon"
        >
      </div>
      
      <div class="day-summary">
        <div class="summary-item">
          <div class="summary-label">Max</div>
          <div class="summary-value">${day.day.maxtemp_c.toFixed(0)}°</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Avg</div>
          <div class="summary-value">${day.day.avgtemp_c.toFixed(0)}°</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Min</div>
          <div class="summary-value">${day.day.mintemp_c.toFixed(0)}°</div>
        </div>
      </div>

      <div class="day-details">
        <div class="detail">
          <span class="detail-icon">💧</span>
          <span class="detail-text">${day.day.avghumidity}% humidity</span>
        </div>
        <div class="detail">
          <span class="detail-icon">💨</span>
          <span class="detail-text">${day.day.maxwind_kph.toFixed(0)} km/h wind</span>
        </div>
      </div>

      <div class="weather-condition">
        <div class="condition-text">${day.day.condition.text}</div>
      </div>

      <div class="hourly-breakdown">
        ${createHourlyPeriod("🌅 Morning", morningHours)}
        ${createHourlyPeriod("☀️ Afternoon", afternoonHours)}
        ${createHourlyPeriod("🌙 Night", nightHours)}
      </div>
    </div>
  `;

  return html;
}

function filterHoursByPeriod(hourlyData, startHour, endHour) {

  return hourlyData.filter((hour) => {
    const timeParts = hour.time.split(" "); 
    const hourParts = timeParts[1].split(":"); 
    const hourNum = parseInt(hourParts[0]);
    return hourNum >= startHour && hourNum <= endHour;
  });
}

function createHourlyPeriod(periodName, hours) {

  if (hours.length === 0) {
    return `
      <div class="hourly-period">
        <div class="period-title">${periodName}</div>
        <div class="period-hours">
          <div class="no-data">No data available</div>
        </div>
      </div>
    `;
  }

  const avgTemp = (
    hours.reduce((sum, hour) => sum + hour.temp_c, 0) / hours.length
  ).toFixed(1);
  const avgHumidity = Math.round(
    hours.reduce((sum, hour) => sum + hour.humidity, 0) / hours.length
  );
  const avgWindSpeed = (
    hours.reduce((sum, hour) => sum + hour.wind_kph, 0) / hours.length
  ).toFixed(1);


  const mainCondition = hours[0].condition;

  
  const sampleHours = hours.slice(0, 3);

  const hoursHTML = sampleHours
    .map(
      (hour) => `
    <div class="hour-item">
      <div class="hour-time">${hour.time.split(" ")[1]}</div>
      <img 
        src="https:${hour.condition.icon}" 
        alt="${hour.condition.text}"
        class="hour-icon"
      >
      <div class="hour-temp">${hour.temp_c.toFixed(1)}°C</div>
      <div class="hour-humidity">${hour.humidity}%</div>
    </div>
  `
    )
    .join("");

  return `
    <div class="hourly-period">
      <div class="period-header">
        <div class="period-title">${periodName}</div>
        <div class="period-condition">
          <img 
            src="https:${mainCondition.icon}" 
            alt="${mainCondition.text}"
            class="period-icon"
          >
          <span class="period-text">${mainCondition.text}</span>
        </div>
      </div>
      
      <div class="period-stats">
        <div class="stat">
          <span class="stat-label">Avg Temp</span>
          <span class="stat-value">${avgTemp}°C</span>
        </div>
        <div class="stat">
          <span class="stat-label">Humidity</span>
          <span class="stat-value">${avgHumidity}%</span>
        </div>
        <div class="stat">
          <span class="stat-label">Wind</span>
          <span class="stat-value">${avgWindSpeed} km/h</span>
        </div>
      </div>

      <div class="period-hours">
        ${hoursHTML}
      </div>
    </div>
  `;
}

function showError(message) {
  errorDiv.innerHTML = `<p>⚠️ ${message}</p>`;
  errorDiv.classList.remove("hidden");
  currentWeatherDiv.classList.add("hidden");
  forecastContainerDiv.classList.add("hidden");
}

function showLoading(isLoading) {
  if (isLoading) {
    loadingDiv.classList.remove("hidden");
  } else {
    loadingDiv.classList.add("hidden");
  }
}

function clearResults() {
  errorDiv.classList.add("hidden");
  currentWeatherDiv.classList.add("hidden");
  forecastContainerDiv.classList.add("hidden");
  forecastGridDiv.innerHTML = "";
}
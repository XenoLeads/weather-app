import "../styles/style.css";
import Weather from "./weather-api.js";
import Icon from "./weather-icons.js";

const searchButton = document.getElementsByClassName("search-button")[0];
const clearSearchButton = document.getElementsByClassName("clear-search-button")[0];
const searchInput = document.getElementById("search");
const searchSuggestions = document.getElementById("search-suggestions");
const selected_weather_icon = [...document.getElementsByClassName("selected-weather-icon")];
const daily_button = document.getElementById("daily-button");
const hourly_button = document.getElementById("hourly-button");
const forecastList = document.getElementsByClassName("forecast-list")[0];

const DIRECTIONS = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"];
const DEBOUNCE_DELAY = 250;
let timeoutId;
let weather_data;

// Data formatting module
const format = {
  weekday: date => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(dateObj);
  },
  time: (date, hour12 = false, includeSeconds = false) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const options = {
      hour: "numeric",
      minute: "2-digit",
      hour12: hour12,
    };

    if (includeSeconds) {
      options.second = "2-digit";
    }

    return new Intl.DateTimeFormat("en-US", options).format(dateObj);
  },
  date: date => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toISOString().split("T")[0];
  },
  custom: (date, options = {}, locale = "en-US") => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  },
};

function showSuggestions(location_name) {
  Weather.geocode(location_name).then(geocode => {
    if (!geocode) return;
    searchSuggestions.innerHTML = "";
    geocode.forEach(location => {
      const option = document.createElement("option");
      option.value = location.name;
      option.textContent = location.name;
      searchSuggestions.appendChild(option);
    });
  });
}

// Initialization IIFE
(() => {
  // Display locally cached weather data if available
  const local_weather_data = JSON.parse(localStorage.getItem("weather_data"));
  if (local_weather_data) {
    weather_data = local_weather_data;
    displayWeatherData(Weather.format(weather_data), forecastList);
  }

  // Show suggestions after typing
  searchInput.addEventListener("input", () => {
    const value = searchInput.value.trim();
    if (value.length < 3) return;
    // Debounce the API call to avoid making a request for every keystroke
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      showSuggestions(value);
    }, DEBOUNCE_DELAY);
  });

  searchButton.addEventListener("click", () => {
    const value = searchInput.value.trim();
    if (value && value.length > 0) {
      Weather.get(value)
        .then(response => {
          // Cache succesfully fetched weather data
          localStorage.setItem("weather_data", JSON.stringify(response));
          weather_data = response;
          searchInput.value = "";
          displayWeatherData(Weather.format(response), forecastList);
        })
        .catch(error => {
          console.error(error);
        });
    }
  });

  clearSearchButton.addEventListener("click", () => (searchInput.value = ""));

  daily_button.addEventListener("click", () => {
    hourly_button.classList.remove("selected");
    daily_button.classList.add("selected");
    displayWeatherForecasts(Weather.format(weather_data), forecastList);
  });
  hourly_button.addEventListener("click", () => {
    daily_button.classList.remove("selected");
    hourly_button.classList.add("selected");
    displayWeatherForecasts(Weather.format(weather_data), forecastList, false);
  });
})();

function getDirectionText(degrees) {
  const index = Math.round(degrees / 45) % 8;

  return DIRECTIONS[index];
}

function displayWeatherData(data, forecast_list_DOM_container = null) {
  const selected_list = parseInt(forecast_list_DOM_container.dataset.forecastList);
  const day_index = parseInt(forecast_list_DOM_container.dataset.day);
  const hour_index = parseInt(forecast_list_DOM_container.dataset.hour);
  const days = [...document.querySelectorAll("[data-day]")];
  const times = [...document.querySelectorAll("[data-time]")];
  const locations = [...document.querySelectorAll("[data-location]")];
  const min_max_temperature = document.querySelector("[data-min-max-temperature]");
  const temperature = document.querySelector("[data-temperature]");
  const feelslike_temperature = document.querySelector("[data-feelslike-temperature]");
  const weather_condition = [...document.querySelectorAll("[data-weather-condition]")];
  const humidity = [...document.querySelectorAll("[data-humidity]")];
  const precipitation = [...document.querySelectorAll("[data-precipitation]")];
  const pressure = [...document.querySelectorAll("[data-pressure]")];
  const uv_index = [...document.querySelectorAll("[data-uv-index]")];
  const wind_speed = [...document.querySelectorAll("[data-wind-speed]")];
  const wind_direction = [...document.querySelectorAll("[data-wind-direction]")];
  const sunrise = [...document.querySelectorAll("[data-sunrise]")];
  const sunset = [...document.querySelectorAll("[data-sunset]")];
  console.log(data);
  const current_config = [
    [days, format.weekday(data.current.time)],
    [times, format.time(data.current.time, true)],
    [locations, data.location],
    [
      min_max_temperature,
      `${data.current.temperature_min}${data.current_units.temperature_min} / ${data.current.temperature_max}${data.current_units.temperature_max}`,
    ],
    [temperature, `${data.current.temperature}${data.current_units.temperature}`],
    [feelslike_temperature, `Feels-like ${data.current.temperature_feelslike}${data.current_units.temperature_feelslike}`],
    [weather_condition, data.current.condition],
    [humidity, `${data.current.humidity}${data.current_units.humidity}`],
    [precipitation, `${data.current.precipitation}${data.current_units.precipitation}`],
    [pressure, `${data.current.pressure} ${data.current_units.pressure}`],
    [uv_index, `${data.current.uv_index} ${data.current_units.uv_index}`],
    [wind_speed, `${data.current.wind_speed} ${data.current_units.wind_speed}`],
    [wind_direction, getDirectionText(data.current.wind_direction)],
    [sunrise, format.time(data.current.sunrise, true)],
    [sunset, format.time(data.current.sunset, true)],
  ];

  // 0 = daily forecast, otherwise hourly forecast
  if (selected_list === 0) {
    // Display current weather data if the day index is 0 and hour index is -1
    if (day_index === 0 && hour_index === -1) {
      setTextContent(current_config);
      Icon.get(data.current.weather_code).then(icon_URL => {
        selected_weather_icon.forEach(icon => (icon.src = icon_URL.default));
      });
    }
    // Show daily forecast list
    displayWeatherForecasts(data, forecast_list_DOM_container);
  } else {
    // Show hourly forecast list
    displayWeatherForecasts(data, forecast_list_DOM_container, false);
  }

  function setTextContent(configs) {
    configs.forEach(config => {
      const [elements, value] = config;
      if (Array.isArray(elements)) {
        elements.forEach(element => {
          element.textContent = value;
        });
      } else {
        elements.textContent = value;
      }
    });
  }
}

// This function displays daily or hourly forecast list
function displayWeatherForecasts(data, forecast_list_DOM_container, isDaily = true) {
  forecast_list_DOM_container.innerHTML = "";

  // Display daily forecast
  if (isDaily) {
    const forecast_list = data.daily;
    forecast_list.forEach((forecast, forecast_index) =>
      forecast_list_DOM_container.appendChild(createDOMForecast(forecast, forecast_index, forecast_list_DOM_container))
    );

    // Add selected class to selected day
    const day_index = parseInt(forecast_list_DOM_container.dataset.day);
    const selected_day = document.querySelector(`.forecast-item[data-index="${day_index}"]`);
    if (selected_day) selected_day.classList.add("selected");

    // Change first daily forecast's label from weekday to "Today"
    const today_label = document.querySelector(`.forecast-item[data-index="0"] .forecast-day`);
    today_label.textContent = "Today";
  }
  // Display dourly forecast
  else {
    const day_index = parseInt(forecast_list_DOM_container.dataset.day);
    const forecast_list = data.daily[day_index].hourly;
    forecast_list.forEach((forecast, forecast_index) =>
      forecast_list_DOM_container.appendChild(createDOMForecast(forecast, forecast_index, forecast_list_DOM_container, false))
    );

    // Get current forecast's inserting index, -1 = there is a hourly forecast with the same time as current forecast
    const current_index = forecast_list.findIndex(forecast => {
      const [hour, minute] = forecast.time
        .split("T")[1]
        .split(":")
        .map(time => parseInt(time));
      const [cHour, cMinute] = data.current.time
        .split("T")[1]
        .split(":")
        .map(time => parseInt(time));
      return hour === cHour && minute !== cMinute;
    });

    // If the current forecast time isn't available in existing hourly forecast then add it to the DOM
    if (current_index !== -1) {
      const insertingIndexElement = [...forecast_list_DOM_container.children][current_index];
      const current_forecast = createDOMForecast(data.current, -1, forecast_list_DOM_container, false);
      insertingIndexElement.after(current_forecast);
      current_forecast.classList.add("selected");
    }

    // Select current selected forecast
    const hour = parseInt(forecastList.dataset.hour);
    let selected_hour;
    if (hour === -1) selected_hour = document.querySelector(`.forecast-item[data-index="-1"]`);
    else {
      const hour_index = parseInt(new Date().toLocaleTimeString().split(":")[0]);
      selected_hour = document.querySelector(`.forecast-item[data-index="${hour_index}"]`);
    }
    if (!selected_hour) {
      const hour_index = parseInt(new Date().toLocaleTimeString().split(":")[0]);
      selected_hour = document.querySelector(`.forecast-item[data-index="${hour_index}"]`);
    }
    selected_hour.classList.add("selected");
    selected_hour.scrollIntoView({ behavior: "smooth", inline: "center" });
  }
}

function createDOMForecast(forecast, forecast_index, forecast_list_DOM_container, isDaily = true) {
  const li = document.createElement("li");
  const button = document.createElement("button");
  button.classList.add("forecast-item");
  button.dataset.index = forecast_index;
  if (isDaily) {
    button.addEventListener("click", () => {
      forecast_list_DOM_container.dataset.day = forecast_index;
      [...forecast_list_DOM_container.getElementsByClassName("forecast-item")].forEach(forecast_item =>
        forecast_item.classList.remove("selected")
      );
      const selected_day = document.querySelector(`.forecast-item[data-index="${forecast_index}"]`);
      if (selected_day) selected_day.classList.add("selected");
    });
  } else {
    button.addEventListener("click", () => {
      forecast_list_DOM_container.dataset.hour = forecast_index;
      [...forecast_list_DOM_container.getElementsByClassName("forecast-item")].forEach(forecast_item =>
        forecast_item.classList.remove("selected")
      );
      const selected_hour = document.querySelector(`.forecast-item[data-index="${forecast_index}"]`);
      if (selected_hour) selected_hour.classList.add("selected");
    });
  }
  li.appendChild(button);
  const temperature = document.createElement("p");
  temperature.classList.add("forecast-temperature");
  temperature.textContent = `${forecast.temperature}°C`;
  const icon = document.createElement("img");
  icon.src = "#";
  Icon.get(forecast.weather_code)
    .then(icon_URL => {
      icon.src = icon_URL.default;
    })
    .catch(error => {
      console.error(error);
    });
  icon.alt = "";
  icon.classList.add("forecast-icon");
  icon.draggable = false;
  button.appendChild(temperature);
  button.appendChild(icon);
  if (isDaily) {
    const weekday = document.createElement("p");
    weekday.classList.add("forecast-day");
    weekday.textContent = format.weekday(forecast.date);
    button.appendChild(weekday);
  } else {
    const time = document.createElement("p");
    time.classList.add("forecast-time");
    time.textContent = format.time(forecast.time, true);
    button.appendChild(time);
  }
  return li;
}

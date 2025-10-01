import "../styles/style.css";
import Weather from "./weather-api.js";

const searchButton = document.getElementsByClassName("search-button")[0];
const clearSearchButton = document.getElementsByClassName("clear-search-button")[0];
const searchInput = document.getElementById("search");
const searchSuggestions = document.getElementById("search-suggestions");

const DIRECTIONS = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"];

let weather_data;

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

(() => {
  const local_weather_data = JSON.parse(localStorage.getItem("weather_data"));
  if (local_weather_data) {
    weather_data = local_weather_data;
    displayWeatherData(Weather.format(weather_data));
  }

  searchInput.addEventListener("input", () => {
    const value = searchInput.value.trim();
    if (value.length < 3) return;
    searchSuggestions.innerHTML = "";
    Weather.geocode(value).then(geocode => {
      if (!geocode) return;
      geocode.forEach(location => {
        const option = document.createElement("option");
        option.value = location.name;
        option.textContent = location.name;
        searchSuggestions.appendChild(option);
      });
    });
  });

  searchButton.addEventListener("click", () => {
    const value = searchInput.value.trim();
    if (value && value.length > 0) {
      Weather.get(value)
        .then(response => {
          localStorage.setItem("weather_data", JSON.stringify(response));
          weather_data = response;
          searchInput.value = "";
          displayWeatherData(Weather.format(response));
        })
        .catch(error => {
          console.error(error);
        });
    }
  });

  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
  });
})();

function getDirectionText(degrees) {
  const index = Math.round(degrees / 45) % 8;

  return DIRECTIONS[index];
}

function displayWeatherData(data, dayIndex = -1, hourIndex = -1) {
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

  // Display current weather data
  if (dayIndex === -1) {
    setTextContent(current_config);
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

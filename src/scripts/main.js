import "../styles/style.css";
import Weather from "./weather-api.js";
import Icon from "./weather-icons.js";

const container = document.getElementById("container");
const search_button = document.getElementsByClassName("search-button")[0];
const clear_search_button = document.getElementsByClassName("clear-search-button")[0];
const search_input = document.getElementById("search");
const search_suggestions = document.getElementById("search-suggestions");
const unit_conversion_button = document.getElementsByClassName("unit-conversion-button")[0];
const unit_conversion_panel_container = document.getElementsByClassName("unit-conversion-panel-container")[0];
const unit_conversion_panel_done_button = document.getElementsByClassName("unit-conversion-panel-done-button")[0];
const unit_toggle_containers = [...document.querySelectorAll("[data-unit-toggle]")];
const selected_weather_icon = [...document.getElementsByClassName("selected-weather-icon")];
const mobile_details_panel_container = document.getElementsByClassName("mobile-details-panel-container")[0];
const mobile_details_button = document.getElementsByClassName("mobile-details-button")[0];
const mobile_details_dismiss_button = document.getElementsByClassName("mobile-details-dismiss-button")[0];
const daily_button = document.getElementById("daily-button");
const hourly_button = document.getElementById("hourly-button");
const forecast_list = document.getElementsByClassName("forecast-list")[0];
const loading_panel_container = document.getElementsByClassName("loading-panel-container")[0];
const loading_text_location_name = document.getElementsByClassName("loading-text-location-name")[0];
const notification_panel_container = document.getElementsByClassName("notification-panel-container")[0];
const notification_text_location_name = document.getElementsByClassName("notification-text-location-name")[0];
const notification_dismiss_button = document.getElementsByClassName("notification-dismiss-button")[0];
const background_overlay = document.getElementsByClassName("background-overlay")[0];

const DIRECTIONS = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"];
const DEBOUNCE_DELAY = 250;
const BLINKING_TIME = 250;
let timeout_id;
let weather_data;

// Data formatting module
const format = {
  weekday: date => {
    const date_obj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date_obj);
  },
  time: (date, hour12 = false, include_seconds = false) => {
    const date_obj = typeof date === "string" ? new Date(date) : date;
    const options = {
      hour: "numeric",
      minute: "2-digit",
      hour12: hour12,
    };

    if (include_seconds) {
      options.second = "2-digit";
    }

    return new Intl.DateTimeFormat("en-US", options).format(date_obj);
  },
  date: date => {
    const date_obj = typeof date === "string" ? new Date(date) : date;
    return date_obj.toISOString().split("T")[0];
  },
  custom: (date, options = {}, locale = "en-US") => {
    const date_obj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(date_obj);
  },
};

function show_suggestions(location_name) {
  Weather.geocode(location_name).then(geocode => {
    if (!geocode) return;
    search_suggestions.innerHTML = "";
    geocode.forEach(location => {
      const option = document.createElement("option");
      option.value = location.name;
      option.textContent = location.name;
      search_suggestions.appendChild(option);
    });
  });
}

function update_screen_label() {
  if (window.innerWidth >= 481 && window.innerWidth <= 768) {
    if (container.classList.contains("tablet")) return;
    container.classList.add("tablet");
    container.classList.remove("desktop");
    container.classList.remove("mobile");
    container.dataset.device = "tablet";
  } else if (window.innerWidth >= 769) {
    if (container.classList.contains("desktop")) return;
    container.classList.add("desktop");
    container.classList.remove("tablet");
    container.classList.remove("mobile");
    container.dataset.device = "desktop";
  } else {
    if (container.classList.contains("mobile")) return;
    container.classList.add("mobile");
    container.classList.remove("desktop");
    container.classList.remove("tablet");
    container.dataset.device = "mobile";
  }
}

function get_temperature_toggle(zero_index = false) {
  const datasets = Object.entries(unit_conversion_panel_container.dataset);
  const obj = {};
  if (zero_index) {
    datasets.map(dataset => {
      const label = dataset[0].slice(8, -6).toLowerCase();
      let index = parseInt(dataset[1]);
      obj[label] = --index;
    });
  } else {
    datasets.map(dataset => {
      const label = dataset[0].slice(8, -6).toLowerCase();
      const index = parseInt(dataset[1]);
      obj[label] = index;
    });
  }
  return obj;
}

const toggle_unit = {
  temperature: index => {
    unit_conversion_panel_container.dataset.selectedTemperatureToggle = index + 1;
    const temperatures = [
      ...document.querySelectorAll("[data-temperature]"),
      document.querySelector("[data-min-temperature]"),
      document.querySelector("[data-max-temperature]"),
    ];
    temperatures.map(temperature => {
      const values = [parseFloat(temperature.dataset.toggleOne), parseFloat(temperature.dataset.toggleTwo)];
      const units = ["°C", "°F"];
      temperature.textContent = `${values[index]}${units[index]}`;
    });
  },
  time: index => {
    unit_conversion_panel_container.dataset.selectedTimeToggle = index + 1;
    const times = [
      ...document.querySelectorAll("[data-time]"),
      ...document.querySelectorAll("[data-sunrise]"),
      ...document.querySelectorAll("[data-sunset]"),
    ];
    times.map(time => {
      const values = [time.dataset.toggleOne, time.dataset.toggleTwo];
      time.textContent = values[index];
    });
  },
  speed: index => {
    unit_conversion_panel_container.dataset.selectedSpeedToggle = index + 1;
    const speeds = [...document.querySelectorAll("[data-wind-speed]")];
    const units = ["km/h", "mph"];
    speeds.map(speed => {
      const values = [parseFloat(speed.dataset.toggleOne), parseFloat(speed.dataset.toggleTwo)];
      speed.textContent = `${values[index]} ${units[index]}`;
    });
  },
  direction: index => {
    unit_conversion_panel_container.dataset.selectedDirectionToggle = index + 1;
    const directions = [...document.querySelectorAll("[data-wind-direction]")];
    const units = ["", "°"];
    directions.map(direction => {
      const values = [direction.dataset.toggleOne, parseFloat(direction.dataset.toggleTwo)];
      direction.textContent = `${values[index]}${units[index]}`;
    });
  },
};
function manage_panels(panel = null, show = true, show_overlay = true) {
  if (panel) {
    if (Array.isArray(panel)) {
      panel.forEach(panel => {
        if (show) {
          switch (panel) {
            case "mobile_details":
              mobile_details_panel_container.classList.add("visible");
              break;
            case "unit_conversion":
              unit_conversion_panel_container.classList.add("visible");
              break;
            case "loading":
              loading_panel_container.classList.add("visible");
              break;
            case "notification":
              notification_panel_container.classList.add("visible");
              break;
          }
        } else {
          switch (panel) {
            case "mobile_details":
              mobile_details_panel_container.classList.remove("visible");
              break;
            case "unit_conversion":
              unit_conversion_panel_container.classList.remove("visible");
              break;
            case "loading":
              loading_panel_container.classList.remove("visible");
              break;
            case "notification":
              notification_panel_container.classList.remove("visible");
              break;
          }
        }
      });
    } else {
      if (show) {
        switch (panel) {
          case "mobile_details":
            mobile_details_panel_container.classList.add("visible");
            break;
          case "unit_conversion":
            unit_conversion_panel_container.classList.add("visible");
            break;
          case "loading":
            loading_panel_container.classList.add("visible");
            break;
          case "notification":
            notification_panel_container.classList.add("visible");
            break;
        }
      } else {
        switch (panel) {
          case "mobile_details":
            mobile_details_panel_container.classList.remove("visible");
            break;
          case "unit_conversion":
            unit_conversion_panel_container.classList.remove("visible");
            break;
          case "loading":
            loading_panel_container.classList.remove("visible");
            break;
          case "notification":
            notification_panel_container.classList.remove("visible");
            break;
        }
      }
    }
  }
  if (show_overlay) background_overlay.classList.add("visible");
  else background_overlay.classList.remove("visible");
}

function capitalize(string) {
  return string
    .split(" ")
    .map(capitalized_string => capitalized_string[0].toUpperCase() + capitalized_string.slice(1).toLowerCase())
    .join(" ");
}

// Initialization IIFE
(() => {
  // Add keyboard support
  window.addEventListener("keydown", e => {
    if (!e.key) return;
    const pressed_key = e.key.toLowerCase();
    if (pressed_key === "enter") search_button.click();
  });
  window.addEventListener("resize", update_screen_label);
  update_screen_label();

  // Fix elements' animation on initial load
  window.onload = () => {
    container.removeAttribute("style");
  };

  // Display locally cached weather data if available
  const local_weather_data = JSON.parse(localStorage.getItem("weather_data"));
  if (local_weather_data) {
    weather_data = local_weather_data;
    displayWeatherData(Weather.format(weather_data), forecast_list, true);
  }

  unit_conversion_button.addEventListener("click", () => {
    manage_panels("unit_conversion");
  });
  unit_conversion_panel_done_button.addEventListener("click", () => {
    manage_panels("unit_conversion", false, false);
  });
  unit_toggle_containers.forEach(unit_toggle_container => {
    const siblings = [...unit_toggle_container.children];
    const toggle_label = unit_toggle_container.dataset.unitToggle;
    siblings.forEach((toggle, index) => {
      toggle.addEventListener("click", () => {
        if (toggle.classList.contains("selected")) return;
        siblings.map(sibling => sibling.classList.remove("selected"));
        toggle.classList.add("selected");
        toggle_unit[toggle_label](index);
      });
    });
  });

  notification_dismiss_button.addEventListener("click", () => {
    background_overlay.classList.remove("visible");
    notification_panel_container.classList.remove("visible");
  });

  // Show suggestions after typing
  search_input.addEventListener("input", () => {
    const value = search_input.value.trim();
    if (value.length < 3) return;
    // Debounce the API call to avoid making a request for every keystroke
    clearTimeout(timeout_id);
    timeout_id = setTimeout(() => {
      show_suggestions(value);
    }, DEBOUNCE_DELAY);
  });

  search_button.addEventListener("click", () => {
    const value = search_input.value.trim();
    if (value && value.length > 0) {
      loading_text_location_name.textContent = capitalize(value);
      manage_panels("loading");
      Weather.get(value)
        .then(response => {
          // Cache succesfully fetched weather data
          localStorage.setItem("weather_data", JSON.stringify(response));
          weather_data = response;
          search_input.value = "";
          forecast_list.dataset.day = 0;
          forecast_list.dataset.hour = -1;
          forecast_list.dataset.forecastList = -1;
          forecast_list.dataset.selectedForecastType = "current";
          displayWeatherData(Weather.format(response), forecast_list, true);
          hourly_button.classList.remove("selected");
          daily_button.classList.add("selected");
          search_input.blur();
          setTimeout(() => manage_panels("loading", false, false), 500);
        })
        .catch(error => {
          console.error(error);
          setTimeout(() => {
            manage_panels("loading", false, true);
            notification_text_location_name.textContent = capitalize(value);
            manage_panels("notification", true, true);
          }, 500);
        });
    }
  });
  clear_search_button.addEventListener("click", () => (search_input.value = ""));

  mobile_details_button.addEventListener("click", () => {
    manage_panels("mobile_details", true, false);
  });
  mobile_details_dismiss_button.addEventListener("click", () => {
    manage_panels("mobile_details", false, false);
  });

  daily_button.addEventListener("click", () => {
    if (daily_button.classList.contains("selected")) return;
    [...forecast_list.children].map(child => child.classList.add("blinking"));
    setTimeout(() => {
      hourly_button.classList.remove("selected");
      daily_button.classList.add("selected");
      forecast_list.dataset.forecastList = 0;
      display_weather_forecasts(Weather.format(weather_data), forecast_list);
      const day_index = parseInt(forecast_list.dataset.day);
      const selected_day = document.querySelector(`.forecast-item[data-index="${day_index}"]`);
      if (selected_day) selected_day.scrollIntoView({ behavior: "smooth", inline: "center" });
      [...forecast_list.children].map(child => child.classList.remove("blinking"));
    }, BLINKING_TIME);
  });
  hourly_button.addEventListener("click", () => {
    if (hourly_button.classList.contains("selected")) return;
    [...forecast_list.children].map(child => child.classList.add("blinking"));
    setTimeout(() => {
      daily_button.classList.remove("selected");
      hourly_button.classList.add("selected");
      forecast_list.dataset.forecastList = 1;
      display_weather_forecasts(Weather.format(weather_data), forecast_list, false);
      const hour_index = parseInt(forecast_list.dataset.hour);
      const selected_hour = document.querySelector(`.forecast-item[data-index="${hour_index}"]`);
      if (selected_hour) selected_hour.scrollIntoView({ behavior: "smooth", inline: "center" });
      else {
        const date = new Date();
        const current_hour = document.querySelector(`.forecast-item[data-index="${date.getHours()}"]`);
        current_hour.scrollIntoView({ behavior: "smooth", inline: "center" });
      }
      [...forecast_list.children].map(child => child.classList.remove("blinking"));
    }, BLINKING_TIME);
  });
})();

function get_direction_text(degrees) {
  const index = Math.round(degrees / 45) % 8;

  return DIRECTIONS[index];
}

function animate_blink(element, callback = null) {
  element.classList.add("blinking");
  setTimeout(() => {
    if (callback) callback(element);
    element.classList.remove("blinking");
  }, BLINKING_TIME);
}

function displayWeatherData(data, forecast_list_DOM_container, display_forecast_list = false) {
  const selected_list = parseInt(forecast_list_DOM_container.dataset.forecastList);
  const day_index = parseInt(forecast_list_DOM_container.dataset.day);
  const hour_index = parseInt(forecast_list_DOM_container.dataset.hour);
  const days = [...document.querySelectorAll("[data-day]:not(.forecast-list)")];
  const dates = [...document.querySelectorAll("[data-date]")];
  const times = [...document.querySelectorAll("[data-time]:not(.forecast-time)")];
  const locations = [...document.querySelectorAll("[data-location]")];
  const min_temperature = document.querySelector("[data-min-temperature]");
  const max_temperature = document.querySelector("[data-max-temperature]");
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
  let forecast;
  let forecast_units;
  let is_current_forecast_time_unique = is_current_forecast_unique(data.daily[0].hourly, data.current);
  if (selected_list === -1) {
    if (is_current_forecast_time_unique === -1) {
      forecast = data.daily[day_index];
      forecast_units = data.daily_units;
      forecast_list_DOM_container.dataset.forecastList = 0;
    } else {
      forecast = data.current;
      forecast_units = data.current_units;
    }
  } else if (selected_list === 0) {
    forecast = data.daily[day_index];
    forecast_units = data.daily_units;
  } else {
    if (hour_index === -1) {
      if (is_current_forecast_time_unique === -1) {
        fallback_hour_index = parseInt(new Date().toLocaleTimeString().split(":")[0]);
        forecast = data.daily[day_index].hourly[fallback_hour_index];
        forecast_units = data.hourly_units;
      } else {
        forecast = data.current;
        forecast_units = data.current_units;
      }
    } else {
      forecast = data.daily[day_index].hourly[hour_index];
      forecast_units = data.hourly_units;
    }
  }

  if (forecast.time) {
    const forecast_date = new Date(forecast.time);
    const forecast_hours = forecast_date.getHours();
    const is_night = forecast_hours >= 20 || forecast_hours <= 5;
    if (is_night)
      Icon.get(forecast.weather_code, false).then(icon_URL => {
        selected_weather_icon.forEach(icon => {
          if (icon.src === icon_URL.default) return;
          animate_blink(icon, () => (icon.src = icon_URL.default));
        });
      });
    else
      Icon.get(forecast.weather_code).then(icon_URL => {
        selected_weather_icon.forEach(icon => {
          if (icon.src === icon_URL.default) return;
          animate_blink(icon, () => (icon.src = icon_URL.default));
        });
      });
  } else
    Icon.get(forecast.weather_code).then(icon_URL => {
      selected_weather_icon.forEach(icon => {
        if (icon.src === icon_URL.default) return;
        animate_blink(icon, () => (icon.src = icon_URL.default));
      });
    });

  const elements = [
    [...days],
    [...dates],
    [...locations],
    [...weather_condition],
    [...humidity],
    [...precipitation],
    [...pressure],
    [...uv_index],
  ];
  const element_texts = [
    format.weekday(forecast.date),
    format.date(forecast.date),
    data.location,
    forecast.condition,
    `${forecast.humidity}%`,
    `${forecast.precipitation}%`,
    `${forecast.pressure} hPa`,
    forecast.uv_index,
  ];
  set_text_content(elements, element_texts);
  const selected_toggle = get_temperature_toggle(true);
  const temperatures = [temperature, min_temperature, max_temperature, feelslike_temperature];
  const temperature_values = [
    [forecast.temperature, parseFloat((forecast.temperature * 9) / 5 + 32).toFixed(1)],
    [forecast.temperature_min, parseFloat((forecast.temperature_min * 9) / 5 + 32).toFixed(1)],
    [forecast.temperature_max, parseFloat((forecast.temperature_max * 9) / 5 + 32).toFixed(1)],
    [forecast.temperature_feelslike, parseFloat((forecast.temperature_feelslike * 9) / 5 + 32).toFixed(1)],
  ];
  set_temperature_data(temperatures, temperature_values, selected_toggle.temperature);
  const time_elements = [[...sunrise], [...sunset]];
  const time_element_values = [
    [format.time(forecast.sunrise, true), format.time(forecast.sunrise)],
    [format.time(forecast.sunset, true), format.time(forecast.sunset)],
  ];
  set_time_data(time_elements, time_element_values, selected_toggle.time);
  if (forecast.time) {
    [...document.querySelectorAll("[data-visible-time]")].map(time_container => time_container.classList.add("visible-time"));
    set_time_data([[...times]], [[format.time(forecast.time, true), format.time(forecast.time)]], selected_toggle.time);
  }
  set_speed_data(
    [...wind_speed],
    [forecast.wind_speed, parseFloat(forecast.wind_speed / 1.609).toFixed(1)],
    selected_toggle.speed
  );
  set_direction_data(
    [...wind_direction],
    [get_direction_text(forecast.wind_direction), forecast.wind_direction],
    selected_toggle.direction
  );

  function set_text_content(array_of_elements, array_of_text) {
    array_of_elements.forEach((element, index) => {
      element.forEach(element => {
        if (element.textContent === array_of_text[index]) return;
        animate_blink(element, () => (element.textContent = array_of_text[index]));
      });
    });
  }
  function set_temperature_data(elements, array_of_values, value_index) {
    elements.forEach((element, index) => {
      const parent_element = element.parentElement;
      const value = array_of_values[index];
      const new_text_content = `${value[value_index]}${["°C", "°F"][value_index]}`;
      if (element.textContent === new_text_content) return;
      if (
        parent_element.classList.contains("min-max-temperature") ||
        parent_element.classList.contains("feelslike-temperature")
      ) {
        animate_blink(parent_element, () => (element.textContent = new_text_content));
      } else animate_blink(element, () => (element.textContent = new_text_content));

      element.dataset.toggleOne = value[0];
      element.dataset.toggleTwo = value[1];
    });
  }
  function set_time_data(array_of_elements, array_of_values, value_index) {
    array_of_elements.forEach((elements, index) => {
      elements.forEach(element => {
        const value = array_of_values[index];
        if (element.textContent === value) return;
        animate_blink(element, () => (element.textContent = value[value_index]));
        element.dataset.toggleOne = value[0];
        element.dataset.toggleTwo = value[1];
      });
    });
  }
  function set_speed_data(elements, array_of_values, value_index) {
    elements.forEach(element => {
      const value = array_of_values;
      const new_text_content = `${value[value_index]} ${["km/h", "mph"][value_index]}`;
      if (element.textContent === new_text_content) return;
      animate_blink(element, () => (element.textContent = new_text_content));
      element.dataset.toggleOne = value[0];
      element.dataset.toggleTwo = value[1];
    });
  }
  function set_direction_data(elements, array_of_values, value_index) {
    elements.forEach(element => {
      const value = array_of_values;
      const new_text_content = `${value[value_index]} ${["", "°"][value_index]}`;
      if (element.textContent === new_text_content) return;
      animate_blink(element, () => (element.textContent = new_text_content));
      element.dataset.toggleOne = value[0];
      element.dataset.toggleTwo = value[1];
    });
  }
  if (display_forecast_list) display_weather_forecasts(data, forecast_list_DOM_container);
}

// This function displays daily or hourly forecast list
function display_weather_forecasts(data, forecast_list_DOM_container, isDaily = true) {
  forecast_list_DOM_container.innerHTML = "";

  // Display daily forecast
  if (isDaily) {
    const forecast_list = data.daily;
    forecast_list.forEach((forecast, forecast_index) =>
      forecast_list_DOM_container.appendChild(create_DOM_forecast(forecast, forecast_index, forecast_list_DOM_container))
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
      forecast_list_DOM_container.appendChild(create_DOM_forecast(forecast, forecast_index, forecast_list_DOM_container, false))
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
    if (current_index !== -1 && day_index === 0) {
      const inserting_index_element = [...forecast_list_DOM_container.children][current_index];
      const current_forecast = create_DOM_forecast(data.current, -1, forecast_list_DOM_container, false);
      inserting_index_element.after(current_forecast);
    }

    // Select current selected forecast
    const hour = parseInt(forecast_list_DOM_container.dataset.hour);
    let selected_hour;
    if (hour !== -2) {
      if (hour === -1) selected_hour = document.querySelector(`.forecast-item[data-index="-1"]`);
      else {
        selected_hour = document.querySelector(`.forecast-item[data-index="${hour}"]`);
      }
      if (!selected_hour) {
        const date = new Date();
        selected_hour = document.querySelector(`.forecast-item[data-index="${date.getHours()}"]`);
      }
      if (selected_hour) selected_hour.classList.add("selected");
    }
  }
}

function create_DOM_forecast(forecast, forecast_index, forecast_list_DOM_container, isDaily = true) {
  const selected_toggle = get_temperature_toggle();
  const li = document.createElement("li");
  li.classList.add("blinking");
  setTimeout(() => li.classList.remove("blinking"), BLINKING_TIME);
  const button = document.createElement("button");
  button.classList.add("forecast-item");
  button.dataset.index = forecast_index;
  if (isDaily) {
    button.dataset.daily = "";
    button.addEventListener("click", () => {
      if (forecast_list_DOM_container.dataset.selectedForecastType === "daily" && button.classList.contains("selected")) return;
      forecast_list_DOM_container.dataset.selectedForecastType = "daily";
      forecast_list_DOM_container.dataset.forecastList = 0;
      forecast_list_DOM_container.dataset.day = forecast_index;
      forecast_list_DOM_container.dataset.hour = -2;
      [...forecast_list_DOM_container.getElementsByClassName("forecast-item")].forEach(forecast_item =>
        forecast_item.classList.remove("selected")
      );
      const selected_day = document.querySelector(`.forecast-item[data-index="${forecast_index}"]`);
      if (selected_day) selected_day.classList.add("selected");
      displayWeatherData(Weather.format(weather_data), forecast_list_DOM_container);
      [...document.querySelectorAll("[data-visible-time]")].map(time_container =>
        time_container.classList.remove("visible-time")
      );
    });
  } else {
    button.dataset.hourly = "";
    button.addEventListener("click", () => {
      if (forecast_list_DOM_container.dataset.selectedForecastType === "hourly" && button.classList.contains("selected")) return;
      forecast_list_DOM_container.dataset.selectedForecastType = "hourly";
      forecast_list_DOM_container.dataset.forecastList = 1;
      forecast_list_DOM_container.dataset.hour = forecast_index;
      [...forecast_list_DOM_container.getElementsByClassName("forecast-item")].forEach(forecast_item =>
        forecast_item.classList.remove("selected")
      );
      const selected_hour = document.querySelector(`.forecast-item[data-index="${forecast_index}"]`);
      if (selected_hour) selected_hour.classList.add("selected");
      displayWeatherData(Weather.format(weather_data), forecast_list_DOM_container);
      [...document.querySelectorAll("[data-visible-time]")].map(time_container => time_container.classList.add("visible-time"));
    });
  }
  const temperature = document.createElement("p");
  const celcius = forecast.temperature;
  const fahrenheit = parseFloat((forecast.temperature * 9) / 5 + 32).toFixed(1);
  temperature.classList.add("forecast-temperature");
  if (selected_toggle.temperature === 1) temperature.textContent = `${celcius}°C`;
  else temperature.textContent = `${fahrenheit}°F`;
  temperature.dataset.temperature = "";
  temperature.dataset.toggleOne = celcius;
  temperature.dataset.toggleTwo = fahrenheit;
  const icon = document.createElement("img");
  icon.src = "#";

  if (forecast.time) {
    const forecast_date = new Date(forecast.time);
    const forecast_hours = forecast_date.getHours();
    const is_night = forecast_hours >= 20 || forecast_hours <= 5;
    if (is_night) Icon.get(forecast.weather_code, false).then(icon_URL => (icon.src = icon_URL.default));
    else Icon.get(forecast.weather_code).then(icon_URL => (icon.src = icon_URL.default));
  } else Icon.get(forecast.weather_code).then(icon_URL => (icon.src = icon_URL.default));

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
    const twelve_hour = format.time(forecast.time, true);
    const twenty_four_hour = format.time(forecast.time);
    if (selected_toggle.time === 1) time.textContent = twelve_hour;
    else time.textContent = twenty_four_hour;
    time.dataset.time = "";
    time.dataset.toggleOne = twelve_hour;
    time.dataset.toggleTwo = twenty_four_hour;
    button.appendChild(time);
  }
  li.appendChild(button);
  return li;
}

function is_current_forecast_unique(forecast_list, current_forecast) {
  const [c_hour, c_minute] = current_forecast.time
    .split("T")[1]
    .split(":")
    .map(time => parseInt(time));
  const closest_time_index = forecast_list.findIndex(forecast => {
    const [hour, minute] = forecast.time
      .split("T")[1]
      .split(":")
      .map(time => parseInt(time));
    return hour === c_hour && minute !== c_minute;
  });
  if (closest_time_index === -1) return false;
  return closest_time_index;
}

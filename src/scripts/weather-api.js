const WEATHER_CODES = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing Rime Fog",
  51: "Light Drizzle",
  53: "Moderate Drizzle",
  55: "Dense Drizzle",
  56: "Light Freezing Drizzle",
  57: "Dense Freezing Drizzle",
  61: "Slight Rain",
  63: "Moderate Rain",
  65: "Heavy Rain",
  66: "Light Freezing Rain",
  67: "Heavy Freezing Rain",
  71: "Slight Snowfall",
  73: "Moderate Snowfall",
  75: "Heavy Snowfall",
  77: "Snow Grains",
  80: "Slight Rain Showers",
  81: "Moderate Rain Showers",
  82: "Violent Rain Showers",
  85: "Slight Snow Showers",
  86: "Heavy Snow Showers",
  95: "Slight or Moderate Thunderstorm",
  96: "Thunderstorm with Slight Hail",
  99: "Thunderstorm with Heavy Hail",
};

// Get necessary data from location name
async function getLocationData(locationName) {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${locationName}&count=10&language=en&format=json`
  );
  const json = response.json();
  return json;
}

// Format the fetched location data
function formatLocationData(data) {
  const suggestions = data.results;
  if (!suggestions) return;
  const formattedData = [];
  const formattedDataNames = new Set();
  for (const property of suggestions) {
    if (formattedDataNames.size >= 10) break;
    if (!formattedDataNames.has(property.name)) {
      formattedDataNames.add(property.name);
      formattedData.push({
        name: property.name,
        latitude: property.latitude,
        longitude: property.longitude,
        timezone: property.timezone,
      });
    }
  }
  return formattedData;
}

async function getGeocode(locationName) {
  const locationData = await getLocationData(locationName.trim());
  const formattedLocationData = formatLocationData(locationData);
  return formattedLocationData;
}

// API call URL:
// `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_min,temperature_2m_max,temperature_2m_mean,apparent_temperature_mean,relative_humidity_2m_mean,surface_pressure_mean,wind_speed_10m_mean,sunrise,sunset,uv_index_max,wind_direction_10m_dominant,precipitation_probability_mean,weather_code&hourly=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,surface_pressure,wind_speed_10m,precipitation_probability,uv_index,wind_direction_10m&current=relative_humidity_2m,temperature_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,weather_code,surface_pressure&timezone=${timezone}`
// Get weather data using location name
async function getWeatherData(locationName) {
  const locationData = await getGeocode(locationName);
  if (!locationData) throw new Error("Location not found!");
  const { latitude, longitude } = locationData[0];
  const timezone = locationData[0].timezone.replace("/", "%2F");
  const weatherResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_min,temperature_2m_max,temperature_2m_mean,apparent_temperature_mean,relative_humidity_2m_mean,surface_pressure_mean,wind_speed_10m_mean,sunrise,sunset,uv_index_max,wind_direction_10m_dominant,precipitation_probability_mean,weather_code&hourly=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,surface_pressure,wind_speed_10m,precipitation_probability,uv_index,wind_direction_10m&current=relative_humidity_2m,temperature_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,weather_code,surface_pressure&timezone=${timezone}`
  );
  const weatherResponseJson = await weatherResponse.json();
  weatherResponseJson.location = locationData[0].name;
  return weatherResponseJson;
}

function formatWeatherData(data) {
  const formattedData = { location: data.location, current: {}, current_units: {}, daily: [], daily_units: {}, hourly_units: {} };
  for (let i = 0; i < data.daily.weather_code.length; i++) formattedData.daily.push({ hourly: [] });
  for (let i = 0; i < formattedData.daily.length; i++) {
    for (let j = 0; j < 24; j++) {
      formattedData.daily[i].hourly.push({});
    }
  }

  const keyMap = {
    temperature_2m: "temperature",
    temperature_2m_mean: "temperature",
    temperature_2m_min: "temperature_min",
    temperature_2m_max: "temperature_max",
    apparent_temperature_mean: "temperature_feelslike",
    apparent_temperature: "temperature_feelslike",
    relative_humidity_2m_mean: "humidity",
    relative_humidity_2m: "humidity",
    precipitation_probability_mean: "precipitation",
    precipitation_probability: "precipitation",
    precipitation: "precipitation",
    surface_pressure_mean: "pressure",
    surface_pressure: "pressure",
    uv_index_max: "uv_index",
    uv_index: "uv_index",
    wind_speed_10m_mean: "wind_speed",
    wind_speed_10m: "wind_speed",
    wind_direction_10m_dominant: "wind_direction",
    wind_direction_10m: "wind_direction",
    sunrise: "sunrise",
    sunset: "sunset",
    time: "time",
    weather_code: "condition",
  };

  // Format daily weather data
  for (const key in data.daily) {
    if (keyMap[key]) {
      if (keyMap[key] === "condition") {
        for (let i = 0; i < data.daily[key].length; i++) {
          formattedData.daily[i][keyMap[key]] = WEATHER_CODES[data.daily[key][i]];
        }
      } else if (keyMap[key] === "time") {
        for (let i = 0; i < data.daily[key].length; i++) {
          formattedData.daily[i]["date"] = data.daily[key][i];
        }
      } else {
        for (let i = 0; i < data.daily[key].length; i++) {
          formattedData.daily[i][keyMap[key]] = data.daily[key][i];
        }
      }
    }
  }

  // Format hourly weather data
  for (const key in data.hourly) {
    if (keyMap[key]) {
      if (keyMap[key] === "condition") {
        for (let i = 0; i < formattedData.daily.length; i++) {
          const weather_codes = data.hourly[key].slice(i * 24, i * 24 + 24);
          for (let j = 0; j < formattedData.daily[i].hourly.length; j++) {
            formattedData.daily[i].hourly[j][keyMap[key]] = WEATHER_CODES[weather_codes[j]];
          }
        }
      } else {
        for (let i = 0; i < formattedData.daily.length; i++) {
          const hours = data.hourly[key].slice(i * 24, i * 24 + 24);
          for (let j = 0; j < formattedData.daily[i].hourly.length; j++) {
            formattedData.daily[i].hourly[j][keyMap[key]] = hours[j];
          }
        }
      }
    }
  }
  // Copy missing properties from daily weather data
  const hourly_keys = Object.keys(formattedData.daily[0].hourly[0]);
  for (const key in formattedData.daily[0]) {
    if (!hourly_keys.includes(key) && key !== "hourly") {
      for (let i = 0; i < formattedData.daily.length; i++) {
        for (let j = 0; j < formattedData.daily[i].hourly.length; j++) {
          formattedData.daily[i].hourly[j][key] = formattedData.daily[i][key];
        }
      }
    }
  }

  // Format current weather data
  for (const key in data.current) {
    if (keyMap[key] === "precipitation") {
      formattedData.current[keyMap[key]] = formattedData.daily[0][keyMap[key]];
    } else if (keyMap[key] === "condition") {
      formattedData.current[keyMap[key]] = WEATHER_CODES[data.current[key]];
    } else if (keyMap[key]) {
      formattedData.current[keyMap[key]] = data.current[key];
    }
  }

  // Format daily weather data units
  for (const key in data.daily_units) {
    if (keyMap[key]) {
      if (keyMap[key] === "condition") {
        formattedData.daily_units[keyMap[key]] = "";
      } else if (keyMap[key] === "time") {
        formattedData.daily_units["date"] = data.daily_units[key];
      } else {
        formattedData.daily_units[keyMap[key]] = data.daily_units[key];
      }
    }
  }

  // Format current weather data units
  for (const key in data.current_units) {
    if (keyMap[key] === "precipitation") {
      formattedData.current_units[keyMap[key]] = formattedData.daily_units[keyMap[key]];
    } else if (keyMap[key] === "condition") {
      formattedData.current_units[keyMap[key]] = "";
    } else if (keyMap[key]) {
      formattedData.current_units[keyMap[key]] = data.current_units[key];
    }
  }

  // Format hourly weather data units
  for (const key in data.hourly_units) {
    if (keyMap[key] === "condition") {
      formattedData.hourly_units[keyMap[key]] = "";
    } else if (keyMap[key]) {
      formattedData.hourly_units[keyMap[key]] = data.hourly_units[key];
    }
  }
  // Copy missing properties from daily weather data
  const hourly_units_keys = Object.keys(formattedData.hourly_units);
  for (const key in formattedData.daily_units) {
    if (!hourly_units_keys.includes(key)) {
      formattedData.hourly_units[key] = formattedData.daily_units[key];
    }
  }
  return formattedData;
}

export default {
  geocode: getGeocode,
  get: getWeatherData,
  format: formatWeatherData,
};

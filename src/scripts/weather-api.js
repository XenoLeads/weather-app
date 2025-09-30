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
  return weatherResponseJson;
}

export default {
  geocode: getGeocode,
  get: getWeatherData,
};

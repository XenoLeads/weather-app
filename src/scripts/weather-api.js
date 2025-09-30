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

export default {
  geocode: getGeocode,
};

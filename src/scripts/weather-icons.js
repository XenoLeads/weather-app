const ICON_KEYMAP = {
  0: "clear",
  1: "clear",
  2: "partly-cloudy",
  3: "overcast",
  45: "fog",
  48: "snow-fog",
  51: "light-drizzle",
  53: "moderate-drizzle",
  55: "dense-drizzle",
  56: "light-sleet",
  57: "dense-sleet",
  61: "slight-rain",
  63: "moderate-rain",
  65: "heavy-rain",
  66: "light-sleet",
  67: "dense-sleet",
  71: "light-snow",
  73: "moderate-snow",
  75: "heavy-snow",
  77: "snow",
  80: "slight-rain",
  81: "moderate-rain",
  82: "heavy-rain",
  85: "light-snow",
  86: "heavy-snow",
  95: "slight-thunderstorm",
  96: "slight-thunderstorm-rain",
  99: "heavy-thunderstorm-rain",
};

export default {
  get: (weather_code, isDay = true) => {
    let icon_name = ICON_KEYMAP[weather_code];
    if (!icon_name) icon_name = ICON_KEYMAP[2];
    if (isDay) return import(`../assets/icons/weather/day/${icon_name}.svg`);
    else return import(`../assets/icons/weather/night/${icon_name}.svg`);
  },
};

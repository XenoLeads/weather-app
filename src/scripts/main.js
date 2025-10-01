import "../styles/style.css";
import Weather from "./weather-api.js";

const searchButton = document.getElementsByClassName("search-button")[0];
const clearSearchButton = document.getElementsByClassName("clear-search-button")[0];
const searchInput = document.getElementById("search");
const searchSuggestions = document.getElementById("search-suggestions");

let weather_data;

function init() {
  const local_weather_data = JSON.parse(localStorage.getItem("weather_data"));
  if (local_weather_data) weather_data = local_weather_data;

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
        })
        .catch(error => {
          console.error(error);
        });
    }
  });

  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
  });
}

init();

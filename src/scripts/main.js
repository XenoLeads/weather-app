import "../styles/style.css";
import Weather from "./weather-api.js";

const searchInput = document.getElementById("search");
const searchSuggestions = document.getElementById("search-suggestions");

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

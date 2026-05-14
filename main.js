// dom
const cityInput = document.getElementById("cityInput");
const suggestionsBox = document.getElementById("suggestions");

const weatherText = document.getElementById("weather");
const locationText = document.getElementById("location");
const windText = document.getElementById("wind");
const conditionText = document.getElementById("condition");
const feelsLikeText = document.getElementById("feelslike");
const precipitationText = document.getElementById("precipitationprobability");

const timeText = document.getElementById("time");
const weatherIcon = document.getElementById("weatherIcon");

const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");

const openSearch = document.getElementById("openSearch");
const searchModal = document.getElementById("searchModal");
const closeSearch = document.getElementById("closeSearch");

let selectedPlace = null;

// auto refresh
const REFRESH_INTERVAL = 5 * 60 * 1000;

// modal control
function openModal(modal) {
    modal.classList.add("show");
    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeModal(modal) {
    modal.classList.remove("show");
    overlay.classList.remove("show");
    document.body.style.overflow = "";
}

// close everything
function closeAll() {
    sideMenu.classList.remove("open");
    searchModal.classList.remove("show");
    overlay.classList.remove("show");
    document.body.style.overflow = "";
}

// menu toggle
menuBtn.onclick = () => {
    const isOpen = sideMenu.classList.contains("open");

    if (isOpen) closeAll();
    else {
        sideMenu.classList.add("open");
        overlay.classList.add("show");
        document.body.style.overflow = "hidden";
    }
};

overlay.onclick = closeAll;
openSearch.onclick = () => openModal(searchModal);
closeSearch.onclick = closeAll;

// load saved location
window.addEventListener("load", () => {
    closeAll();

    const saved = localStorage.getItem("selectedPlace");
    if (saved) {
        selectedPlace = JSON.parse(saved);
        getWeather(selectedPlace);
    }
});

// auto refresh
setInterval(() => {
    if (selectedPlace) getWeather(selectedPlace);
}, REFRESH_INTERVAL);

// input
cityInput.addEventListener("input", updateSuggestions);

// suggestions
async function updateSuggestions() {
    const query = cityInput.value.trim();
    selectedPlace = null;

    if (query.length < 2) {
        suggestionsBox.innerHTML = "";
        return;
    }

    const url =
        `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=8&language=en&format=json`;

    const res = await fetch(url);
    const data = await res.json();

    suggestionsBox.innerHTML = "";

    if (!data.results) return;

    data.results.forEach(place => {
        const div = document.createElement("div");

        const label =
            `${place.name}${place.admin1 ? ", " + place.admin1 : ""}, ${place.country}`;

        div.textContent = label;

        div.onclick = () => {
            selectedPlace = place;
            cityInput.value = label;
            suggestionsBox.innerHTML = "";

            localStorage.setItem("selectedPlace", JSON.stringify(place));

            getWeather(place);
            closeAll();
        };

        suggestionsBox.appendChild(div);
    });
}

// weather mapping
function getWeatherType(code) {
    if (code === 0) return "clear";
    if (code <= 3) return "cloudy";
    if (code >= 45 && code <= 48) return "fog";
    if (code >= 51 && code <= 55) return "drizzle";
    if (code >= 61 && code <= 65) return "rain";
    if (code >= 71 && code <= 77) return "snow";
    if (code >= 80 && code <= 82) return "rain";
    if (code >= 95) return "storm";
    return "cloud";
}

// icon mapping
function getWeatherIcon(type) {
    if (type === "clear") return "sun";
    if (type === "cloudy") return "cloud";
    if (type === "fog") return "cloud-fog";
    if (type === "drizzle") return "cloud-drizzle";
    if (type === "rain") return "cloud-rain";
    if (type === "snow") return "cloud-snow";
    if (type === "storm") return "cloud-lightning";
    return "cloud";
}

// icons
function setIcon(iconName) {

    weatherIcon.innerHTML = "";

    weatherIcon.setAttribute("data-lucide", iconName);

    lucide.createIcons({
        nodes: [weatherIcon]
    });
}

// weather fetch
async function getWeather(place) {
    if (!place) return;

    const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation_probability&temperature_unit=fahrenheit`
    );

    const data = await res.json();

    const temp = data.current.temperature_2m;
    const feels = data.current.apparent_temperature;
    const wind = data.current.wind_speed_10m;
    const precip = data.current.precipitation_probability;

    const type = getWeatherType(data.current.weather_code);
    const iconName = getWeatherIcon(type);

    weatherText.textContent = `${temp}°F`;
    feelsLikeText.textContent = `Feels like ${feels}°F`;
    windText.textContent = `Wind ${wind} mph`;
    precipitationText.textContent = `Precipitation ${precip}%`;
    conditionText.textContent = type;

    locationText.textContent =
        `${place.name}${place.admin1 ? ", " + place.admin1 : ""}, ${place.country}`;

    setIcon(iconName);

    localStorage.setItem("selectedPlace", JSON.stringify(place));

    suggestionsBox.innerHTML = "";
}

// clock
function updateClock() {
    const now = new Date();

    let h = now.getHours();
    const m = now.getMinutes();

    const ampm = h >= 12 ? "PM" : "AM";

    h = h % 12;
    h = h ? h : 12;

    timeText.textContent =
        `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

setInterval(updateClock, 1000);
updateClock();
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

const searchBtn = document.getElementById("searchBtn");

let selectedPlace = null;


// auto refresh for weather

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes


// load location from storage

window.addEventListener("load", () => {

    const saved = localStorage.getItem("selectedPlace");

    if (saved) {
        selectedPlace = JSON.parse(saved);

        cityInput.value =
            `${selectedPlace.name}${selectedPlace.admin1 ? ", " + selectedPlace.admin1 : ""}, ${selectedPlace.country}`;

        getWeather(selectedPlace);
    }
});


// auto refresh

setInterval(() => {

    if (selectedPlace) {
        getWeather(selectedPlace);
    }

}, REFRESH_INTERVAL);


// event listeners

cityInput.addEventListener("input", updateSuggestions);

cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        if (selectedPlace) {
            getWeather(selectedPlace);
        }
    }
});


// live suggestions for town search

async function updateSuggestions() {

    const query = cityInput.value.trim();

    selectedPlace = null;

    if (query.length < 2) {
        suggestionsBox.innerHTML = "";
        return;
    }

    const url =
        `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=8&language=en&format=json`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        suggestionsBox.innerHTML = "";

        if (!data.results) return;

        data.results.forEach(place => {

            const div = document.createElement("div");

            const label =
                `${place.name}${place.admin1 ? ", " + place.admin1 : ""}, ${place.country}`;

            div.textContent = label;
            div.style.cursor = "pointer";
            div.style.padding = "6px";

            div.addEventListener("click", () => {

                selectedPlace = place;

                cityInput.value = label;
                suggestionsBox.innerHTML = "";

                localStorage.setItem("selectedPlace", JSON.stringify(place));

                getWeather(place);
            });

            suggestionsBox.appendChild(div);
        });

    } catch (err) {
        console.error("Suggestion error:", err);
    }
}


// weather type variable conversion

function getWeatherType(code) {

    if (code === 0) return "clear";
    if (code <= 3) return "cloudy";

    if (code >= 45 && code <= 48) return "fog";

    if (code >= 51 && code <= 55) return "drizzle";

    if (code >= 61 && code <= 65) return "rain";

    if (code >= 71 && code <= 77) return "snow";

    if (code >= 80 && code <= 82) return "rain";

    if (code >= 95) return "storm";

    return "unknown";
}


// fetch weather

async function getWeather(place) {

    if (!place) return;

    try {

        const latitude = place.latitude;
        const longitude = place.longitude;

        const weatherUrl =
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,visibility,precipitation_probability&daily=sunrise,sunset&temperature_unit=fahrenheit`;

        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        // raw

        const temperature = weatherData.current.temperature_2m;
        const feelsLike = weatherData.current.apparent_temperature;
        const weatherCode = weatherData.current.weather_code;
        const windSpeed = weatherData.current.wind_speed_10m;
        const visibility = weatherData.current.visibility;
        const precipitationProbability = weatherData.current.precipitation_probability;

        const sunrise = weatherData.daily.sunrise[0];
        const sunset = weatherData.daily.sunset[0];

        // convert

        const weatherType = getWeatherType(weatherCode);

        // display

        weatherText.textContent =
            `${temperature}°F`;

        feelsLikeText.textContent =
            `Feels like: ${feelsLike}°F`;

        windText.textContent =
            `Wind: ${windSpeed} mph`;

        precipitationText.textContent =
            `Precipitation: ${precipitationProbability}%`;

        conditionText.textContent =
            weatherType;

        locationText.textContent =
            `${place.name}${place.admin1 ? ", " + place.admin1 : ""}, ${place.country}`;

        localStorage.setItem("selectedPlace", JSON.stringify(place));

        suggestionsBox.innerHTML = "";

    } catch (err) {
        console.error("Weather error:", err);
        weatherText.textContent = "Error loading weather";
        windText.textContent = "";
        locationText.textContent = "";
        conditionText.textContent = "";
        feelsLikeText.textContent = "";
        precipitationText.textContent = "";
    }
}


// clock

function updateClock() {

    const now = new Date();

    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12; // no military time in this house

    const formattedHours = String(hours);
    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(seconds).padStart(2, "0");

    timeText.textContent =
        `${formattedHours}:${formattedMinutes} ${ampm}`;
        // with seconds:
        //`${formattedHours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;
}

// run clock now
setInterval(updateClock, 1000);
updateClock();
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

const bgVideo = document.getElementById("bgVideo");

// landing UI
const landing = document.getElementById("landing");
const selectLocationBtn = document.getElementById("selectLocationBtn");

let selectedPlace = null;
let hasLocation = false;

const DEFAULT_VIDEO = "clear-day";

// auto refresh
const REFRESH_INTERVAL = 5 * 60 * 1000;

// bg vid

function setBackgroundVideo(name) {
    const src = `assets/background-video/${name}.mp4`;

    if (bgVideo.dataset.current === src) return;

    bgVideo.dataset.current = src;

    bgVideo.style.opacity = 0;

    setTimeout(() => {
        bgVideo.src = src;
        bgVideo.load();

        bgVideo.oncanplay = () => {
            bgVideo.style.opacity = 1;
        };

        bgVideo.onerror = () => {
            bgVideo.src = `assets/background-video/${DEFAULT_VIDEO}.mp4`;
        };
    }, 200);
}

// modals

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

// landing

function showLanding() {
    landing.classList.add("show");
    setBackgroundVideo(DEFAULT_VIDEO);
}

function hideLanding() {
    landing.classList.remove("show");
}

selectLocationBtn.onclick = () => {
    openModal(searchModal);
};

// load location

window.addEventListener("load", () => {
    setBackgroundVideo(DEFAULT_VIDEO);

    closeAll();

    const saved = localStorage.getItem("selectedPlace");

    if (saved) {
        selectedPlace = JSON.parse(saved);
        hasLocation = true;
        hideLanding();
        getWeather(selectedPlace);
    } else {
        hasLocation = false;
        showLanding();
    }
});

// search

cityInput.addEventListener("input", updateSuggestions);

async function updateSuggestions() {
    const query = cityInput.value.trim();

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
            hasLocation = true;

            cityInput.value = label;
            suggestionsBox.innerHTML = "";

            localStorage.setItem("selectedPlace", JSON.stringify(place));

            hideLanding();
            getWeather(place);
            closeAll();
        };

        suggestionsBox.appendChild(div);
    });
}

// weather types

function getWeatherType(code) {
    if (code === 0) return "clear";
    if (code <= 3) return "cloudy";
    if (code >= 45 && code <= 48) return "cloudy";
    if (code >= 51 && code <= 55) return "rain";
    if (code >= 61 && code <= 65) return "rain";
    if (code >= 71 && code <= 77) return "snow";
    if (code >= 80 && code <= 82) return "rain";
    if (code >= 95) return "storm";
    return "cloudy";
}

// day/night

function isDay(sunrise, sunset) {
    const now = Date.now();
    return now >= sunrise * 1000 && now <= sunset * 1000;
}

// select video

function getVideoName(type, dayTime) {
    if (type === "clear") return dayTime ? "clear-day" : "clear-night";
    if (type === "cloudy") return dayTime ? "cloudy-day" : "cloudy-night";
    if (type === "rain") return dayTime ? "rain-day" : "rain-night";
    if (type === "snow") return dayTime ? "snow-day" : "snow-night";
    if (type === "storm") return dayTime ? "storm-day" : "storm-night";

    return dayTime ? "cloudy-day" : "cloudy-night";
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

    try {
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation_probability&daily=sunrise,sunset&temperature_unit=fahrenheit`
        );

        const data = await res.json();

        const temp = data.current.temperature_2m;
        const feels = data.current.apparent_temperature;
        const wind = data.current.wind_speed_10m;
        const precip = data.current.precipitation_probability;

        const type = getWeatherType(data.current.weather_code);

        let dayTime = true;

        if (data.daily?.sunrise?.[0] && data.daily?.sunset?.[0]) {
            dayTime = isDay(data.daily.sunrise[0], data.daily.sunset[0]);
        }

        weatherText.textContent = `${temp}°F`;
        feelsLikeText.textContent = `Feels like ${feels}°F`;
        windText.textContent = `Wind ${wind} mph`;
        precipitationText.textContent = `Precipitation ${precip}%`;
        conditionText.textContent = type;

        locationText.textContent =
            `${place.name}${place.admin1 ? ", " + place.admin1 : ""}, ${place.country}`;

        setIcon(
            type === "clear" ? "sun" :
            type === "cloudy" ? "cloud" :
            type === "rain" ? "cloud-rain" :
            type === "snow" ? "cloud-snow" :
            type === "storm" ? "cloud-lightning" :
            "cloud"
        );

        setBackgroundVideo(getVideoName(type, dayTime));

        localStorage.setItem("selectedPlace", JSON.stringify(place));

    } catch (err) {
        console.error(err);
    }
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
const API_KEY = "66a784b1f05f4dc784a102423262903";
let LOCATION = "Sonipat";

function updateLiveTime() {
    const timeElement = document.getElementById('live-time');
    if (!timeElement) return;
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    timeElement.textContent = now.toLocaleDateString('en-US', options);
}
setInterval(updateLiveTime, 1000);
updateLiveTime();

function getIconSVG(type) {
    if (type === 'sun') return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"></line><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"></line><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"></line></svg>`;
    if (type === 'rain') return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4da6ff" stroke-width="2" stroke-linecap="round"><path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"></path><path d="M16 14v6"></path><path d="M8 14v6"></path><path d="M12 16v6"></path></svg>`;
    if (type === 'cloud') return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round"><path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1325 20.176 10.2078 17.8573 10.0211C17.5348 6.64332 14.6853 4 11.25 4C7.45304 4 4.375 7.07804 4.375 10.875C4.375 11.1353 4.39401 11.3912 4.43085 11.6416C2.45353 12.336 1 14.2494 1 16.5C1 19.5376 3.46243 22 6.5 22H17.5V19Z"></path></svg>`;
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2" stroke-linecap="round"><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path><path d="M17.5 19C19.985 19 22 16.985 22 14.5C22 12.132 20.176 10.208 17.857 10.021C17.535 6.643 14.685 4 11.25 4C7.453 4 4.375 7.078 4.375 10.875C4.375 11.135 4.394 11.391 4.431 11.642C2.454 12.336 1 14.249 1 16.5C1 19.538 3.462 22 6.5 22H17.5V19Z" stroke="#ffffff"></path></svg>`;
}

function mapConditionToIcon(text) {
    const t = text.toLowerCase();
    if (t.includes('rain') || t.includes('drizzle') || t.includes('shower') || t.includes('snow')) return 'rain';
    if (t.includes('cloud') || t.includes('overcast')) return t.includes('partly') ? 'cloud-sun' : 'cloud';
    if (t.includes('sun') || t.includes('clear')) return 'sun';
    return 'cloud-sun';
}

function getAQIDescription(aqi) {
    if (!aqi) return "Unknown";
    const index = aqi["us-epa-index"];
    if (index === 1) return `Good`;
    if (index === 2) return `Moderate`;
    if (index === 3) return `Unhealthy (Sensitive)`;
    if (index === 4) return `Unhealthy`;
    if (index === 5) return `Very Unhealthy`;
    if (index === 6) return `Hazardous`;
    return "Moderate";
}

function formatDateTab(dateStr, isToday) {
    if (isToday) return "Today";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
}

let retrievedForecastDays = []; 
let currentHourlySource = [];
let sortCol = null;
let sortAsc = true;

async function fetchWeatherData(queryLocation = LOCATION) {
    try {
        const URL = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${queryLocation}&days=10&aqi=yes`;
        const res = await fetch(URL);
        if (!res.ok) throw new Error("API request failed");
        
        const data = await res.json();
        
        const loc = data.location;
        document.getElementById('city-title').textContent = `${loc.name}, ${loc.region ? loc.region + ', ' : ''}${loc.country}`;
        
        populateCurrentWeather(data);
        populateForecast(data);
        
        setHourlyFilter('today');
        
    } catch (err) {
        console.error("Fetch Error:", err);
        showToast("Error fetching city data. Please try another.", true);
    }
}

function populateCurrentWeather(data) {
    const current = data.current;
    document.getElementById('current-temp').innerHTML = `${Math.round(current.temp_c)}°<span>C</span>`;
    document.getElementById('current-condition').textContent = current.condition.text;
    document.getElementById('current-feels-like').textContent = `Feels Like: ${Math.round(current.feelslike_c)}°C`;
    
    document.getElementById('val-wind-dir').textContent = `${current.wind_degree}° ${current.wind_dir}`;
    document.getElementById('val-wind-speed').textContent = `${current.wind_kph} km/h`;
    document.getElementById('val-gust').textContent = `${current.gust_kph} km/h`;
    document.getElementById('val-cloud').textContent = `${current.cloud}%`;
    document.getElementById('val-vis').textContent = `${current.vis_km} km`;
    document.getElementById('val-precip').textContent = `${current.precip_mm} mm`;
    document.getElementById('val-pressure').textContent = `${current.pressure_mb} mb`;
    document.getElementById('val-uv').textContent = `${current.uv}`;

    const todayForecast = data.forecast.forecastday[0].day;
    document.getElementById('current-rain-chance').textContent = `${todayForecast.daily_chance_of_rain}%`;

    document.getElementById('current-aqi').textContent = getAQIDescription(current.air_quality);

    const humidity = current.humidity;
    document.getElementById('current-humidity-text').textContent = `${humidity}%`;
    const deg = (humidity / 100) * 360;
    document.getElementById('humidity-progress').style.setProperty('--prog', `${deg}deg`);
}

function populateForecast(data) {
    retrievedForecastDays = data.forecast.forecastday;
    const tabsContainer = document.getElementById('forecast-tabs');
    tabsContainer.innerHTML = ''; 

    retrievedForecastDays.forEach((dayData, index) => {
        const isToday = (index === 0);
        const dayLabel = formatDateTab(dayData.date, isToday);
        const max = Math.round(dayData.day.maxtemp_c);
        const min = Math.round(dayData.day.mintemp_c);
        const precip = dayData.day.daily_chance_of_rain;
        const iconType = mapConditionToIcon(dayData.day.condition.text);

        const li = document.createElement('li');
        li.className = `day-tab ${isToday ? 'active' : ''}`;
        li.innerHTML = `
            <span class="date">${dayLabel}</span>
            ${getIconSVG(iconType)}
            <span class="temps">${max}° / ${min}°</span>
            <span class="precip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
                ${precip}%
            </span>
        `;
        
        li.addEventListener('click', () => {
            document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
            li.classList.add('active');
            
            currentHourlySource = dayData.hour;
            renderHourlyTable();
            document.getElementById('time-filter-btn').textContent = dayLabel + ' ⌄';
        });
        
        tabsContainer.appendChild(li);
    });

    drawAreaChart();
}

function setHourlyFilter(mode) {
    let btnText = "Today";
    if (!retrievedForecastDays.length) return;
    
    if (mode === 'today') {
        currentHourlySource = retrievedForecastDays[0].hour;
        btnText = "Today";
    } else if (mode === 'tomorrow') {
        currentHourlySource = retrievedForecastDays[1] ? retrievedForecastDays[1].hour : retrievedForecastDays[0].hour;
        btnText = "Tomorrow";
    } else if (mode === 'all') {
        currentHourlySource = retrievedForecastDays.map(d => d.hour).flat();
        btnText = "Next 3 Days";
    }
    
    document.getElementById('time-filter-btn').textContent = btnText + ' ⌄';
    renderHourlyTable();
}

function handleSortClick(e) {
    const th = e.currentTarget;
    const sortType = th.getAttribute('data-sort');
    
    if (sortCol === sortType) {
        sortAsc = !sortAsc;
    } else {
        sortCol = sortType;
        sortAsc = true;
    }
    
    document.querySelectorAll('th.sortable').forEach(el => {
        const text = el.textContent.replace(/[↑↓↕]/g, '').trim();
        el.textContent = text + ' ↕';
    });
    
    const baseText = th.textContent.replace(/[↑↓↕]/g, '').trim();
    th.textContent = baseText + (sortAsc ? ' ↑' : ' ↓');
    
    renderHourlyTable();
}

function renderHourlyTable() {
    const tbody = document.getElementById('hourly-tbody');
    tbody.innerHTML = '';
    
    let displayData = [...currentHourlySource];
    
    if (sortCol) {
        displayData.sort((a, b) => {
            let valA, valB;
            switch(sortCol) {
                case 'time': valA = a.time_epoch; valB = b.time_epoch; break;
                case 'temp': valA = a.temp_c; valB = b.temp_c; break;
                case 'humidity': valA = a.humidity; valB = b.humidity; break;
                case 'uv': valA = a.uv; valB = b.uv; break;
                case 'wind': valA = a.wind_kph; valB = b.wind_kph; break;
                default: valA = a.time_epoch; valB = b.time_epoch; 
            }
            return sortAsc ? valA - valB : valB - valA;
        });
    }

    displayData.forEach(hour => {
        const timeObj = new Date(hour.time);
        const formatStr = timeObj.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
        const dateStr = timeObj.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
        const displayTime = (displayData.length > 24) ? `${dateStr}, ${formatStr}` : formatStr;

        const iconType = mapConditionToIcon(hour.condition.text);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${displayTime}</td>
            <td>${getIconSVG(iconType)} ${hour.condition.text}</td>
            <td><strong>${Math.round(hour.temp_c)}°</strong></td>
            <td>${hour.humidity}%</td>
            <td>${hour.uv}</td>
            <td>${hour.wind_kph} km/h</td>
        `;
        tbody.appendChild(tr);
    });
}

function drawAreaChart() {
    const canvas = document.getElementById('tempAreaChart');
    if (!canvas || retrievedForecastDays.length === 0) return;
    const ctx = canvas.getContext('2d');
    
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const temps = retrievedForecastDays.map(d => Math.round(d.day.maxtemp_c));
    if (temps.length < 2) return; 

    const minTemp = Math.min(...temps) - 2;
    const maxTemp = Math.max(...temps) - (-2);
    
    const xStep = width / (temps.length - 1);
    const points = temps.map((temp, i) => {
        const x = i * xStep;
        const normalizedY = (temp - minTemp) / (maxTemp - minTemp);
        const y = height - (normalizedY * height * 0.8) - 20; 
        return {x, y, temp};
    });

    ctx.beginPath();
    ctx.moveTo(points[0].x, height);
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i+1];
        const xc = (p1.x + p2.x) / 2;
        const yc = (p1.y + p2.y) / 2;
        if (i===0) ctx.lineTo(p1.x, p1.y);
        ctx.quadraticCurveTo(p1.x, p1.y, xc, yc);
        if (i===points.length - 2) ctx.lineTo(p2.x, p2.y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i+1];
        const xc = (p1.x + p2.x) / 2;
        const yc = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, xc, yc);
        if (i===points.length - 2) ctx.lineTo(p2.x, p2.y);
    }
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.stroke();

    points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        let txtX = p.x;
        if (i === 0) txtX += 10;
        if (i === points.length - 1) txtX -= 10;
        ctx.fillText(p.temp + '°C', txtX, p.y - 12);
    });
}
window.addEventListener('resize', drawAreaChart);

document.addEventListener('DOMContentLoaded', () => {
    
    const searchForm = document.getElementById('search-form');
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('search-input').value.trim();
        if (input) {
            LOCATION = input;
            fetchWeatherData(LOCATION);
            document.getElementById('search-input').blur();
        }
    });

    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dd => {
        dd.addEventListener('click', (e) => {
            e.stopPropagation();
            const childMenu = dd.querySelector('.dropdown-menu');
            if (childMenu) {
                document.querySelectorAll('.dropdown-menu').forEach(m => {
                    if (m !== childMenu) m.classList.remove('show');
                });
                childMenu.classList.toggle('show');
            }
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    });

    document.querySelectorAll('.sub-nav-links li').forEach(li => {
        li.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sub-nav-links li').forEach(el => el.classList.remove('active'));
            li.classList.add('active');
            showToast(`${li.textContent} content is loading...`);
        });
    });

    const modal = document.getElementById('login-modal');
    document.getElementById('login-btn').addEventListener('click', () => modal.classList.add('active'));
    document.getElementById('close-login').addEventListener('click', () => modal.classList.remove('active'));
    document.getElementById('auth-btn').addEventListener('click', () => {
        modal.classList.remove('active');
        showToast("Successfully Authenticated!");
    });

    document.getElementById('share-btn').addEventListener('click', () => showToast("Link copied to clipboard!"));
    document.getElementById('fav-btn').addEventListener('click', () => showToast("Added to Favorites ❤️"));

    document.querySelectorAll('.hr-filter').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            setHourlyFilter(e.target.getAttribute('data-filter'));
        });
    });


    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', handleSortClick);
    });

    fetchWeatherData();
});


let toastTimeout;
function showToast(message, isError = false) {
    const toast = document.getElementById('toast-notification');
    toast.textContent = message;
    
   
    if (isError) {
        toast.style.background = 'rgba(220, 53, 69, 0.4)';
        toast.style.borderColor = 'rgba(220, 53, 69, 0.6)';
    } else {
        toast.style.background = 'rgba(40, 167, 69, 0.4)';
        toast.style.borderColor = 'rgba(40, 167, 69, 0.6)';
    }

    toast.classList.add('show');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}


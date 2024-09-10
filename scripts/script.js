// 更新本地時間
function updateTime() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    document.getElementById('local-time').textContent = now.toLocaleString('zh-Hant-TW', options);
}
setInterval(updateTime, 1000); 
updateTime(); 

// 獲取用戶的地理位置
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        document.getElementById('city').textContent = "此瀏覽器不支持地理位置服務。";
    }
}

function showPosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    getCityName(latitude, longitude);
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            document.getElementById('city').textContent = "用戶拒絕了地理位置請求。";
            break;
        case error.POSITION_UNAVAILABLE:
            document.getElementById('city').textContent = "位置資訊不可用。";
            break;
        case error.TIMEOUT:
            document.getElementById('city').textContent = "請求位置超時。";
            break;
        case error.UNKNOWN_ERROR:
            document.getElementById('city').textContent = "發生未知錯誤。";
            break;
    }
}

function getCityName(latitude, longitude) {
    const apiKey = 'e3c3e2d1964b4fd297dfd180cde9a6e3'; 
    const geoApiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}&language=en`;

    fetch(geoApiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('無法獲取城市名稱');
            }
            return response.json();
        })
        .then(data => {
            if (data.results.length > 0) {
                const city = data.results[0].components.city || data.results[0].components.town;
                const country = data.results[0].components.country;
                document.getElementById('city').textContent = `你當前所在的城市是：${city}`;
                document.getElementById('country').textContent = `國家：${country}`; 
                getWeather(city);
            } else {
                document.getElementById('city').textContent = "未能找到城市名稱。";
            }
        })
        .catch(error => {
            document.getElementById('city').textContent = "無法獲取城市資訊。";
            console.error('Error fetching city name:', error);
        });
}

// 獲取天氣資訊
function getWeather(city) {
    const apiKey = '8aedf7b3c49897fccbfced0645a4d57b';
    const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=8aedf7b3c49897fccbfced0645a4d57b&lang=zh_tw&units=metric`;

    fetch(weatherApiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('城市未找到');
            }
            return response.json();
        })
        .then(data => {
            const description = data.weather[0].description;
            const temperature = data.main.temp;
            document.getElementById('weather-info').textContent = `當前溫度: ${temperature} °C, 天氣: ${description}`;
        })
        .catch(error => {
            document.getElementById('weather-info').textContent = '無法獲取天氣資訊';
            console.error('Error fetching weather data:', error);
        });
}
setInterval(getWeather, 1800000); 
getWeather();

// Google 搜尋功能
document.getElementById('search-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { 
        const query = document.getElementById('search-input').value;
        if (query) {
            const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            window.open(googleSearchUrl, '_blank'); 
        } else {
            alert('輸入搜尋');
        }
    }
});


getLocation();
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
    // 保存最後知道的位置
    window.lastKnownPosition = { latitude, longitude };
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
    const geoApiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}&language=zh-TW`;

    fetch(geoApiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('無法獲取城市名稱');
            }
            return response.json();
        })
        .then(data => {
            if (data.results && data.results.length > 0) {
                const components = data.results[0].components;
                // 嘗試不同的城市級別名稱
                const city = components.city || 
                           components.town || 
                           components.district ||
                           components.suburb ||
                           '未知城市';
                const country = components.country || '未知國家';
                
                document.getElementById('city').textContent = `你當前所在的城市是：${city}`;
                document.getElementById('country').textContent = `國家：${country}`; 
                
                // 使用英文城市名稱查詢天氣
                const cityForWeather = components.city_en || 
                                     components.town_en || 
                                     components.district_en ||
                                     city;
                getWeatherAndForecast(cityForWeather);
            } else {
                throw new Error('未能找到城市名稱');
            }
        })
        .catch(error => {
            console.error('Error fetching city name:', error);
            document.getElementById('city').textContent = "無法獲取城市資訊";
            document.getElementById('country').textContent = "";
        });
}

// 獲取天氣資訊
async function getWeatherAndForecast(city) {
    const apiKey = '8aedf7b3c49897fccbfced0645a4d57b';
    
    try {
        // 先嘗試使用原始城市名稱
        let weatherData = await tryGetWeather(city, apiKey);
        
        // 如果失敗，嘗試使用英文城市名稱（如果不同的話）
        if (!weatherData && city.match(/[\u4e00-\u9fa5]/)) { // 檢查是否包含中文
            const englishCity = await translateToEnglish(city);
            if (englishCity && englishCity !== city) {
                weatherData = await tryGetWeather(englishCity, apiKey);
            }
        }
        
        // 如果仍然失敗，使用經緯度查詢
        if (!weatherData && window.lastKnownPosition) {
            const { latitude, longitude } = window.lastKnownPosition;
            weatherData = await getWeatherByCoords(latitude, longitude, apiKey);
        }
        
        if (weatherData) {
            updateCurrentWeather(weatherData);
            // 獲取天氣預報
            const forecastData = await getForecastData(weatherData.name, apiKey);
            if (forecastData) {
                updateForecast(forecastData);
            }
        } else {
            throw new Error('無法獲取天氣資訊');
        }
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        document.getElementById('current-weather').innerHTML = '無法獲取天氣資訊';
        document.getElementById('forecast-weather').innerHTML = '';
    }
}

// 嘗試獲取天氣資訊
async function tryGetWeather(city, apiKey) {
    const encodedCity = encodeURIComponent(city);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${apiKey}&lang=zh_tw&units=metric`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error in tryGetWeather:', error);
        return null;
    }
}

// 使用經緯度獲取天氣
async function getWeatherByCoords(lat, lon, apiKey) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&lang=zh_tw&units=metric`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error in getWeatherByCoords:', error);
        return null;
    }
}

// 獲取天氣預報
async function getForecastData(city, apiKey) {
    const encodedCity = encodeURIComponent(city);
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodedCity}&appid=${apiKey}&lang=zh_tw&units=metric`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error in getForecastData:', error);
        return null;
    }
}

// 更新當前天氣顯示
function updateCurrentWeather(data) {
    const weatherHtml = `
        <img src="http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="天氣圖標">
        <p>當前溫度: ${data.main.temp.toFixed(1)} °C</p>
        <p>天氣: ${data.weather[0].description}</p>
        <p>濕度: ${data.main.humidity}%</p>
        <p>風速: ${data.wind.speed} m/s</p>
    `;
    document.getElementById('current-weather').innerHTML = weatherHtml;
}

// 更新天氣預報顯示
function updateForecast(data) {
    const forecastDiv = document.getElementById('forecast-weather');
    forecastDiv.innerHTML = '';
    
    // 獲取未來5天的天氣預報（每天一筆）
    const dailyForecasts = data.list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 5);
    
    dailyForecasts.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayHtml = `
            <div class="forecast-day">
                <h4>${date.toLocaleDateString('zh-TW', {weekday: 'short'})}</h4>
                <img src="http://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="天氣圖標">
                <p>${day.main.temp.toFixed(1)} °C</p>
                <p>${day.weather[0].description}</p>
            </div>
        `;
        forecastDiv.innerHTML += dayHtml;
    });
}

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

function updateCountdown() {
    const now = new Date();
    const target = new Date('2025-01-01T00:00:00');
    const diff = target - now;

    if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }
}

setInterval(updateCountdown, 1000);
updateCountdown();

getLocation();

// 添加搜尋建議功能
let searchTimeout;

document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value;
    
    if (query.length < 2) {
        document.getElementById('search-suggestions').style.display = 'none';
        return;
    }

    searchTimeout = setTimeout(() => {
        fetch(`https://api.bing.com/qsonhs.aspx?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                const suggestions = data.AS.Results[0].Suggests;
                const suggestionsDiv = document.getElementById('search-suggestions');
                suggestionsDiv.innerHTML = '';
                
                suggestions.forEach(sug => {
                    const div = document.createElement('div');
                    div.className = 'suggestion-item';
                    div.textContent = sug.Txt;
                    div.onclick = () => {
                        document.getElementById('search-input').value = sug.Txt;
                        window.open(`https://www.google.com/search?q=${encodeURIComponent(sug.Txt)}`, '_blank');
                        suggestionsDiv.style.display = 'none';
                    };
                    suggestionsDiv.appendChild(div);
                });
                
                suggestionsDiv.style.display = 'block';
            })
            .catch(error => console.error('Error fetching suggestions:', error));
    }, 300);
});

// 點擊外部時關閉建議
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        document.getElementById('search-suggestions').style.display = 'none';
    }
});

// 預設背景圖片列表
const backgrounds = [
    'photo/tunnel.jpg'
];

// 初始化預設背景
function initPresetBackgrounds() {
    const presetContainer = document.getElementById('preset-backgrounds');
    if (!presetContainer) return;

    presetContainer.innerHTML = '';
    backgrounds.forEach((bg, index) => {
        const div = document.createElement('div');
        div.className = 'preset-bg';
        div.style.backgroundImage = `url('${bg}')`;
        div.onclick = () => setBackground(bg);
        presetContainer.appendChild(div);
    });
}

// 處理背景圖片上傳
function handleBackgroundUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 檢查文件類型
    if (!file.type.match('image.*')) {
        alert('請上傳圖片文件（支援 jpg、png、gif 等格式）');
        return;
    }

    // 檢查文件大小（限制為 5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        alert('圖片大小不能超過 5MB');
        return;
    }

    // 顯示載入中狀態
    const preview = document.getElementById('bg-preview');
    preview.classList.add('loading');

    const reader = new FileReader();
    reader.onload = function(e) {
        // 創建一個新的圖片對象來檢查尺寸
        const img = new Image();
        img.onload = function() {
            // 檢查圖片尺寸
            if (img.width < 800 || img.height < 600) {
                alert('建議上傳至少 800x600 像素的圖片以獲得最佳效果');
            }

            // 設置背景
            setBackground(e.target.result);
            saveBackgroundSettings();
            updatePreview();

            // 移除載入中狀態
            preview.classList.remove('loading');

            // 清空文件輸入框，允許重複上傳相同文件
            document.getElementById('background-upload').value = '';
        };

        img.onerror = function() {
            alert('圖片載入失敗，請確認文件是否損壞');
            preview.classList.remove('loading');
            document.getElementById('background-upload').value = '';
        };

        img.src = e.target.result;
    };

    reader.onerror = function() {
        alert('讀取文件時發生錯誤');
        preview.classList.remove('loading');
        document.getElementById('background-upload').value = '';
    };

    reader.readAsDataURL(file);
}

// 從 URL 設置背景
function setBackgroundFromUrl() {
    const url = document.getElementById('background-url').value.trim();
    if (!url) {
        alert('請輸入有效的圖片 URL');
        return;
    }

    // 顯示載入中狀態
    const preview = document.getElementById('bg-preview');
    preview.classList.add('loading');

    // 驗證 URL 是否為圖片
    const img = new Image();
    img.onload = function() {
        setBackground(url);
        preview.classList.remove('loading');
        document.getElementById('background-url').value = ''; // 清空輸入框
    };

    img.onerror = function() {
        alert('無法載入圖片，請確認 URL 是否正確');
        preview.classList.remove('loading');
    };

    img.src = url;
}

// 設置背景
function setBackground(src) {
    // 創建一個新的圖片對象來預載入
    const img = new Image();
    img.onload = function() {
        document.body.style.backgroundImage = `url('${src}')`;
        const preview = document.getElementById('bg-preview');
        if (preview) {
            preview.style.backgroundImage = `url('${src}')`;
        }

        // 保存到本地存儲
        saveBackgroundSettings();
    };

    img.onerror = function() {
        alert('設置背景圖片失敗');
    };

    img.src = src;
}

// 更新預覽
function updatePreview() {
    const preview = document.getElementById('bg-preview');
    if (!preview) return;

    preview.style.backgroundImage = document.body.style.backgroundImage;
    preview.style.backgroundPosition = document.body.style.backgroundPosition;
    preview.style.filter = document.body.style.filter;
}

// 重置背景設置
function resetBackgroundSettings() {
    const defaultSettings = {
        backgroundImage: `url('photo/tunnel.jpg')`,
        backgroundPosition: 'center',
        filter: 'none'
    };

    applyBackgroundSettings(defaultSettings);
    saveBackgroundSettings();
    updatePreview();
}

// 用背景設置
function applyBackgroundSettings(settings) {
    document.body.style.backgroundImage = settings.backgroundImage;
    document.body.style.backgroundPosition = settings.backgroundPosition;
    document.body.style.filter = settings.filter;
}

// 載入保存的設置
function loadSavedBackgroundSettings() {
    const savedSettings = localStorage.getItem('backgroundSettings');
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            applyBackgroundSettings(settings);
        } catch (e) {
            console.error('載入背景設置時出錯:', e);
            resetBackgroundSettings();
        }
    }
}

// 修改 openBackgroundSettings 函數，添加重置按鈕
function openBackgroundSettings() {
    const modal = document.getElementById('background-settings');
    modal.style.display = 'block';
    
    // 更新模態框內容
    const modalContent = modal.querySelector('.modal-content');
    modalContent.innerHTML = `
        <span class="close" onclick="closeBackgroundSettings()">&times;</span>
        <h2>背景設置</h2>
        
        <div class="background-preview">
            <h3>預覽</h3>
            <div id="bg-preview"></div>
        </div>

        <div class="background-controls">
            <div class="control-group">
                <h3>模糊度</h3>
                <input type="range" id="blur-control" min="0" max="20" value="0" 
                    onchange="updateBackgroundEffect('blur', this.value)">
                <span id="blur-value">0px</span>
            </div>

            <div class="control-group">
                <h3>亮度</h3>
                <input type="range" id="brightness-control" min="0" max="200" value="100" 
                    onchange="updateBackgroundEffect('brightness', this.value)">
                <span id="brightness-value">100%</span>
            </div>

            <div class="control-group">
                <h3>背景位置</h3>
                <select id="position-control" onchange="updateBackgroundPosition(this.value)">
                    <option value="center">置中</option>
                    <option value="top">頂部</option>
                    <option value="bottom">底部</option>
                    <option value="left">左側</option>
                    <option value="right">右側</option>
                </select>
            </div>
        </div>

        <div class="background-options">
            <div class="option">
                <h3>上傳圖片</h3>
                <input type="file" id="background-upload" accept="image/*" onchange="handleBackgroundUpload(event)">
            </div>
            
            <div class="option">
                <h3>圖片URL</h3>
                <input type="text" id="background-url" placeholder="輸入圖片URL">
                <button onclick="setBackgroundFromUrl()">設置</button>
            </div>
            
            <div class="option">
                <h3>預設背景</h3>
                <div id="preset-backgrounds"></div>
            </div>
        </div>

        <button class="reset-button" onclick="resetBackgroundSettings()">重置設置</button>
    `;

    // 載入當前設置
    loadCurrentSettings();

    // 初始化預設背景
    initPresetBackgrounds();
    
    // 更新預覽
    updatePreview();
}

// 更新背景效果
function updateBackgroundEffect(effect, value) {
    const body = document.body;
    const preview = document.getElementById('bg-preview');
    const currentFilters = getComputedStyle(body).filter.split(' ');
    
    let newFilters = [];
    if (effect === 'blur') {
        document.getElementById('blur-value').textContent = `${value}px`;
        newFilters.push(`blur(${value}px)`);
    } else if (effect === 'brightness') {
        document.getElementById('brightness-value').textContent = `${value}%`;
        newFilters.push(`brightness(${value}%)`);
    }
    
    // 保持其他效果不變
    currentFilters.forEach(filter => {
        if (!filter.includes(effect)) {
            newFilters.push(filter);
        }
    });
    
    const filterString = newFilters.join(' ');
    body.style.filter = filterString;
    preview.style.filter = filterString;
    
    // 保存設置
    saveBackgroundSettings();
}

// 更新背景位置
function updateBackgroundPosition(position) {
    document.body.style.backgroundPosition = position;
    document.getElementById('bg-preview').style.backgroundPosition = position;
    saveBackgroundSettings();
}

// 保存所有背景設置
function saveBackgroundSettings() {
    const settings = {
        backgroundImage: document.body.style.backgroundImage,
        backgroundPosition: document.body.style.backgroundPosition,
        filter: document.body.style.filter
    };
    localStorage.setItem('backgroundSettings', JSON.stringify(settings));
}

// 載入當前設置
function loadCurrentSettings() {
    const settings = JSON.parse(localStorage.getItem('backgroundSettings') || '{}');
    const preview = document.getElementById('bg-preview');
    
    // 設置預覽區域的背景
    preview.style.backgroundImage = document.body.style.backgroundImage;
    preview.style.backgroundPosition = document.body.style.backgroundPosition;
    preview.style.filter = document.body.style.filter;
    
    // 更新控制項的值
    const blurMatch = (settings.filter || '').match(/blur\((\d+)px\)/);
    if (blurMatch) {
        document.getElementById('blur-control').value = blurMatch[1];
        document.getElementById('blur-value').textContent = `${blurMatch[1]}px`;
    }
    
    const brightnessMatch = (settings.filter || '').match(/brightness\((\d+)%\)/);
    if (brightnessMatch) {
        document.getElementById('brightness-control').value = brightnessMatch[1];
        document.getElementById('brightness-value').textContent = `${brightnessMatch[1]}%`;
    }
    
    if (settings.backgroundPosition) {
        document.getElementById('position-control').value = settings.backgroundPosition;
    }
}

// 關閉背景設置對話框
function closeBackgroundSettings() {
    document.getElementById('background-settings').style.display = 'none';
}

// 農曆日期計算和顯示功能
function updateLunarDate() {
    try {
        const date = new Date();
        const lunar = Lunar.fromDate(date);
        
        const yearZh = lunar.getYearInChinese();
        const monthZh = lunar.getMonthInChinese();
        const dayZh = lunar.getDayInChinese();
        
        // 判斷是否為閏月
        const isLeap = lunar.getMonthInChinese().includes('閏');
        
        // 組合農曆日期字串
        const lunarDateStr = `農曆 ${yearZh}年${isLeap ? '閏' : ''}${monthZh}月${dayZh}`;
        
        document.getElementById('lunar-date').textContent = lunarDateStr;
    } catch (error) {
        console.error('Error updating lunar date:', error);
        document.getElementById('lunar-date').textContent = '無法獲取農曆日期';
    }
}

// 定時更新農曆日期
setInterval(updateLunarDate, 1000 * 60 * 60); // 每小時更新一次
updateLunarDate(); // 初始更新

// 添加農曆節日判斷功能
function getLunarFestival(lunar) {
    const month = lunar.getMonth();
    const day = lunar.getDay();
    
    const festivals = {
        '1-1': '春節',
        '1-15': '元宵節',
        '5-5': '端午節',
        '7-7': '七夕',
        '8-15': '中秋節',
        '9-9': '重陽節',
        '12-30': '除夕'
    };
    
    const key = `${month}-${day}`;
    return festivals[key] || '';
}

// 更新樣式
const lunarDateStyles = `
#lunar-date {
    color: #FFD700;
    font-size: 1.2em;
    margin: 10px 0;
    text-align: center;
}
`;

// 添加樣式到頁面
const styleSheet = document.createElement('style');
styleSheet.textContent = lunarDateStyles;
document.head.appendChild(styleSheet);

// 在頁面加載時初始化
document.addEventListener('DOMContentLoaded', () => {
    updateLunarDate();
    // 每天更新一次農曆日期
    setInterval(updateLunarDate, 24 * 60 * 60 * 1000);
});

// 錯誤處理函數
function handleApiError(error, fallbackFn) {
    console.error('API Error:', error);
    if (fallbackFn) {
        fallbackFn();
    }
}

// 添加待辦事項功能
function addTodo() {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    
    if (text) {
        const todoList = document.getElementById('todo-list');
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.innerHTML = `
            <input type="checkbox" onchange="toggleTodo(this)">
            <span>${text}</span>
            <button onclick="deleteTodo(this)">刪除</button>
        `;
        todoList.appendChild(li);
        input.value = '';
        saveTodos();
    }
}

function toggleTodo(checkbox) {
    checkbox.parentElement.classList.toggle('completed');
    saveTodos();
}

function deleteTodo(button) {
    button.parentElement.remove();
    saveTodos();
}

function saveTodos() {
    const todos = [];
    document.querySelectorAll('.todo-item').forEach(item => {
        todos.push({
            text: item.querySelector('span').textContent,
            completed: item.classList.contains('completed')
        });
    });
    localStorage.setItem('todos', JSON.stringify(todos));
}

function loadTodos() {
    const todos = JSON.parse(localStorage.getItem('todos') || '[]');
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';
    
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" onchange="toggleTodo(this)" ${todo.completed ? 'checked' : ''}>
            <span>${todo.text}</span>
            <button onclick="deleteTodo(this)">刪除</button>
        `;
        todoList.appendChild(li);
    });
}

// 頁面加載時載入待辦事項
document.addEventListener('DOMContentLoaded', loadTodos);

// 添加訪問計數器功能
function updateVisitCount() {
    const visitCountElement = document.getElementById('visit-count');
    if (visitCountElement) {
        let count = parseInt(localStorage.getItem('visitCount') || '0');
        count++;
        localStorage.setItem('visitCount', count);
        visitCountElement.textContent = count;
    }
}

// 頁面加載時更新訪問次數
document.addEventListener('DOMContentLoaded', updateVisitCount);

// 主題切換功能
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// 在頁面加載時設置保存的主題
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
});

// 修改原本的 setInterval
setInterval(() => getLocation(), 1800000); // 每30分鐘更新一次
getLocation(); // 初始化調用

// 確保所有元素都存在
document.addEventListener('DOMContentLoaded', () => {
    // 初始化訪問計數
    updateVisitCount();
    
    // 初始化農曆日期
    updateLunarDate();
    
    // 獲取位置和天氣
    getLocation();
    
    // 設置定時更新
    setInterval(updateLunarDate, 24 * 60 * 60 * 1000);  // 每天更新農曆
    setInterval(getLocation, 1800000);  // 每30分鐘更新天氣
});

// 側邊欄功能
const sidebarFunctions = {
    // 主頁功能
    home: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // 工具功能
    tools: () => {
        const toolsModal = createModal('工具箱', `
            <div class="tools-grid">
                <div class="tool-item" onclick="openCalculator()">
                    <i class="fas fa-calculator"></i>
                    <span>計算機</span>
                </div>
                <div class="tool-item" onclick="openNotepad()">
                    <i class="fas fa-sticky-note"></i>
                    <span>記事本</span>
                </div>
                <div class="tool-item" onclick="openTimer()">
                    <i class="fas fa-clock"></i>
                    <span>計時器</span>
                </div>
                <div class="tool-item" onclick="openConverter()">
                    <i class="fas fa-exchange-alt"></i>
                    <span>單位換算</span>
                </div>
            </div>
        `);
        document.body.appendChild(toolsModal);
    },

    // 設計功能
    design: () => {
        const designModal = createModal('個人化設置', `
            <div class="design-options">
                <div class="option-group">
                    <h3>字體大小</h3>
                    <input type="range" min="12" max="24" value="16" onchange="changeFontSize(this.value)">
                </div>
                <div class="option-group">
                    <h3>小部件透明度</h3>
                    <input type="range" min="0" max="100" value="80" onchange="changeWidgetOpacity(this.value)">
                </div>
                <div class="option-group">
                    <h3>動畫效果</h3>
                    <label>
                        <input type="checkbox" onchange="toggleAnimations(this.checked)" checked>
                        啟用動畫
                    </label>
                </div>
            </div>
        `);
        document.body.appendChild(designModal);
    },

    // 程式功能
    code: () => {
        const codeModal = createModal('程式工具', `
            <div class="code-tools">
                <div class="tool-section">
                    <h3>程式碼格式化</h3>
                    <textarea id="code-input" placeholder="貼上程式碼..."></textarea>
                    <button onclick="formatCode()">格式化</button>
                </div>
                <div class="tool-section">
                    <h3>常用程式碼片段</h3>
                    <div id="code-snippets"></div>
                </div>
            </div>
        `);
        document.body.appendChild(codeModal);
        loadCodeSnippets();
    },

    // 資訊功能
    info: () => {
        const infoModal = createModal('關於', `
        <div class="about-content">
            <h3>版本資訊</h3>
            <p>當前版本：1.0.0</p>
            <h3>作者資訊</h3>
            <p>作者：LCM</p>
            <h3>更新日誌</h3>
            <ul id="changelog">
                <li>2024/03/21 - 初始版本發布</li>
                <li>2024/03/22 - 添加農曆日期功能</li>
                <li>2024/03/23 - 優化響應式設計</li>
            </ul>
        </div>
    `);
    document.body.appendChild(infoModal);}

};

// 創建模態框的輔助函數
function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    
    // 點擊模態框外部關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    return modal;
}

// 工具函數
function openCalculator() {
    const calc = createModal('計算機', `
        <div class="calculator">
            <input type="text" id="calc-display" readonly>
            <div class="calc-buttons">
                <!-- 計算機按鈕 -->
            </div>
        </div>
    `);
    document.body.appendChild(calc);
    initCalculator();
}

function openNotepad() {
    const notepad = createModal('記事本', `
        <div class="notepad">
            <textarea id="notepad-content">${localStorage.getItem('notepad') || ''}</textarea>
            <button onclick="saveNote()">保存</button>
        </div>
    `);
    document.body.appendChild(notepad);
}

// 初始化側邊欄事件監聽
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const icons = sidebar.getElementsByTagName('img');
    
    // 為每���圖標添加點擊事件
    Array.from(icons).forEach((icon, index) => {
        icon.addEventListener('click', () => {
            const functionName = ['home', 'tools', 'design', 'code', 'theme', 'background','info'][index];
            if (sidebarFunctions[functionName]) {
                sidebarFunctions[functionName]();
            }
        });
    });
});

// 添加相應的 CSS
const sidebarStyles = `
    .modal {
        display: flex;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        justify-content: center;
        align-items: center;
    }

    .modal-content {
        background-color: var(--bg-color);
        padding: 20px;
        border-radius: 10px;
        width: 80%;
        max-width: 600px;
        position: relative;
    }

    .tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 15px;
        padding: 15px;
    }

    .tool-item {
        text-align: center;
        padding: 15px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .tool-item:hover {
        transform: scale(1.05);
    }

    .design-options {
        padding: 15px;
    }

    .option-group {
        margin-bottom: 20px;
    }

    .code-tools {
        padding: 15px;
    }

    .tool-section {
        margin-bottom: 20px;
    }

    #code-input {
        width: 100%;
        height: 200px;
        margin: 10px 0;
    }

    .about-content {
        padding: 15px;
    }

    #changelog {
        margin-top: 10px;
        padding-left: 20px;
    }
`;

// 添加樣式到頁面
const sidebarStyleSheet = document.createElement('style');
sidebarStyleSheet.textContent = sidebarStyles;
document.head.appendChild(sidebarStyleSheet);

// 添加錯誤處理
window.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        // 圖片載入失敗時使用預設背景
        console.error('背景圖片載入失敗:', e);
        resetBackgroundSettings();
    }
});

// 簡單的中文轉英文城市名稱對照（可以根據需要擴充）
const cityNameMap = {
    '台北': 'Taipei',
    '高雄': 'Kaohsiung',
    '台中': 'Taichung',
    '台南': 'Tainan',
    '基隆': 'Keelung',
    '新北': 'New Taipei',
    '桃園': 'Taoyuan',
    '新竹': 'Hsinchu',
    '嘉義': 'Chiayi',
    '屏東': 'Pingtung',
    '宜蘭': 'Yilan',
    '花蓮': 'Hualien',
    '台東': 'Taitung',
    '澎湖': 'Penghu',
    '金門': 'Kinmen',
    '馬祖': 'Matsu',
    // 可以添加更多城市對照
};

// 轉換城市名稱
async function translateToEnglish(cityName) {
    // 先檢查對照表
    if (cityNameMap[cityName]) {
        return cityNameMap[cityName];
    }
    
    // 如果沒有對照，返回原始名稱
    return cityName;
}

// 添加相關的 CSS 樣式
const style = document.createElement('style');
style.textContent = `
    .loading {
        position: relative;
        pointer-events: none;
    }

    .loading::after {
        content: '載入中...';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 14px;
    }

    #background-url {
        width: 100%;
        padding: 8px;
        margin-bottom: 8px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-color);
    }

    .file-upload-label {
        display: inline-block;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
    }

    .file-upload-label:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;

document.head.appendChild(style);
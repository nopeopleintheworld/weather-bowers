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
            document.getElementById('city').textContent = "位置資��不可用。";
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
    const encodedCity = encodeURIComponent(city);
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${apiKey}&lang=zh_tw&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodedCity}&appid=${apiKey}&lang=zh_tw&units=metric`;

    try {
        // 獲取當前天氣
        const currentResponse = await fetch(currentWeatherUrl);
        if (!currentResponse.ok) {
            throw new Error('城市未找到');
        }
        const currentData = await currentResponse.json();
        
        // 確保數據存在
        if (!currentData || !currentData.weather || !currentData.weather[0]) {
            throw new Error('無效的天氣數據');
        }

        // 更新當前天氣
        updateCurrentWeather(currentData);
        
        // 獲取天氣預報
        const forecastResponse = await fetch(forecastUrl);
        if (!forecastResponse.ok) {
            throw new Error('無法獲取天氣預報');
        }
        const forecastData = await forecastResponse.json();
        
        // 更新天氣預報
        if (forecastData && forecastData.list) {
            updateForecast(forecastData);
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        document.getElementById('current-weather').textContent = '無法獲取天氣資訊';
        document.getElementById('forecast-weather').textContent = '';
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
    'RobloxScreenShot20240905_223451164.png',
    'background2.jpg',
    'background3.jpg',
    // 添加更多預設背景
];

// 打開背景設置對話框
function openBackgroundSettings() {
    const modal = document.getElementById('background-settings');
    modal.style.display = 'block';
    
    // 載入預設背景選項
    const presetContainer = document.getElementById('preset-backgrounds');
    presetContainer.innerHTML = '';
    
    backgrounds.forEach((bg, index) => {
        const div = document.createElement('div');
        div.className = 'preset-bg';
        div.style.backgroundImage = `url('photo/${bg}')`;
        div.onclick = () => setBackground(`photo/${bg}`);
        presetContainer.appendChild(div);
    });
}

// 關閉背景設置對話框
function closeBackgroundSettings() {
    document.getElementById('background-settings').style.display = 'none';
}

// 處理用戶上傳的背景圖片
function handleBackgroundUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            setBackground(e.target.result);
            saveBackgroundSetting(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// 從URL設置背景
function setBackgroundFromUrl() {
    const url = document.getElementById('background-url').value.trim();
    if (url) {
        // 先驗證URL是否有效
        const img = new Image();
        img.onload = function() {
            setBackground(url);
            saveBackgroundSetting(url);
        };
        img.onerror = function() {
            alert('無法載入圖片，請確認URL是否正確');
        };
        img.src = url;
    }
}

// 設置背景
function setBackground(src) {
    document.body.style.backgroundImage = `url('${src}')`;
    closeBackgroundSettings();
}

// 保存背景設置
function saveBackgroundSetting(src) {
    localStorage.setItem('customBackground', src);
}

// 載入保存的背景設置
document.addEventListener('DOMContentLoaded', () => {
    const savedBg = localStorage.getItem('customBackground');
    if (savedBg) {
        setBackground(savedBg);
    }
});

// 點擊模態框外部關閉
window.onclick = function(event) {
    const modal = document.getElementById('background-settings');
    if (event.target === modal) {
        closeBackgroundSettings();
    }
}

// 農曆日期計算和顯示功能
function updateLunarDate() {
    try {
        const date = new Date();
        
        // 使用 lunar.js 計算農曆日期
        const lunar = Lunar.fromDate(date);
        
        // 獲取農曆年月日
        const lunarYear = lunar.getYear();
        const lunarMonth = lunar.getMonth();
        const lunarDay = lunar.getDay();
        
        // 獲取天干地支年份
        const cyclicalYear = lunar.getYearInGanZhi();
        
        // 獲取生肖
        const zodiac = lunar.getYearShengXiao();
        
        // 獲取農曆月份名稱（需要處理閏月）
        const monthName = lunar.isLeapMonth() ? `閏${lunarMonth}` : lunarMonth;
        
        // 更新顯示
        document.getElementById('lunar-date').innerHTML = `
            農曆 ${cyclicalYear}年 (${zodiac}年)<br>
            ${monthName}月 ${lunarDay}日
        `;
    } catch (error) {
        console.error('Error updating lunar date:', error);
        document.getElementById('lunar-date').textContent = '農曆日期計算錯誤';
    }
}

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
        document.body.appendChild(infoModal);
    }
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
    
    // 為每個圖標添加點擊事件
    Array.from(icons).forEach((icon, index) => {
        icon.addEventListener('click', () => {
            const functionName = ['home', 'tools', 'design', 'code', 'info'][index];
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
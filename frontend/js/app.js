const API_BASE = '/api';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const itemDetail = document.getElementById('itemDetail');
const playerSection = document.getElementById('playerSection');
const loading = document.getElementById('loading');
const videoPlayer = document.getElementById('videoPlayer');
const qualityButtons = document.getElementById('qualityButtons');
const subtitlesContainer = document.getElementById('subtitlesContainer');
const subtitleButtons = document.getElementById('subtitleButtons');

// State
let currentItem = null;
let currentStream = null;
let selectedSeason = null;
let selectedEpisode = null;
let selectedTranslator = null;

// Loading Functions
function showLoading() {
    loading.style.display = 'flex';
}

function hideLoading() {
    loading.style.display = 'none';
}

// Search Functions
async function search(query) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        hideLoading();
        
        if (data.success) {
            displaySearchResults(data.results);
        } else {
            alert('Ошибка поиска: ' + data.error);
        }
    } catch (error) {
        hideLoading();
        alert('Ошибка: ' + error.message);
    }
}

function displaySearchResults(results) {
    searchResults.style.display = 'grid';
    itemDetail.style.display = 'none';
    playerSection.style.display = 'none';
    
    if (results.length === 0) {
        searchResults.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 80px 20px;">
                <h2 style="margin-bottom: 12px;">Ничего не найдено</h2>
                <p style="color: var(--text-secondary);">Попробуйте другой запрос</p>
            </div>
        `;
        return;
    }
    
    searchResults.innerHTML = results.map(item => `
        <div class="result-card" onclick="loadItem('${item.url}')">
            <img src="${item.image || ''}" alt="${item.title}" onerror="this.style.display='none'">
            <div class="info">
                <div class="title">${item.title}</div>
                ${item.rating ? `<div class="rating">⭐ ${item.rating}</div>` : ''}
            </div>
        </div>
    `).join('');
}

// Item Detail Functions
async function loadItem(url) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/item?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        hideLoading();
        
        if (data.success) {
            currentItem = data.item;
            displayItemDetail(data.item);
        } else {
            alert('Ошибка: ' + data.error);
        }
    } catch (error) {
        hideLoading();
        alert('Ошибка: ' + error.message);
    }
}

function displayItemDetail(item) {
    searchResults.style.display = 'none';
    playerSection.style.display = 'none';
    itemDetail.style.display = 'block';
    
    const isSeries = item.type === 'tv_series';
    selectedTranslator = null;
    selectedSeason = null;
    selectedEpisode = null;
    
    itemDetail.innerHTML = `
        <button class="back-btn" onclick="showSearchResults()">← Назад к поиску</button>
        <div class="detail-content">
            <div class="detail-poster">
                <img src="${item.thumbnailHQ || item.thumbnail || ''}" alt="${item.name}" onerror="this.style.display='none'">
            </div>
            <div class="detail-info">
                <h2>${item.name}</h2>
                ${item.origName ? `<p style="color: var(--text-secondary); font-size: 16px; margin-bottom: 8px;">${item.origName}</p>` : ''}
                ${item.releaseYear ? `<p class="year">${item.releaseYear}</p>` : ''}
                ${item.rating.value ? `<p class="rating">⭐ ${item.rating.value} (${item.rating.votes} оценок)</p>` : ''}
                <p class="description">${item.description}</p>
                
                <div class="translators">
                    <h3>🔊 Переводы</h3>
                    ${Object.entries(item.translators).map(([id, info]) => `
                        <button class="translator-btn" data-id="${id}" onclick="selectTranslator(${id}, '${info.name}')">
                            ${info.name} ${info.premium ? '👑' : ''}
                        </button>
                    `).join('')}
                </div>
                
                ${isSeries ? `
                    <div class="episodes">
                        <h3>📺 Сезоны и эпизоды</h3>
                        ${item.episodesInfo.map(season => `
                            <div class="season">
                                <div class="season-title">Сезон ${season.season}</div>
                                <div class="episode-buttons">
                                    ${season.episodes.map(ep => `
                                        <button class="episode-btn" data-season="${season.season}" data-episode="${ep.episode}" 
                                                onclick="selectEpisode(${season.season}, ${ep.episode})">
                                            ${ep.episode}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <button class="watch-btn" onclick="loadStream()">▶️ Смотреть</button>
                `}
            </div>
        </div>
    `;
}

function selectTranslator(id, name) {
    selectedTranslator = id;
    document.querySelectorAll('.translator-btn').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.id) === id) {
            btn.classList.add('active');
        }
    });
    
    if (currentItem && currentItem.type !== 'tv_series') {
        if (!document.querySelector('.watch-btn')) {
            const btn = document.createElement('button');
            btn.className = 'watch-btn';
            btn.textContent = '▶️ Смотреть';
            btn.onclick = loadStream;
            document.querySelector('.detail-info').appendChild(btn);
        }
    }
}

function selectEpisode(season, episode) {
    selectedSeason = season;
    selectedEpisode = episode;
    
    document.querySelectorAll('.episode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.season) === season && parseInt(btn.dataset.episode) === episode) {
            btn.classList.add('active');
        }
    });
    
    loadStream();
}

// Player Functions
async function loadStream() {
    if (!currentItem) return;
    
    showLoading();
    
    try {
        let url = `${API_BASE}/stream?url=${encodeURIComponent(currentItem.url)}`;
        
        if (currentItem.type === 'tv_series') {
            if (!selectedSeason || !selectedEpisode) {
                hideLoading();
                alert('Выберите сезон и эпизод');
                return;
            }
            url += `&season=${selectedSeason}&episode=${selectedEpisode}`;
        }
        
        if (selectedTranslator) {
            url += `&translation=${selectedTranslator}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        hideLoading();
        
        if (data.success) {
            currentStream = data.stream;
            displayPlayer(data.stream);
        } else {
            alert('Ошибка: ' + data.error);
        }
    } catch (error) {
        hideLoading();
        alert('Ошибка: ' + error.message);
    }
}

function displayPlayer(stream) {
    itemDetail.style.display = 'none';
    searchResults.style.display = 'none';
    playerSection.style.display = 'block';
    
    // Display qualities
    qualityButtons.innerHTML = Object.entries(stream.videos).map(([quality, urls]) => `
        <button class="quality-btn" onclick="playVideo('${urls[0]}', '${quality}')">
            ${quality}
        </button>
    `).join('');
    
    // Display subtitles if available
    if (stream.subtitles && stream.subtitles.keys && stream.subtitles.keys.length > 0) {
        subtitlesContainer.style.display = 'block';
        subtitleButtons.innerHTML = stream.subtitles.keys.map(key => {
            const sub = stream.subtitles.subtitles[key];
            return `<button class="translator-btn" onclick="loadSubtitle('${sub.link}', '${sub.title || key}')">
                ${sub.title || key}
            </button>`;
        }).join('');
    } else {
        subtitlesContainer.style.display = 'none';
    }
    
    // Auto-play first quality
    const firstQuality = Object.entries(stream.videos)[0];
    if (firstQuality) {
        playVideo(firstQuality[1][0], firstQuality[0]);
    }
}

function playVideo(url, quality) {
    videoPlayer.src = url;
    videoPlayer.play().catch(err => console.log('Auto-play blocked:', err));
}

function loadSubtitle(url, language) {
    // Note: Native HTML5 video subtitles require VTT format and CORS headers
    alert(`Субтитры "${language}": ${url}\n\nПримечание: для встроенных субтитров требуется поддержка браузером.`);
}

// Navigation Functions
function showSearchResults() {
    searchResults.innerHTML = `
        <div class="welcome-section">
            <h1 class="welcome-title">Добро пожаловать в 88 sim</h1>
            <p class="welcome-subtitle">Найди и смотри любимые фильмы и сериалы</p>
        </div>
    `;
    searchResults.style.display = 'grid';
    itemDetail.style.display = 'none';
    playerSection.style.display = 'none';
    videoPlayer.pause();
}

function showItemDetail() {
    if (currentItem) {
        playerSection.style.display = 'none';
        videoPlayer.pause();
        displayItemDetail(currentItem);
    }
}

// Event Listeners
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        search(query);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            search(query);
        }
    }
});


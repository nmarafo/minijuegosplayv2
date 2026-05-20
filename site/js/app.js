// State management
let state = {
  games: [],
  favorites: JSON.parse(localStorage.getItem('minijuegos_favs')) || [],
  recent: JSON.parse(localStorage.getItem('minijuegos_recent')) || [],
  activeCategory: 'all',
  searchQuery: ''
};

// DOM Elements
const gamesGrid = document.getElementById('gamesGrid');
const searchInput = document.getElementById('searchInput');
const categoriesContainer = document.getElementById('categoriesContainer');
const recentList = document.getElementById('recentList');
const favoritesList = document.getElementById('favoritesList');
const showFavoritesBtn = document.getElementById('showFavoritesBtn');

// Modal Elements
const playerModal = document.getElementById('playerModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const closePlayerBtn = document.getElementById('closePlayerBtn');
const gameIframe = document.getElementById('gameIframe');
const modalGameTitle = document.getElementById('modalGameTitle');
const modalGameCategory = document.getElementById('modalGameCategory');
const modalGameDesc = document.getElementById('modalGameDesc');
const modalGameInstructions = document.getElementById('modalGameInstructions');
const modalFavBtn = document.getElementById('modalFavBtn');
const restartGameBtn = document.getElementById('restartGameBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

// Hero Elements
const heroSection = document.getElementById('heroSection');
const heroTitle = document.getElementById('heroTitle');
const heroDesc = document.getElementById('heroDesc');
const heroPlayBtn = document.getElementById('heroPlayBtn');

// Initialize portal
document.addEventListener('DOMContentLoaded', () => {
  loadGames();
  setupEventListeners();
});

// Fetch games registry
async function loadGames() {
  try {
    const response = await fetch('/site/games.json');
    if (!response.ok) throw new Error('Error al cargar games.json');
    state.games = await response.json();
    
    renderHero();
    renderGamesGrid();
    renderRecentList();
    renderFavoritesList();
  } catch (error) {
    console.error('Error loading games:', error);
    gamesGrid.innerHTML = `<p class="empty-state">Error al cargar los juegos: ${error.message}</p>`;
  }
}

// Setup listeners
function setupEventListeners() {
  // Search
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    renderGamesGrid();
  });

  // Categories
  categoriesContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('category-btn')) {
      // Toggle active styling
      document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      showFavoritesBtn.classList.remove('active');
      
      state.activeCategory = e.target.dataset.category;
      renderGamesGrid();
    }
  });

  // Favorites filter toggle in header
  showFavoritesBtn.addEventListener('click', () => {
    showFavoritesBtn.classList.toggle('active');
    
    // De-select category tabs
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    
    if (showFavoritesBtn.classList.contains('active')) {
      state.activeCategory = 'favorites';
    } else {
      state.activeCategory = 'all';
      const allBtn = document.querySelector('.category-btn[data-category="all"]');
      if (allBtn) allBtn.classList.add('active');
    }
    renderGamesGrid();
  });

  // Modal actions
  closePlayerBtn.addEventListener('click', closePlayer);
  modalBackdrop.addEventListener('click', closePlayer);

  restartGameBtn.addEventListener('click', () => {
    // Reload iframe
    const currentSrc = gameIframe.src;
    gameIframe.src = '';
    setTimeout(() => {
      gameIframe.src = currentSrc;
    }, 100);
  });

  fullscreenBtn.addEventListener('click', () => {
    const wrapper = document.querySelector('.iframe-wrapper');
    if (!document.fullscreenElement) {
      wrapper.requestFullscreen().catch(err => {
        console.error(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  });

  // If fullscreen state changes
  document.addEventListener('fullscreenchange', () => {
    const wrapper = document.querySelector('.iframe-wrapper');
    if (document.fullscreenElement) {
      wrapper.classList.add('fullscreen-mode');
      fullscreenBtn.innerHTML = '<i class="fa-solid fa-compress"></i>';
    } else {
      wrapper.classList.remove('fullscreen-mode');
      fullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
    }
  });
}

// Render Featured Hero
function renderHero() {
  if (state.games.length === 0) return;
  
  // Highlight the first game (Space Defender)
  const featured = state.games[0];
  heroTitle.textContent = featured.name;
  heroDesc.textContent = featured.description;
  
  // Dynamic gradient background style for the hero section
  heroSection.style.background = `linear-gradient(135deg, rgba(30, 20, 50, 0.95) 0%, rgba(10, 11, 16, 0.95) 100%)`;
  
  heroPlayBtn.onclick = () => openGame(featured.id);
}

// Render games grid
function renderGamesGrid() {
  gamesGrid.innerHTML = '';
  
  let filteredGames = state.games.filter(game => {
    // Category check
    if (state.activeCategory === 'favorites') {
      if (!state.favorites.includes(game.id)) return false;
    } else if (state.activeCategory !== 'all') {
      if (game.category !== state.activeCategory) return false;
    }
    
    // Search check
    if (state.searchQuery) {
      const matchName = game.name.toLowerCase().includes(state.searchQuery);
      const matchDesc = game.description.toLowerCase().includes(state.searchQuery);
      return matchName || matchDesc;
    }
    
    return true;
  });

  if (filteredGames.length === 0) {
    gamesGrid.innerHTML = '<p class="empty-state">No se encontraron juegos que coincidan con los filtros.</p>';
    return;
  }

  filteredGames.forEach(game => {
    const isFav = state.favorites.includes(game.id);
    const card = document.createElement('div');
    card.className = 'game-card';
    
    // Custom gradient style for the card thumbnail background based on game color
    const thumbStyle = `background: radial-gradient(circle at 50% 50%, ${game.color}25 0%, #0d0f17 100%)`;

    card.innerHTML = `
      <div class="card-img-wrapper" style="${thumbStyle}">
        <div class="card-img-placeholder">
          <img src="${game.thumbnail}" alt="${game.name}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%2312141f%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23${game.color.replace('#','')}%22 font-family=%22sans-serif%22 font-size=%2212%22 font-weight=%22bold%22>${game.name}</text></svg>';">
        </div>
        <button class="card-fav-btn ${isFav ? 'active' : ''}" data-id="${game.id}" title="Favorito">
          <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
        </button>
      </div>
      <div class="card-content">
        <div class="card-header-row">
          <span class="card-category" style="color: ${game.color}">${game.category}</span>
        </div>
        <h3 class="card-title">${game.name}</h3>
        <p class="card-desc">${game.description}</p>
        <div class="card-footer">
          <span class="play-badge" style="color: ${game.color}">
            Jugar <i class="fa-solid fa-arrow-right"></i>
          </span>
        </div>
      </div>
    `;

    // Click on favorite
    const favBtn = card.querySelector('.card-fav-btn');
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(game.id);
    });

    // Click on card body opens the game
    card.addEventListener('click', () => {
      openGame(game.id);
    });

    gamesGrid.appendChild(card);
  });
}

// Toggle Favorite state
function toggleFavorite(gameId) {
  const index = state.favorites.indexOf(gameId);
  if (index === -1) {
    state.favorites.push(gameId);
  } else {
    state.favorites.splice(index, 1);
  }
  
  localStorage.setItem('minijuegos_favs', JSON.stringify(state.favorites));
  
  renderGamesGrid();
  renderFavoritesList();
  updateModalFavBtnState(gameId);
}

// Update Favorite Button in modal
function updateModalFavBtnState(gameId) {
  if (!playerModal.classList.contains('hidden') && gameIframe.dataset.id === gameId) {
    const isFav = state.favorites.includes(gameId);
    if (isFav) {
      modalFavBtn.className = 'btn btn-secondary btn-full active';
      modalFavBtn.innerHTML = '<i class="fa-solid fa-heart"></i> Guardado en Favoritos';
    } else {
      modalFavBtn.className = 'btn btn-secondary btn-full';
      modalFavBtn.innerHTML = '<i class="fa-regular fa-heart"></i> Añadir a Favoritos';
    }
  }
}

// Add to Recent Games list
function addToRecent(gameId) {
  // Remove if already exists (to move to front)
  state.recent = state.recent.filter(id => id !== gameId);
  
  // Add to front
  state.recent.unshift(gameId);
  
  // Cap at 5 games
  if (state.recent.length > 5) {
    state.recent.pop();
  }
  
  localStorage.setItem('minijuegos_recent', JSON.stringify(state.recent));
  renderRecentList();
}

// Render Recent List
function renderRecentList() {
  recentList.innerHTML = '';
  
  const recentGames = state.recent
    .map(id => state.games.find(g => g.id === id))
    .filter(Boolean); // remove undefined if any

  if (recentGames.length === 0) {
    recentList.innerHTML = '<p class="empty-state">No has jugado nada recientemente.</p>';
    return;
  }

  recentGames.forEach(game => {
    const item = document.createElement('div');
    item.className = 'mini-game-item';
    item.innerHTML = `
      <div class="mini-img">
        <img src="${game.thumbnail}" alt="" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 100 100%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%2312141f%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23${game.color.replace('#','')}%22 font-family=%22sans-serif%22 font-size=%2224%22 font-weight=%22bold%22>${game.name[0]}</text></svg>';">
      </div>
      <div class="mini-info">
        <div class="mini-name">${game.name}</div>
        <div class="mini-cat" style="color: ${game.color}">${game.category}</div>
      </div>
      <div class="mini-play-btn"><i class="fa-solid fa-play"></i></div>
    `;
    
    item.onclick = () => openGame(game.id);
    recentList.appendChild(item);
  });
}

// Render Favorites list in sidebar
function renderFavoritesList() {
  favoritesList.innerHTML = '';
  
  const favGames = state.favorites
    .map(id => state.games.find(g => g.id === id))
    .filter(Boolean);

  if (favGames.length === 0) {
    favoritesList.innerHTML = '<p class="empty-state">No tienes favoritos guardados.</p>';
    return;
  }

  favGames.forEach(game => {
    const item = document.createElement('div');
    item.className = 'mini-game-item';
    item.innerHTML = `
      <div class="mini-img">
        <img src="${game.thumbnail}" alt="" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 100 100%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%2312141f%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23${game.color.replace('#','')}%22 font-family=%22sans-serif%22 font-size=%2224%22 font-weight=%22bold%22>${game.name[0]}</text></svg>';">
      </div>
      <div class="mini-info">
        <div class="mini-name">${game.name}</div>
        <div class="mini-cat" style="color: ${game.color}">${game.category}</div>
      </div>
      <div class="mini-play-btn"><i class="fa-solid fa-play"></i></div>
    `;
    
    item.onclick = () => openGame(game.id);
    favoritesList.appendChild(item);
  });
}

// Open Game modal
function openGame(gameId) {
  const game = state.games.find(g => g.id === gameId);
  if (!game) return;
  
  // Set iframe dataset and source
  gameIframe.dataset.id = gameId;
  gameIframe.src = game.path;
  
  // Populate sidebar details
  modalGameTitle.textContent = game.name;
  modalGameCategory.textContent = game.category;
  modalGameCategory.style.color = game.color;
  modalGameCategory.style.backgroundColor = `${game.color}15`;
  modalGameDesc.textContent = game.description;
  modalGameInstructions.textContent = game.instructions;

  // Favorite button action inside modal
  updateModalFavBtnState(gameId);
  modalFavBtn.onclick = () => toggleFavorite(gameId);

  // Show Modal
  playerModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Disable scroll on body
  
  // Add to recent list
  addToRecent(gameId);
}

// Close Game modal
function closePlayer() {
  playerModal.classList.add('hidden');
  gameIframe.src = '';
  document.body.style.overflow = 'auto'; // Re-enable body scroll
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restartButton');
const finalScoreEl = document.getElementById('finalScore');

// Web Audio API Synth for Retro Sounds
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type) {
  if (!audioCtx) return;
  
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'laser') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } else if (type === 'explosion') {
      // Noise buffer for explosion
      const bufferSize = audioCtx.sampleRate * 0.25;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.25);
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      noise.start();
      noise.stop(audioCtx.currentTime + 0.25);
    } else if (type === 'hit') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'level') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, audioCtx.currentTime);
      osc.frequency.setValueAtTime(440, audioCtx.currentTime + 0.1);
      osc.frequency.setValueAtTime(554, audioCtx.currentTime + 0.2);
      osc.frequency.setValueAtTime(660, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    }
  } catch (e) {
    console.error("Audio error", e);
  }
}

// Game State variables
let player = {
  x: 400,
  y: 530,
  width: 40,
  height: 30,
  speed: 6,
  color: '#00ffcc'
};

let keys = {};
let bullets = [];
let enemyBullets = [];
let enemies = [];
let particles = [];
let stars = [];
let score = 0;
let lives = 3;
let gameOver = false;
let gameStarted = false;
let enemySpeed = 1.0;
let level = 1;
let lastShot = 0;
const shotCooldown = 250; // ms

// Init stars (Parallax background)
for (let i = 0; i < 80; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 1.5 + 0.5
  });
}

// Event Listeners
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (['ArrowLeft', 'ArrowRight', 'Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
    e.preventDefault(); // Prevent page scrolling
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// Touch controls helper for Iframe integration
window.addEventListener('touchstart', (e) => {
  initAudio();
  const touchX = e.touches[0].clientX;
  const screenWidth = window.innerWidth;
  if (touchX < screenWidth / 2) {
    keys['ArrowLeft'] = true;
  } else {
    keys['ArrowRight'] = true;
  }
  keys['Space'] = true;
});

window.addEventListener('touchend', () => {
  keys['ArrowLeft'] = false;
  keys['ArrowRight'] = false;
  keys['Space'] = false;
});

startButton.addEventListener('click', () => {
  initAudio();
  startGame();
});

restartButton.addEventListener('click', () => {
  initAudio();
  startGame();
});

function startGame() {
  score = 0;
  lives = 3;
  level = 1;
  enemySpeed = 1.0;
  bullets = [];
  enemyBullets = [];
  enemies = [];
  particles = [];
  gameOver = false;
  gameStarted = true;
  player.x = canvas.width / 2 - player.width / 2;
  
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  
  updateUI();
  spawnEnemies();
  playSound('level');
  
  requestAnimationFrame(gameLoop);
}

function spawnEnemies() {
  enemies = [];
  const rows = 4 + Math.min(level, 2);
  const cols = 8;
  const cellWidth = 60;
  const cellHeight = 40;
  const startX = (canvas.width - (cols * cellWidth)) / 2;
  const startY = 80;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let type = 'easy';
      let color = '#39ff14'; // Neon Green
      let pts = 10;
      if (r === 0) {
        type = 'hard';
        color = '#ff007f'; // Hot Pink
        pts = 40;
      } else if (r <= 2) {
        type = 'medium';
        color = '#00e5ff'; // Cyan
        pts = 20;
      }

      enemies.push({
        x: startX + c * cellWidth + 10,
        y: startY + r * cellHeight,
        width: 36,
        height: 26,
        color: color,
        type: type,
        points: pts,
        dx: enemySpeed * (Math.random() > 0.5 ? 1 : -1),
        yAnchor: startY + r * cellHeight,
        shootCooldown: Math.random() * 5000 + 2000
      });
    }
  }
}

function createExplosion(x, y, color) {
  playSound('explosion');
  for (let i = 0; i < 15; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      radius: Math.random() * 3 + 1,
      color: color,
      life: 1.0,
      decay: Math.random() * 0.05 + 0.02
    });
  }
}

function updateUI() {
  scoreEl.textContent = String(score).padStart(4, '0');
  livesEl.textContent = '❤'.repeat(Math.max(0, lives));
}

// Check AABB Collision
function rectIntersect(r1, r2) {
  return r1.x < r2.x + r2.width &&
         r1.x + r1.width > r2.x &&
         r1.y < r2.y + r2.height &&
         r1.y + r1.height > r2.y;
}

function update(deltaTime) {
  if (gameOver) return;

  // Starfield animation
  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  });

  // Player controls
  if (keys['ArrowLeft'] || keys['KeyA']) {
    player.x = Math.max(0, player.x - player.speed);
  }
  if (keys['ArrowRight'] || keys['KeyD']) {
    player.x = Math.min(canvas.width - player.width, player.x + player.speed);
  }
  if (keys['Space']) {
    const now = Date.now();
    if (now - lastShot > shotCooldown) {
      bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 12,
        speed: 8,
        color: '#fff'
      });
      lastShot = now;
      playSound('laser');
    }
  }

  // Update Player Bullets
  bullets.forEach((bullet, index) => {
    bullet.y -= bullet.speed;
    if (bullet.y < 0) {
      bullets.splice(index, 1);
    }
  });

  // Update Enemy Bullets
  enemyBullets.forEach((bullet, index) => {
    bullet.y += bullet.speed;
    // Check hit player
    if (rectIntersect(bullet, player)) {
      enemyBullets.splice(index, 1);
      lives--;
      createExplosion(player.x + player.width/2, player.y + player.height/2, player.color);
      playSound('hit');
      updateUI();
      if (lives <= 0) {
        endGame();
      }
      return;
    }
    if (bullet.y > canvas.height) {
      enemyBullets.splice(index, 1);
    }
  });

  // Update Enemies
  let changeDirection = false;
  enemies.forEach(enemy => {
    enemy.x += enemy.dx;
    
    // Bounce walls
    if (enemy.x + enemy.width > canvas.width - 10 || enemy.x < 10) {
      changeDirection = true;
    }

    // Shoot
    enemy.shootCooldown -= deltaTime;
    if (enemy.shootCooldown <= 0) {
      enemyBullets.push({
        x: enemy.x + enemy.width / 2 - 2,
        y: enemy.y + enemy.height,
        width: 4,
        height: 10,
        speed: 4 + level * 0.5,
        color: '#ff3366'
      });
      enemy.shootCooldown = Math.random() * 6000 + 4000 - level * 500;
    }

    // Touch down gameover check
    if (enemy.y + enemy.height >= player.y) {
      endGame();
    }
  });

  if (changeDirection) {
    enemies.forEach(enemy => {
      enemy.dx = -enemy.dx;
      enemy.y += 12; // Descent
    });
  }

  // Collision bullet & enemies
  bullets.forEach((bullet, bIndex) => {
    enemies.forEach((enemy, eIndex) => {
      if (rectIntersect(bullet, enemy)) {
        createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);
        score += enemy.points;
        updateUI();
        
        enemies.splice(eIndex, 1);
        bullets.splice(bIndex, 1);
      }
    });
  });

  // Check Level Complete
  if (enemies.length === 0) {
    level++;
    enemySpeed += 0.3;
    playSound('level');
    spawnEnemies();
  }

  // Particles animation
  particles.forEach((part, index) => {
    part.x += part.vx;
    part.y += part.vy;
    part.life -= part.decay;
    if (part.life <= 0) {
      particles.splice(index, 1);
    }
  });
}

function draw() {
  // Clear Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Stars
  ctx.fillStyle = '#ffffff';
  stars.forEach(star => {
    ctx.globalAlpha = star.speed / 2;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });
  ctx.globalAlpha = 1.0;

  if (gameOver) return;

  // Draw Player (Spaceship UI shape)
  ctx.fillStyle = player.color;
  ctx.shadowBlur = 10;
  ctx.shadowColor = player.color;
  
  ctx.beginPath();
  ctx.moveTo(player.x + player.width / 2, player.y);
  ctx.lineTo(player.x, player.y + player.height);
  ctx.lineTo(player.x + player.width, player.y + player.height);
  ctx.closePath();
  ctx.fill();

  // Draw Player Bullets
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#ffffff';
  bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // Draw Enemy Bullets
  ctx.fillStyle = '#ff3366';
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#ff3366';
  enemyBullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // Draw Enemies
  enemies.forEach(enemy => {
    ctx.fillStyle = enemy.color;
    ctx.shadowColor = enemy.color;
    ctx.shadowBlur = 8;

    // Custom retro pixel shapes for alien enemies
    if (enemy.type === 'hard') {
      // Draw Octopus-like shape
      ctx.fillRect(enemy.x + 8, enemy.y + 4, 20, 10);
      ctx.fillRect(enemy.x + 4, enemy.y + 10, 28, 8);
      ctx.fillRect(enemy.x, enemy.y + 16, 6, 8);
      ctx.fillRect(enemy.x + 30, enemy.y + 16, 6, 8);
    } else if (enemy.type === 'medium') {
      // Draw Crab-like shape
      ctx.fillRect(enemy.x + 4, enemy.y, 28, 8);
      ctx.fillRect(enemy.x, enemy.y + 8, 36, 10);
      ctx.fillRect(enemy.x + 6, enemy.y + 18, 6, 8);
      ctx.fillRect(enemy.x + 24, enemy.y + 18, 6, 8);
    } else {
      // Draw Squid-like shape
      ctx.fillRect(enemy.x + 6, enemy.y + 2, 24, 12);
      ctx.fillRect(enemy.x, enemy.y + 12, 36, 6);
      ctx.fillRect(enemy.x + 2, enemy.y + 18, 6, 8);
      ctx.fillRect(enemy.x + 14, enemy.y + 18, 6, 8);
      ctx.fillRect(enemy.x + 28, enemy.y + 18, 6, 8);
    }
  });

  // Draw Particles
  ctx.shadowBlur = 0;
  particles.forEach(part => {
    ctx.globalAlpha = part.life;
    ctx.fillStyle = part.color;
    ctx.beginPath();
    ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1.0;
  ctx.shadowBlur = 0;
}

let lastTime = 0;
function gameLoop(time) {
  if (gameOver || !gameStarted) return;
  
  if (!lastTime) lastTime = time;
  const deltaTime = time - lastTime;
  lastTime = time;

  update(deltaTime);
  draw();

  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameOver = true;
  gameStarted = false;
  finalScoreEl.textContent = score;
  gameOverScreen.classList.remove('hidden');
}

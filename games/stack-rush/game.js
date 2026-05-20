const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restartButton');
const finalScoreEl = document.getElementById('finalScore');

// Web Audio API Synth
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type, pitchMultiplier = 1) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'hit') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300 * pitchMultiplier, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600 * pitchMultiplier, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'perfect') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440 * pitchMultiplier, audioCtx.currentTime);
      osc.frequency.setValueAtTime(554.37 * pitchMultiplier, audioCtx.currentTime + 0.08);
      osc.frequency.setValueAtTime(659.25 * pitchMultiplier, audioCtx.currentTime + 0.16);
      osc.frequency.exponentialRampToValueAtTime(880 * pitchMultiplier, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } else if (type === 'chop') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'lose') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    }
  } catch (e) {
    console.error("Audio error", e);
  }
}

// Game dimensions & settings
const BLOCK_HEIGHT = 30;
const BASE_Y = 500;
let stack = [];
let debris = [];
let particles = [];
let score = 0;
let combo = 0;
let gameOver = false;
let gameStarted = false;

// Active moving block
let currentBlock = {
  x: 0,
  y: 0,
  width: 200,
  speed: 4,
  direction: 1 // 1 = right, -1 = left
};

let cameraY = 0;
let targetCameraY = 0;

// Setup Event Listeners
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (gameStarted && !gameOver) {
      placeBlock();
    }
  }
});

canvas.addEventListener('mousedown', (e) => {
  initAudio();
  if (gameStarted && !gameOver) {
    placeBlock();
  }
});

canvas.addEventListener('touchstart', (e) => {
  initAudio();
  if (gameStarted && !gameOver) {
    placeBlock();
  }
  e.preventDefault();
}, { passive: false });

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
  combo = 0;
  gameOver = false;
  gameStarted = true;
  cameraY = 0;
  targetCameraY = 0;
  debris = [];
  particles = [];
  
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');

  // Spawn base block
  stack = [{
    x: (canvas.width - 200) / 2,
    y: BASE_Y,
    width: 200,
    color: getHueColor(0)
  }];

  setupNextBlock();
  updateUI();
  
  requestAnimationFrame(gameLoop);
}

function setupNextBlock() {
  const currentHeight = stack.length;
  const lastBlock = stack[currentHeight - 1];
  
  currentBlock.width = lastBlock.width;
  currentBlock.y = lastBlock.y - BLOCK_HEIGHT;
  currentBlock.x = currentBlock.direction === 1 ? -currentBlock.width : canvas.width;
  // Increase speed slightly with height
  currentBlock.speed = 4 + Math.min(currentHeight * 0.15, 6);
  
  // Adjust target camera scroll
  if (currentBlock.y < 300) {
    targetCameraY = BASE_Y - currentBlock.y - 200;
  }
}

function getHueColor(index) {
  const hue = (index * 15) % 360;
  return `hsl(${hue}, 85%, 55%)`;
}

function placeBlock() {
  const lastBlock = stack[stack.length - 1];
  const diff = currentBlock.x - lastBlock.x;
  
  // Check if completely missed
  if (Math.abs(diff) >= currentBlock.width) {
    // Drop whole block
    spawnDebris(currentBlock.x, currentBlock.y, currentBlock.width, getHueColor(stack.length));
    endGame();
    return;
  }

  // Perfect threshold
  const perfectThreshold = 5;
  if (Math.abs(diff) < perfectThreshold) {
    // Perfect placement!
    currentBlock.x = lastBlock.x; // snap
    combo++;
    score += 10 + combo * 5;
    
    // Play perfect chime
    const pitch = 1 + Math.min(combo * 0.05, 0.5);
    playSound('perfect', pitch);
    
    // Reward: expand width slightly if perfect combo
    if (combo >= 3) {
      currentBlock.width = Math.min(220, currentBlock.width + 12);
      currentBlock.x = Math.max(0, currentBlock.x - 6);
    }
    
    createPerfectParticles(currentBlock.x, currentBlock.y, currentBlock.width);
  } else {
    // Imperfect - chop overhang
    combo = 0;
    score += 10;
    playSound('hit');

    let newWidth = currentBlock.width - Math.abs(diff);
    let chopX, chopWidth;

    if (diff > 0) {
      // Overlap on the right, chop the right side overhang
      chopX = lastBlock.x + lastBlock.width;
      chopWidth = diff;
      currentBlock.x = lastBlock.x;
    } else {
      // Overlap on the left, chop the left side overhang
      chopX = currentBlock.x;
      chopWidth = -diff;
      currentBlock.x = lastBlock.x;
    }

    currentBlock.width = newWidth;
    spawnDebris(chopX, currentBlock.y, chopWidth, getHueColor(stack.length));
    playSound('chop');
  }

  // Add block to stack
  stack.push({
    x: currentBlock.x,
    y: currentBlock.y,
    width: currentBlock.width,
    color: getHueColor(stack.length - 1)
  });

  updateUI();
  setupNextBlock();
}

function spawnDebris(x, y, width, color) {
  debris.push({
    x: x,
    y: y,
    width: width,
    height: BLOCK_HEIGHT,
    color: color,
    vy: -2,
    vx: (Math.random() - 0.5) * 4,
    rotation: 0,
    vRotation: (Math.random() - 0.5) * 0.1,
    gravity: 0.4,
    opacity: 1
  });
}

function createPerfectParticles(x, y, width) {
  // Glow sparks at corners
  const colors = ['#ffffff', '#ffff00', '#00ff88', '#00ffff'];
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: x + Math.random() * width,
      y: y + BLOCK_HEIGHT/2,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      radius: Math.random() * 4 + 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1.0,
      decay: Math.random() * 0.05 + 0.02
    });
  }
}

function updateUI() {
  scoreEl.textContent = score;
  comboEl.textContent = combo;
}

function update() {
  if (gameOver) return;

  // Move active block
  currentBlock.x += currentBlock.speed * currentBlock.direction;

  // Bounce active block off wall boundaries
  if (currentBlock.x + currentBlock.width > canvas.width) {
    currentBlock.x = canvas.width - currentBlock.width;
    currentBlock.direction = -1;
  } else if (currentBlock.x < 0) {
    currentBlock.x = 0;
    currentBlock.direction = 1;
  }

  // Camera smooth follow
  cameraY += (targetCameraY - cameraY) * 0.1;

  // Update Debris (falling physics)
  debris.forEach((deb, index) => {
    deb.vy += deb.gravity;
    deb.x += deb.vx;
    deb.y += deb.vy;
    deb.rotation += deb.vRotation;
    deb.opacity -= 0.015;

    if (deb.y > canvas.height + cameraY || deb.opacity <= 0) {
      debris.splice(index, 1);
    }
  });

  // Update Particles
  particles.forEach((p, index) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    if (p.life <= 0) {
      particles.splice(index, 1);
    }
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  // Apply camera scroll
  ctx.translate(0, cameraY);

  // Draw Grid Lines (cool background grid)
  ctx.strokeStyle = 'rgba(0, 255, 136, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, -cameraY);
    ctx.lineTo(x, canvas.height - cameraY);
    ctx.stroke();
  }
  for (let y = -Math.floor(cameraY); y < canvas.height - cameraY; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw Stack
  stack.forEach(block => {
    ctx.fillStyle = block.color;
    ctx.shadowColor = block.color;
    ctx.shadowBlur = 8;
    ctx.fillRect(block.x, block.y, block.width, BLOCK_HEIGHT);
    // Bevel highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(block.x, block.y, block.width, 3);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(block.x, block.y + BLOCK_HEIGHT - 3, block.width, 3);
  });

  // Draw Debris
  ctx.shadowBlur = 0;
  debris.forEach(deb => {
    ctx.save();
    ctx.globalAlpha = deb.opacity;
    ctx.translate(deb.x + deb.width/2, deb.y + deb.height/2);
    ctx.rotate(deb.rotation);
    ctx.fillStyle = deb.color;
    ctx.fillRect(-deb.width/2, -deb.height/2, deb.width, deb.height);
    ctx.restore();
  });
  ctx.globalAlpha = 1.0;

  // Draw Particles
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1.0;

  // Draw Current block
  if (!gameOver) {
    ctx.fillStyle = getHueColor(stack.length);
    ctx.shadowColor = getHueColor(stack.length);
    ctx.shadowBlur = 12;
    ctx.fillRect(currentBlock.x, currentBlock.y, currentBlock.width, BLOCK_HEIGHT);
    
    // Top shiny line
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(currentBlock.x, currentBlock.y, currentBlock.width, 3);
  }

  ctx.restore();
}

function gameLoop() {
  if (gameOver || !gameStarted) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameOver = true;
  gameStarted = false;
  playSound('lose');
  finalScoreEl.textContent = score;
  gameOverScreen.classList.remove('hidden');
}

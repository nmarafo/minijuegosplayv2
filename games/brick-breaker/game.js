const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
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

function playSound(type) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'hit_paddle') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'hit_brick') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } else if (type === 'hit_wall') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.06);
    } else if (type === 'powerup') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'lose') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'win') {
      osc.type = 'sine';
      const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C
      notes.forEach((freq, idx) => {
        const noteOsc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        noteOsc.type = 'sine';
        noteOsc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.1);
        noteGain.gain.setValueAtTime(0.1, audioCtx.currentTime + idx * 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.1 + 0.3);
        noteOsc.connect(noteGain);
        noteGain.connect(audioCtx.destination);
        noteOsc.start(audioCtx.currentTime + idx * 0.1);
        noteOsc.stop(audioCtx.currentTime + idx * 0.1 + 0.3);
      });
    }
  } catch (e) {
    console.error("Audio error", e);
  }
}

// Game settings
let paddle = {
  x: 350,
  y: 540,
  width: 100,
  height: 15,
  color: '#ff00ff', // Pink
  speed: 10
};

let balls = [];
let bricks = [];
let particles = [];
let powerups = [];
let score = 0;
let lives = 3;
let gameOver = false;
let gameStarted = false;
let level = 1;

let keys = {};
let mouseX = null;

// Event Listeners
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (['ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// Mouse controls
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
});

// Touch controls
canvas.addEventListener('touchmove', (e) => {
  initAudio();
  const rect = canvas.getBoundingClientRect();
  if (e.touches.length > 0) {
    mouseX = e.touches[0].clientX - rect.left;
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
  lives = 3;
  level = 1;
  balls = [];
  bricks = [];
  particles = [];
  powerups = [];
  gameOver = false;
  gameStarted = true;
  paddle.width = 100;
  
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  
  resetBall();
  spawnBricks();
  updateUI();
  playSound('win');
  
  requestAnimationFrame(gameLoop);
}

function resetBall() {
  balls = [{
    x: paddle.x + paddle.width / 2,
    y: paddle.y - 12,
    vx: (Math.random() - 0.5) * 6,
    vy: -6,
    radius: 8,
    color: '#00ffff' // Cyan
  }];
}

function spawnBricks() {
  bricks = [];
  const rows = 4 + Math.min(level, 2);
  const cols = 10;
  const brickWidth = 70;
  const brickHeight = 20;
  const gap = 8;
  const offsetTop = 60;
  const offsetLeft = (canvas.width - (cols * (brickWidth + gap) - gap)) / 2;

  const colors = ['#ff0055', '#ff00aa', '#aa00ff', '#00e5ff', '#39ff14'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({
        x: offsetLeft + c * (brickWidth + gap),
        y: offsetTop + r * (brickHeight + gap),
        width: brickWidth,
        height: brickHeight,
        color: colors[r % colors.length],
        points: (rows - r) * 10,
        active: true
      });
    }
  }
}

function createSparks(x, y, color) {
  for (let i = 0; i < 10; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      radius: Math.random() * 2 + 1,
      color: color,
      life: 1.0,
      decay: Math.random() * 0.06 + 0.03
    });
  }
}

function updateUI() {
  scoreEl.textContent = String(score).padStart(4, '0');
  livesEl.textContent = '❤'.repeat(Math.max(0, lives));
}

function update() {
  if (gameOver) return;

  // Update Paddle
  if (mouseX !== null) {
    paddle.x = mouseX - paddle.width / 2;
  } else {
    if (keys['ArrowLeft'] || keys['KeyA']) {
      paddle.x -= paddle.speed;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
      paddle.x += paddle.speed;
    }
  }
  
  // Constrain Paddle
  paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));

  // Update Balls
  balls.forEach((ball, bIndex) => {
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Bounce walls
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.vx = -ball.vx;
      playSound('hit_wall');
    }
    if (ball.x + ball.radius > canvas.width) {
      ball.x = canvas.width - ball.radius;
      ball.vx = -ball.vx;
      playSound('hit_wall');
    }
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy = -ball.vy;
      playSound('hit_wall');
    }

    // Hit bottom (lose ball)
    if (ball.y + ball.radius > canvas.height) {
      balls.splice(bIndex, 1);
      if (balls.length === 0) {
        lives--;
        playSound('lose');
        updateUI();
        if (lives <= 0) {
          endGame();
        } else {
          resetBall();
        }
      }
      return;
    }

    // Bounce Paddle
    if (ball.y + ball.radius >= paddle.y && 
        ball.y - ball.radius <= paddle.y + paddle.height &&
        ball.x >= paddle.x && 
        ball.x <= paddle.x + paddle.width) {
      
      playSound('hit_paddle');
      
      // Calculate angle based on where ball hits paddle
      const hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      const angle = hitPoint * (Math.PI / 3); // Max 60 degrees bounce
      
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      ball.vx = speed * Math.sin(angle);
      ball.vy = -speed * Math.cos(angle);
      ball.y = paddle.y - ball.radius; // reset pos to avoid double hit
    }

    // Bounce Bricks
    bricks.forEach((brick) => {
      if (!brick.active) return;

      // Ball AABB check
      const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
      const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
      const distanceX = ball.x - closestX;
      const distanceY = ball.y - closestY;
      const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

      if (distanceSquared < (ball.radius * ball.radius)) {
        brick.active = false;
        createSparks(closestX, closestY, brick.color);
        playSound('hit_brick');
        score += brick.points;
        updateUI();

        // Bounce physics logic
        if (Math.abs(distanceX) > Math.abs(distanceY)) {
          ball.vx = -ball.vx;
        } else {
          ball.vy = -ball.vy;
        }

        // Powerup drop chance (15%)
        if (Math.random() < 0.15) {
          const types = ['WIDEN', 'SLOW', 'MULTI'];
          const randType = types[Math.floor(Math.random() * types.length)];
          powerups.push({
            x: brick.x + brick.width / 2,
            y: brick.y + brick.height,
            type: randType,
            width: 14,
            height: 14,
            speed: 2.5
          });
        }
      }
    });
  });

  // Update Powerups
  powerups.forEach((pu, index) => {
    pu.y += pu.speed;
    
    // Check collect
    if (pu.y + pu.height >= paddle.y && 
        pu.y <= paddle.y + paddle.height &&
        pu.x + pu.width >= paddle.x && 
        pu.x <= paddle.x + paddle.width) {
      
      playSound('powerup');
      applyPowerup(pu.type);
      powerups.splice(index, 1);
      return;
    }

    // Out of bounds
    if (pu.y > canvas.height) {
      powerups.splice(index, 1);
    }
  });

  // Check Win Condition
  if (bricks.filter(b => b.active).length === 0) {
    level++;
    playSound('win');
    spawnBricks();
    resetBall();
    // Reduce paddle size slightly as difficulty
    paddle.width = Math.max(60, paddle.width - 5);
  }

  // Update Particles
  particles.forEach((part, index) => {
    part.x += part.vx;
    part.y += part.vy;
    part.life -= part.decay;
    if (part.life <= 0) {
      particles.splice(index, 1);
    }
  });
}

function applyPowerup(type) {
  if (type === 'WIDEN') {
    paddle.width = Math.min(180, paddle.width + 40);
    // Shrink back after 8 seconds
    setTimeout(() => {
      paddle.width = Math.max(60, paddle.width - 40);
    }, 8000);
  } else if (type === 'SLOW') {
    balls.forEach(ball => {
      ball.vx *= 0.65;
      ball.vy *= 0.65;
      // Revert speed after 8 seconds
      setTimeout(() => {
        ball.vx /= 0.65;
        ball.vy /= 0.65;
      }, 8000);
    });
  } else if (type === 'MULTI') {
    if (balls.length > 0) {
      const baseBall = balls[0];
      balls.push({
        x: baseBall.x,
        y: baseBall.y,
        vx: baseBall.vx + 2,
        vy: baseBall.vy,
        radius: baseBall.radius,
        color: '#ff00aa'
      });
      balls.push({
        x: baseBall.x,
        y: baseBall.y,
        vx: baseBall.vx - 2,
        vy: baseBall.vy,
        radius: baseBall.radius,
        color: '#aa00ff'
      });
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameOver) return;

  // Draw Paddle
  ctx.fillStyle = paddle.color;
  ctx.shadowBlur = 12;
  ctx.shadowColor = paddle.color;
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

  // Draw Balls
  balls.forEach(ball => {
    ctx.fillStyle = ball.color;
    ctx.shadowColor = ball.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw Bricks
  bricks.forEach(brick => {
    if (!brick.active) return;
    ctx.fillStyle = brick.color;
    ctx.shadowColor = brick.color;
    ctx.shadowBlur = 6;
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    // Draw brick inner border
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
  });

  // Draw Powerups
  powerups.forEach(pu => {
    let color = '#fff';
    if (pu.type === 'WIDEN') color = '#ff00ff';
    if (pu.type === 'SLOW') color = '#00ffff';
    if (pu.type === 'MULTI') color = '#39ff14';
    
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    
    // Draw power-up as a rotating or glowing shape
    ctx.fillRect(pu.x - pu.width/2, pu.y - pu.height/2, pu.width, pu.height);
    
    // Add text inside
    ctx.fillStyle = '#000';
    ctx.font = '8px monospace';
    ctx.fillText(pu.type[0], pu.x - 3, pu.y + 3);
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

function gameLoop() {
  if (gameOver || !gameStarted) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameOver = true;
  gameStarted = false;
  finalScoreEl.textContent = score;
  gameOverScreen.classList.remove('hidden');
}

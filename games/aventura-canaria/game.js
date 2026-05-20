const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelNameEl = document.getElementById('levelName');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restartButton');
const winScreen = document.getElementById('winScreen');
const winPlayAgainButton = document.getElementById('winPlayAgainButton');
const mobileControls = document.getElementById('mobileControls');

// Audio Context
let audioCtx = null;
let musicInterval = null;
let currentStep = 0;
let isPlayingMusic = false;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Procedural Canarian Timple / Guitar Synthesizer
function playTimpleNote(freq, startTime, duration = 0.25) {
  if (!audioCtx) return;
  
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, startTime);
  
  // Plucked string envelope
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(400, startTime);
  filter.frequency.exponentialRampToValueAtTime(1000, startTime + 0.05);
  
  gainNode.gain.setValueAtTime(0.0, startTime);
  gainNode.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc.start(startTime);
  osc.stop(startTime + duration);
}

// Strum a chord with slight delay between strings to simulate a timple/guitar
function strumTimpleChord(notes, startTime, duration = 0.3) {
  notes.forEach((freq, idx) => {
    // 15ms delay between each string strum
    playTimpleNote(freq, startTime + (idx * 0.015), duration);
  });
}

// Isa/Folía Chords (Canarian traditional rhythm)
// C Major (Do), F Major (Fa), G Major (Sol), C Major (Do)
const CHORD_C = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
const CHORD_F = [261.63, 349.23, 440.00, 523.25]; // C4, F4, A4, C5
const CHORD_G = [293.66, 392.00, 493.88, 587.33]; // D4, G4, B4, D5

// Music loop sequence
const MUSIC_SEQUENCE = [
  CHORD_C, CHORD_C, CHORD_C, CHORD_C,
  CHORD_F, CHORD_F, CHORD_F, CHORD_F,
  CHORD_G, CHORD_G, CHORD_G, CHORD_G,
  CHORD_C, CHORD_C, CHORD_C, CHORD_C
];

function startMusic() {
  if (isPlayingMusic) return;
  isPlayingMusic = true;
  currentStep = 0;
  
  const stepTime = 250; // ms per beat (120 BPM)
  
  musicInterval = setInterval(() => {
    if (!audioCtx || audioCtx.state === 'suspended') return;
    
    const now = audioCtx.currentTime;
    const chord = MUSIC_SEQUENCE[currentStep];
    
    // Play strumming pattern
    // Strum on beat 1, simple pluck/strum on beat 3
    if (currentStep % 2 === 0) {
      strumTimpleChord(chord, now, 0.4);
    } else {
      // Arpeggiate notes
      playTimpleNote(chord[0], now, 0.15);
      playTimpleNote(chord[2], now + 0.08, 0.15);
    }
    
    currentStep = (currentStep + 1) % MUSIC_SEQUENCE.length;
  }, stepTime);
}

function stopMusic() {
  if (musicInterval) {
    clearInterval(musicInterval);
  }
  isPlayingMusic = false;
}

// Sound effects synthesizer
function playSFX(type) {
  if (!audioCtx) return;
  
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    
    if (type === 'jump') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.16);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'collect') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.07); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.14); // G5
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'hurt') {
      // Noise burst for impact
      const bufferSize = audioCtx.sampleRate * 0.2;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);
      
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.15, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      noise.start(now);
      noise.stop(now + 0.2);
    } else if (type === 'win_level') {
      // Fanfare
      const notes = [392, 523, 659, 784, 1046];
      notes.forEach((freq, idx) => {
        const noteOsc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        noteOsc.type = 'sine';
        noteOsc.frequency.setValueAtTime(freq, now + idx * 0.08);
        noteGain.gain.setValueAtTime(0.08, now + idx * 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        noteOsc.connect(noteGain);
        noteGain.connect(audioCtx.destination);
        noteOsc.start(now + idx * 0.08);
        noteOsc.stop(now + idx * 0.08 + 0.25);
      });
    }
  } catch (e) {
    console.error(e);
  }
}

// Game Constants
const GRAVITY = 0.5;
const WALK_SPEED = 4;
const JUMP_FORCE = -11.5;

// Game State
let player = {
  x: 100,
  y: 400,
  vx: 0,
  vy: 0,
  width: 32,
  height: 48,
  grounded: false,
  facingRight: true,
  walkTimer: 0,
  squashX: 1,
  squashY: 1
};

let keys = {};
let score = 0;
let lives = 3;
let currentLevel = 0;
let gameOver = false;
let gameStarted = false;
let gameWon = false;

let platforms = [];
let items = [];
let enemies = [];
let particles = [];
let levelDoor = { x: 0, y: 0, width: 40, height: 60 };

let cameraX = 0;
let mapWidth = 2400; // Multi-screen scrolling!

// Particle System
function spawnParticle(x, y, vx, vy, color, size = 4, maxLife = 1.0) {
  particles.push({
    x, y, vx, vy, color, size,
    life: maxLife,
    decay: Math.random() * 0.04 + 0.01
  });
}

function updateParticles() {
  particles.forEach((p, idx) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    if (p.life <= 0) {
      particles.splice(idx, 1);
    }
  });
}

function drawParticles() {
  ctx.save();
  ctx.translate(-cameraX, 0);
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

// Vector Character Drawing (Organic procedural Guanche)
function drawGuanche(ctx, p) {
  ctx.save();
  ctx.translate(p.x + p.width/2, p.y + p.height/2);
  
  // Apply squash and stretch
  ctx.scale(p.squashX, p.squashY);
  
  // Direction facing
  const dir = p.facingRight ? 1 : -1;
  ctx.scale(dir, 1);

  // Walk Animation timing
  let walkAngle = 0;
  if (Math.abs(p.vx) > 0.2 && p.grounded) {
    walkAngle = Math.sin(p.walkTimer * 0.15) * 0.6; // legs sway
  }

  // 1. Drew Legs (Back leg first)
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#d7ccc8'; // brown skin tone
  
  // Back leg
  ctx.beginPath();
  ctx.moveTo(-4, 10);
  ctx.lineTo(-4 + Math.sin(walkAngle) * 8, 22);
  ctx.stroke();
  
  // Front leg
  ctx.beginPath();
  ctx.moveTo(4, 10);
  ctx.lineTo(4 - Math.sin(walkAngle) * 8, 22);
  ctx.stroke();

  // 2. Torso (Traditional Guanche Tamar tunic made of goat skin)
  ctx.fillStyle = '#8d6e63'; // Brown leather color
  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 1.5;
  
  ctx.beginPath();
  ctx.moveTo(-10, -12);
  ctx.lineTo(10, -12);
  ctx.lineTo(12, 12);
  ctx.lineTo(-12, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Leather waistband/belt
  ctx.fillStyle = '#ffcc00'; // Yellow accent
  ctx.fillRect(-12, 2, 24, 4);

  // 3. Head & Hair
  // Head
  ctx.fillStyle = '#e0a080'; // tan skin
  ctx.beginPath();
  ctx.arc(0, -20, 8, 0, Math.PI * 2);
  ctx.fill();

  // Headband (Cinta guanche)
  ctx.fillStyle = '#3a86c8'; // Blue ribbon
  ctx.fillRect(-8, -23, 16, 2.5);

  // Hair
  ctx.fillStyle = '#3e2723'; // Dark brown hair
  ctx.beginPath();
  ctx.arc(-2, -22, 9, Math.PI, Math.PI * 2);
  ctx.fill();
  
  // Long hair strand back
  ctx.fillRect(-9, -20, 4, 12);

  // Face details (Eyes looking forward)
  ctx.fillStyle = '#000000';
  ctx.fillRect(3, -21, 2, 2);

  // 4. Arms
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#d7ccc8';
  
  // Back arm
  ctx.beginPath();
  ctx.moveTo(-8, -8);
  ctx.lineTo(-12 - Math.sin(walkAngle) * 5, 2);
  ctx.stroke();
  
  // Front arm
  ctx.beginPath();
  ctx.moveTo(8, -8);
  ctx.lineTo(12 + Math.sin(walkAngle) * 5, 2);
  ctx.stroke();

  ctx.restore();
}

// Level Configurations
const LEVELS = [
  {
    // Level 1: Tenerife (Volcán)
    name: "ISLA 1: TENERIFE - Las Tierras de Fuego",
    bgColor: "#080302",
    platformColor: "#1d1918",
    platformEdgeColor: "#ff4400",
    doorColor: "#ffcc00",
    init: function() {
      // Spawn Platforms
      platforms = [
        { x: 0, y: 520, w: 500, h: 80, type: 'normal' },
        { x: 600, y: 520, w: 400, h: 80, type: 'normal' },
        { x: 1100, y: 460, w: 300, h: 30, type: 'normal' },
        { x: 1480, y: 380, w: 250, h: 30, type: 'normal' },
        { x: 1800, y: 480, w: 600, h: 120, type: 'normal' },
        
        // Lava pits
        { x: 500, y: 570, w: 100, h: 30, type: 'lava' },
        { x: 1000, y: 570, w: 800, h: 30, type: 'lava' },
        
        // High helper blocks
        { x: 250, y: 380, w: 120, h: 20, type: 'normal' },
        { x: 750, y: 380, w: 120, h: 20, type: 'normal' },
        { x: 2100, y: 360, w: 150, h: 20, type: 'normal' }
      ];

      // Spawn Items (Pintaderas)
      items = [
        { x: 300, y: 330, collected: false },
        { x: 750, y: 470, collected: false },
        { x: 1250, y: 410, collected: false },
        { x: 1600, y: 330, collected: false },
        { x: 2150, y: 300, collected: false }
      ];

      // Spawn Enemies
      enemies = [
        { x: 350, y: 480, minX: 100, maxX: 450, vx: 1.5, type: 'lava_slime', color: '#ff3300' },
        { x: 700, y: 480, minX: 620, maxX: 950, vx: -2, type: 'lava_slime', color: '#ff3300' },
        { x: 1900, y: 440, minX: 1820, maxX: 2350, vx: 2.2, type: 'lava_slime', color: '#ff3300' }
      ];

      // Set Door (Drago Tree portal) at level end
      levelDoor.x = 2250;
      levelDoor.y = 420;
    },
    drawBackground: function() {
      // Draw Sunset Volcanic Gradient Sky
      let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0a030b');
      grad.addColorStop(0.5, '#2b090b');
      grad.addColorStop(1, '#6c1b0c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield (slow scroll)
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 30; i++) {
        let x = (Math.sin(i * 12345) * 0.5 + 0.5) * canvas.width;
        let y = (Math.cos(i * 54321) * 0.5 + 0.5) * (canvas.height - 200);
        ctx.fillRect(x - (cameraX * 0.03) % canvas.width, y, 1.5, 1.5);
      }

      // Parallax Level 1: Teide Volcano Silhouette
      ctx.fillStyle = '#1c080b';
      ctx.beginPath();
      // Centered mountain peak
      let peakX = canvas.width/2 - (cameraX * 0.1);
      ctx.moveTo(peakX - 350, canvas.height);
      ctx.lineTo(peakX, canvas.height - 280); // Peak
      ctx.lineTo(peakX + 10, canvas.height - 280); // Flat peak (Teide caldera shape)
      ctx.lineTo(peakX + 380, canvas.height);
      ctx.closePath();
      ctx.fill();
      
      // Draw lava vein on the volcano silhouette
      ctx.strokeStyle = '#ff3300';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(peakX + 5, canvas.height - 280);
      ctx.lineTo(peakX - 10, canvas.height - 240);
      ctx.lineTo(peakX - 5, canvas.height - 180);
      ctx.stroke();

      // Parallax Level 2: Dark closer mountains
      ctx.fillStyle = '#120406';
      ctx.beginPath();
      let startX = -(cameraX * 0.25);
      ctx.moveTo(startX, canvas.height);
      ctx.lineTo(startX + 200, canvas.height - 120);
      ctx.lineTo(startX + 500, canvas.height - 180);
      ctx.lineTo(startX + 800, canvas.height - 100);
      ctx.lineTo(startX + 1200, canvas.height - 140);
      ctx.lineTo(startX + 1500, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Ash/fire ember particles falling down
      if (Math.random() < 0.25) {
        spawnParticle(cameraX + Math.random() * canvas.width, 0, -1 - Math.random(), 1 + Math.random() * 2, '#ff6600', Math.random()*2+1, 2.0);
      }
    }
  },
  {
    // Level 2: La Gomera (Laurisilva Forest)
    name: "ISLA 2: LA GOMERA - El Bosque de Garajonay",
    bgColor: "#030a05",
    platformColor: "#172b1a",
    platformEdgeColor: "#00ff88",
    doorColor: "#00ff88",
    init: function() {
      platforms = [
        { x: 0, y: 520, w: 400, h: 80, type: 'normal' },
        { x: 500, y: 440, w: 250, h: 30, type: 'normal' },
        { x: 850, y: 370, w: 200, h: 30, type: 'normal' },
        { x: 1150, y: 450, w: 300, h: 30, type: 'normal' },
        { x: 1550, y: 350, w: 100, h: 20, type: 'normal' },
        { x: 1750, y: 420, w: 150, h: 20, type: 'normal' },
        { x: 1980, y: 500, w: 500, h: 100, type: 'normal' },
        
        // Thorns (Spikes)
        { x: 400, y: 580, w: 1580, h: 20, type: 'spikes' },
        
        // Extra high platform nodes
        { x: 200, y: 360, w: 100, h: 20, type: 'normal' },
        { x: 1350, y: 280, w: 120, h: 20, type: 'normal' }
      ];

      items = [
        { x: 250, y: 300, collected: false },
        { x: 620, y: 380, collected: false },
        { x: 950, y: 310, collected: false },
        { x: 1400, y: 220, collected: false },
        { x: 2100, y: 440, collected: false }
      ];

      enemies = [
        { x: 200, y: 480, minX: 30, maxX: 350, vx: 1.8, type: 'forest_bug', color: '#00ffaa' },
        { x: 1250, y: 410, minX: 1160, maxX: 1420, vx: -2, type: 'forest_bug', color: '#00ffaa' },
        { x: 2150, y: 460, minX: 2000, maxX: 2380, vx: 1.5, type: 'forest_bug', color: '#00ffaa' }
      ];

      levelDoor.x = 2300;
      levelDoor.y = 440;
    },
    drawBackground: function() {
      // Lush forest gradient
      let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#020b08');
      grad.addColorStop(0.5, '#051d10');
      grad.addColorStop(1, '#0e3a1f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      for (let i = 0; i < 20; i++) {
        let x = (Math.sin(i * 321) * 0.5 + 0.5) * canvas.width;
        let y = (Math.cos(i * 654) * 0.5 + 0.5) * 150;
        ctx.fillRect(x - (cameraX * 0.05) % canvas.width, y, 1, 1);
      }

      // Forest silhouettes
      ctx.fillStyle = '#061d0f';
      ctx.beginPath();
      let startX1 = -(cameraX * 0.12);
      ctx.moveTo(startX1, canvas.height);
      ctx.quadraticCurveTo(startX1 + 100, canvas.height - 180, startX1 + 250, canvas.height - 260);
      ctx.quadraticCurveTo(startX1 + 400, canvas.height - 180, startX1 + 550, canvas.height - 300);
      ctx.quadraticCurveTo(startX1 + 700, canvas.height - 200, startX1 + 900, canvas.height);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#031109';
      ctx.beginPath();
      let startX2 = -(cameraX * 0.28);
      ctx.moveTo(startX2, canvas.height);
      ctx.lineTo(startX2 + 100, canvas.height - 120);
      ctx.lineTo(startX2 + 250, canvas.height - 180);
      ctx.lineTo(startX2 + 400, canvas.height - 100);
      ctx.lineTo(startX2 + 650, canvas.height - 160);
      ctx.lineTo(startX2 + 800, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Green spores floating around (bioluminescence)
      if (Math.random() < 0.15) {
        spawnParticle(cameraX + Math.random() * canvas.width, Math.random() * canvas.height, (Math.random()-0.5)*0.5, (Math.random()-0.5)*0.5, '#00ff88', Math.random()*3+1, 3.0);
      }
    }
  },
  {
    // Level 3: Gran Canaria / Fuerteventura (Dunas al atardecer)
    name: "ISLA 3: GRAN CANARIA - Las Dunas de Maspalomas",
    bgColor: "#090915",
    platformColor: "#2c220f",
    platformEdgeColor: "#ffcc00",
    doorColor: "#00ffff",
    init: function() {
      platforms = [
        { x: 0, y: 520, w: 450, h: 80, type: 'normal' },
        
        // Moving platform
        { x: 550, y: 440, w: 150, h: 20, type: 'moving', minX: 520, maxX: 780, vx: 1.5 },
        
        { x: 800, y: 360, w: 300, h: 30, type: 'normal' },
        
        // Moving platform vertical
        { x: 1200, y: 450, w: 150, h: 20, type: 'moving_y', minY: 320, maxY: 500, vy: 1.2 },
        
        { x: 1450, y: 320, w: 250, h: 30, type: 'normal' },
        { x: 1780, y: 440, w: 200, h: 20, type: 'normal' },
        { x: 2050, y: 520, w: 400, h: 80, type: 'normal' },
        
        // Sea hazards below (resets)
        { x: 450, y: 580, w: 1600, h: 20, type: 'lava' } // behaves like lava (insta-hurt)
      ];

      items = [
        { x: 200, y: 440, collected: false },
        { x: 620, y: 380, collected: false },
        { x: 950, y: 280, collected: false },
        { x: 1550, y: 240, collected: false },
        { x: 2200, y: 440, collected: false }
      ];

      enemies = [
        { x: 250, y: 480, minX: 50, maxX: 400, vx: 2, type: 'sand_crab', color: '#ffcc00' },
        { x: 920, y: 320, minX: 810, maxX: 1080, vx: -1.5, type: 'sand_crab', color: '#ffcc00' },
        { x: 2150, y: 480, minX: 2060, maxX: 2360, vx: 2.5, type: 'sand_crab', color: '#ffcc00' }
      ];

      levelDoor.x = 2250;
      levelDoor.y = 460;
    },
    drawBackground: function() {
      // Golden Sunset gradient
      let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0a0d24');
      grad.addColorStop(0.4, '#1b1b46');
      grad.addColorStop(0.7, '#6b3252');
      grad.addColorStop(0.9, '#a66a38');
      grad.addColorStop(1, '#ffc060');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Sunset Sun
      let sunX = canvas.width * 0.7 - (cameraX * 0.05);
      let sunY = canvas.height - 120;
      let sunGrad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 70);
      sunGrad.addColorStop(0, '#ffffff');
      sunGrad.addColorStop(0.2, '#ffffcc');
      sunGrad.addColorStop(0.5, 'rgba(255, 204, 0, 0.4)');
      sunGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
      ctx.fill();

      // Parallax layer: Sea and dunas silhouette
      ctx.fillStyle = '#221535';
      ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

      // Sand dunes curvature
      ctx.fillStyle = '#3a242c';
      ctx.beginPath();
      let startX = -(cameraX * 0.2);
      ctx.moveTo(startX, canvas.height);
      ctx.quadraticCurveTo(startX + 200, canvas.height - 140, startX + 450, canvas.height - 90);
      ctx.quadraticCurveTo(startX + 700, canvas.height - 170, startX + 900, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Palm silhouettes
      ctx.fillStyle = '#1c0f1b';
      let palmX = canvas.width * 0.2 - (cameraX * 0.25);
      ctx.fillRect(palmX, canvas.height - 180, 8, 100);
      ctx.beginPath();
      ctx.arc(palmX + 4, canvas.height - 180, 25, 0, Math.PI, true);
      ctx.fill();
    }
  }
];

// Touch Event Listeners mapping for mobile virtual buttons
function setupMobileControls() {
  const detectTouch = () => {
    mobileControls.classList.remove('hidden');
    // Once touch is detected, remove listener
    window.removeEventListener('touchstart', detectTouch);
  };
  window.addEventListener('touchstart', detectTouch);

  // Left button
  const btnLeft = document.getElementById('btnLeft');
  btnLeft.addEventListener('touchstart', (e) => { keys['ArrowLeft'] = true; e.preventDefault(); });
  btnLeft.addEventListener('touchend', (e) => { keys['ArrowLeft'] = false; e.preventDefault(); });

  // Right button
  const btnRight = document.getElementById('btnRight');
  btnRight.addEventListener('touchstart', (e) => { keys['ArrowRight'] = true; e.preventDefault(); });
  btnRight.addEventListener('touchend', (e) => { keys['ArrowRight'] = false; e.preventDefault(); });

  // Jump button
  const btnJump = document.getElementById('btnJump');
  btnJump.addEventListener('touchstart', (e) => { keys['Space'] = true; e.preventDefault(); });
  btnJump.addEventListener('touchend', (e) => { keys['Space'] = false; e.preventDefault(); });
}

// Window Event Listeners
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (['ArrowLeft', 'ArrowRight', 'Space', 'ArrowUp', 'KeyW', 'KeyA', 'KeyD'].includes(e.code)) {
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

startButton.addEventListener('click', () => {
  initAudio();
  startGame();
});

restartButton.addEventListener('click', () => {
  initAudio();
  startGame();
});

winPlayAgainButton.addEventListener('click', () => {
  initAudio();
  startGame();
});

function startGame() {
  score = 0;
  lives = 3;
  currentLevel = 0;
  gameOver = false;
  gameWon = false;
  gameStarted = true;
  particles = [];
  
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  winScreen.classList.add('hidden');

  resetPlayer();
  loadLevel(currentLevel);
  
  stopMusic();
  startMusic();
  
  requestAnimationFrame(gameLoop);
}

function resetPlayer() {
  player.x = 80;
  player.y = 350;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
}

function loadLevel(idx) {
  const levelData = LEVELS[idx];
  levelNameEl.textContent = levelData.name;
  levelData.init();
  cameraX = 0;
  updateUI();
  playSFX('win_level');
}

function updateUI() {
  scoreEl.textContent = score;
  livesEl.textContent = '❤'.repeat(Math.max(0, lives));
}

// AABB Collision utility
function getIntersection(r1, r2) {
  const r1Left = r1.x;
  const r1Right = r1.x + r1.width;
  const r1Top = r1.y;
  const r1Bottom = r1.y + r1.height;
  
  const r2Left = r2.x;
  const r2Right = r2.x + r2.width;
  const r2Top = r2.y;
  const r2Bottom = r2.y + r2.height;

  if (r1Right <= r2Left || r1Left >= r2Right || r1Bottom <= r2Top || r1Top >= r2Bottom) {
    return null; // No collision
  }

  // Calculate overlapping dimensions
  const overlapX = Math.min(r1Right, r2Right) - Math.max(r1Left, r2Left);
  const overlapY = Math.min(r1Bottom, r2Bottom) - Math.max(r1Top, r2Top);
  
  return { x: overlapX, y: overlapY };
}

function update() {
  if (gameOver || gameWon) return;

  // 1. Horizontal movement
  let moveDir = 0;
  if (keys['ArrowLeft'] || keys['KeyA']) {
    moveDir = -1;
    player.facingRight = false;
  }
  if (keys['ArrowRight'] || keys['KeyD']) {
    moveDir = 1;
    player.facingRight = true;
  }

  player.vx = moveDir * WALK_SPEED;
  player.x += player.vx;
  
  // Constrain boundary
  player.x = Math.max(0, Math.min(mapWidth - player.width, player.x));

  // Walk animation step timer
  if (player.vx !== 0 && player.grounded) {
    player.walkTimer += 1;
  } else {
    player.walkTimer = 0;
  }

  // Horizontal platform collisions
  platforms.forEach(plat => {
    if (plat.type === 'lava' || plat.type === 'spikes') return;
    
    let overlap = getIntersection(player, plat);
    if (overlap) {
      // Resolve horizontal
      if (player.vx > 0) {
        player.x -= overlap.x;
      } else if (player.vx < 0) {
        player.x += overlap.x;
      }
      player.vx = 0;
    }
  });

  // 2. Vertical movement (Gravity)
  player.vy += GRAVITY;
  player.y += player.vy;

  // Ground check flag reset
  player.grounded = false;

  // Vertical platform collisions
  platforms.forEach(plat => {
    if (plat.type === 'lava' || plat.type === 'spikes') return;

    let overlap = getIntersection(player, plat);
    if (overlap) {
      // Resolve vertical
      if (player.vy > 0) {
        // Standing on top of platform
        player.y -= overlap.y;
        player.vy = 0;
        player.grounded = true;
        
        // Squash effect on landing
        if (player.squashY < 0.95) {
          player.squashY = 0.8;
          player.squashX = 1.2;
        }
      } else if (player.vy < 0) {
        // Head bump
        player.y += overlap.y;
        player.vy = 0;
      }
    }
  });

  // Restore squash/stretch values smoothly
  player.squashX += (1 - player.squashX) * 0.15;
  player.squashY += (1 - player.squashY) * 0.15;

  // 3. Jump Trigger
  if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && player.grounded) {
    player.vy = JUMP_FORCE;
    player.grounded = false;
    playSFX('jump');
    // Stretch animation effect on jump
    player.squashY = 1.25;
    player.squashX = 0.8;
  }

  // 4. Moving platforms update
  platforms.forEach(plat => {
    if (plat.type === 'moving') {
      plat.x += plat.vx;
      if (plat.x + plat.w > plat.maxX || plat.x < plat.minX) {
        plat.vx = -plat.vx;
      }
      // If player stands on it, carry them along
      if (player.grounded && player.y + player.height === plat.y && 
          player.x + player.width >= plat.x && player.x <= plat.x + plat.w) {
        player.x += plat.vx;
      }
    } else if (plat.type === 'moving_y') {
      plat.y += plat.vy;
      if (plat.y + plat.h > plat.maxY || plat.y < plat.minY) {
        plat.vy = -plat.vy;
      }
      // If player stands on it, carry them along vertically
      if (player.grounded && player.y + player.height === plat.y + plat.vy && 
          player.x + player.width >= plat.x && player.x <= plat.x + plat.w) {
        player.y += plat.vy;
      }
    }
  });

  // 5. Lava & Spikes hazard hits
  platforms.forEach(plat => {
    if (plat.type === 'lava' || plat.type === 'spikes') {
      let overlap = getIntersection(player, {
        x: plat.x,
        y: plat.y + 4, // smaller box for spikes/lava
        width: plat.w,
        height: plat.h - 4
      });
      if (overlap) {
        handlePlayerHurt();
      }
    }
  });

  // 6. Camera scrolling (Horizontal follow)
  let targetCamX = player.x - canvas.width / 2 + player.width / 2;
  cameraX += (targetCamX - cameraX) * 0.1;
  cameraX = Math.max(0, Math.min(mapWidth - canvas.width, cameraX));

  // 7. Items (Pintaderas) Collection
  items.forEach(item => {
    if (!item.collected) {
      // Collision bounding box
      let itemBox = { x: item.x, y: item.y, width: 20, height: 20 };
      if (getIntersection(player, itemBox)) {
        item.collected = true;
        score++;
        playSFX('collect');
        updateUI();
        
        // Spawn chimes particles
        for(let i=0; i<8; i++) {
          spawnParticle(item.x + 10, item.y + 10, (Math.random()-0.5)*3, (Math.random()-0.5)*3, '#ffcc00', Math.random()*2+2, 1.0);
        }
      }
    }
  });

  // 8. Enemies logic
  enemies.forEach(en => {
    en.x += en.vx;
    if (en.x > en.maxX || en.x < en.minX) {
      en.vx = -en.vx;
    }

    let enBox = { x: en.x, y: en.y, width: 28, height: 24 };
    let overlap = getIntersection(player, enBox);
    if (overlap) {
      // If jumping down on enemy head, squash enemy
      if (player.vy > 0 && player.y + player.height - player.vy <= en.y + 8) {
        playSFX('collect');
        player.vy = JUMP_FORCE * 0.7; // bounce
        // Kill enemy
        enemies.splice(enemies.indexOf(en), 1);
        score += 2; // reward
        updateUI();
        
        // Particles
        for(let i=0; i<10; i++) {
          spawnParticle(en.x + 14, en.y + 12, (Math.random()-0.5)*4, (Math.random()-0.5)*4, en.color, Math.random()*2+2, 0.8);
        }
      } else {
        // Hurt player
        handlePlayerHurt();
      }
    }
  });

  // 9. Door Check (Win / Next Island Portal)
  let doorBox = { x: levelDoor.x, y: levelDoor.y, width: levelDoor.width, height: levelDoor.height };
  if (getIntersection(player, doorBox)) {
    if (score >= (currentLevel + 1) * 5) { // collected all items for the level
      nextLevel();
    }
  }

  // Update particles
  updateParticles();
}

function handlePlayerHurt() {
  lives--;
  playSFX('hurt');
  updateUI();
  
  // Flash particles
  for(let i=0; i<20; i++) {
    spawnParticle(player.x + player.width/2, player.y + player.height/2, (Math.random()-0.5)*8, (Math.random()-0.5)*8, '#ff3b3b', Math.random()*3+2, 1.2);
  }

  if (lives <= 0) {
    endGame(false);
  } else {
    resetPlayer();
  }
}

function nextLevel() {
  currentLevel++;
  if (currentLevel < LEVELS.length) {
    loadLevel(currentLevel);
  } else {
    endGame(true);
  }
}

function draw() {
  // 1. Draw Parallax Background (Level customized)
  LEVELS[currentLevel].drawBackground();

  ctx.save();
  // Translate camera offset
  ctx.translate(-cameraX, 0);

  // 2. Draw level Door (Drago Tree Portal)
  drawDragoTree(ctx, levelDoor.x, levelDoor.y, score >= (currentLevel + 1) * 5);

  // 3. Draw Platforms
  platforms.forEach(plat => {
    ctx.shadowBlur = 0;
    if (plat.type === 'lava') {
      ctx.fillStyle = '#ff3300';
      ctx.shadowColor = '#ff3300';
      ctx.shadowBlur = 10;
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      
      // Floating lava bubbles
      if (Math.random() < 0.05) {
        spawnParticle(plat.x + Math.random() * plat.w, plat.y, 0, -Math.random()*2, '#ffaa00', Math.random()*2+1, 1.0);
      }
    } else if (plat.type === 'spikes') {
      ctx.fillStyle = '#455a64';
      // Draw triangular spikes
      const spikeWidth = 10;
      for (let sx = plat.x; sx < plat.x + plat.w; sx += spikeWidth) {
        ctx.beginPath();
        ctx.moveTo(sx, plat.y + plat.h);
        ctx.lineTo(sx + spikeWidth/2, plat.y);
        ctx.lineTo(sx + spikeWidth, plat.y + plat.h);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Normal platform
      ctx.fillStyle = LEVELS[currentLevel].platformColor;
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      
      // Platform top edge glow line
      ctx.fillStyle = LEVELS[currentLevel].platformEdgeColor;
      ctx.shadowColor = LEVELS[currentLevel].platformEdgeColor;
      ctx.shadowBlur = 6;
      ctx.fillRect(plat.x, plat.y, plat.w, 4);
    }
    ctx.shadowBlur = 0;
  });

  // 4. Draw Items (Pintaderas - Canarian aboriginal symbol)
  items.forEach(item => {
    if (!item.collected) {
      drawPintadera(ctx, item.x, item.y);
    }
  });

  // 5. Draw Enemies
  enemies.forEach(en => {
    ctx.fillStyle = en.color;
    ctx.shadowColor = en.color;
    ctx.shadowBlur = 8;
    
    // Draw bouncing element
    if (en.type === 'sand_crab') {
      // Crab shape
      ctx.fillRect(en.x, en.y + 6, 28, 14);
      ctx.fillRect(en.x + 2, en.y, 4, 6); // eyes
      ctx.fillRect(en.x + 22, en.y, 4, 6);
      ctx.fillRect(en.x - 2, en.y + 12, 4, 8); // legs
      ctx.fillRect(en.x + 26, en.y + 12, 4, 8);
    } else if (en.type === 'forest_bug') {
      // Glowing green forest bug
      ctx.beginPath();
      ctx.arc(en.x + 14, en.y + 10, 10, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#ffffff'; // eyes
      ctx.fillRect(en.x + 12, en.y + 4, 2, 2);
      ctx.fillRect(en.x + 16, en.y + 4, 2, 2);
    } else {
      // Lava Slime (Volcán)
      ctx.beginPath();
      ctx.moveTo(en.x, en.y + 24);
      ctx.quadraticCurveTo(en.x + 14, en.y - 4, en.x + 28, en.y + 24);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  });

  // 6. Draw Player
  drawGuanche(ctx, player);

  ctx.restore();

  // 7. Draw overlay particles (glow, embers)
  drawParticles();
}

// Draw a beautiful vector Pintadera (Circular aboriginal pattern)
function drawPintadera(ctx, x, y) {
  ctx.save();
  ctx.translate(x + 10, y + 10);
  
  // Neon glow yellow
  ctx.fillStyle = '#ffcc00';
  ctx.shadowColor = '#ffcc00';
  ctx.shadowBlur = 10;
  
  // Base circle
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner brown details to resemble clay pintadera stamp pattern
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#3e2723';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.stroke();
  
  // Center cross / geometric pattern
  ctx.beginPath();
  ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
  ctx.moveTo(0, -4); ctx.lineTo(0, 4);
  ctx.stroke();
  
  ctx.restore();
}

// Draw a beautiful vector Drago Tree (Portal to next island)
function drawDragoTree(ctx, x, y, unlocked) {
  ctx.save();
  ctx.translate(x + 20, y + 30);
  
  // 1. Draw thick trunk
  ctx.fillStyle = '#5d4037'; // brown trunk
  ctx.beginPath();
  ctx.moveTo(-15, 30);
  ctx.lineTo(-6, -10);
  ctx.lineTo(6, -10);
  ctx.lineTo(15, 30);
  ctx.closePath();
  ctx.fill();
  
  // Branch splits (characteristic Drago tree shape)
  ctx.beginPath();
  ctx.moveTo(-6, -10);
  ctx.lineTo(-14, -28);
  ctx.lineTo(-6, -28);
  ctx.lineTo(0, -10);
  ctx.lineTo(6, -28);
  ctx.lineTo(14, -28);
  ctx.lineTo(6, -10);
  ctx.closePath();
  ctx.fill();
  
  // 2. Canopy / Foliage (Drago crown)
  ctx.fillStyle = '#1b5e20'; // deep green
  if (unlocked) {
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
  }
  
  // Draw spiked umbrella shapes
  ctx.beginPath();
  ctx.arc(-10, -28, 14, 0, Math.PI*2);
  ctx.arc(10, -28, 14, 0, Math.PI*2);
  ctx.arc(0, -32, 16, 0, Math.PI*2);
  ctx.fill();
  
  ctx.shadowBlur = 0;

  // 3. Draw active glowing portal effect inside foliage if unlocked
  if (unlocked) {
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, -15, 8 + Math.sin(Date.now() * 0.005) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  ctx.restore();
}

let lastTime = 0;
function gameLoop(time) {
  if (gameOver || gameWon || !gameStarted) return;

  if (!lastTime) lastTime = time;
  const deltaTime = time - lastTime;
  lastTime = time;

  update();
  draw();

  requestAnimationFrame(gameLoop);
}

function endGame(won) {
  gameOver = !won;
  gameWon = won;
  gameStarted = false;
  
  stopMusic();

  if (won) {
    winScreen.classList.remove('hidden');
    playSFX('win_level');
  } else {
    gameOverScreen.classList.remove('hidden');
  }
}

// Initialize Mobile button interactions
setupMobileControls();

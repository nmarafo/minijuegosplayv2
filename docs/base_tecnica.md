# Skill de Desarrollo de Videojuegos: Base Técnica de MinijuegosPlay V2

Esta guía define las directrices y estándares técnicos obligatorios para la creación y publicación de nuevos minijuegos en el portal **MinijuegosPlay V2**. Siguiendo estas directrices garantizamos una experiencia premium, interactiva y de carga ultra-rápida.

---

## 1. Uso de SVG (Scalable Vector Graphics)
Los gráficos vectoriales (SVG) son el estándar para el renderizado visual de nuestros juegos. Evita el uso de archivos PNG/JPG pesados o pixelados.

### ¿Por qué SVG?
* **Escalabilidad infinita**: Se ven nítidos en pantallas 4K, retinas de móviles y pantallas antiguas.
* **Manipulación directa**: Se pueden animar con CSS y JS como elementos del DOM, o dibujar en Canvas convirtiéndolos en imágenes virtuales.
* **Peso pluma**: Un archivo SVG de un personaje complejo ocupa apenas unos pocos kilobytes.

### Ejemplo de Implementación (Animar Personaje SVG mediante CSS):
```html
<svg id="hero-ship" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="80" height="80">
  <defs>
    <!-- Filtro de brillo neón -->
    <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <!-- Cuerpo de nave -->
  <polygon points="50,10 20,80 80,80" fill="#00ffcc" filter="url(#neon-glow)" />
  <!-- Propulsor animado -->
  <polygon class="engine-fire" points="40,80 50,98 60,80" fill="#ff007f" />
</svg>

<style>
  @keyframes flicker {
    0% { transform: scaleY(1); opacity: 0.9; }
    100% { transform: scaleY(1.3); opacity: 1; }
  }
  .engine-fire {
    transform-origin: 50% 80%;
    animation: flicker 0.1s infinite alternate;
  }
</style>
```

---

## 2. Profundidad mediante Parallax Scrolling
Cada juego debe crear una sensación de inmersión y tridimensionalidad usando múltiples capas de fondo que se mueven a diferentes velocidades respecto al movimiento del jugador o la cámara.

### Capas recomendadas:
1. **Fondo Lejano (Capa 0)**: Estrellas estáticas o gradientes de espacio profundo (Velocidad: 5% - 10%).
2. **Fondo Medio (Capa 1)**: Nebulosas, nubes o siluetas distantes (Velocidad: 20% - 30%).
3. **Capa del Juego (Capa 2)**: Obstáculos, enemigos y jugador (Velocidad: 100%).
4. **Primer Plano (Capa 3 - Opcional)**: Partículas flotantes que pasan muy rápido frente a la pantalla (Velocidad: 130% - 150%).

### Ejemplo de Fórmulas en Canvas JS:
```javascript
// Actualización del fondo parallax en el bucle del juego
function updateParallax(cameraX, cameraY) {
  // Capa 1: Estrellas distantes (lento)
  backgroundStars.x = -(cameraX * 0.1);
  backgroundStars.y = -(cameraY * 0.1);

  // Capa 2: Nebulosas medias (medio)
  backgroundNebula.x = -(cameraX * 0.4);
  backgroundNebula.y = -(cameraY * 0.4);
  
  // Capa 3: El juego (100% de velocidad de cámara)
  player.x = realPlayerX - cameraX;
  player.y = realPlayerY - cameraY;
}
```

---

## 3. Efectos Lumínicos y Neón
El estilo artístico visual de la plataforma exige estética retro-futurista de alta calidad. Esto se logra mediante efectos de iluminación artificial y glows.

### Métodos recomendados:
* **En CSS**: Usa combinaciones de `box-shadow` y `filter: drop-shadow()`.
* **En Canvas 2D**: Utiliza `ctx.shadowBlur` y `ctx.shadowColor` antes de renderizar figuras de neón.
* **En SVG**: Utiliza filtros de desenfoque gaussianos (`feGaussianBlur`) integrados.

### Ejemplo de Iluminación en Canvas:
```javascript
function drawNeonBall(ctx, x, y, radius, color) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  
  // Configuración del resplandor neón
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.fillStyle = color;
  ctx.fill();
  
  // Núcleo blanco para dar sensación de intensidad de luz
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}
```

---

## 4. Efectos Sonoros y Música de Fondo (Web Audio API)
Para evitar la carga lenta y el consumo excesivo de red de archivos `.mp3` o `.wav`, los juegos **deben sintetizar su propio audio en tiempo real** utilizando la Web Audio API del navegador.

### Ventajas:
* Cero consumo de ancho de banda.
* Latencia ultra-baja en dispositivos móviles.
* Modificaciones y cambios de tono en tiempo real.

### Sintetizador de Efectos Comunes:
```javascript
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  const now = audioCtx.currentTime;
  
  if (type === 'laser') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === 'hit') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.1);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  }
}
```

---

## 5. Control Dual (Desktop y Dispositivo Móvil)
Todos los juegos deben ser 100% responsivos y soportar controles táctiles en smartphones y tabletas, además de teclado/ratón en ordenadores.

### Implementación del input dual:
1. **Mouse / Touch en Canvas**: Mapea las coordenadas en base al tamaño relativo del contenedor (usando `getBoundingClientRect()`).
2. **Eventos táctiles**: Utiliza `touchstart`, `touchmove` y `touchend` llamando siempre a `e.preventDefault()` para evitar zoom o scroll accidental en móviles.
3. **Controles virtuales**: Si el juego requiere controles direccionales, dibuja un joystick virtual o botones táctiles flotantes si se detecta un dispositivo móvil.

### Detección de Dispositivos:
```javascript
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobile) {
  // Renderizar botones táctiles en pantalla o activar giroscopio/touch.
  setupTouchControls();
} else {
  // Activar controladores de eventos de teclado (keydown/keyup).
  setupKeyboardControls();
}
```

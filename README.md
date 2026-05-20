# MinijuegosPlay V2

Un portal de miniguegos web premium diseñado con tecnologías web puras (**HTML5, CSS3, JavaScript**). Cuenta con una interfaz moderna con modo oscuro, diseño *glassmorphic*, buscador en tiempo real, guardado de favoritos e historial mediante `localStorage`, y un reproductor de juegos integrado en la misma pantalla.

El repositorio está dividido en dos carpetas principales, manteniendo la plataforma y los juegos completamente aislados.

---

## Estructura del Repositorio

```
/
├── site/                     # Código de la plataforma portal
│   ├── css/
│   │   └── style.css         # Diseño premium y responsive (Glassmorphism)
│   ├── js/
│   │   └── app.js            # Lógica (favoritos, recientes, buscador, modal)
│   ├── assets/               # Miniaturas de los juegos
│   ├── games.json            # Registro de metadatos de los juegos
│   └── index.html            # Estructura principal y reproductor
│
├── games/                    # Directorio independiente para los juegos
│   ├── space-defender/       # Shooter arcade espacial en Canvas
│   ├── brick-breaker/        # Rompe-ladrillos estilo neón
│   └── stack-rush/           # Juego de apilar bloques con combos
│
├── server.js                 # Servidor de desarrollo ligero (Node.js nativo)
└── README.md                 # Documentación
```

---

## Cómo Ejecutar en Local

Para evitar restricciones de CORS del navegador al cargar los miniguegos dentro del iframe del reproductor, hemos creado un servidor web ligero integrado que utiliza los módulos nativos de Node.js (sin dependencias de `npm`).

1. Asegúrate de tener instalado [Node.js](https://nodejs.org/).
2. Abre una terminal en la raíz del proyecto y ejecuta:
   ```bash
   node server.js
   ```
3. Abre tu navegador e ingresa a la siguiente dirección:
   [http://localhost:3000/site/index.html](http://localhost:3000/site/index.html)

---

## Cómo Añadir un Nuevo Minijuego

Añadir un nuevo minijuego es un proceso sumamente sencillo y modular:

### Paso 1: Crear los archivos del minijuego
Crea una nueva carpeta dentro del directorio `/games/` (por ejemplo, `/games/mi-juego/`) e implementa tu minijuego web.
Asegúrate de que el archivo de entrada principal se llame `index.html`.

> [!TIP]
> Para mantener la coherencia estética de la plataforma, te sugerimos utilizar una paleta de colores oscuros/neón, tipografías atractivas (por ejemplo, de Google Fonts) y un lienzo responsivo que se adapte bien dentro de un tamaño estándar de `800x600`.

### Paso 2: Agregar una miniatura (Thumbnail)
Guarda una imagen o banner que represente al juego en la ruta:
`/site/assets/mi_juego.png` (se recomienda una relación de aspecto de 16:9).

### Paso 3: Registrar el juego en `games.json`
Edita el archivo `/site/games.json` y añade un nuevo objeto al final del array con la información de tu juego:

```json
  {
    "id": "mi-juego",
    "name": "Nombre de mi Juego",
    "description": "Una descripción breve pero emocionante de lo que trata tu juego.",
    "category": "Categoría (por ejemplo, Acción, Estrategia, Arcade, etc.)",
    "path": "/games/mi-juego/index.html",
    "thumbnail": "/site/assets/mi_juego.png",
    "instructions": "Instrucciones de cómo jugar (por ejemplo, Usa W/A/S/D para moverte y Click para disparar).",
    "color": "#color-hex-representativo (por ejemplo: #ff00ff para fucsia)"
  }
```

Al guardar los cambios, la plataforma detectará el nuevo juego automáticamente, lo incluirá en el listado y creará sus correspondientes filtros.

# NEON RIFT

Un arcade de supervivencia espacial para navegador. Pilota una nave de iones por seis sectores, combina mejoras y destruye el Núcleo. Arte procedural en Canvas 2D, partículas, sonido y música sintetizados en tiempo real. Sin dependencias externas ni descargas de recursos.

## Ejecutar

Node.js 24 o superior:

```sh
cd /workspace/pruebas
npm run dev
```

El servidor escucha en el puerto 4173. `PORT` permite cambiarlo. Abre el juego en un navegador moderno. No hace falta ejecutar `npm install` ni compilar.

```sh
npm test
npm run check
```

Las pruebas cubren combate, colisiones continuas, invulnerabilidad, mejoras, progresión, pausa, puntuación y una incursión completa hasta el jefe.

## Controles

- **WASD / flechas:** movimiento.
- **Ratón + clic mantenido / F:** apuntar y disparar.
- **Espacio / Shift / clic derecho:** dash con invulnerabilidad y daño por contacto.
- **E:** colapso al cargarlo con fragmentos azules; daña enemigos y elimina proyectiles cercanos.
- **Esc / P:** pausa.
- **1 / 2 / 3:** elegir mejora entre oleadas.
- **Móvil:** joystick táctil, apuntado y disparo automáticos, botones de dash y pulso.

Elimina todos los enemigos de cada oleada para elegir una mejora. Las mejoras se acumulan. En la sexta oleada, destruye el Núcleo para ganar. Encadena bajas sin recibir daño para multiplicar tu puntuación. Los fragmentos verdes recuperan integridad. Se recuperan 12 puntos al entrar en un nuevo sector.

El récord y la preferencia de sonido se guardan localmente cuando el navegador permite almacenamiento. La partida se pausa al perder el foco. El juego respeta la preferencia de movimiento reducido para las animaciones de menú y el temblor de cámara.

## Estructura

- `src/rift.js`: simulación independiente de la interfaz, oleadas, combate y mejoras.
- `src/main.js`: render, efectos, audio, controles e interfaz.
- `src/styles.css`: diseño adaptable.
- `test/rift.test.js`: pruebas con el runner nativo de Node.
- `server.js`: servidor local sin dependencias.

El sitio es estático: `index.html` y `src/` se pueden servir en GitHub Pages. El flujo existente de CI valida el juego antes de publicar.

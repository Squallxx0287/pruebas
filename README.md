# MultiplicaClub

Juego infantil para aprender las tablas de multiplicar del **1 al 12**. Ilustraciones originales del bosque, un zorrito acompañante, pistas con grupos de estrellas, música breve y medallas. No hay cronómetro, vidas, anuncios ni registro.

- **Aprender:** consulta las 144 cuentas y entiende la multiplicación como grupos iguales y suma repetida.
- **Practicar:** 12 ejercicios por tabla, desde multiplicar por 1 hasta multiplicar por 12.
- **Aventura:** 10 ejercicios distintos en orden sorpresa, de una tabla o mezclando las doce. Da prioridad a las cuentas todavía no aprendidas.
- **Mis logros:** cada cuenta distinta resuelta añade una estrella. Hay tres hitos por tabla y seis medallas. Equivocarse muestra una pista y permite seguir intentando; usar pistas no reduce la recompensa.

El progreso se guarda en este navegador mediante `localStorage`, sin datos personales. Puede borrarse desde Mis logros, con confirmación. Si el almacenamiento no está disponible se puede seguir jugando. La asistente **Luna** acompaña los retos, explica pistas, anima después de los errores y celebra los aciertos. Su voz utiliza la síntesis de voz del navegador: prefiere voces femeninas conocidas en español (por ejemplo, Mónica, Paulina, Elvira o Dalia), y permite seleccionar otra voz, ajustar la velocidad, escuchar una prueba, detenerla o desactivar la guía automática. No solicita micrófono. Las voces disponibles y su sonido dependen del dispositivo; no se incluye ni se clona la voz de Alexa o Siri. Los efectos musicales y la guía de voz tienen controles independientes.

## Ejecutar y verificar

```sh
cd /workspace/pruebas
npm run dev
```

Node.js 24. Puerto predeterminado 4173; variable `PORT` opcional. No necesita instalación de dependencias ni compilación. Los dibujos SVG, las fuentes y el código se sirven desde el propio sitio.

```sh
npm test
npm run check
```

Las pruebas cubren las 144 multiplicaciones y sus distractores, las doce tablas, los retos mezclados, reintentos, pistas, avance, progreso, almacenamiento dañado y medallas. También se mantienen las pruebas del juego de zombis.

En los retos: clic o toque para responder; teclas **1–4** para elegir, **H** para ver una pista y **Enter** para avanzar después de acertar. Las páginas funcionan con teclado, botones táctiles y lectores de pantalla; respetan la preferencia de movimiento reducido.

## Publicación

GitHub Pages publica `index.html`, `zombies.html`, `.nojekyll` y `src/` al actualizar `main`, después de validar pruebas y sintaxis.

- MultiplicaClub: https://squallxx0287.github.io/pruebas/
- DEADZONE, conservado por separado: https://squallxx0287.github.io/pruebas/zombies.html

La documentación del juego anterior está en [DEADZONE.md](./DEADZONE.md).

## Archivos y licencias

- `src/multiplica/model.js`: preguntas, sesiones y progreso.
- `src/multiplica/art.js`: iconos, zorrito y dibujos educativos.
- `src/multiplica/main.js`: interfaz, navegación, controles, audio y persistencia.
- `src/multiplica/voice.js`: elección de voz española, narración de Luna y control de reproducción.
- `src/multiplica/styles.css`: diseño adaptable.
- `src/multiplica/assets/forest.svg`: ilustración original.
- `test/multiplica.test.js`: pruebas del aprendizaje y la progresión.

Nunito y Fredoka se incluyen localmente bajo SIL Open Font License; sus licencias, versiones y hashes están en `src/multiplica/assets/`. El juego anterior conserva Three.js y su licencia MIT en `src/vendor/`.

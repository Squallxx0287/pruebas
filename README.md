# DEADZONE — Protocolo Cero

FPS de supervivencia contra zombis para navegador. Cinco niveles con hordas crecientes, un jefe distinto al final de cada nivel y diez armas disponibles desde el comienzo. Escenarios, personajes, armas, texturas, efectos y audio generados localmente. Gráficos 3D procedurales de estilo cinematográfico, con materiales físicos, sombras, niebla, iluminación ambiental, fuego y partículas.

## Ejecutar

Requiere Node.js 24 para el servidor y las pruebas. Para jugar se necesita un navegador moderno con **WebGL 2**; se recomienda aceleración gráfica por hardware.

```sh
cd /workspace/pruebas
npm run dev
```

Puerto predeterminado: 4173. `PORT` permite cambiarlo. No hace falta instalar paquetes ni compilar: Three.js 0.170.0 está incluido en `src/vendor/`, con licencia MIT y procedencia verificable. El juego no descarga modelos, audio ni bibliotecas de otros dominios.

```sh
npm test
npm run check
```

Las 20 pruebas verifican colisiones, impactos en cabeza/cuerpo, cobertura, movimiento, saltos, recargas, diez armas, granadas, explosiones, fuego persistente, navegación, suministros, pausa, ataques de jefes y progresión hasta la victoria. También incluyen un combate simulado que completa la primera horda y su jefe usando entradas de movimiento, apuntado, disparo y recarga.

## Controles

| Acción       | Control                                            |
| ------------ | -------------------------------------------------- |
| Movimiento   | WASD / flechas                                     |
| Mirar        | Mover el ratón, sin mantener clic                  |
| Disparar     | Clic izquierdo; mantener para armas automáticas    |
| Apuntar      | Mantener clic derecho; mira telescópica con el AWP |
| Recargar     | R                                                  |
| Correr       | Shift, consume resistencia                         |
| Saltar       | Barra espaciadora                                  |
| Agacharse    | Mantener C                                         |
| Granada      | G, tres por nivel                                  |
| Linterna     | F                                                  |
| Cambiar arma | 1–9 y 0, o rueda del ratón                         |
| Arsenal      | Tab                                                |
| Pausa        | Esc / P                                            |

En móvil: joystick izquierdo, deslizar en el área derecha para mirar, botones para disparar, apuntar, recargar, cambiar arma y lanzar granadas. Al perder el foco se pausa la partida.

## Campaña

| Nivel | Zona         | Horda | Jefe                                    |
| ----- | ------------ | ----: | --------------------------------------- |
| 1     | El Distrito  |    12 | El Carnicero: embestidas                |
| 2     | Muelle 13    |    22 | El Acechador: cargas rápidas            |
| 3     | La Fundición |    34 | La Colmena: esporas y ácido             |
| 4     | Cuarentena   |    48 | El Blindado: armadura y ondas de choque |
| 5     | Zona Cero    |    64 | Paciente Cero: ácido, ondas y refuerzos |

Elimina toda la horda para provocar la aparición del jefe. Derrotarlo permite avanzar al siguiente sector. Entre niveles recuperas hasta 45 puntos de integridad, repones toda la munición y obtienes tres granadas. Los suministros de los enemigos permiten recuperar salud y munición durante el combate. Destruir al quinto jefe completa la campaña.

## Arsenal

P9 Sentinel, M44 Executioner, MP5 Phantom, AK-47 Revenant, M870 Breacher, DB-2 Judgement, AWP Longshot, M249 Devastator, Ignis Incinerator y RPG-7 Apocalypse. Cada arma tiene modelo 3D, cargador, cadencia, daño, dispersión, tiempo de recarga, retroceso y sonido propios. Las escopetas disparan múltiples perdigones; el AWP atraviesa objetivos; Ignis quema en un cono y mantiene daño residual; el RPG explota con daño de área y puede herirte si disparas muy cerca.

## Gráficos y rendimiento

El menú permite seleccionar gráficos ALTO/BAJO. La geometría estática se agrupa por material y las piezas de los personajes usan instancias. Las luces locales se limitan a las cuatro más cercanas. Los efectos tienen límites de partículas y cadáveres. La simulación utiliza pasos cortos independientes del render. El modo bajo reduce la resolución, desactiva sombras y el resplandor de postprocesado; conserva modelos, texturas y mecánicas.

La velocidad depende del equipo. Chromium con render por software sirve para validar WebGL y las interacciones, pero no representa el rendimiento de una GPU física. El récord y las preferencias se guardan en el almacenamiento local cuando está disponible.

## Archivos

- `src/survival.js`: simulación, campaña, armas, navegación y colisiones.
- `src/graphics.js`: escenarios, modelos 3D, texturas, luces y efectos.
- `src/main.js`: controles, audio, interfaces y bucle de juego.
- `src/styles.css`: diseño adaptable.
- `test/survival.test.js`: pruebas nativas de Node.
- `src/vendor/`: Three.js, su licencia y la integridad del paquete original.

La aplicación es estática. `index.html`, `.nojekyll` y `src/` se pueden publicar en GitHub Pages. El flujo de CI ejecuta las pruebas y la comprobación de sintaxis antes de desplegar.

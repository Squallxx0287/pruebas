# Sala Ocho

Juego de billar 8-ball para navegador, sin dependencias externas. Incluye dos jugadores locales, modo práctica, efectos de la bola blanca, guía de tiro, sonido sintetizado y controles para ratón, teclado y pantalla táctil.

## Ejecutar

Requiere Node.js 20 o superior.

```sh
cd /workspace/pruebas
npm run dev
```

Abre `http://localhost:4173` en un navegador. El servidor usa `PORT` si se necesita otro puerto. Ejecuta `npm test` para comprobar física y reglas, y `npm run check` para comprobar la sintaxis.

## Controles

- Mueve el cursor para apuntar; toca la mesa para apuntar y disparar en móvil.
- Ajusta la potencia con el deslizador y el efecto moviendo el punto rojo.
- Haz clic en la mesa, pulsa **Disparar** o presiona **Espacio**. Usa **←/→** para afinar el ángulo; con **Mayús** haces ajustes pequeños.
- Después de una falta en duelo, toca una zona libre para colocar la blanca.

La simulación usa una mesa de 1000 × 500 unidades con bolas a escala, detección continua de choques, restitución, fricción de rodadura, transferencia de efecto y pérdidas de energía en las bandas. Las reglas implementan la variante recreativa de 8-ball con mesa abierta, grupos, faltas, bola en mano y victoria con la 8. No pretende ser un simulador certificado para competición.

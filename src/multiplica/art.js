export function icon(name, className = "", title = "") {
  const shapes = {
    star: '<path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4L3 9.7l6.4-.9Z"/>',
    home: '<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
    book: '<path d="M12 5c-3-3-6-2-9-1v15c3-1 6-2 9 1 3-3 6-2 9-1V4c-3-1-6-2-9 1Zm0 0v15"/><path d="M6 8h3M15 8h3M6 12h3M15 12h3"/>',
    game: '<path d="M7 7h10c2 0 3 2 4 6s-1 7-3 5l-3-3H9l-3 3c-2 2-4-1-3-5s2-6 4-6Z"/><path d="M7 9v5M4.5 11.5h5M16 10h.1M18 13h.1"/>',
    trophy:
      '<path d="M7 3h10v7a5 5 0 0 1-10 0Zm5 12v5m-4 1h8M7 5H3v4a4 4 0 0 0 4 4m10-8h4v4a4 4 0 0 1-4 4"/>',
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
    sound:
      '<path d="M3 9h4l5-4v14l-5-4H3Zm13-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    mute: '<path d="M3 9h4l5-4v14l-5-4H3Zm13 0 6 6m0-6-6 6"/>',
    bulb: '<path d="M8 17v-2a6 6 0 1 1 8 0v2Zm1 3h6m-5 3h4M12 1v1M2 9h2m16 0h2M4 3l2 2m12 0 2-2"/>',
    check: '<path d="m5 12 4 4L20 5"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    heart: '<path d="M12 21C-8 9 4-2 12 7c8-9 20 2 0 14Z"/>',
    sprout:
      '<path d="M12 22V11M12 14C2 15 2 6 3 4c8-1 12 3 9 10Zm0-3c-1-7 3-10 9-9 1 7-2 11-9 9"/>',
    flower:
      '<path d="M12 7C4-2 0 8 7 12c-9 8 1 12 5 5 8 9 12-1 5-5 9-8-1-12-5-5Z"/><circle cx="12" cy="12" r="3"/>',
    butterfly:
      '<path d="M12 7C-1-7-1 18 10 16m2-9c13-14 13 11 2 9M12 7v13m0-13L9 3m3 4 3-4M10 16c-8 8 2 9 2 1 0 8 10 7 2-1"/>',
    tree: '<path d="M12 2 4 11h4l-5 6h18l-5-6h4ZM12 17v5"/>',
    rainbow:
      '<path d="M2 20V12a10 10 0 0 1 20 0v8M6 20v-8a6 6 0 0 1 12 0v8M10 20v-8a2 2 0 0 1 4 0v8"/>',
    planet:
      '<circle cx="12" cy="12" r="7"/><ellipse cx="12" cy="12" rx="12" ry="3" transform="rotate(-30 12 12)"/>',
    fish: '<path d="M18 12C10 0 2 5 2 12s8 12 16 0l4 5V7Z"/><circle cx="7" cy="11" r=".5"/>',
    balloon:
      '<ellipse cx="12" cy="8" rx="7" ry="7"/><path d="m12 15-2 3h4Zm0 3c-5 2 5 3 0 5"/>',
    cloud:
      '<path d="M6 19a5 5 0 0 1-1-10 7 7 0 0 1 13-3 6.5 6.5 0 0 1 0 13Z"/>',
    rocket:
      '<path d="M8 14C7 5 15 1 21 2c1 6-3 14-12 13l-1-1Zm0-5H4l-3 6h7m7 0v5l-6 3v-8M5 18l-3 4"/><circle cx="15" cy="8" r="2"/>',
    flag: '<path d="M5 22V3c5-4 10 4 15 0v12c-5 4-10-4-15 0"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16 7-3 7-6 3 3-7Z"/>',
    crown: '<path d="m3 6 5 4 4-7 4 7 5-4-2 14H5ZM7 16h10"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  };
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${title ? `role="img" aria-label="${title}"` : 'aria-hidden="true"'}>${shapes[name] || shapes.star}</svg>`;
}
export function fox(className = "", happy = false) {
  return `<svg class="fox ${className}" viewBox="0 0 160 170" aria-hidden="true"><path d="M19 68 22 9l44 30m29 0 43-30 3 60" fill="#f0a275"/><path d="m29 51 2-27 21 22m55 0 22-22 2 27" fill="#ffd6b6"/><path d="M13 83c0-36 28-57 67-57s67 21 67 57c0 43-32 72-67 72S13 126 13 83" fill="#f0a275"/><path d="M13 83c22-7 52 10 67 32 15-22 45-39 67-32-3 43-32 72-67 72S16 126 13 83" fill="#fff6df"/><path d="M32 64c8-10 17-10 24-2m48 0c7-8 16-8 24 2" fill="none" stroke="#d88561" stroke-width="4" stroke-linecap="round"/>${happy ? '<path d="m43 84 5-4 5 4m54 0 5-4 5 4" stroke="#464055" stroke-width="5" fill="none" stroke-linecap="round"/>' : '<ellipse cx="49" cy="82" rx="4" ry="6" fill="#464055"/><ellipse cx="111" cy="82" rx="4" ry="6" fill="#464055"/>'}<ellipse cx="36" cy="96" rx="10" ry="5" fill="#ed8f88" opacity=".65"/><ellipse cx="124" cy="96" rx="10" ry="5" fill="#ed8f88" opacity=".65"/><path d="M70 111q10-8 20 0-3 12-10 12t-10-12" fill="#464055"/><path d="M80 123v5m-10 1q10 9 20 0" fill="none" stroke="#464055" stroke-width="3" stroke-linecap="round"/><path d="M40 145q40 18 80 0l-4 19q-36-12-72 0Z" fill="#8b69d9"/><path d="m105 159 14 9 7-18" fill="#8b69d9"/></svg>`;
}
export function groupDrawing(a, b, reveal = false) {
  return `<div class="group-summary">${icon("star")} <strong>${a} ${a === 1 ? "grupo" : "grupos"} de ${b}</strong><span>¡Cuenta las estrellas!</span></div><div class="groups" style="--group-columns:${Math.min(a, 4)}">${Array.from({ length: a }, (_, i) => `<div class="star-group" role="img" aria-label="Grupo ${i + 1}: ${b} ${b === 1 ? "estrella" : "estrellas"}"><div class="group-stars" style="--stars-columns:${Math.min(b, 4)}">${Array.from({ length: b }, () => icon("star", "count-star")).join("")}</div><small>Grupo ${i + 1}</small></div>`).join("")}</div><div class="addition"><span>${Array.from({ length: a }, () => b).join(" + ")}</span><b>= ${reveal ? a * b : "?"}</b></div>`;
}

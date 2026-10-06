import * as T from "./vendor/three.module.js";
import { LEVELS, WEAPONS, layout } from "./survival.js";
const rand = (a, b) => a + Math.random() * (b - a);
const palette = {
  amber: 0xffb16b,
  red: 0xff4740,
  green: 0xb8d881,
  cyan: 0x89c9db,
};
const geometries = new Map();
function geometry(kind, ...args) {
  const key = kind + args.join(",");
  if (!geometries.has(key)) geometries.set(key, new T[kind](...args));
  return geometries.get(key);
}
function mesh(g, m, parent, x = 0, y = 0, z = 0) {
  const o = new T.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
function box(parent, m, x, y, z, w, h, d) {
  let geo;
  if (parent.userData.weapon && Math.min(w, h, d) > 0.065) {
    const key = `bevel-${w},${h},${d}`;
    if (!geometries.has(key)) {
      const bevel = Math.min(0.005, Math.min(w, h, d) * 0.05),
        s = new T.Shape();
      s.moveTo(-w / 2 + bevel, -h / 2 + bevel);
      s.lineTo(w / 2 - bevel, -h / 2 + bevel);
      s.lineTo(w / 2 - bevel, h / 2 - bevel);
      s.lineTo(-w / 2 + bevel, h / 2 - bevel);
      s.closePath();
      const g = new T.ExtrudeGeometry(s, {
        depth: d - 2 * bevel,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 2,
        steps: 1,
      });
      g.translate(0, 0, -d / 2 + bevel);
      geometries.set(key, g);
    }
    geo = geometries.get(key);
  } else geo = geometry("BoxGeometry", w, h, d);
  return mesh(geo, m, parent, x, y, z);
}
function sphere(parent, m, x, y, z, r, sx = 1, sy = 1, sz = 1) {
  const o = mesh(geometry("SphereGeometry", r, 16, 12), m, parent, x, y, z);
  o.scale.set(sx, sy, sz);
  return o;
}
function cylinder(parent, m, x, y, z, r1, r2, h, segments = 12) {
  return mesh(
    geometry("CylinderGeometry", r1, r2, h, segments),
    m,
    parent,
    x,
    y,
    z,
  );
}
function tube(parent, m, x, y, z, r, length) {
  const o = cylinder(parent, m, x, y, z, r, r, length, 16);
  o.rotation.x = Math.PI / 2;
  return o;
}
function ring(parent, m, x, y, z, r, thickness = 0.03) {
  return mesh(
    geometry("TorusGeometry", r, thickness, 8, 32),
    m,
    parent,
    x,
    y,
    z,
  );
}
function texture(kind) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const c = canvas.getContext("2d");
  const base =
    {
      brick: "#565449",
      concrete: "#788078",
      asphalt: "#343c3d",
      metal: "#515b58",
      skin: "#969086",
      cloth: "#3d4c47",
      wood: "#825231",
    }[kind] || "#777";
  c.fillStyle = base;
  c.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 25000; i++) {
    const v = Math.random() > 0.5 ? 255 : 0;
    c.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.14})`;
    c.fillRect(
      Math.random() * 512,
      Math.random() * 512,
      1 + Math.random() * 3,
      1 + Math.random() * 3,
    );
  }
  if (kind === "brick") {
    for (let row = 0; row < 12; row++)
      for (let col = -1; col < 8; col++) {
        const x = col * 74 + (row % 2) * 37,
          y = row * 44;
        c.fillStyle = `rgba(15,14,11,.7)`;
        c.fillRect(x, y, 73, 43);
        c.fillStyle = `rgb(${rand(76, 108)},${rand(77, 93)},${rand(66, 82)})`;
        c.fillRect(x + 3, y + 3, 67, 37);
        c.fillStyle = "#ffffff16";
        c.fillRect(x + 3, y + 3, 66, 2);
      }
  }
  if (kind === "metal" || kind === "cloth" || kind === "wood") {
    for (let i = 0; i < 160; i++) {
      c.strokeStyle =
        kind === "wood"
          ? "#21150742"
          : kind === "metal"
            ? "#bdd0ce19"
            : "#111e1940";
      c.lineWidth = rand(0.5, 2);
      c.beginPath();
      const y = rand(0, 512);
      c.moveTo(0, y);
      for (let x = 0; x <= 512; x += 24)
        c.lineTo(x, y + Math.sin(x * 0.024 + i) * rand(1, 6));
      c.stroke();
    }
  }
  for (let i = 0; i < 45; i++) {
    const x = rand(0, 512),
      y = rand(0, 512),
      r = rand(3, 45);
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(
      0,
      kind === "metal"
        ? "#694325aa"
        : kind === "skin"
          ? "#442b36aa"
          : "#131c1777",
    );
    g.addColorStop(1, "#00000000");
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  if (["concrete", "skin", "asphalt"].includes(kind))
    for (let i = 0; i < 35; i++) {
      let x = rand(0, 512),
        y = rand(0, 512);
      c.strokeStyle = kind === "skin" ? "#38373c55" : "#1c26275c";
      c.lineWidth = rand(0.4, 1.2);
      c.beginPath();
      c.moveTo(x, y);
      for (let j = 0; j < 8; j++) {
        x += rand(-10, 10);
        y += rand(0, 12);
        c.lineTo(x, y);
      }
      c.stroke();
    }
  const t = new T.CanvasTexture(canvas);
  t.colorSpace = T.SRGBColorSpace;
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
function decalTexture(text, color = "#c9c7ac", bg = null) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const c = canvas.getContext("2d");
  if (bg) {
    c.fillStyle = bg;
    c.fillRect(0, 0, 1024, 256);
  }
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.font = "900 105px Arial";
  c.fillStyle = color;
  c.fillText(text, 512, 128, 960);
  for (let i = 0; i < 500; i++) {
    c.clearRect(rand(0, 1024), rand(0, 256), rand(1, 14), rand(1, 5));
  }
  const t = new T.CanvasTexture(canvas);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}
function softTexture(blood = false) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const c = canvas.getContext("2d");
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, blood ? "#661918dd" : "#ffffffff");
  g.addColorStop(0.3, blood ? "#511514cc" : "#ffffffaa");
  g.addColorStop(1, "#ffffff00");
  c.fillStyle = g;
  c.fillRect(0, 0, 128, 128);
  if (blood)
    for (let i = 0; i < 25; i++) {
      c.fillStyle = "#5e171b";
      c.beginPath();
      c.arc(rand(10, 118), rand(10, 118), rand(1, 8), 0, Math.PI * 2);
      c.fill();
    }
  return new T.CanvasTexture(canvas);
}
function makeMaterials() {
  const textures = {};
  for (const k of [
    "brick",
    "concrete",
    "asphalt",
    "metal",
    "skin",
    "cloth",
    "wood",
  ])
    textures[k] = texture(k);
  textures.brick.repeat.set(4, 3);
  textures.concrete.repeat.set(3, 3);
  const mat = (color, roughness = 0.8, metalness = 0, map = null, extra = {}) =>
    new T.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      map: map ? textures[map] : null,
      ...extra,
    });
  return {
    textures,
    brick: mat(0xb8b7a5, 0.95, 0, "brick"),
    concrete: mat(0xb4b6b0, 0.94, 0, "concrete"),
    asphalt: mat(0x8f9b9a, 0.96, 0, "asphalt"),
    metal: mat(0x7f9290, 0.67, 0.65, "metal"),
    rust: mat(0xa26c45, 0.82, 0.4, "metal"),
    dark: mat(0x182321, 0.72, 0.5, "metal"),
    steel: mat(0xa7b3af, 0.35, 0.8, "metal"),
    wood: mat(0xc4a071, 0.8, 0, "wood"),
    skin: mat(0xc1c7b0, 0.92, 0, "skin"),
    skinDark: mat(0x808f78, 0.9, 0, "skin"),
    flesh: mat(0x783437, 0.78),
    bone: mat(0xd5cfad, 0.65),
    cloth: mat(0x6d7c74, 0.95, 0, "cloth"),
    pants: mat(0x384343, 0.95, 0, "cloth"),
    leather: mat(0x332c24, 0.8, 0, "cloth"),
    black: mat(0x080b0b, 0.78),
    glass: mat(0x1d3b40, 0.14, 0.75),
    gold: mat(0xd4aa5d, 0.32, 0.8),
    red: mat(0x9e3b2f, 0.75, 0.15),
    white: mat(0xd1d4c4, 0.8),
    olive: mat(0x79806a, 0.8, 0.2),
    eye: mat(0xdfd597, 0.4, 0, null, {
      emissive: 0xa3934c,
      emissiveIntensity: 0.6,
    }),
    lamp: mat(0xecc894, 0.5, 0, null, {
      emissive: 0xffd39b,
      emissiveIntensity: 2.5,
    }),
    neon: mat(0xafebdc, 0.5, 0, null, {
      emissive: 0x80ccbd,
      emissiveIntensity: 3,
    }),
    fire: mat(0xffb857, 0.4, 0, null, {
      emissive: 0xff8b36,
      emissiveIntensity: 4,
    }),
    toxic: mat(0x92bf54, 0.65, 0, null, {
      emissive: 0x73a844,
      emissiveIntensity: 0.8,
    }),
    core: mat(0xef6464, 0.5, 0, null, {
      emissive: 0xff4444,
      emissiveIntensity: 3,
    }),
    blood: new T.MeshBasicMaterial({
      map: softTexture(true),
      transparent: true,
      depthWrite: false,
      color: 0x843233,
    }),
    particle: softTexture(),
  };
}

export function makeZombie(materials, type = "shambler", scale = 1) {
  const m = materials,
    g = new T.Group(),
    body = new T.Group();
  g.add(body);
  const boss = ["butcher", "stalker", "hive", "armored", "zero"].includes(type),
    shirt =
      type === "soldier" || type === "armored"
        ? m.dark
        : type === "hive"
          ? m.skinDark
          : m.cloth;
  const torso = sphere(body, shirt, 0, 1.1, 0, 0.33, 0.82, 0.98, 0.54);
  torso.rotation.z = 0.035;
  sphere(body, m.pants, 0, 0.76, 0, 0.235, 0.9, 0.6, 0.63);
  sphere(body, m.skin, 0, 1.41, 0.01, 0.1, 0.85, 1.1, 1);
  const head = new T.Group();
  head.position.set(0, 1.63, 0.035);
  head.rotation.z = 0.08;
  body.add(head);
  sphere(head, m.skin, 0, 0, 0, 0.225, 0.86, 1.14, 0.91);
  sphere(head, m.skinDark, -0.15, -0.025, 0.09, 0.08, 0.7, 1, 0.65);
  sphere(head, m.skinDark, 0.15, -0.025, 0.09, 0.08, 0.7, 1, 0.65);
  for (const side of [-1, 1]) {
    sphere(head, m.black, side * 0.085, 0.035, 0.183, 0.053, 1, 0.76, 0.45);
    sphere(
      head,
      type === "zero" ? m.core : m.eye,
      side * 0.085,
      0.039,
      0.205,
      0.02,
      1,
      0.7,
      0.5,
    );
    sphere(head, m.black, side * 0.085, 0.039, 0.216, 0.01, 1, 0.8, 0.45);
    const socket = ring(
      head,
      m.flesh,
      side * 0.085,
      0.035,
      0.199,
      0.048,
      0.009,
    );
    socket.scale.y = 0.72;
    const brow = box(
      head,
      m.skinDark,
      side * 0.085,
      0.094,
      0.18,
      0.12,
      0.032,
      0.05,
    );
    brow.rotation.z = -side * 0.27;
  }
  const nose = cylinder(
    head,
    m.skinDark,
    0,
    -0.016,
    0.21,
    0.02,
    0.036,
    0.07,
    5,
  );
  nose.rotation.x = Math.PI / 2;
  sphere(head, m.black, 0, -0.11, 0.18, 0.075, 1, 1, 0.45);
  const lip = ring(head, m.flesh, 0, -0.11, 0.212, 0.073, 0.008);
  lip.scale.y = 1.05;
  for (let i = 0; i < 6; i++) {
    if (i !== 1)
      box(
        head,
        m.bone,
        (i - 2.5) * 0.021,
        -0.067,
        0.221,
        0.015,
        0.021 + (i % 2) * 0.011,
        0.018,
      );
    if (i !== 2 && i !== 4)
      box(head, m.bone, (i - 2.5) * 0.021, -0.153, 0.22, 0.014, 0.022, 0.017);
  }
  sphere(head, m.skinDark, 0, -0.16, 0.095, 0.12, 1, 0.55, 0.6);
  const hair = mesh(
    geometry("SphereGeometry", 0.231, 12, 6, 0, Math.PI * 2, 0, 0.85),
    m.leather,
    head,
    0,
    0.018,
    -0.012,
  );
  hair.castShadow = false;
  box(head, m.flesh, -0.12, 0.145, 0.145, 0.085, 0.05, 0.028).rotation.z = 0.4;
  const arms = [],
    legs = [];
  for (const side of [-1, 1]) {
    const arm = new T.Group();
    arm.position.set(side * 0.3, 1.33, 0);
    body.add(arm);
    arm.rotation.x = -0.95;
    arm.rotation.z = side * 0.11;
    sphere(arm, shirt, 0, -0.045, 0, 0.125, 1, 1, 0.95);
    cylinder(arm, shirt, 0, -0.2, 0, 0.075, 0.11, 0.34);
    const elbow = new T.Group();
    elbow.position.y = -0.38;
    elbow.rotation.x = -0.45;
    arm.add(elbow);
    sphere(elbow, m.skinDark, 0, 0, 0, 0.072);
    cylinder(elbow, m.skin, 0, -0.17, 0, 0.064, 0.076, 0.32);
    sphere(elbow, m.skinDark, 0, -0.365, 0.015, 0.083, 0.8, 1.15, 0.6);
    for (let f = 0; f < 4; f++) {
      const finger = cylinder(
        elbow,
        m.skin,
        (f - 1.5) * 0.033,
        -0.46,
        0.025,
        0.012,
        0.019,
        0.15,
        6,
      );
      finger.rotation.x = -0.3;
      const nail = box(
        elbow,
        m.bone,
        (f - 1.5) * 0.033,
        -0.53,
        0.052,
        0.014,
        0.035,
        0.009,
      );
      nail.castShadow = false;
    }
    box(
      elbow,
      m.flesh,
      side * 0.047,
      -0.17,
      0.022,
      0.05,
      0.12,
      0.04,
    ).rotation.z = 0.3;
    arms.push(arm);
    const leg = new T.Group();
    leg.position.set(side * 0.14, 0.72, 0);
    body.add(leg);
    cylinder(leg, m.pants, 0, -0.18, 0, 0.11, 0.13, 0.38);
    const knee = new T.Group();
    knee.position.y = -0.37;
    leg.add(knee);
    sphere(knee, m.pants, 0, 0, 0, 0.09);
    cylinder(knee, m.pants, 0, -0.155, 0, 0.075, 0.1, 0.31);
    box(knee, m.leather, 0, -0.34, 0.064, 0.2, 0.16, 0.33);
    legs.push({ leg, knee });
  }
  for (let i = 0; i < 3; i++) {
    const tear = box(
      body,
      m.flesh,
      (i % 2 ? 1 : -1) * 0.11,
      1.02 + i * 0.1,
      0.172,
      0.035,
      0.1,
      0.012,
    );
    tear.rotation.z = 0.35;
  }
  if (type === "soldier" || type === "armored") {
    box(body, m.olive, 0, 1.17, 0.19, 0.48, 0.42, 0.07);
    for (let s = -1; s <= 1; s++)
      box(body, m.dark, s * 0.13, 1.07, 0.25, 0.105, 0.14, 0.09);
    const helmet = sphere(head, m.dark, 0, 0.12, 0, 0.25, 1, 0.67, 1.05);
    helmet.rotation.x = -0.1;
    box(head, m.steel, 0, 0.07, 0.23, 0.38, 0.028, 0.05);
    if (type === "armored") {
      for (const side of [-1, 1])
        box(body, m.dark, side * 0.32, 1.37, 0, 0.26, 0.18, 0.4);
      box(body, m.steel, 0, 1.16, 0.24, 0.3, 0.3, 0.07);
      for (let i = 0; i < 4; i++)
        box(
          body,
          m.gold,
          ((i % 2) - 0.5) * 0.23,
          1.27 - Math.floor(i / 2) * 0.22,
          0.288,
          0.025,
          0.025,
          0.012,
        );
    }
  }
  if (type === "butcher") {
    box(body, m.white, 0, 1.04, 0.175, 0.39, 0.55, 0.028);
    box(body, m.flesh, 0, 1.07, 0.193, 0.26, 0.26, 0.014);
    const cleaver = box(arms[1], m.steel, 0.03, -0.82, 0.04, 0.12, 0.39, 0.032);
    cleaver.rotation.z = 0.18;
    box(arms[1], m.leather, 0.03, -0.62, 0.04, 0.048, 0.15, 0.05);
    sphere(body, m.skin, 0.03, 0.85, 0.12, 0.25, 1, 0.9, 0.65);
  }
  if (type === "hive" || type === "zero" || type === "spitter") {
    for (let i = 0; i < (type === "zero" ? 13 : 9); i++) {
      const a = i * 2.4,
        y = 0.92 + (i % 4) * 0.17;
      const x = Math.sin(a) * 0.24,
        z = Math.cos(a) * 0.23;
      sphere(
        body,
        type === "zero" ? m.flesh : m.toxic,
        x,
        y,
        z,
        0.07 + (i % 3) * 0.025,
        1,
        0.8,
        1,
      );
    }
    for (const side of [-1, 1])
      for (let i = 0; i < 3; i++) {
        const spike = cylinder(
          body,
          m.bone,
          side * (0.29 + i * 0.055),
          1.35 + i * 0.1,
          -0.11,
          0.005,
          0.06,
          0.3 + i * 0.08,
          8,
        );
        spike.rotation.z = -side * 0.7;
        spike.rotation.x = -0.35;
      }
    if (type === "zero") {
      sphere(body, m.core, 0, 1.16, 0.2, 0.15, 1, 1.15, 0.5);
      box(head, m.flesh, 0, 0.08, 0.225, 0.15, 0.1, 0.02);
    }
  }
  g.scale.setScalar(scale);
  g.userData = { body, head, arms, legs, boss, type };
  return g;
}

export function makeWeapon(m, id) {
  const g = new T.Group(),
    details = {};
  g.userData.weapon = true;
  const metal = m.dark,
    steel = m.steel,
    wood = m.wood;
  function barrel(z, length, r = 0.033, x = 0, y = 0.075, material = steel) {
    return tube(g, material, x, y, z, r, length);
  }
  function grip(z, material = m.leather) {
    const a = box(g, material, 0, -0.15, z, 0.11, 0.26, 0.15);
    a.rotation.x = -0.22;
    return a;
  }
  function sights(z) {
    box(g, metal, 0, 0.14, z, 0.06, 0.07, 0.035);
    box(g, steel, 0, 0.18, z, 0.012, 0.012, 0.035);
  }
  function rifleStock(z, material = m.dark) {
    const s = box(g, material, 0, -0.005, z, 0.12, 0.18, 0.36);
    box(g, m.leather, 0, -0.01, z + 0.19, 0.14, 0.2, 0.025);
    return s;
  }
  function magazine(z, w = 0.11, h = 0.25, d = 0.14, material = metal) {
    const a = box(g, material, 0, -0.17, z, w, h, d);
    for (let i = 0; i < 4; i++)
      box(g, steel, w / 2 + 0.002, -0.07 - i * 0.047, z, 0.005, 0.016, d * 0.7);
    return a;
  }
  function rail(z, length) {
    for (let i = 0; i < 12; i++)
      box(g, steel, 0, 0.135, z + (i * length) / 12, 0.11, 0.012, 0.016);
  }
  function scope(z, length = 0.37) {
    tube(g, metal, 0, 0.245, z, 0.07, length);
    tube(g, steel, 0, 0.245, z - length / 2, 0.075, 0.06);
    tube(g, m.glass, 0, 0.245, z - length / 2 - 0.033, 0.057, 0.004);
    box(g, metal, 0, 0.155, z - 0.09, 0.085, 0.12, 0.08);
    box(g, metal, 0, 0.155, z + 0.09, 0.085, 0.12, 0.08);
    cylinder(g, steel, 0.055, 0.245, z, 0.033, 0.033, 0.06).rotation.z =
      Math.PI / 2;
  }
  function trigger(z) {
    const r = ring(g, steel, 0, -0.085, z, 0.067, 0.009);
    r.rotation.y = Math.PI / 2;
    r.scale.z = 0.8;
    box(g, steel, 0, -0.072, z - 0.025, 0.014, 0.06, 0.02).rotation.x = -0.2;
  }
  let length = 0.7;
  if (id === "pistol") {
    grip(0.02);
    const slide = box(g, steel, 0, 0.075, -0.13, 0.105, 0.12, 0.35);
    details.slide = slide;
    box(g, metal, 0, -0.005, -0.11, 0.115, 0.07, 0.31);
    barrel(-0.32, 0.08, 0.029, 0, 0.071, metal);
    for (let i = 0; i < 7; i++)
      box(g, metal, 0.054, 0.065, -0.05 + i * 0.012, 0.003, 0.07, 0.004);
    sights(-0.265);
    sights(0.015);
    trigger(-0.08);
    length = 0.39;
  } else if (id === "revolver") {
    grip(0.08, wood);
    box(g, steel, 0, 0.05, -0.08, 0.1, 0.12, 0.33);
    const drum = tube(g, steel, 0, 0.03, -0.08, 0.078, 0.135);
    details.drum = drum;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      tube(
        g,
        metal,
        Math.cos(a) * 0.054,
        0.03 + Math.sin(a) * 0.054,
        -0.154,
        0.016,
        0.012,
      );
    }
    barrel(-0.31, 0.32, 0.034, 0, 0.073);
    box(g, steel, 0, 0.015, -0.33, 0.07, 0.1, 0.26);
    sights(-0.43);
    trigger(-0.03);
    length = 0.51;
  } else if (id === "smg") {
    box(g, metal, 0, 0.035, -0.17, 0.12, 0.16, 0.46);
    grip(0.025);
    magazine(-0.17, 0.1, 0.29, 0.1);
    barrel(-0.48, 0.19, 0.025);
    tube(g, metal, 0, 0.07, -0.61, 0.043, 0.15);
    for (let i = 0; i < 4; i++)
      ring(g, steel, 0, 0.07, -0.45 - i * 0.035, 0.041, 0.006);
    rifleStock(0.22);
    rail(-0.31, 0.22);
    sights(-0.43);
    trigger(-0.04);
    length = 0.72;
  } else if (id === "rifle") {
    box(g, metal, 0, 0.035, -0.18, 0.14, 0.17, 0.45);
    grip(0.03, wood);
    rifleStock(0.25, wood);
    box(g, wood, 0, 0.022, -0.52, 0.14, 0.15, 0.31);
    barrel(-0.8, 0.28, 0.029);
    barrel(-0.67, 0.19, 0.021, 0, 0.14, metal);
    for (let i = 0; i < 5; i++)
      box(g, metal, 0, -0.14 - i * 0.04, -0.22 - i * 0.016, 0.13, 0.055, 0.18);
    sights(-0.9);
    sights(-0.35);
    trigger(-0.045);
    length = 0.98;
  } else if (id === "shotgun") {
    box(g, metal, 0, 0.05, -0.17, 0.12, 0.15, 0.36);
    rifleStock(0.23, wood);
    grip(0.03, wood);
    barrel(-0.65, 0.68, 0.037);
    barrel(-0.6, 0.57, 0.03, 0, -0.035, metal);
    const pump = box(g, wood, 0, -0.035, -0.54, 0.13, 0.13, 0.25);
    details.pump = pump;
    for (let i = 0; i < 7; i++)
      box(g, metal, 0.067, -0.025, -0.65 + i * 0.033, 0.005, 0.105, 0.008);
    sights(-0.97);
    trigger(-0.01);
    length = 1.02;
  } else if (id === "double") {
    rifleStock(0.23, wood);
    grip(0.04, wood);
    box(g, steel, 0, 0.035, -0.12, 0.16, 0.13, 0.27);
    for (const x of [-0.046, 0.046]) barrel(-0.59, 0.67, 0.042, x, 0.067);
    box(g, wood, 0, -0.032, -0.41, 0.16, 0.1, 0.3);
    sights(-0.9);
    trigger(-0.015);
    length = 0.98;
  } else if (id === "sniper") {
    box(g, m.olive, 0, -0.017, -0.22, 0.14, 0.12, 0.62);
    rifleStock(0.27, m.olive);
    grip(0.04, m.olive);
    barrel(-0.87, 0.7, 0.03);
    tube(g, metal, 0, 0.075, -1.21, 0.045, 0.15);
    scope(-0.3, 0.5);
    magazine(-0.22, 0.12, 0.13, 0.19);
    const bolt = tube(g, steel, 0.1, 0.073, -0.08, 0.017, 0.12);
    bolt.rotation.y = 0.8;
    sphere(g, metal, 0.15, 0.074, -0.025, 0.025);
    for (const side of [-1, 1]) {
      const leg = cylinder(
        g,
        metal,
        side * 0.08,
        -0.14,
        -0.88,
        0.014,
        0.014,
        0.29,
      );
      leg.rotation.z = side * 0.3;
    }
    trigger(-0.025);
    length = 1.31;
  } else if (id === "lmg") {
    box(g, metal, 0, 0.055, -0.2, 0.18, 0.19, 0.51);
    rifleStock(0.26, m.olive);
    grip(0.03);
    barrel(-0.86, 0.68, 0.034);
    box(g, m.olive, -0.11, -0.14, -0.22, 0.26, 0.26, 0.29);
    for (let i = 0; i < 9; i++) {
      tube(
        g,
        m.gold,
        0.1 + i * 0.014,
        0.01,
        -0.2 + i * 0.024,
        0.013,
        0.09,
      ).rotation.y = Math.PI / 2;
    }
    rail(-0.39, 0.34);
    box(g, steel, 0, 0.23, -0.15, 0.018, 0.25, 0.018).rotation.z = 0.3;
    for (const side of [-1, 1]) {
      const leg = cylinder(
        g,
        metal,
        side * 0.09,
        -0.13,
        -0.92,
        0.015,
        0.015,
        0.3,
      );
      leg.rotation.z = side * 0.36;
    }
    sights(-1.13);
    trigger(-0.025);
    length = 1.22;
  } else if (id === "flame") {
    box(g, m.rust, 0, 0.04, -0.24, 0.19, 0.17, 0.52);
    grip(0.03);
    rifleStock(0.27);
    barrel(-0.73, 0.52, 0.067, 0, 0.06, m.rust);
    barrel(-0.99, 0.13, 0.09, 0, 0.06, steel);
    tube(g, m.gold, 0, -0.065, -0.87, 0.02, 0.33);
    for (const side of [-1, 1])
      cylinder(g, m.olive, side * 0.14, -0.09, -0.11, 0.082, 0.082, 0.42);
    const hose = ring(g, m.black, 0.17, -0.13, -0.42, 0.14, 0.022);
    hose.rotation.y = 0.45;
    box(g, m.red, 0, 0.15, -0.18, 0.05, 0.045, 0.08);
    sights(-0.92);
    length = 1.11;
  } else if (id === "rocket") {
    tube(g, m.olive, 0, 0.06, -0.18, 0.09, 1.09);
    tube(g, steel, 0, 0.06, 0.36, 0.115, 0.13);
    grip(-0.06, wood);
    grip(-0.47, wood);
    tube(g, m.olive, 0, 0.06, -0.82, 0.125, 0.21);
    const warhead = cylinder(
      g,
      m.olive,
      0,
      0.06,
      -1.05,
      0.004,
      0.125,
      0.31,
      16,
    );
    warhead.rotation.x = -Math.PI / 2;
    scope(-0.32, 0.27);
    length = 1.25;
  }
  // Trigger guard, fasteners, worn edges, and visible gloved hands.
  for (let i = 0; i < 5; i++)
    sphere(g, m.gold, 0.075, 0.07, -0.03 - i * 0.04, 0.008);
  sphere(g, m.leather, 0.07, -0.13, 0.06, 0.083, 0.72, 1, 0.82);
  const forearm = cylinder(g, m.cloth, 0.14, -0.23, 0.26, 0.07, 0.1, 0.35);
  forearm.rotation.x = -0.9;
  forearm.rotation.z = -0.28;
  for (let i = 0; i < 3; i++)
    sphere(g, m.leather, 0.055, -0.13 - i * 0.025, -0.012, 0.03, 1, 0.7, 0.65);
  if (!["pistol", "revolver"].includes(id)) {
    sphere(g, m.leather, -0.075, -0.08, -0.43, 0.077, 0.7, 0.8, 1);
    const left = cylinder(g, m.cloth, -0.2, -0.2, -0.22, 0.075, 0.1, 0.36);
    left.rotation.z = -0.55;
    left.rotation.x = 0.7;
  }
  g.userData = { ...details, length, id };
  return g;
}

export class DeadzoneRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.4));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.NoToneMapping;
    this.renderer.autoClear = false;
    this.scene = new T.Scene();
    this.camera = new T.PerspectiveCamera(
      72,
      innerWidth / innerHeight,
      0.075,
      120,
    );
    this.camera.rotation.order = "YXZ";
    const envCanvas = document.createElement("canvas");
    envCanvas.width = 512;
    envCanvas.height = 256;
    const ec = envCanvas.getContext("2d"),
      eg = ec.createLinearGradient(0, 0, 0, 256);
    eg.addColorStop(0, "#5b7688");
    eg.addColorStop(0.48, "#bdc6b6");
    eg.addColorStop(0.54, "#788078");
    eg.addColorStop(1, "#202c24");
    ec.fillStyle = eg;
    ec.fillRect(0, 0, 512, 256);
    ec.fillStyle = "#e8e4cf";
    ec.fillRect(130, 70, 24, 20);
    ec.fillRect(320, 76, 50, 14);
    this.environment = new T.CanvasTexture(envCanvas);
    this.environment.colorSpace = T.SRGBColorSpace;
    this.environment.mapping = T.EquirectangularReflectionMapping;
    this.scene.environment = this.environment;
    this.materials = makeMaterials();
    this.world = new T.Group();
    this.scene.add(this.world);
    this.characters = new T.Group();
    this.scene.add(this.characters);
    this.enemyMeshes = new Map();
    this.corpses = [];
    this.effects = [];
    this.decals = [];
    this.projectileMeshes = new Map();
    this.pickupMeshes = new Map();
    this.environmentEffects = [];
    this.weaponScene = new T.Scene();
    this.weaponScene.environment = this.environment;
    this.weaponCamera = new T.PerspectiveCamera(
      72,
      innerWidth / innerHeight,
      0.025,
      10,
    );
    this.weaponScene.add(new T.HemisphereLight(0xdce5e1, 0x283338, 2.2));
    const gunLight = new T.DirectionalLight(0xffffff, 3);
    gunLight.position.set(-2, 3, 1);
    this.weaponScene.add(gunLight);
    this.weaponRig = new T.Group();
    this.weaponScene.add(this.weaponRig);
    this.weaponModels = WEAPONS.map((w) => {
      const model = makeWeapon(this.materials, w.id);
      this.weaponRig.add(model);
      model.visible = false;
      return model;
    });
    this.weaponIndex = 3;
    this.weaponModels[3].visible = true;
    this.flash = new T.Group();
    this.weaponRig.add(this.flash);
    const flashmat = new T.MeshBasicMaterial({
      color: 0xffe7a0,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const flame = mesh(
      geometry("ConeGeometry", 0.07, 0.3, 7),
      flashmat,
      this.flash,
      0,
      0,
      -0.12,
    );
    flame.rotation.x = -Math.PI / 2;
    this.flash.visible = false;
    this.gunFlash = new T.PointLight(0xffaf5b, 0, 4, 2);
    this.weaponScene.add(this.gunFlash);
    this.light = new T.SpotLight(0xe5efff, 42, 28, Math.PI / 7, 0.55, 1.25);
    this.light.position.set(0, 2, 12);
    this.light.castShadow = false;
    this.scene.add(this.light);
    this.scene.add(this.light.target);
    this.flashlight = true;
    this.target = new T.WebGLRenderTarget(1, 1, {
      type: T.HalfFloatType,
      depthBuffer: true,
    });
    this.postScene = new T.Scene();
    this.postCamera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.postMaterial = new T.ShaderMaterial({
      uniforms: {
        image: { value: this.target.texture },
        resolution: { value: new T.Vector2(1, 1) },
        time: { value: 0 },
        hurt: { value: 0 },
        bloomStrength: { value: 1 },
        exposure: { value: 1.28 },
      },
      vertexShader:
        "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
      fragmentShader: `uniform sampler2D image;uniform vec2 resolution;uniform float time,hurt,exposure,bloomStrength;varying vec2 vUv;vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}void main(){vec2 p=1./resolution;vec3 color=texture2D(image,vUv).rgb;vec3 bloom=vec3(0.);if(bloomStrength>.1){for(int x=-1;x<=1;x++){for(int y=-1;y<=1;y++){vec3 b=texture2D(image,vUv+vec2(float(x),float(y))*p*5.).rgb;bloom+=max(b-vec3(1.1),vec3(0.))/9.;}}}color=aces((color+bloom*.20)*exposure);float vig=smoothstep(.82,.17,distance(vUv,vec2(.5)));color*=mix(.64,1.,vig);float n=fract(sin(dot(vUv*resolution+time,vec2(12.9898,78.233)))*43758.5453)-.5;color=mix(color,vec3(.7,.025,.018),hurt*(1.-vig)*.8);color=pow(max(color,vec3(0.)),vec3(1./2.2));color+=n*.003;gl_FragColor=vec4(color,1.);}`,
    });
    this.postScene.add(
      new T.Mesh(new T.PlaneGeometry(2, 2), this.postMaterial),
    );
    this.recoil = 0;
    this.recoilVelocity = 0;
    this.flashTime = 0;
    this.damageFlash = 0;
    this.walkTime = 0;
    this.time = 0;
    this.buildLevel(1);
    this.resize();
  }
  resize() {
    const w = innerWidth,
      h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = this.weaponCamera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.weaponCamera.updateProjectionMatrix();
    const size = new T.Vector2();
    this.renderer.getDrawingBufferSize(size);
    this.target.setSize(size.x, size.y);
    this.postMaterial.uniforms.resolution.value.copy(size);
  }
  label(text, x, y, z, w = 4, h = 1, color = "#c5c4b3", bg = "#19231e") {
    const mat = new T.MeshStandardMaterial({
      map: decalTexture(text, color, bg),
      transparent: true,
      roughness: 0.8,
    });
    const sign = mesh(
      geometry("PlaneGeometry", w, h),
      mat,
      this.world,
      x,
      y,
      z,
    );
    sign.castShadow = false;
    return sign;
  }
  point(x, y, z, color, intensity = 40, distance = 15) {
    const l = new T.PointLight(color, intensity, distance, 2);
    l.position.set(x, y, z);
    this.world.add(l);
    return l;
  }
  groundMark(text, x, z, w = 5, angle = 0, color = "#bdb89a") {
    const p = this.label(text, x, 0.018, z, w, w / 4, color, null);
    p.rotation.x = -Math.PI / 2;
    p.rotation.z = angle;
    return p;
  }
  buildLevel(level) {
    this.level = level;
    const l = LEVELS[level - 1],
      m = this.materials;
    this.world.traverse((o) => {
      if (o.isLight && o.shadow?.map) o.shadow.map.dispose();
      if (o.isSprite) o.material.dispose();
      if (o.isMesh && o.geometry.userData.merged) o.geometry.dispose();
    });
    this.world.clear();
    this.characters.clear();
    this.zombieBatches = new Map();
    this.zombieNodes = new WeakMap();
    this.enemyMeshes.clear();
    this.corpses = [];
    this.effects.forEach((e) => this.scene.remove(e.object));
    this.effects = [];
    this.decals = [];
    this.projectileMeshes.forEach((o) => this.scene.remove(o));
    this.projectileMeshes.clear();
    this.pickupMeshes.forEach((o) => this.scene.remove(o));
    this.pickupMeshes.clear();
    this.environmentEffects = [];
    this.scene.background = new T.Color(l.sky);
    this.scene.fog = new T.FogExp2(l.fog, l.fogDensity);
    const hemi = new T.HemisphereLight(l.light, 0x262722, 1.7);
    this.world.add(hemi);
    const sun = new T.DirectionalLight(l.light, 2.1);
    sun.position.set(14, 26, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -42,
      right: 42,
      top: 42,
      bottom: -42,
      near: 1,
      far: 95,
    });
    sun.shadow.bias = -0.00018;
    sun.shadow.normalBias = 0.025;
    this.world.add(sun);
    this.world.add(sun.target);
    const floorMap = m.textures.asphalt.clone();
    floorMap.repeat.set(24, 24);
    floorMap.needsUpdate = true;
    const floorMat = new T.MeshStandardMaterial({
      map: floorMap,
      color: level === 4 ? 0x8b9992 : 0x919f9f,
      roughness: 0.91,
      metalness: 0.06,
    });
    const floor = mesh(geometry("PlaneGeometry", 90, 90), floorMat, this.world);
    floor.rotation.x = -Math.PI / 2;
    floor.castShadow = false;
    // Paved road, drainage, lane markings, and sidewalks.
    for (const side of [-1, 1]) {
      box(this.world, m.concrete, side * 20, 0.09, 0, 2, 0.18, 72);
      box(this.world, m.concrete, side * 21.2, 0.07, 0, 0.15, 0.14, 72);
      for (let z = -32; z < 35; z += 4) {
        box(this.world, m.dark, side * 19, 0.015, z, 0.4, 0.018, 0.8);
        for (let i = 0; i < 4; i++)
          box(
            this.world,
            m.steel,
            side * 19 - 0.14 + i * 0.09,
            0.026,
            z,
            0.023,
            0.018,
            0.73,
          );
      }
    }
    for (let z = -28; z <= 30; z += 5) {
      box(this.world, m.white, -0.15, 0.012, z, 0.12, 0.012, 2);
      box(this.world, m.white, 0.15, 0.012, z, 0.12, 0.012, 2);
    }
    for (let i = 0; i < 8; i++)
      box(this.world, m.white, -6 + i * 1.6, 0.014, 2, 0.7, 0.015, 3);
    const obstacles = layout(level);
    for (let i = 0; i < obstacles.length; i++) {
      const b = obstacles[i];
      if (b.kind === "building") this.buildBuilding(b, i, l.theme);
      else this.buildProp(b, i, l.theme);
    }
    for (let i = 0; i < 15; i++) {
      const x = ((i * 17 + 7) % 38) - 19,
        z = ((i * 13 + 9) % 61) - 30;
      if (
        obstacles.some(
          (b) =>
            Math.abs(x - b.x) < b.w / 2 + 1 && Math.abs(z - b.z) < b.d / 2 + 1,
        )
      )
        continue;
      const rubble = new T.Group();
      rubble.position.set(x, 0, z);
      this.world.add(rubble);
      for (let r = 0; r < 3; r++) {
        const o = box(
          rubble,
          r % 2 ? m.concrete : m.rust,
          rand(-0.5, 0.5),
          0.06,
          rand(-0.5, 0.5),
          rand(0.15, 0.55),
          rand(0.07, 0.2),
          rand(0.1, 0.35),
        );
        o.rotation.set(rand(-0.3, 0.3), rand(0, 6), rand(-0.2, 0.2));
      }
    }
    for (const side of [-1, 1])
      for (const z of [-18, 10, 29]) {
        const x = side * 18.5;
        cylinder(this.world, m.dark, x, 2.6, z, 0.06, 0.11, 5.2);
        const arm = box(
          this.world,
          m.dark,
          x - side * 0.6,
          5.12,
          z,
          1.4,
          0.07,
          0.07,
        );
        box(this.world, m.lamp, x - side * 1.15, 5.04, z, 0.6, 0.12, 0.23);
        this.point(x - side * 1.15, 4.7, z, 0xffc493, 24, 10);
      }
    for (let i = 0; i < 5; i++) {
      const x = [-17, 16, -8, 11, -15][i],
        z = [-22, -18, 23, 26, 1][i];
      this.addFire(x, z, i === 0 ? 1.3 : 0.7);
    }
    this.groundMark(
      level === 4 ? "QUARANTINE" : "KEEP CLEAR",
      0,
      7,
      7,
      0,
      level === 4 ? "#d2c0a6" : "#ada583",
    );
    this.groundMark("SECTOR 0" + level, -11, 21, 5, 0.3);
    // Dust, ash or rain as one point cloud.
    const positions = new Float32Array(900 * 3);
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = rand(-36, 36);
      positions[i + 1] = rand(0.5, 22);
      positions[i + 2] = rand(-36, 36);
    }
    const rain = new T.Points(
      new T.BufferGeometry().setAttribute(
        "position",
        new T.BufferAttribute(positions, 3),
      ),
      new T.PointsMaterial({
        color: level === 3 || level === 5 ? 0xd6ac85 : 0xaac6ca,
        size: level === 2 ? 0.06 : 0.035,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      }),
    );
    this.world.add(rain);
    this.weather = rain;
    if (l.theme === "dock") {
      const water = mesh(
        geometry("PlaneGeometry", 100, 30),
        new T.MeshStandardMaterial({
          color: 0x1e4653,
          metalness: 0.65,
          roughness: 0.27,
        }),
        this.world,
        0,
        -0.08,
        -49,
      );
      water.rotation.x = -Math.PI / 2;
      this.buildCrane(-19, -26);
      this.buildCrane(18, -25);
    }
    if (l.theme === "foundry") {
      for (const x of [-17, 17]) {
        cylinder(this.world, m.rust, x, 9, -22, 1.1, 1.6, 18);
        for (let y = 2; y < 17; y += 3)
          ring(this.world, m.steel, x, y, -22, 1.2, 0.1).rotation.x =
            Math.PI / 2;
      }
      this.point(0, 4, -20, 0xff7237, 160, 22);
    }
    if (l.theme === "hospital") {
      this.label("ST. LAZARUS", 0, 7, -27.4, 16, 2, "#c1d6c3", "#243b32");
      this.label("EMERGENCY", 0, 3, -27.3, 8, 1, "#dfb5a5", "#502d2b");
      this.groundMark("H", 0, -1, 4, 0, "#c6c3aa");
      for (const x of [-5, 5]) {
        cylinder(this.world, m.red, x, 0.48, -22, 0.17, 0.21, 0.9);
        box(this.world, m.white, x, 0.7, -22, 0.06, 0.18, 0.36);
      }
    }
    if (l.theme === "reactor") {
      for (const x of [-10, 10]) this.point(x, 2, -10, 0xff4141, 120, 18);
      this.label("PROTOCOL ZERO", 0, 5, -27.3, 17, 1.8, "#eeb5a1", "#4a2424");
    }
    this.hero = makeZombie(
      m,
      level === 1 ? "shambler" : l.bossType,
      level === 1 ? 1.24 : 1.05,
    );
    this.hero.position.set(2.5, 0, 4.5);
    this.hero.rotation.y = 0.4;
    this.characters.add(this.hero);
    this.point(3, 3, 5, 0xffc5a0, 65, 10);
    this.point(-2, 3, 3, 0x9acede, 45, 10);
    this.batchStatic();
  }
  buildBuilding(b, index, theme) {
    const m = this.materials,
      { x, z, w, d, h } = b;
    const wall =
      theme === "hospital"
        ? m.concrete
        : theme === "reactor"
          ? m.dark
          : m.brick;
    box(this.world, wall, x, h / 2, z, w, h, d);
    box(this.world, m.concrete, x, h + 0.15, z, w + 0.35, 0.3, d + 0.35);
    box(this.world, m.dark, x, 0.6, z, w + 0.25, 1.2, d + 0.2);
    const side = x === 0 ? 0 : x > 0 ? -1 : 1;
    const faceZ = z + d / 2 + 0.03;
    if (side === 0) {
      for (let xx = -w / 2 + 1.5; xx < w / 2 - 1; xx += 2.1)
        for (let y = 2.5; y < h - 1; y += 2.5) {
          box(
            this.world,
            index % 2 ? m.glass : m.dark,
            x + xx,
            y,
            faceZ,
            0.9,
            1.35,
            0.09,
          );
          box(
            this.world,
            m.concrete,
            x + xx,
            y - 0.7,
            faceZ + 0.03,
            1.12,
            0.1,
            0.15,
          );
        }
      box(this.world, m.dark, x, 1.55, faceZ + 0.02, 5, 3.1, 0.12);
      for (const s of [-1, 1])
        box(
          this.world,
          m.steel,
          x + s * 2.6,
          1.55,
          faceZ + 0.07,
          0.14,
          3.1,
          0.15,
        );
    } else {
      const fx = x + side * (w / 2 + 0.035);
      for (let zz = z - d / 2 + 1.4; zz < z + d / 2 - 1; zz += 2)
        for (let y = 2.5; y < h - 1; y += 2.5) {
          box(
            this.world,
            Math.floor(zz + y) % 5 === 0 ? m.lamp : m.glass,
            fx,
            y,
            zz,
            0.085,
            1.25,
            0.88,
          );
          box(
            this.world,
            m.concrete,
            fx + side * 0.06,
            y - 0.66,
            zz,
            0.2,
            0.08,
            1.08,
          );
        }
      box(this.world, m.steel, fx + side * 0.06, 1.5, z, 0.07, 2.9, 3);
      for (let zz = z - 1.4; zz < z + 1.5; zz += 0.23)
        box(this.world, m.dark, fx + side * 0.11, 1.5, zz, 0.05, 2.8, 0.055);
      for (let y = 1.5; y < h; y += 3.2)
        box(this.world, m.concrete, fx + side * 0.08, y, z, 0.23, 0.08, d);
      const sign = this.label(
        index % 2 ? "NO ENTRY" : "EVACUATE",
        fx + side * 0.17,
        3.3,
        z,
        4,
        0.72,
        "#c8bfa5",
        "#433d31",
      );
      sign.rotation.y = (side * Math.PI) / 2;
      const pipe = cylinder(
        this.world,
        m.rust,
        fx + side * 0.2,
        h / 2,
        z + d / 2 - 0.7,
        0.1,
        0.1,
        h,
        8,
      );
      box(
        this.world,
        m.dark,
        fx + side * 0.38,
        2,
        z - d / 2 + 2,
        0.6,
        0.9,
        1.2,
      );
    }
    for (let i = 0; i < 3; i++)
      box(this.world, m.dark, x + (i - 1) * 2, h + 0.8, z, 0.8, 1.3, 0.8);
  }
  buildProp(b, index, theme) {
    const m = this.materials,
      { x, z, w, d, h, kind } = b,
      g = new T.Group();
    g.position.set(x, 0, z);
    this.world.add(g);
    if (kind === "car" || kind === "ambulance") {
      const paint =
        kind === "ambulance" ? m.white : index % 2 ? m.red : m.olive;
      box(g, paint, 0, 0.68, 0, w, 0.68, d);
      box(g, m.dark, 0, 0.4, 0, w + 0.03, 0.12, d + 0.08);
      box(
        g,
        paint,
        0,
        1.15,
        -0.14,
        w * 0.86,
        kind === "ambulance" ? 1.65 : 0.64,
        d * 0.52,
      );
      box(
        g,
        m.glass,
        0,
        kind === "ambulance" ? 1.7 : 1.22,
        -d * 0.3,
        w * 0.77,
        0.46,
        0.04,
      );
      box(g, m.glass, 0, 1.2, d * 0.22, w * 0.76, 0.4, 0.04);
      for (const side of [-1, 1]) {
        for (const zz of [-d * 0.31, d * 0.31]) {
          const tire = cylinder(
            g,
            m.black,
            side * (w / 2 + 0.015),
            0.42,
            zz,
            0.38,
            0.38,
            0.2,
            18,
          );
          tire.rotation.z = Math.PI / 2;
          const hub = cylinder(
            g,
            m.steel,
            side * (w / 2 + 0.125),
            0.42,
            zz,
            0.17,
            0.17,
            0.02,
            12,
          );
          hub.rotation.z = Math.PI / 2;
        }
        box(g, m.glass, side * w * 0.435, 1.23, -0.28, 0.025, 0.38, d * 0.38);
        box(g, m.steel, side * w * 0.505, 0.94, 0.05, 0.03, 0.025, 0.18);
        box(g, m.lamp, side * w * 0.32, 0.75, -d / 2 - 0.015, 0.3, 0.13, 0.04);
        box(g, m.red, side * w * 0.32, 0.68, d / 2 + 0.015, 0.3, 0.1, 0.04);
      }
      box(g, m.steel, 0, 0.55, -d / 2 - 0.035, w * 0.95, 0.14, 0.1);
      for (let i = 0; i < 8; i++)
        box(
          g,
          m.dark,
          (i - 3.5) * 0.1,
          0.73,
          -d / 2 - 0.055,
          0.065,
          0.11,
          0.01,
        );
      if (kind === "ambulance") {
        box(g, m.red, 0, 2.05, 0, 0.8, 0.14, 0.2);
        for (const side of [-1, 1]) {
          box(g, m.red, side * w * 0.505, 1.43, 0.25, 0.014, 0.6, 0.17);
          box(g, m.red, side * w * 0.51, 1.43, 0.25, 0.015, 0.16, 0.6);
        }
      } else {
        const hood = box(
          g,
          paint,
          0,
          1.03,
          -d * 0.37,
          w * 0.96,
          0.08,
          d * 0.25,
        );
        hood.rotation.x = 0.07;
        for (let i = 0; i < 5; i++)
          box(
            g,
            m.black,
            rand(-w * 0.35, w * 0.35),
            1.08,
            rand(-d * 0.47, -d * 0.27),
            0.03,
            0.012,
            0.38,
          ).rotation.y = rand(-0.4, 0.4);
      }
    } else if (kind === "container") {
      const material = index % 2 ? m.rust : m.olive;
      box(g, material, 0, h / 2, 0, w, h, d);
      for (const side of [-1, 1]) {
        for (let zz = -d / 2 + 0.15; zz < d / 2; zz += 0.31)
          box(
            g,
            m.steel,
            side * (w / 2 + 0.008),
            h / 2,
            zz,
            0.035,
            h - 0.2,
            0.035,
          );
        for (const xx of [-w * 0.23, w * 0.23]) {
          box(g, m.dark, xx, h / 2, d / 2 + 0.035, 0.03, h - 0.2, 0.04);
          box(g, m.steel, xx, 0.75, d / 2 + 0.08, 0.08, 0.18, 0.1);
        }
        box(g, m.steel, (side * w) / 2, 0.08, 0, 0.08, 0.1, d);
        box(g, m.steel, (side * w) / 2, h - 0.08, 0, 0.08, 0.1, d);
      }
      const sign = this.label(
        "CAUTION",
        x,
        1.8,
        z + d / 2 + 0.08,
        3,
        0.75,
        "#d8c59b",
        "#45443a",
      );
    } else if (kind === "crate") {
      box(g, m.wood, 0, h / 2, 0, w, h, d);
      for (const side of [-1, 1]) {
        box(g, m.dark, side * w * 0.38, h / 2, 0, 0.08, h + 0.02, d + 0.02);
        box(g, m.dark, 0, h / 2, side * d * 0.38, w + 0.02, h + 0.02, 0.07);
      }
      for (let i = 0; i < 3; i++)
        box(g, m.wood, 0, ((i + 0.5) * h) / 3, d / 2 + 0.035, w, 0.045, 0.06);
    } else if (kind === "barrier") {
      box(g, m.concrete, 0, h / 2, 0, w, h, d);
      for (let i = 0; i < w / 0.35; i++) {
        const stripe = box(
          g,
          i % 2 ? m.dark : m.gold,
          -w / 2 + i * 0.35 + 0.15,
          h * 0.65,
          d / 2 + 0.008,
          0.2,
          h * 0.6,
          0.012,
        );
        stripe.rotation.z = -0.3;
      }
    } else if (kind === "bed") {
      box(g, m.steel, 0, 0.65, 0, w, 0.15, d);
      box(g, m.white, 0, 0.83, 0, w * 0.85, 0.22, d * 0.8);
      box(g, m.cloth, 0, 1.01, 0.3, w * 0.86, 0.06, d * 0.5);
      for (const xx of [-w * 0.42, w * 0.42])
        for (const zz of [-d * 0.36, d * 0.36]) {
          cylinder(g, m.steel, xx, 0.38, zz, 0.033, 0.033, 0.65);
          const wheel = cylinder(g, m.black, xx, 0.14, zz, 0.1, 0.1, 0.08, 10);
          wheel.rotation.z = Math.PI / 2;
        }
      sphere(g, m.white, 0, 1.02, -d * 0.28, 0.28, 2, 0.3, 1);
    } else if (kind === "furnace" || kind === "tank") {
      cylinder(g, m.rust, 0, h / 2, 0, w * 0.43, w * 0.47, h, 24);
      for (const y of [0.2, h - 0.2, h * 0.45])
        ring(g, m.steel, 0, y, 0, w * 0.47, 0.12).rotation.x = Math.PI / 2;
      box(g, m.dark, 0, h * 0.42, d * 0.45, w * 0.55, h * 0.35, 0.1);
      box(g, m.fire, 0, h * 0.42, d * 0.46, w * 0.4, h * 0.21, 0.08);
      for (let i = 0; i < 6; i++)
        box(
          g,
          m.dark,
          (i - 2.5) * w * 0.07,
          h * 0.42,
          d * 0.49,
          0.04,
          h * 0.29,
          0.05,
        );
      cylinder(g, m.rust, 0, h + 1, 0, 0.55, 0.55, 2);
      this.point(x, 2, z + d * 0.6, 0xff9b40, 100, 14);
    } else if (kind === "pylon") {
      box(g, m.dark, 0, 1.7, 0, 1.8, 3.4, 1.8);
      cylinder(g, m.steel, 0, 4, 0, 0.55, 0.7, 2.3);
      for (let y = 3.2; y < 5.1; y += 0.28)
        ring(g, m.dark, 0, y, 0, 0.8, 0.07).rotation.x = Math.PI / 2;
      sphere(g, m.core, 0, 5.4, 0, 0.42);
      cylinder(g, m.dark, 0, 5.7, 0, 0.03, 0.15, 0.7);
    } else if (kind === "reactor") {
      cylinder(g, m.dark, 0, 2.1, 0, w * 0.42, w * 0.48, 4.2, 32);
      cylinder(g, m.steel, 0, 4.8, 0, w * 0.3, w * 0.35, 1.8, 32);
      cylinder(g, m.core, 0, 4.8, 0, w * 0.29, w * 0.29, 1.5, 32);
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        box(
          g,
          m.dark,
          Math.sin(a) * w * 0.31,
          4.8,
          Math.cos(a) * w * 0.31,
          0.3,
          2.4,
          0.3,
        );
      }
      cylinder(g, m.dark, 0, 6, 0, w * 0.37, w * 0.37, 0.3, 32);
      ring(g, m.core, 0, 3.5, 0, w * 0.44, 0.08).rotation.x = Math.PI / 2;
      ring(g, m.rust, 0, 1.1, 0, w * 0.5, 0.16).rotation.x = Math.PI / 2;
    }
  }
  buildCrane(x, z) {
    const m = this.materials;
    for (const dx of [-2, 2])
      box(this.world, m.rust, x + dx, 7, z, 0.4, 14, 0.4);
    box(this.world, m.rust, x, 13.9, z, 10, 0.5, 0.7);
    box(this.world, m.dark, x + 3, 8, z, 0.045, 12, 0.045);
    box(this.world, m.rust, x + 3, 2.1, z, 0.16, 0.4, 0.2);
  }
  addFire(x, z, scale = 1) {
    const m = this.materials;
    box(this.world, m.dark, x, 0.12, z, 1.5 * scale, 0.25, 1.5 * scale);
    this.point(x, 1, z, 0xff9a4a, 42 * scale, 12);
    for (let i = 0; i < 7; i++) {
      const s = new T.Sprite(
        new T.SpriteMaterial({
          map: m.particle,
          color: i % 2 ? 0xff912c : 0xffd294,
          transparent: true,
          opacity: 0.65,
          blending: T.AdditiveBlending,
          depthWrite: false,
        }),
      );
      this.world.add(s);
      this.environmentEffects.push({
        sprite: s,
        x,
        z,
        scale,
        offset: i * 0.37,
        smoke: false,
      });
    }
    for (let i = 0; i < 4; i++) {
      const s = new T.Sprite(
        new T.SpriteMaterial({
          map: m.particle,
          color: 0x303b3c,
          transparent: true,
          opacity: 0.17,
          depthWrite: false,
        }),
      );
      this.world.add(s);
      this.environmentEffects.push({
        sprite: s,
        x,
        z,
        scale: scale * 2,
        offset: i * 0.83,
        smoke: true,
      });
    }
  }
  batchStatic() {
    this.world.updateMatrixWorld(true);
    const batches = new Map(),
      remove = [];
    this.world.traverse((o) => {
      if (
        !o.isMesh ||
        !o.geometry ||
        Array.isArray(o.material) ||
        o.geometry.type === "PlaneGeometry"
      )
        return;
      let batch = batches.get(o.material.uuid);
      if (!batch) {
        batch = {
          material: o.material,
          positions: [],
          normals: [],
          uvs: [],
          indices: [],
        };
        batches.set(o.material.uuid, batch);
      }
      const g = o.geometry.clone().applyMatrix4(o.matrixWorld),
        p = g.attributes.position,
        n = g.attributes.normal,
        uv = g.attributes.uv,
        offset = batch.positions.length / 3;
      batch.positions.push(...p.array);
      batch.normals.push(...n.array);
      batch.uvs.push(...uv.array);
      if (g.index)
        for (const index of g.index.array) batch.indices.push(index + offset);
      else for (let i = 0; i < p.count; i++) batch.indices.push(i + offset);
      g.dispose();
      remove.push(o);
    });
    for (const o of remove) o.parent.remove(o);
    for (const b of batches.values()) {
      const geo = new T.BufferGeometry();
      geo.setAttribute(
        "position",
        new T.Float32BufferAttribute(b.positions, 3),
      );
      geo.setAttribute("normal", new T.Float32BufferAttribute(b.normals, 3));
      geo.setAttribute("uv", new T.Float32BufferAttribute(b.uvs, 2));
      geo.setIndex(b.indices);
      geo.userData.merged = true;
      const object = new T.Mesh(geo, b.material);
      object.castShadow = true;
      object.receiveShadow = true;
      this.world.add(object);
    }
    this.localLights = [];
    this.world.traverse((o) => {
      if (o.isPointLight) this.localLights.push(o);
    });
  }
  batchCharacters() {
    for (const batch of this.zombieBatches.values()) batch.count = 0;
    for (const root of this.characters.children.filter(
      (o) => o.isGroup && o.visible,
    )) {
      let nodes = this.zombieNodes.get(root);
      if (!nodes) {
        nodes = [];
        root.traverse((o) => {
          if (o.isMesh) {
            nodes.push(o);
            o.visible = false;
          }
        });
        this.zombieNodes.set(root, nodes);
      }
      root.updateMatrixWorld(true);
      for (const node of nodes) {
        const key = node.geometry.uuid + node.material.uuid;
        let batch = this.zombieBatches.get(key);
        if (!batch) {
          batch = new T.InstancedMesh(node.geometry, node.material, 512);
          batch.count = 0;
          batch.castShadow = true;
          batch.receiveShadow = true;
          batch.frustumCulled = false;
          this.characters.add(batch);
          this.zombieBatches.set(key, batch);
        }
        if (batch.count < 512)
          batch.setMatrixAt(batch.count++, node.matrixWorld);
      }
    }
    for (const batch of this.zombieBatches.values())
      batch.instanceMatrix.needsUpdate = true;
  }
  setWeapon(index) {
    this.weaponModels[this.weaponIndex].visible = false;
    this.weaponIndex = index;
    this.weaponModels[index].visible = true;
    this.recoil = 0.1;
  }
  blood(x, z, scale = 0.65) {
    const decal = new T.Mesh(
      geometry("PlaneGeometry", scale * 2.3, scale * 2.3),
      this.materials.blood,
    );
    decal.position.set(x, 0.019, z);
    decal.rotation.set(-Math.PI / 2, 0, rand(0, Math.PI * 2));
    this.world.add(decal);
    this.decals.push(decal);
    if (this.decals.length > 45) this.world.remove(this.decals.shift());
  }
  burst(x, y, z, color, count = 12, speed = 4, life = 0.6) {
    for (let i = 0; i < count; i++) {
      const object = new T.Sprite(
        new T.SpriteMaterial({
          map: this.materials.particle,
          color,
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
          blending: T.AdditiveBlending,
        }),
      );
      object.position.set(x, y, z);
      const size = rand(0.035, 0.13);
      object.scale.setScalar(size);
      this.scene.add(object);
      this.effects.push({
        object,
        vx: rand(-speed, speed),
        vy: rand(0, speed),
        vz: rand(-speed, speed),
        life: rand(life * 0.5, life),
        max: life,
        gravity: 5,
        size,
      });
    }
    while (this.effects.length > 220) {
      const e = this.effects.shift();
      this.scene.remove(e.object);
      e.object.material.dispose();
    }
  }
  handle(event, game) {
    if (event.type === "level") this.buildLevel(event.level);
    if (event.type === "switch") this.setWeapon(event.index);
    if (event.type === "fire") {
      const w = WEAPONS[event.weapon];
      this.recoilVelocity += w.recoil * 8;
      this.flashTime = w.id === "flame" ? 0.1 : 0.045;
      const c = game.eye,
        dir = new T.Vector3(
          -Math.sin(game.player.yaw),
          0,
          -Math.cos(game.player.yaw),
        );
      if (w.id === "flame") {
        for (let i = 0; i < 5; i++) {
          const d = rand(1, 6);
          this.burst(
            c.x + dir.x * d,
            1.3 + rand(-0.3, 0.3),
            c.z + dir.z * d,
            i % 2 ? 0xff9c3d : 0xffe5a1,
            1,
            1.2,
            0.38,
          );
        }
      }
    }
    if (event.type === "tracer") {
      const from = new T.Vector3(
          event.from.x,
          event.from.y - 0.12,
          event.from.z,
        ),
        to = new T.Vector3(event.to.x, event.to.y, event.to.z);
      const mat = new T.LineBasicMaterial({
        color: 0xffdca5,
        transparent: true,
        opacity: 0.55,
      });
      const object = new T.Line(
        new T.BufferGeometry().setFromPoints([from, to]),
        mat,
      );
      this.scene.add(object);
      this.effects.push({
        object,
        life: 0.045,
        max: 0.045,
        vx: 0,
        vy: 0,
        vz: 0,
      });
      if (event.wall && Number.isFinite(to.x))
        this.burst(to.x, to.y, to.z, 0xc9b291, 4, 1.4, 0.28);
    }
    if (event.type === "hit")
      this.burst(
        event.x,
        event.y,
        event.z,
        0x9e292e,
        event.headshot ? 6 : 3,
        1.5,
        0.35,
      );
    if (event.type === "kill") {
      const o = this.enemyMeshes.get(event.id);
      if (o) {
        this.enemyMeshes.delete(event.id);
        o.userData.dead = true;
        o.rotation.x = -Math.PI / 2;
        o.rotation.z = rand(-0.25, 0.25);
        o.position.y = 0.22;
        this.corpses.push(o);
        if (this.corpses.length > 12)
          this.characters.remove(this.corpses.shift());
      }
      this.blood(event.x, event.z, event.boss ? 2.5 : 0.85);
    }
    if (event.type === "damage") this.damageFlash = 0.8;
    if (event.type === "explosion") {
      this.burst(event.x, event.y, event.z, 0xffb369, 45, 8, 1.1);
      const light = new T.PointLight(0xffa14a, 150, 18);
      light.position.set(event.x, event.y + 1, event.z);
      this.scene.add(light);
      this.effects.push({
        object: light,
        life: 0.35,
        max: 0.35,
        vx: 0,
        vy: 0,
        vz: 0,
      });
    }
  }
  sync(game, dt) {
    const ids = new Set(game.enemies.filter((e) => e.hp > 0).map((e) => e.id));
    for (const [id, o] of this.enemyMeshes)
      if (!ids.has(id)) {
        this.characters.remove(o);
        this.enemyMeshes.delete(id);
      }
    for (const e of game.enemies) {
      if (e.hp <= 0) continue;
      let o = this.enemyMeshes.get(e.id);
      if (!o) {
        o = makeZombie(this.materials, e.type, e.scale);
        this.characters.add(o);
        this.enemyMeshes.set(e.id, o);
      }
      o.position.set(e.x, Math.sin(e.age * e.speed * 3) * 0.018, e.z);
      o.rotation.y = e.angle;
      this.animateZombie(
        o,
        e.age,
        e.speed,
        e.attackAnim || 0,
        e.phase !== "walk",
      );
      if (e.burn > 0 && Math.random() < 0.3)
        this.burst(e.x, rand(0.4, 1.6) * e.scale, e.z, 0xffa354, 1, 0.8, 0.35);
    }
    const projectileIds = new Set(game.projectiles.map((p) => p.id));
    for (const [id, o] of this.projectileMeshes)
      if (!projectileIds.has(id)) {
        this.scene.remove(o);
        this.projectileMeshes.delete(id);
      }
    for (const p of game.projectiles) {
      let o = this.projectileMeshes.get(p.id);
      if (!o) {
        o = new T.Mesh(
          geometry(
            "SphereGeometry",
            p.kind === "rocket" ? 0.09 : p.kind === "grenade" ? 0.08 : 0.14,
            10,
            8,
          ),
          p.kind === "acid"
            ? this.materials.toxic
            : p.kind === "rocket"
              ? this.materials.fire
              : this.materials.olive,
        );
        this.scene.add(o);
        this.projectileMeshes.set(p.id, o);
      }
      o.position.set(p.x, p.y, p.z);
      if (p.kind === "rocket")
        this.burst(p.x, p.y, p.z, 0xffb878, 1, 0.4, 0.15);
    }
    const pickupIds = new Set(game.pickups.map((p) => p.id));
    for (const [id, o] of this.pickupMeshes)
      if (!pickupIds.has(id)) {
        this.scene.remove(o);
        this.pickupMeshes.delete(id);
      }
    for (const p of game.pickups) {
      let o = this.pickupMeshes.get(p.id);
      if (!o) {
        o = new T.Group();
        box(
          o,
          p.kind === "health" ? this.materials.white : this.materials.olive,
          0,
          0,
          0,
          0.5,
          0.25,
          0.35,
        );
        if (p.kind === "health") {
          box(o, this.materials.red, 0, 0.13, 0, 0.08, 0.012, 0.25);
          box(o, this.materials.red, 0, 0.134, 0, 0.28, 0.012, 0.08);
        } else
          for (let i = 0; i < 4; i++)
            tube(
              o,
              this.materials.gold,
              (i - 1.5) * 0.08,
              0.13,
              0,
              0.018,
              0.18,
            );
        this.scene.add(o);
        this.pickupMeshes.set(p.id, o);
      }
      o.position.set(p.x, 0.28 + Math.sin(this.time * 2) * 0.03, p.z);
      o.rotation.y = this.time * 0.25;
    }
    for (const h of game.hazards) {
      if (!h.rendered) {
        const mat = new T.MeshBasicMaterial({
          color: h.kind === "acid" ? 0x9ccd47 : 0xff6158,
          transparent: true,
          opacity: 0.23,
          depthWrite: false,
          side: T.DoubleSide,
        });
        const object = new T.Mesh(
          geometry("RingGeometry", h.radius * 0.87, h.radius, 48),
          mat,
        );
        object.rotation.x = -Math.PI / 2;
        object.position.set(h.x, 0.035, h.z);
        this.scene.add(object);
        this.effects.push({
          object,
          life: h.delay + h.life,
          max: h.delay + h.life,
          vx: 0,
          vy: 0,
          vz: 0,
          hazard: h,
        });
        h.rendered = true;
      }
    }
  }
  animateZombie(o, time, speed = 1, attack = 0, charge = false) {
    const { body, head, arms, legs } = o.userData;
    const a = time * (speed > 2 ? 7 : 3.6);
    body.rotation.z = Math.sin(a * 0.5) * 0.025;
    body.rotation.x = charge ? 0.2 : 0.025;
    head.rotation.z = 0.07 + Math.sin(time * 1.7) * 0.06;
    head.rotation.x = -0.07;
    legs.forEach(({ leg, knee }, i) => {
      leg.rotation.x = Math.sin(a + i * Math.PI) * 0.3;
      knee.rotation.x = Math.max(0, -Math.sin(a + i * Math.PI)) * 0.4;
    });
    arms.forEach((arm, i) => {
      arm.rotation.x = -0.9 + Math.sin(a + i * Math.PI) * 0.13 - attack * 2;
      arm.rotation.z = (i ? 1 : -1) * (0.1 + Math.sin(a * 0.7) * 0.04);
    });
  }
  updateEffects(dt) {
    for (const e of this.effects) {
      e.life -= dt;
      if (e.vx !== undefined) {
        e.object.position.x += e.vx * dt;
        e.object.position.y += e.vy * dt;
        e.object.position.z += e.vz * dt;
        if (e.gravity) e.vy -= e.gravity * dt;
      }
      if (e.object.material && e.object.material.transparent)
        e.object.material.opacity = Math.max(0, e.life / e.max) * 0.75;
      if (e.object.isPointLight)
        e.object.intensity = 150 * Math.max(0, e.life / e.max);
    }
    this.effects = this.effects.filter((e) => {
      if (e.life > 0) return true;
      this.scene.remove(e.object);
      if (e.object.material) e.object.material.dispose();
      if (e.object.isLine) e.object.geometry.dispose();
      return false;
    });
    for (const e of this.environmentEffects) {
      const phase = (this.time * (e.smoke ? 0.35 : 1.1) + e.offset) % 1;
      e.sprite.position.set(
        e.x + Math.sin(this.time + e.offset) * phase * 0.3,
        phase * (e.smoke ? 6 : 2) * e.scale + 0.3,
        e.z,
      );
      const s = (e.smoke ? 1.5 + phase * 2 : 0.5 + phase * 0.3) * e.scale;
      e.sprite.scale.set(s, s * (e.smoke ? 1 : 1.8), 1);
      e.sprite.material.opacity = (1 - phase) * (e.smoke ? 0.13 : 0.55);
    }
    if (this.weather) {
      const p = this.weather.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let y =
          p.getY(i) +
          (this.level === 2
            ? -8
            : this.level === 3 || this.level === 5
              ? 0.5
              : -1) *
            dt;
        if (y < 0) y = 22;
        if (y > 22) y = 0.1;
        p.setY(i, y);
      }
      p.needsUpdate = true;
    }
  }
  render(game, dt, movement = 0) {
    this.time += dt;
    this.updateEffects(dt);
    this.recoilVelocity -= this.recoil * 65 * dt;
    this.recoilVelocity *= Math.exp(-dt * 11);
    this.recoil += this.recoilVelocity * dt;
    this.recoil = Math.max(0, this.recoil);
    this.flashTime -= dt;
    this.damageFlash = Math.max(0, this.damageFlash - dt * 2);
    const menu = game.state === "menu";
    this.hero.visible = menu;
    if (menu) {
      this.camera.position.set(
        3.8 + Math.sin(this.time * 0.13) * 0.3,
        2.05,
        7.7,
      );
      this.camera.lookAt(-2, 1.4, 0);
      this.animateZombie(this.hero, this.time * 0.7, 0.3);
      this.light.intensity = 0;
    } else {
      this.sync(game, dt);
      const p = game.player;
      this.walkTime += dt * movement * 9;
      const bob = movement
        ? Math.sin(this.walkTime) * 0.035
        : Math.sin(this.time * 1.4) * 0.006;
      this.camera.position.set(p.x, (p.crouch ? 1.15 : 1.7) + bob, p.z);
      this.camera.rotation.set(p.pitch + this.recoil * 0.12, p.yaw, 0, "YXZ");
      const fov = p.aim ? (this.weaponIndex === 6 ? 29 : 52) : 72;
      this.camera.fov += (fov - this.camera.fov) * Math.min(1, dt * 12);
      this.camera.updateProjectionMatrix();
      this.light.intensity = this.flashlight ? 40 : 0;
      this.light.position.copy(this.camera.position);
      const direction = new T.Vector3(0, 0, -1).applyQuaternion(
        this.camera.quaternion,
      );
      this.light.target.position
        .copy(this.camera.position)
        .addScaledVector(direction, 10);
    }
    this.batchCharacters();
    const closest = [...this.localLights]
      .sort(
        (a, b) =>
          a.position.distanceToSquared(this.camera.position) -
          b.position.distanceToSquared(this.camera.position),
      )
      .slice(0, 4);
    for (const l of this.localLights) l.visible = closest.includes(l);
    const model = this.weaponModels[this.weaponIndex];
    this.weaponCamera.fov = this.camera.fov;
    this.weaponCamera.updateProjectionMatrix();
    const p = game.player;
    let reloadAngle = 0,
      reloadDrop = 0;
    if (p.reload > 0) {
      const phase = 1 - p.reload / p.reloadDuration;
      reloadAngle = Math.sin(phase * Math.PI) * -0.6;
      reloadDrop = Math.sin(phase * Math.PI) * -0.22;
    }
    const aiming = p.aim && !menu;
    this.weaponRig.position.set(
      aiming ? 0 : 0.31,
      (aiming ? -0.14 : -0.3) +
        reloadDrop +
        Math.sin(this.walkTime) * movement * 0.008,
      -0.49 + this.recoil * 0.6,
    );
    this.weaponRig.rotation.set(
      this.recoil * 1.2 + reloadAngle,
      aiming ? 0 : -0.06,
      reloadAngle * 0.6 + Math.cos(this.walkTime) * movement * 0.015,
    );
    this.weaponRig.scale.setScalar(0.84);
    if (model.userData.slide)
      model.userData.slide.position.z = -0.13 + this.recoil * 0.4;
    if (model.userData.pump)
      model.userData.pump.position.z = -0.54 + this.recoil * 0.45;
    this.flash.position.set(0, 0.075, -model.userData.length - 0.05);
    this.flash.visible =
      this.flashTime > 0 && WEAPONS[this.weaponIndex].id !== "flame";
    this.flash.rotation.z = Math.random() * Math.PI;
    this.gunFlash.intensity = this.flash.visible ? 9 : 0;
    this.gunFlash.position.set(0.25, -0.1, -0.8);
    this.renderer.setRenderTarget(this.target);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.stats = {
      calls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
    };
    if (
      !menu &&
      game.state !== "arsenal" &&
      !(p.aim && this.weaponIndex === 6)
    ) {
      this.renderer.clearDepth();
      this.renderer.render(this.weaponScene, this.weaponCamera);
    }
    this.renderer.setRenderTarget(null);
    this.renderer.clear();
    this.postMaterial.uniforms.time.value = this.time;
    this.postMaterial.uniforms.hurt.value = this.damageFlash;
    this.renderer.render(this.postScene, this.postCamera);
  }
  weaponThumbnails() {
    const canvas = document.createElement("canvas"),
      r = new T.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
    r.setSize(480, 210);
    r.setPixelRatio(1);
    r.outputColorSpace = T.SRGBColorSpace;
    r.toneMapping = T.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.45;
    const s = new T.Scene();
    s.add(new T.HemisphereLight(0xe2e8de, 0x252e32, 2.5));
    const key = new T.DirectionalLight(0xffd6aa, 4);
    key.position.set(-2, 3, 2);
    s.add(key);
    const fill = new T.DirectionalLight(0x91c8de, 2);
    fill.position.set(2, 1, -2);
    s.add(fill);
    s.environment = this.environment;
    const c = new T.OrthographicCamera(-0.95, 0.95, 0.415, -0.415, 0.01, 10);
    c.position.set(2.4, 0.45, 0.2);
    c.lookAt(0, 0, -0.3);
    const result = [];
    for (const w of WEAPONS) {
      const model = makeWeapon(this.materials, w.id);
      model.rotation.y = 0;
      s.add(model);
      r.render(s, c);
      result.push(canvas.toDataURL("image/png"));
      s.remove(model);
    }
    r.dispose();
    return result;
  }
}

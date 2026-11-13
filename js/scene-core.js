// =========================================================================
// 1. RAUM- & HAUS-INITIALISIERUNG (wird über house-editor.js geladen)
// =========================================================================
let ROOMS = [];
const DEMO_ROOMS = ROOMS;
window.currentHouseConfig = null;

function switchSidebarTab(tabId) {
  document.querySelectorAll('.sidebar-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.sidebar-tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabId}`);
  });
}

// =========================================================================
// 2. THREE.JS SZENE INITIALISIEREN
// =========================================================================
const container = document.getElementById('canvas-container');
const labelsContainer = document.getElementById('labels-container');
const scene = new THREE.Scene();
const houseRoot = new THREE.Group();
scene.add(houseRoot);

function withHouseTarget(fn) {
  const origAdd = scene.add.bind(scene);
  scene.add = (...objs) => houseRoot.add(...objs);
  try {
    return fn();
  } finally {
    scene.add = origAdd;
  }
}

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(1.7, 13.5, 11.2);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(1.7, 0.2, 0.3);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI / 2 - 0.04;
controls.update();

const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.35);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xdbeafe, 0.34);
dirLight.position.set(-5, 14, 8);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -9;
dirLight.shadow.camera.right = 9;
dirLight.shadow.camera.top = 9;
dirLight.shadow.camera.bottom = -9;
dirLight.shadow.camera.near = 2;
dirLight.shadow.camera.far = 28;
dirLight.shadow.bias = -0.0004;
dirLight.target.position.set(1.7, 0, 1.0);
scene.add(dirLight);
scene.add(dirLight.target);

// =========================================================================
// 3D ARCHITEKTUR-PODEST & ECHTES 3D-BODENRASTER
// =========================================================================
const pedestalGroup = new THREE.Group();
pedestalGroup.name = 'pedestalGroup';

// 1. Edles Hauptpodest (Dunkler Graphit-Sockel direkt unter der Wohnung)
const pedestalBodyGeo = new THREE.BoxGeometry(9.80, 0.14, 12.00);
const pedestalBodyMat = new THREE.MeshStandardMaterial({
  color: 0x141824,
  roughness: 0.38,
  metalness: 0.30
});
const pedestalBody = new THREE.Mesh(pedestalBodyGeo, pedestalBodyMat);
pedestalBody.position.set(1.70, -0.19, 1.00);
pedestalBody.receiveShadow = true;
pedestalGroup.add(pedestalBody);

// 2. Feine gefaste Fase / Kantenleiste oben
const pedestalLipGeo = new THREE.BoxGeometry(9.94, 0.02, 12.14);
const pedestalLipMat = new THREE.MeshStandardMaterial({
  color: 0x222a3a,
  roughness: 0.28,
  metalness: 0.45
});
const pedestalLip = new THREE.Mesh(pedestalLipGeo, pedestalLipMat);
pedestalLip.position.set(1.70, -0.121, 1.00);
pedestalLip.receiveShadow = true;
pedestalGroup.add(pedestalLip);

// 3. Dezenter Ambient-LED-Leuchtstreifen am unteren Rand des Sockels (Underglow)
const px1 = -4.90, px2 = 4.90, pz1 = -6.00, pz2 = 6.00;
const glowPoints = [
  new THREE.Vector3(px1, 0, pz1),
  new THREE.Vector3(px2, 0, pz1),
  new THREE.Vector3(px2, 0, pz2),
  new THREE.Vector3(px1, 0, pz2),
  new THREE.Vector3(px1, 0, pz1)
];
const glowLineGeo = new THREE.BufferGeometry().setFromPoints(glowPoints);
const glowLineMat = new THREE.LineBasicMaterial({
  color: 0x38bdf8,
  transparent: true,
  opacity: 0.65,
  blending: THREE.AdditiveBlending
});
const glowLine = new THREE.Line(glowLineGeo, glowLineMat);
glowLine.position.set(1.70, -0.258, 1.00);
pedestalGroup.add(glowLine);

scene.add(pedestalGroup);
pedestalGroup.visible = false;

// 4. Echtes 3D-Bodenraster (CAD / Architektur-Gitter mit Tiefenperspektive)
const groundGrid = new THREE.GridHelper(36, 36, 0x38bdf8, 0x2563eb);
groundGrid.position.set(1.70, -0.122, 1.00);
groundGrid.material.transparent = true;
groundGrid.material.opacity = 0.42;
groundGrid.visible = true;
scene.add(groundGrid);

// 5. 3D-Boden-Schattenplatte (Shadow Catcher unter dem Podest)
const groundShadowGeo = new THREE.PlaneGeometry(42, 42);
const groundShadowMat = new THREE.ShadowMaterial({ opacity: 0.38 });
const groundShadowPlane = new THREE.Mesh(groundShadowGeo, groundShadowMat);
groundShadowPlane.rotation.x = -Math.PI / 2;
groundShadowPlane.position.set(1.70, -0.125, 1.00);
groundShadowPlane.receiveShadow = true;
groundShadowPlane.visible = false;
scene.add(groundShadowPlane);

// 6. Atmosphärischer Entfernungsnebel (Fog) für weichen Horizontübergang
scene.fog = new THREE.FogExp2(0x0c0f16, 0.016);

// Erzeugt eine realistische, warme Eichenholz-Laminat/Parkett-Textur (wie auf den Wohnzimmer-Fotos)
function createOakFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Warmer Honig-/Natur-Eichenton
  ctx.fillStyle = '#bf9261';
  ctx.fillRect(0, 0, 512, 512);

  const plankH = 64;
  const palettes = ['#c59968', '#b88958', '#c99e6e', '#b38352', '#c19463'];
  for (let row = 0; row < 8; row++) {
    const y = row * plankH;
    const offset = (row % 2) * 128 + ((row * 73) % 90);
    for (let col = -1; col < 3; col++) {
      const x = col * 256 + offset;
      ctx.fillStyle = palettes[(row * 3 + col + 10) % palettes.length];
      ctx.fillRect(x, y, 255, plankH - 1.5);

      // Feine Holzmaserung in den Dielen
      ctx.strokeStyle = 'rgba(110, 70, 35, 0.13)';
      ctx.lineWidth = 1.2;
      for (let g = 0; g < 6; g++) {
        ctx.beginPath();
        const gy = y + 8 + g * 9;
        ctx.moveTo(x + 4, gy);
        ctx.bezierCurveTo(x + 85, gy + ((g % 2) ? 3 : -3), x + 170, gy + ((g % 2) ? -2 : 2), x + 250, gy);
        ctx.stroke();
      }

      // Dezente Dielenfuge
      ctx.fillStyle = 'rgba(82, 52, 26, 0.28)';
      ctx.fillRect(x, y + plankH - 1.5, 256, 1.5);
      ctx.fillRect(x + 254.5, y, 1.5, plankH);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3.2, 3.2);
  tex.needsUpdate = true;
  return tex;
}

const oakFloorTex = createOakFloorTexture();

// Erzeugt die diagonal (45°) verlegten grau-grünen Naturstein-/Schieferfliesen für Flur & Küche (wie auf IMG_6401–6403!)
function createDiagonalSlateTileTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Grundton der Schiefer-/Stein-Fliesen
  ctx.fillStyle = '#5e6768';
  ctx.fillRect(0, 0, 512, 512);

  // Leichte Naturstein-Wolkung
  const stoneShades = ['rgba(120, 132, 133, 0.22)', 'rgba(68, 76, 77, 0.24)', 'rgba(142, 152, 152, 0.16)'];
  for (let i = 0; i < 48; i++) {
    ctx.fillStyle = stoneShades[i % stoneShades.length];
    const rx = (i * 97) % 512;
    const ry = (i * 151) % 512;
    ctx.beginPath();
    ctx.arc(rx, ry, 28 + (i % 5) * 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // 45°-Diagonale Fliesenfugen (hellgrau)
  ctx.strokeStyle = 'rgba(182, 190, 192, 0.58)';
  ctx.lineWidth = 3.2;
  const step = 128;
  for (let d = -512; d <= 1024; d += step) {
    ctx.beginPath();
    ctx.moveTo(d, 0);
    ctx.lineTo(d + 512, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(d, 512);
    ctx.lineTo(d + 512, 0);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.needsUpdate = true;
  return tex;
}

const hallSlateTileTex = createDiagonalSlateTileTexture();

// Erzeugt eine realistische, warme Greige-/Sandstein-Großformat-Fliesentextur (Boden: 80x80cm quadratisch, Wand: 120x60cm rechteckig)
function createBathroomFloorTileTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Warmer Greige-/Sand-Feinsteinzeug-Grundton (IMG_6404–6406)
  ctx.fillStyle = '#bcb4a8';
  ctx.fillRect(0, 0, 512, 512);

  // Dezente mineralische Naturstein-Schattierungen
  const shades = ['rgba(202, 195, 185, 0.32)', 'rgba(172, 164, 153, 0.25)', 'rgba(220, 213, 203, 0.20)', 'rgba(152, 144, 134, 0.18)'];
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = shades[i % shades.length];
    const rx = (i * 89) % 512;
    const ry = (i * 137) % 512;
    ctx.beginPath();
    ctx.ellipse(rx, ry, 38 + (i % 4) * 14, 24 + (i % 3) * 10, (i % 5) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Feine dunkle Fliesenfuge am Rand der 80x80cm Bodenfliese
  ctx.strokeStyle = 'rgba(72, 66, 60, 0.75)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 508, 508);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.needsUpdate = true;
  return tex;
}

function createBathroomWallTileTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256; // 2:1 Querformat (120cm breit : 60cm hoch)
  const ctx = canvas.getContext('2d');

  // Greige-/Sandstein-Farbton passend zum Boden
  ctx.fillStyle = '#b8b0a4';
  ctx.fillRect(0, 0, 512, 256);

  // Sanfte Naturstein-Schattierungen
  const shades = ['rgba(202, 195, 185, 0.30)', 'rgba(168, 160, 150, 0.24)', 'rgba(220, 213, 203, 0.18)', 'rgba(150, 142, 132, 0.16)'];
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = shades[i % shades.length];
    const rx = (i * 97) % 512;
    const ry = (i * 73) % 256;
    ctx.beginPath();
    ctx.ellipse(rx, ry, 45 + (i % 4) * 15, 20 + (i % 3) * 8, (i % 5) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Feine dunkle Fuge am Rand der 120x60cm Wandfliese
  ctx.strokeStyle = 'rgba(72, 66, 60, 0.75)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 508, 252);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.needsUpdate = true;
  return tex;
}

const badFloorTileTex = createBathroomFloorTileTexture();
const badWallTileTex = createBathroomWallTileTexture();

// Materialien (originalgetreu abgestimmt auf die echten Wohnzimmer-, Flur- & Badezimmer-Fotos)
const mats = {
  wall: new THREE.MeshStandardMaterial({ color: 0xdbe4ee, roughness: 0.65, metalness: 0.05 }),
  outerFacade: new THREE.MeshStandardMaterial({ color: 0xede6d8, roughness: 0.65, metalness: 0.02 }), // Zeitloses, edles Eierschalenweiß (Eggshell / warmer Naturputz)
  outerWallTop: new THREE.MeshStandardMaterial({ color: 0xf7f4ec, roughness: 0.38, metalness: 0.04 }), // Saubere, helle Eierschalen-Abschlusskante oben
  wzWall: new THREE.MeshStandardMaterial({ color: 0xa68c83, roughness: 0.68, metalness: 0.03 }), // Warmer Taupe-/Cappuccino-Wandton im Wohnzimmer
  hallWall: new THREE.MeshStandardMaterial({ color: 0x8d9299, roughness: 0.65, metalness: 0.03 }), // Edles Hell-/Mittelgrau der Flurwände (IMG_6401–6403)
  badTileWall: new THREE.MeshStandardMaterial({ map: badWallTileTex, color: 0xd8d2c9, roughness: 0.36, metalness: 0.04 }), // Raumhohe Greige-Wandfliesen im Bad (IMG_6404–6406)
  badWhiteWall: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.58, metalness: 0.02 }), // Weiß verputzte Eingangswand rechts im Bad (IMG_6406)
  badWalnut: new THREE.MeshStandardMaterial({ color: 0x4c3d35, roughness: 0.42, metalness: 0.05 }), // Dunkelbraunes Nussbaum-Holzdekor (Waschtisch, Spiegelschrank & Hochschrank im Bad)
  szAccentWall: new THREE.MeshStandardMaterial({ color: 0x3d281f, roughness: 0.72, metalness: 0.02 }), // Dunkelbraune Espresso-Akzentwand (TV-Wand IMG_6410)
  szWhiteWall: new THREE.MeshStandardMaterial({ color: 0xf2ede8, roughness: 0.65, metalness: 0.02 }),  // Warmer heller Cremeweiß-Putz im Schlafzimmer
  szOak: new THREE.MeshStandardMaterial({ color: 0xc8a67c, roughness: 0.46, metalness: 0.04 }),        // Helles natürliches Eichenholz (Schrank & Wandboard)
  szBronzeGlass: new THREE.MeshStandardMaterial({ color: 0x766657, roughness: 0.12, metalness: 0.78 }),// Glänzendes bronzefarbenes Spiegelglas am Schwebetürenschrank
  szSheet: new THREE.MeshStandardMaterial({ color: 0xa8998a, roughness: 0.88 }),                        // Taupe/Greige Spannbettlaken (IMG_6407–6409)
  szDuvet: new THREE.MeshStandardMaterial({ color: 0xf5f6f8, roughness: 0.90 }),                        // Weiße Bettdecken & Kissen (IMG_6408)
  szGreyOak: new THREE.MeshStandardMaterial({ color: 0xa49a90, roughness: 0.44 }),                      // Helles Grau-Eichenholz der Standvitrine (IMG_6410)
  szPampas: new THREE.MeshStandardMaterial({ color: 0xdfd3be, roughness: 0.92 }),                       // Getrocknete Pampasgras-Wedel
  szRedGlass: new THREE.MeshStandardMaterial({ color: 0xa82025, roughness: 0.20, metalness: 0.1, transparent: true, opacity: 0.85 }), // Rotes Kerzenglas auf dem Lowboard
  wallTop: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 }),
  wzWallTop: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 }), // Weiße Deckenkante im Wohnzimmer, Flur & Bad
  glassDoor: new THREE.MeshPhysicalMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.58, roughness: 0.25, transmission: 0.42 }),
  woodFloor: new THREE.MeshStandardMaterial({ map: oakFloorTex, color: 0xeadbc8, roughness: 0.48 }),
  hallFloor: new THREE.MeshStandardMaterial({ map: hallSlateTileTex, color: 0xd8e0e0, roughness: 0.44 }),
  tileFloor: new THREE.MeshStandardMaterial({ map: badFloorTileTex, color: 0xd8d2c9, roughness: 0.38, metalness: 0.05 }), // Warme Greige-Feinsteinzeug-Bodenfliesen im Bad
  kitchenFloor: new THREE.MeshStandardMaterial({ map: hallSlateTileTex, color: 0xd8e0e0, roughness: 0.44 }),
  sofa: new THREE.MeshStandardMaterial({ color: 0x5c626a, roughness: 0.84 }), // Mittelgrauer Strukturstoff der L-Wohnlandschaft
  blanketBrown: new THREE.MeshStandardMaterial({ color: 0x543424, roughness: 0.92 }), // Braune Kuscheldecke auf der Recamiere
  rugMat: new THREE.MeshStandardMaterial({ color: 0x363a40, roughness: 0.95 }), // Dunkelgrauer/Anthrazit Hochflor-Teppich
  chairMat: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 }),
  woodDark: new THREE.MeshStandardMaterial({ color: 0x27201c, roughness: 0.5 }),
  anthraciteFurn: new THREE.MeshStandardMaterial({ color: 0x43484f, roughness: 0.40, metalness: 0.08 }), // Anthrazit-Korpus (Lowboard, Vitrine, Sideboard)
  greyDrawer: new THREE.MeshStandardMaterial({ color: 0x7e848b, roughness: 0.36, metalness: 0.06 }), // Hellere graue Schubladenfronten am Lowboard
  oakNatural: new THREE.MeshStandardMaterial({ color: 0xc48f56, roughness: 0.44 }), // Natur-Eiche (Sideboard-Deckplatte, Baumkante, Fensterbänke)
  slateMat: new THREE.MeshStandardMaterial({ color: 0x333840, roughness: 0.65, metalness: 0.12 }), // Schiefer-Mittelteil im Wandboard
  vitrineGlass: new THREE.MeshPhysicalMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.28, roughness: 0.08, metalness: 0.2, transmission: 0.6 }),
  chromeMat: new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.18, metalness: 0.88 }), // Edelstahl/Chrom (Teleskop-Stativ, Griffe, Sofafüße)
  woodSlat: new THREE.MeshStandardMaterial({ color: 0x9a6b43, roughness: 0.48 }),
  woodTable: new THREE.MeshStandardMaterial({ color: 0x855836, roughness: 0.45 }),
  wardrobeMat: new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.4 }),
  whiteFurn: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.32 }),
  counterTop: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 }),
  bedSheet: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.75 }),
  tvScreenOff: new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.2, metalness: 0.5 }),
  kitchenWall: new THREE.MeshStandardMaterial({ color: 0x7a848e, roughness: 0.65, metalness: 0.02 }), // Schieferblau-Grau der Küchenwände (IMG_6411–6413)
  kitchenFront: new THREE.MeshStandardMaterial({ color: 0xd6dade, roughness: 0.38, metalness: 0.05 }), // Helle matte Küchenfronten
  kitchenUpper: new THREE.MeshStandardMaterial({ color: 0x8a8f96, roughness: 0.40, metalness: 0.05 }), // Graue Oberschränke
  kitchenSplash: new THREE.MeshStandardMaterial({ color: 0x272c33, roughness: 0.75, metalness: 0.08 }), // Dunkle Nischenrückwand
  kitchenCounter: new THREE.MeshStandardMaterial({ color: 0x22262a, roughness: 0.50, metalness: 0.15 }), // Anthrazit-Arbeitsplatte
  chairFabric: new THREE.MeshStandardMaterial({ color: 0x484b50, roughness: 0.88 }), // Dunkelgrauer Polsterstoff der Freischwinger-Stühle
  azWhiteWall: new THREE.MeshStandardMaterial({ color: 0xf5f6f8, roughness: 0.65, metalness: 0.02 }), // Weiß verputzte Wände im Arbeitszimmer (IMG_6414–6417)
  azBlackWall: new THREE.MeshStandardMaterial({ color: 0x181c22, roughness: 0.70, metalness: 0.02 })  // Schwarze Akzentwand in der Gaming-Ecke (IMG_6416)
};

const wallMeshes = [];
let currentWallHeight = 1.8;

function addFloor(x1, z1, x2, z2, mat) {
  const w = Math.abs(x2 - x1);
  const d = Math.abs(z2 - z1);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const geo = new THREE.BoxGeometry(w, 0.12, d);

  // Für Flur- & Küchenfliesen sowie Badezimmerfliesen Weltkoordinaten-UVs nutzen
  if (mat === mats.tileFloor) {
    // Badezimmer-Bodenfliesen: Exakt 80cm x 80cm quadratisches Fliesenraster!
    const tileScale = 0.80; // 80cm
    const posAttr = geo.attributes.position;
    const uvAttr = geo.attributes.uv;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = cx + posAttr.getX(i);
      const vz = cz + posAttr.getZ(i);
      uvAttr.setXY(i, (vx - (-2.80)) / tileScale, (vz - (-0.60)) / tileScale);
    }
    uvAttr.needsUpdate = true;
  } else if (mat === mats.hallFloor || mat === mats.kitchenFloor) {
    const tileScale = 1.42; // Exakt die Küchen-Fliesengröße
    const posAttr = geo.attributes.position;
    const uvAttr = geo.attributes.uv;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = cx + posAttr.getX(i);
      const vz = cz + posAttr.getZ(i);
      uvAttr.setXY(i, vx / tileScale, vz / tileScale);
    }
    uvAttr.needsUpdate = true;
  }

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx, -0.06, cz);
  mesh.receiveShadow = true;
  scene.add(mesh);
}

const collisionWalls = [];

function addWall(x1, z1, x2, z2, thickness = 0.12, isGlass = false, customWallMat = null, isOuterWall = false, flipOuter = false) {
  collisionWalls.push({ x1, z1, x2, z2, halfThick: thickness / 2 });
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);

  const group = new THREE.Group();
  const geo = new THREE.BoxGeometry(len, 1, thickness);
  const activeWallMat = customWallMat || mats.wall;

  let wallMeshMat;
  if (isGlass) {
    wallMeshMat = mats.glassDoor;
  } else if (isOuterWall) {
    // Berechne automatisch, welche Seite der Wand nach außen schaut (vom Zentrum weg)
    const midPoint = new THREE.Vector2((x1 + x2) / 2, (z1 + z2) / 2);
    const aptCenter = new THREE.Vector2(1.70, 1.00);
    const normPlus = new THREE.Vector2(-Math.sin(angle), Math.cos(angle));
    const distPlus = midPoint.clone().add(normPlus).distanceTo(aptCenter);
    const distMinus = midPoint.clone().sub(normPlus).distanceTo(aptCenter);
    const isPlusInward = flipOuter ? !(distPlus < distMinus) : (distPlus < distMinus);

    const innerFaceMat = activeWallMat;
    const outerFaceMat = mats.outerFacade;

    // BoxGeometry Faces: [0: +X, 1: -X, 2: +Y, 3: -Y, 4: +Z, 5: -Z]
    wallMeshMat = [
      outerFaceMat,                               // +X (Stirnseite)
      outerFaceMat,                               // -X (Stirnseite)
      mats.outerWallTop,                          // +Y (Oberseite)
      innerFaceMat,                               // -Y (Unterseite)
      isPlusInward ? innerFaceMat : outerFaceMat, // +Z (Innen oder Außen)
      isPlusInward ? outerFaceMat : innerFaceMat  // -Z (Außen oder Innen)
    ];
  } else {
    wallMeshMat = activeWallMat;
  }

  const mesh = new THREE.Mesh(geo, wallMeshMat);
  mesh.castShadow = !isGlass;
  mesh.receiveShadow = true;

  if (customWallMat === mats.badTileWall) {
    // Wandfliesen: Exakt 120cm breit x 60cm hoch (Querformat)
    // Wandhöhe ist currentWallHeight = 1.80m => 1.80m / 0.60m = exakt 3 Fliesen übereinander!
    const posAttr = geo.attributes.position;
    const uvAttr = geo.attributes.uv;
    for (let i = 0; i < posAttr.count; i++) {
      const lx = posAttr.getX(i);
      const ly = posAttr.getY(i);
      const u = (lx + len / 2) / 1.20;
      const v = (ly + 0.5) * (currentWallHeight / 0.60);
      uvAttr.setXY(i, u, v);
    }
    uvAttr.needsUpdate = true;
  }

  group.add(mesh);

  if (!isGlass) {
    const capGeo = new THREE.BoxGeometry(len + 0.01, 0.04, thickness + 0.01);
    let capMat;
    if (isOuterWall) {
      capMat = mats.outerWallTop;
    } else {
      const isWhiteCap = customWallMat === mats.wzWall || customWallMat === mats.hallWall || customWallMat === mats.badTileWall || customWallMat === mats.badWhiteWall || customWallMat === mats.szAccentWall || customWallMat === mats.szWhiteWall || customWallMat === mats.kitchenWall || customWallMat === mats.azWhiteWall || customWallMat === mats.azBlackWall;
      capMat = isWhiteCap ? mats.wzWallTop : mats.wallTop;
    }
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.51;
    cap.castShadow = true;
    cap.receiveShadow = true;
    group.add(cap);
  }

  group.position.set((x1 + x2) / 2, currentWallHeight / 2, (z1 + z2) / 2);
  group.scale.y = currentWallHeight;
  group.rotation.y = -angle;
  scene.add(group);
  wallMeshes.push(group);
}

function addBox(x, y, z, w, h, d, mat, castShadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addChair(x, z, rotY) {
  const group = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), mats.chairMat);
  seat.position.y = 0.44;
  group.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.06), mats.chairMat);
  back.position.set(0, 0.68, -0.18);
  group.add(back);
  const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.44, 8);
  [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, mats.woodDark);
    leg.position.set(lx, 0.22, lz);
    group.add(leg);
  });
  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  scene.add(group);
}

function addCantileverChair(x, z, rotY) {
  const group = new THREE.Group();
  // Schwarzes Kufengestell (Freischwinger, IMG_6411 & IMG_6412)
  const sledMat = mats.anthraciteFurn;
  // Bodenkufen
  [-0.18, 0.18].forEach(lx => {
    const skid = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.02, 0.44), sledMat);
    skid.position.set(lx, 0.01, 0.02);
    group.add(skid);
  });
  // Vordere Verbindungsstrebe am Boden
  const frontSkid = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 0.022), sledMat);
  frontSkid.position.set(0, 0.01, 0.23);
  group.add(frontSkid);
  // Vertikale Kufenrohre (Freischwinger-Bögen vorne nach oben)
  [-0.18, 0.18].forEach(lx => {
    const riser = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.42, 0.022), sledMat);
    riser.position.set(lx, 0.22, 0.23);
    group.add(riser);
    const seatRunner = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.02, 0.42), sledMat);
    seatRunner.position.set(lx, 0.42, 0.03);
    group.add(seatRunner);
  });
  // Dunkelgrauer gepolsterter Sitz
  const seatPad = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.065, 0.44), mats.chairFabric);
  seatPad.position.set(0, 0.46, 0.02);
  group.add(seatPad);
  // Gepolsterte Rückenlehne mit Griffbügel oben (IMG_6412)
  const backPad = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.06), mats.chairFabric);
  backPad.position.set(0, 0.70, -0.17);
  group.add(backPad);
  const topHandle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.018, 0.018), mats.chromeMat);
  topHandle.position.set(0, 0.91, -0.17);
  group.add(topHandle);

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  scene.add(group);
  return group;
}

// Erstellt ein echtes 3D-Fenster mit weißen Rahmen, weißen Sprossen und warmer Eichenholz-Fensterbank (wie auf den Fotos!)
const windowGlassMat = new THREE.MeshPhysicalMaterial({
  color: 0xbae6fd,
  transparent: true,
  opacity: 0.42,
  roughness: 0.08,
  metalness: 0.1,
  transmission: 0.58
});
const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.28 });

function addWindow(x1, z1, x2, z2, isDouble = false, customWallMat = null, isOuter = true, flipOuter = false) {
  collisionWalls.push({ x1, z1, x2, z2, halfThick: 0.06 });
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const activeWallMat = customWallMat || mats.wall;

  const group = new THREE.Group();

  // Brüstung unter dem Fenster (Wandstück unten bis Höhe 0.55m, außen Fassadengrau, innen Raumfarbe)
  let lowerWallMat = activeWallMat;
  if (isOuter) {
    const midPoint = new THREE.Vector2(cx, cz);
    const aptCenter = new THREE.Vector2(1.70, 1.00);
    const normPlus = new THREE.Vector2(-Math.sin(angle), Math.cos(angle));
    const distPlus = midPoint.clone().add(normPlus).distanceTo(aptCenter);
    const distMinus = midPoint.clone().sub(normPlus).distanceTo(aptCenter);
    const isPlusInward = flipOuter ? !(distPlus < distMinus) : (distPlus < distMinus);
    lowerWallMat = [
      mats.outerFacade,
      mats.outerFacade,
      mats.outerWallTop,
      activeWallMat,
      isPlusInward ? activeWallMat : mats.outerFacade,
      isPlusInward ? mats.outerFacade : activeWallMat
    ];
  }
  const lowerWall = new THREE.Mesh(new THREE.BoxGeometry(len, 0.55, 0.12), lowerWallMat);
  lowerWall.position.y = 0.275;
  lowerWall.castShadow = true;
  lowerWall.receiveShadow = true;
  group.add(lowerWall);

  // Warme Eichenholz-Fensterbank (innen & außen leicht überstehend, wie auf den Wohnzimmer-Fotos!)
  const sill = new THREE.Mesh(new THREE.BoxGeometry(len + 0.05, 0.032, 0.20), mats.oakNatural);
  sill.position.y = 0.56;
  group.add(sill);

  // Weißer Fenster-Außenrahmen (von Höhe 0.58m bis 1.68m -> 1.10m hoch)
  const winH = 1.10;
  const winY = 0.58 + winH / 2;
  const frameThickness = 0.055;

  // Rahmen oben, unten, links, rechts
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(len, frameThickness, 0.13), windowFrameMat);
  topBar.position.y = 0.58 + winH - frameThickness / 2;
  group.add(topBar);

  const botBar = new THREE.Mesh(new THREE.BoxGeometry(len, frameThickness, 0.13), windowFrameMat);
  botBar.position.y = 0.58 + frameThickness / 2;
  group.add(botBar);

  const leftBar = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, winH, 0.13), windowFrameMat);
  leftBar.position.set(-len / 2 + frameThickness / 2, winY, 0);
  group.add(leftBar);

  const rightBar = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, winH, 0.13), windowFrameMat);
  rightBar.position.set(len / 2 - frameThickness / 2, winY, 0);
  group.add(rightBar);

  // Weiße Fenstersprossen (Kreuzsprossen in jedem Flügel wie auf den Fotos)
  const muntinMat = windowFrameMat;
  if (isDouble) {
    const midBar = new THREE.Mesh(new THREE.BoxGeometry(frameThickness * 1.15, winH, 0.135), windowFrameMat);
    midBar.position.set(0, winY, 0);
    group.add(midBar);

    // Je 1 vertikale und 2 horizontale Sprossen pro Fensterflügel
    [-len / 4, len / 4].forEach(paneX => {
      const vSprosse = new THREE.Mesh(new THREE.BoxGeometry(0.016, winH - frameThickness * 2, 0.05), muntinMat);
      vSprosse.position.set(paneX, winY, 0);
      group.add(vSprosse);
    });
    [winY - 0.18, winY + 0.18].forEach(sy => {
      const hSprosse = new THREE.Mesh(new THREE.BoxGeometry(len - frameThickness * 2, 0.016, 0.05), muntinMat);
      hSprosse.position.set(0, sy, 0);
      group.add(hSprosse);
    });
  } else {
    const vSprosse = new THREE.Mesh(new THREE.BoxGeometry(0.016, winH - frameThickness * 2, 0.05), muntinMat);
    vSprosse.position.set(0, winY, 0);
    group.add(vSprosse);
    [winY - 0.18, winY + 0.18].forEach(sy => {
      const hSprosse = new THREE.Mesh(new THREE.BoxGeometry(len - frameThickness * 2, 0.016, 0.05), muntinMat);
      hSprosse.position.set(0, sy, 0);
      group.add(hSprosse);
    });
  }

  // Glasscheibe
  const glass = new THREE.Mesh(new THREE.BoxGeometry(len - frameThickness * 2, winH - frameThickness * 2, 0.04), windowGlassMat);
  glass.position.y = winY;
  group.add(glass);

  // Oberer Wandsturz (von 1.68m bis 1.80m)
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 0.12), activeWallMat);
  lintel.position.y = 1.74;
  group.add(lintel);

  const isWhiteCapWin = customWallMat === mats.wzWall || customWallMat === mats.hallWall || customWallMat === mats.badTileWall || customWallMat === mats.szAccentWall || customWallMat === mats.szWhiteWall || customWallMat === mats.kitchenWall || customWallMat === mats.azWhiteWall || customWallMat === mats.azBlackWall;
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(len + 0.01, 0.04, 0.13),
    isWhiteCapWin ? mats.wzWallTop : mats.wallTop
  );
  cap.position.y = 1.81;
  group.add(cap);

  group.position.set(cx, 0, cz);
  group.rotation.y = -angle;
  scene.add(group);
}

// Erstellt eine 3D-Zimmerpflanze im Topf
const potMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.55 });
const soilMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.9 });
const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.45 });
const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 });

function addPlant(x, y, z, scale = 1.0) {
  const group = new THREE.Group();
  // Pflanztopf
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.28, 16), potMat);
  pot.position.y = 0.14;
  pot.castShadow = true;
  group.add(pot);

  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16), soilMat);
  soil.position.y = 0.275;
  group.add(soil);

  // Blätter-Büschel
  const leafPositions = [
    [0, 0.44, 0, 0.16, leafMat1],
    [-0.09, 0.38, 0.06, 0.12, leafMat2],
    [0.09, 0.40, -0.05, 0.13, leafMat1],
    [0.05, 0.52, 0.07, 0.11, leafMat2],
    [-0.06, 0.50, -0.07, 0.12, leafMat1]
  ];
  leafPositions.forEach(([lx, ly, lz, r, mat]) => {
    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), mat);
    foliage.position.set(lx, ly, lz);
    foliage.castShadow = true;
    group.add(foliage);
  });

  group.position.set(x, y, z);
  group.scale.set(scale, scale, scale);
  scene.add(group);
}

// Erstellt eine Standard-Wandbild-Textur als Platzhalter
function createWallPictureTexture(variant = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  // Deep-Space Hintergrund
  const bgGrad = ctx.createLinearGradient(0, 0, 512, 320);
  bgGrad.addColorStop(0, '#030614');
  bgGrad.addColorStop(0.5, '#090d24');
  bgGrad.addColorStop(1, '#02040a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 512, 320);

  // Nebel / Galaxie-Wolken
  const blobs = variant === 1
    ? [
        { x: 256, y: 160, r: 170, c1: 'rgba(168, 85, 247, 0.55)', c2: 'rgba(59, 130, 246, 0.0)' },
        { x: 210, y: 145, r: 120, c1: 'rgba(236, 72, 153, 0.5)', c2: 'rgba(14, 165, 233, 0.0)' },
        { x: 295, y: 170, r: 95,  c1: 'rgba(251, 191, 36, 0.65)', c2: 'rgba(244, 63, 94, 0.0)' }
      ]
    : [
        { x: 256, y: 160, r: 165, c1: 'rgba(14, 165, 233, 0.55)', c2: 'rgba(99, 102, 241, 0.0)' },
        { x: 280, y: 140, r: 115, c1: 'rgba(244, 63, 94, 0.50)', c2: 'rgba(168, 85, 247, 0.0)' },
        { x: 245, y: 160, r: 75,  c1: 'rgba(254, 240, 138, 0.75)', c2: 'rgba(56, 189, 248, 0.0)' }
      ];

  blobs.forEach(b => {
    const g = ctx.createRadialGradient(b.x, b.y, 4, b.x, b.y, b.r);
    g.addColorStop(0, b.c1);
    g.addColorStop(1, b.c2);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Sterne
  for (let i = 0; i < 180; i++) {
    const sx = (Math.sin(i * 78.233) * 0.5 + 0.5) * 512;
    const sy = (Math.cos(i * 45.164) * 0.5 + 0.5) * 320;
    const sr = (i % 7 === 0) ? 1.8 : 0.9;
    ctx.fillStyle = (i % 9 === 0) ? '#bae6fd' : (i % 11 === 0 ? '#fde68a' : '#ffffff');
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

const wallPictureMaterials = {};

function applyDataUrlToPictureFrame(slot, dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:image')) return;
  const img = new Image();
  img.onload = () => {
    const tex = new THREE.Texture(img);
    tex.needsUpdate = true;
    if (wallPictureMaterials[slot]) {
      wallPictureMaterials[slot].map = tex;
      wallPictureMaterials[slot].needsUpdate = true;
    }
  };
  img.src = dataUrl;
}

function compressImageDataUrl(rawDataUrl, maxW = 900, maxH = 560, quality = 0.85) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = maxW;
      canvas.height = maxH;
      const ctx = canvas.getContext('2d');
      // Cover-Crop: füllt den Rahmen im richtigen Seitenverhältnis ohne Verzerrung
      const imgRatio = img.width / img.height;
      const targetRatio = maxW / maxH;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (imgRatio > targetRatio) {
        sw = img.height * targetRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetRatio;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, maxW, maxH);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}

function uploadWallPicture(slot, input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    const rawDataUrl = e.target.result;
    // Bild auf optimale Rahmengröße (900x560 JPEG) komprimieren
    const compressedDataUrl = await compressImageDataUrl(rawDataUrl, 900, 560, 0.85);
    applyDataUrlToPictureFrame(slot, compressedDataUrl);
    try {
      localStorage.setItem('homey_picture_img_' + slot, compressedDataUrl);
    } catch (err) {}
    if (typeof pushConfigToServer === 'function') {
      pushConfigToServer(false);
    }
    showToast(`🖼️ Wandbild ${slot} gespeichert!`);
  };
  reader.readAsDataURL(file);
}

function addWallPicture(x, y, z, w, h, rotY = 0, slot = 1) {
  const group = new THREE.Group();
  // Edler schwarzer Bilderrahmen
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.06, h + 0.06, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
  );
  group.add(frame);

  // Leinwand (leicht selbstleuchtend, damit man das Motiv auch bei gedimmtem Licht gut erkennt)
  const artMat = new THREE.MeshBasicMaterial({ map: createWallPictureTexture(slot) });
  wallPictureMaterials[slot] = artMat;
  const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), artMat);
  art.position.z = 0.017;
  group.add(art);

  // Falls der Nutzer schon ein eigenes Bild gespeichert hat, direkt aus localStorage laden:
  try {
    const saved = localStorage.getItem('homey_picture_img_' + slot);
    if (saved) applyDataUrlToPictureFrame(slot, saved);
  } catch (e) {}

  group.position.set(x, y, z);
  group.rotation.y = rotY;
  scene.add(group);
}

// =========================================================================
// INTERAKTIVES TÜRENSYSTEM (Alle Türen öffnen / schließen per Klick & Badge)
// =========================================================================
const apartmentDoors = {};
const allInteractiveDoorMeshes = [];

function registerDoor(config) {
  const door = {
    ...config,
    targetRot: config.isOpen ? config.openAngle : config.closedAngle
  };
  door.pivot.rotation.y = door.targetRot;

  const badge = document.createElement('div');
  badge.className = `device-badge ${door.isOpen ? 'on' : ''}`;
  badge.title = `${door.name} (Klicken zum Öffnen / Schließen)`;
  badge.innerHTML = '🚪';
  badge.onclick = (e) => {
    e.stopPropagation();
    toggleDoor(door.id);
  };
  labelsContainer.appendChild(badge);
  door.badge = badge;

  door.pivot.traverse(child => {
    if (child.isMesh) {
      child.userData = child.userData || {};
      child.userData.doorId = door.id;
      allInteractiveDoorMeshes.push(child);
      if (door.id !== 'wz') {
        child.castShadow = true;
        child.receiveShadow = true;
      } else {
        child.castShadow = false;
        child.receiveShadow = true;
      }
    }
  });

  apartmentDoors[door.id] = door;
  return door;
}

function toggleDoor(id) {
  const door = apartmentDoors[id];
  if (!door) return;
  door.isOpen = !door.isOpen;
  door.targetRot = door.isOpen ? door.openAngle : door.closedAngle;
  if (door.badge) door.badge.classList.toggle('on', door.isOpen);
  if (typeof showToast === 'function') {
    showToast(`🚪 ${door.name} ${door.isOpen ? 'geöffnet' : 'geschlossen'}`);
  }
}

window.toggleWzGlassDoor = () => toggleDoor('wz');


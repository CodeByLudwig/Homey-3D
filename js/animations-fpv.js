// =========================================================================
// 6. EXPORT-FUNKTIONEN FÜR SPACEY PLAN (HOMEY DASHBOARD)
// =========================================================================
function showToast(msg) {
  const toast = document.getElementById('status-toast');
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 3200);
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportCurrentPNG(customFilename = 'wohnung_3d_ansicht.png') {
  renderer.render(scene, camera);
  const dataUrl = renderer.domElement.toDataURL('image/png');
  downloadDataUrl(dataUrl, customFilename);
  showToast(`✅ Gespeichert als: ${customFilename}`);
}

async function exportSpaceyPlanBundle() {
  const previousStates = {};
  Object.keys(deviceObjects).forEach(id => {
    previousStates[id] = deviceObjects[id].data.on;
  });

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  setAllLights(false);
  await sleep(150);
  exportCurrentPNG('01_spacey_plan_basis_dunkel.png');

  await sleep(350);
  setAllLights(true);
  await sleep(150);
  exportCurrentPNG('02_spacey_plan_alle_lichter_an.png');

  await sleep(300);
  Object.keys(previousStates).forEach(id => applyDeviceState(id, previousStates[id]));
  showToast('🎉 Spacey Plan Basis- & Licht-Bilder wurden heruntergeladen!');
}

// =========================================================================
// 7. ROBOROCK LIVE-FAHRT DURCH DIE RÄUME & RENDER-LOOP
// =========================================================================
const ROBOROCK_DOCK_POS = { x: 2.92, z: 3.55 };
// Realistischer Reinigungs-Pfad durch alle Räume und offenen Türen deiner Wohnung:
// Arbeitszimmer -> Tür (5.65, 3.2) -> Küche -> Tür (2.6, 0.1) -> Flur -> Bad -> Schlafzimmer -> Wohnzimmer -> zurück
const ROBOROCK_WAYPOINTS = [
  // 1. Arbeitszimmer (Aus der Absaugstation heraus durch den freien Mittelgang)
  { x: 2.92, z: 4.40 },
  { x: 4.40, z: 4.50 },
  { x: 5.65, z: 4.50 },
  { x: 5.65, z: 3.60 },
  // 2. Durch die Arbeitszimmer-Tür in die Küche
  { x: 5.65, z: 3.20 },
  { x: 5.65, z: 2.15 },
  { x: 4.20, z: 2.05 },
  { x: 3.85, z: 1.15 },
  { x: 3.55, z: 0.10 },
  // 3. Durch die Küchentür in den Flur
  { x: 2.60, z: 0.10 },
  { x: 1.80, z: 0.10 },
  { x: 0.25, z: 0.10 },
  { x: 0.25, z: 1.65 },
  { x: 0.25, z: 3.10 },
  { x: 0.25, z: 0.45 },
  // 4. Durch die Badtür ins Badezimmer und wieder raus
  { x: -0.60, z: 0.45 },
  { x: -1.55, z: 0.45 },
  { x: -1.80, z: 0.70 },
  { x: -1.55, z: 0.45 },
  { x: -0.60, z: 0.45 },
  { x: 0.25, z: 0.10 },
  // 5. Durch die Schlafzimmertür ins Schlafzimmer und wieder raus
  { x: 0.25, z: -0.60 },
  { x: 0.15, z: -1.75 },
  { x: 0.15, z: -3.75 },
  { x: -0.55, z: -3.75 },
  { x: 0.15, z: -1.75 },
  { x: 0.25, z: -0.60 },
  { x: 0.25, z: 0.10 },
  // 6. Durch die Glastür ins Wohnzimmer (um Teleskop & Couchtisch herum)
  { x: 1.95, z: 0.10 },
  { x: 1.95, z: -0.60 },
  { x: 2.35, z: -1.65 },
  { x: 2.65, z: -3.35 },
  { x: 3.25, z: -3.55 },
  { x: 2.65, z: -1.65 },
  { x: 4.85, z: -1.55 },
  { x: 2.25, z: -1.55 },
  { x: 1.95, z: -0.60 },
  { x: 1.95, z: 0.10 },
  // 7. Zurück durch die Küche ins Arbeitszimmer zur Station
  { x: 2.60, z: 0.10 },
  { x: 3.85, z: 1.15 },
  { x: 5.65, z: 2.15 },
  { x: 5.65, z: 3.20 },
  { x: 5.65, z: 3.60 },
  { x: 5.65, z: 4.50 },
  { x: 4.40, z: 4.50 },
  { x: 2.92, z: 4.40 }
];

let roborockWpIndex = 0;
let roborockReturnQueue = [];
let wasRoborockActive = false;
let lastFrameTime = performance.now();

// Leuchtende Wisch-/Reinigungsspur hinter dem fahrenden Roborock für perfekte Sichtbarkeit in der 3D-Übersicht
const roborockTrailDots = [];
const TRAIL_COUNT = 16;
const trailGeo = new THREE.CircleGeometry(0.13, 16);
for (let i = 0; i < TRAIL_COUNT; i++) {
  const mat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  const dot = new THREE.Mesh(trailGeo, mat);
  dot.rotation.x = -Math.PI / 2;
  dot.position.set(ROBOROCK_DOCK_POS.x, 0.015, ROBOROCK_DOCK_POS.z);
  scene.add(dot);
  roborockTrailDots.push({ mesh: dot, mat, age: 999 });
}
let trailSpawnTimer = 0;
let trailIndex = 0;

function updateRoborockPositionVisuals(x, z, rotY) {
  if (window.roborockGroup) {
    window.roborockGroup.position.set(x, 0, z);
    if (typeof rotY === 'number') {
      window.roborockGroup.rotation.y = rotY;
    }
  }
  const roboObj = deviceObjects['az_roborock'];
  if (roboObj) {
    roboObj.data.pos[0] = x;
    roboObj.data.pos[2] = z;
    roboObj.light.position.set(x, 0.22, z);
    roboObj.glowMesh.position.set(x, 0.088, z);
    if (roboObj.haloSprite) {
      roboObj.haloSprite.position.set(x, 0.14, z);
      roboObj.haloSprite.scale.set(roboObj.data.on ? 1.15 : 0.55, roboObj.data.on ? 1.15 : 0.55, 1);
    }
  }
}

function buildRoborockReturnQueue(fromWpIndex) {
  const n = ROBOROCK_WAYPOINTS.length;
  const queue = [];
  if (fromWpIndex <= 28) {
    for (let i = Math.max(0, fromWpIndex - 1); i >= 0; i--) {
      queue.push(ROBOROCK_WAYPOINTS[i]);
    }
  } else {
    for (let i = fromWpIndex; i < n; i++) {
      queue.push(ROBOROCK_WAYPOINTS[i]);
    }
    queue.push(ROBOROCK_WAYPOINTS[1]);
    queue.push(ROBOROCK_WAYPOINTS[0]);
  }
  queue.push(ROBOROCK_DOCK_POS);
  return queue;
}

function updateRoborockAnimation(dt) {
  const roboObj = deviceObjects['az_roborock'];
  if (!roboObj || !window.roborockGroup) return;

  const curX = window.roborockGroup.position.x;
  const curZ = window.roborockGroup.position.z;

  if (roboObj.data.on && !wasRoborockActive) {
    wasRoborockActive = true;
    window._roborockDocked = false;
    roborockReturnQueue = [];
    const distFromDock = Math.hypot(curX - ROBOROCK_DOCK_POS.x, curZ - ROBOROCK_DOCK_POS.z);
    if (distFromDock < 0.85) {
      roborockWpIndex = 0;
    }
  } else if (!roboObj.data.on && wasRoborockActive) {
    wasRoborockActive = false;
    roborockReturnQueue = buildRoborockReturnQueue(roborockWpIndex);
  }

  // Wischspur-Punkte langsam ausblenden lassen (nur wenn aktiv)
  if (roboObj.data.on || wasRoborockActive) {
    for (let i = 0; i < TRAIL_COUNT; i++) {
      const td = roborockTrailDots[i];
      if (td.age < 7.0) {
        td.age += dt;
        td.mat.opacity = roboObj.data.on ? Math.max(0, 0.34 * (1 - td.age / 6.5)) : 0;
      }
    }
  }

  if (roboObj.data.on) {
    // Seitenbürste drehen lassen während er saugt/wischt
    if (window.roborockBrush) {
      window.roborockBrush.rotation.y += dt * 9.0;
    }

    // Alle 0.42s einen neuen Wischspur-Punkt hinter dem Roborock setzen
    trailSpawnTimer += dt;
    if (trailSpawnTimer >= 0.42) {
      trailSpawnTimer = 0;
      const td = roborockTrailDots[trailIndex];
      td.mesh.position.set(curX, 0.015, curZ);
      td.age = 0;
      td.mat.opacity = 0.34;
      trailIndex = (trailIndex + 1) % TRAIL_COUNT;
    }

    const target = ROBOROCK_WAYPOINTS[roborockWpIndex];
    const dx = target.x - curX;
    const dz = target.z - curZ;
    const dist = Math.hypot(dx, dz);
    const speed = 0.38; // Ruhige, realistische Saug-/Wischgeschwindigkeit (0.38 m/s)

    if (dist < 0.05) {
      roborockWpIndex = (roborockWpIndex + 1) % ROBOROCK_WAYPOINTS.length;
    } else {
      const step = Math.min(dist, speed * dt);
      const nx = curX + (dx / dist) * step;
      const nz = curZ + (dz / dist) * step;
      // Sanfte Drehung in Fahrtrichtung
      const targetAngle = Math.atan2(dx, dz);
      let angleDiff = targetAngle - window.roborockGroup.rotation.y;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      const newRotY = window.roborockGroup.rotation.y + angleDiff * Math.min(1, dt * 5.0);
      updateRoborockPositionVisuals(nx, nz, newRotY);
    }
  } else {
    // Wenn fertig / gestoppt: Durch die offenen Türen entlang der Wegpunkte zurück zur Ladestation fahren
    const distToDock = Math.hypot(ROBOROCK_DOCK_POS.x - curX, ROBOROCK_DOCK_POS.z - curZ);
    if (distToDock > 0.02) {
      if (roborockReturnQueue.length === 0) {
        roborockReturnQueue = buildRoborockReturnQueue(roborockWpIndex);
      }
      const target = roborockReturnQueue[0];
      const dx = target.x - curX;
      const dz = target.z - curZ;
      const dist = Math.hypot(dx, dz);
      const returnSpeed = 0.44;
      if (dist < 0.05 && roborockReturnQueue.length > 1) {
        roborockReturnQueue.shift();
      } else {
        const step = Math.min(dist, returnSpeed * dt);
        const nx = curX + (dx / Math.max(dist, 0.0001)) * step;
        const nz = curZ + (dz / Math.max(dist, 0.0001)) * step;
        const targetAngle = Math.atan2(dx, dz);
        let angleDiff = targetAngle - window.roborockGroup.rotation.y;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        const newRotY = window.roborockGroup.rotation.y + angleDiff * Math.min(1, dt * 6.0);
        updateRoborockPositionVisuals(nx, nz, newRotY);
      }
      if (roboObj.badge) {
        roboObj.badge.classList.add('vacuum-live');
        roboObj.badge.innerHTML = '🤖 <span>Fährt zur Station...</span>';
      }
    } else {
      roborockReturnQueue = [];
      roborockWpIndex = 0;
      if (wasRoborockActive || !window._roborockDocked) {
        window._roborockDocked = true;
        updateRoborockPositionVisuals(ROBOROCK_DOCK_POS.x, ROBOROCK_DOCK_POS.z, 0);
        if (roboObj.badge) {
          roboObj.badge.classList.remove('vacuum-live');
          roboObj.badge.innerHTML = '🤖';
        }
      }
    }
  }
}

// Direktes Anklicken ALLER 3D-Türen & Editor-Drag-and-Drop per Raycaster ermöglichen
const doorRaycaster = new THREE.Raycaster();
const pointerDownPos = { x: 0, y: 0 };
let editorDragging = false;
renderer.domElement.addEventListener('pointermove', (e) => {
  if (window.HouseEditor && window.HouseEditor.state.active) {
    window.HouseEditor.onPointerMove(e);
  }
});
renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDownPos.x = e.clientX;
  pointerDownPos.y = e.clientY;
  if (window.HouseEditor && window.HouseEditor.state.active && typeof window.HouseEditor.onPointerDragStart === 'function') {
    if (window.HouseEditor.onPointerDragStart(e)) {
      editorDragging = true;
      if (typeof controls !== 'undefined' && controls) controls.enabled = false;
    }
  }
});
renderer.domElement.addEventListener('pointerup', (e) => {
  if (editorDragging) {
    editorDragging = false;
    if (typeof controls !== 'undefined' && controls && !(typeof fpvMode !== 'undefined' && fpvMode)) {
      controls.enabled = true;
    }
    if (window.HouseEditor && typeof window.HouseEditor.onPointerDragEnd === 'function') {
      window.HouseEditor.onPointerDragEnd(e);
    }
    return;
  }
  if (Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y) > 6) return;
  if (window.HouseEditor && window.HouseEditor.state.active) {
    if (window.HouseEditor.onPointerDown(e)) return;
  }
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1
  );
  doorRaycaster.setFromCamera(mouse, camera);
  const hits = doorRaycaster.intersectObjects(allInteractiveDoorMeshes, true);
  if (hits.length > 0) {
    let obj = hits[0].object;
    while (obj && !obj.userData?.doorId) obj = obj.parent;
    if (obj && obj.userData?.doorId) {
      toggleDoor(obj.userData.doorId);
    }
  }
});

const _projVec = new THREE.Vector3();
let _lastCamX = null, _lastCamY = null, _lastCamZ = null;
let _lastTargetX = null, _lastTargetY = null, _lastTargetZ = null;
let _lastContainerW = 0, _lastContainerH = 0;

function updateLabels(force = false) {
  const isFpvMode = typeof fpvMode !== 'undefined' && fpvMode;
  if (!labelsVisible && !isFpvMode) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  const widthHalf = w / 2;
  const heightHalf = h / 2;

  const camX = camera.position.x;
  const camY = camera.position.y;
  const camZ = camera.position.z;
  const tgtX = controls.target.x;
  const tgtY = controls.target.y;
  const tgtZ = controls.target.z;

  const camMoved = force ||
    (typeof fpvMode !== 'undefined' && fpvMode) ||
    Math.abs(camX - _lastCamX) > 0.001 ||
    Math.abs(camY - _lastCamY) > 0.001 ||
    Math.abs(camZ - _lastCamZ) > 0.001 ||
    Math.abs(tgtX - _lastTargetX) > 0.001 ||
    Math.abs(tgtY - _lastTargetY) > 0.001 ||
    Math.abs(tgtZ - _lastTargetZ) > 0.001 ||
    w !== _lastContainerW ||
    h !== _lastContainerH;

  const roboObj = deviceObjects['az_roborock'];
  const roboMoving = roboObj && roboObj.data.on;

  // Wenn Kamera stillsteht, Türen ruhen und Roborock steht: Keine rechenintensiven DOM-Updates!
  if (!camMoved && !roboMoving && !window.doorsMoving) return;

  _lastCamX = camX; _lastCamY = camY; _lastCamZ = camZ;
  _lastTargetX = tgtX; _lastTargetY = tgtY; _lastTargetZ = tgtZ;
  _lastContainerW = w; _lastContainerH = h;

  ROOMS.forEach(room => {
    if (typeof fpvMode !== 'undefined' && fpvMode) {
      room.domLabel.style.display = 'none';
      return;
    }
    room.domLabel.style.display = '';
    _projVec.set(room.labelPos[0], room.labelPos[1], room.labelPos[2]).project(camera);
    room.domLabel.style.left = `${Math.round(_projVec.x * widthHalf + widthHalf)}px`;
    room.domLabel.style.top = `${Math.round(-(_projVec.y * heightHalf) + heightHalf)}px`;
  });

  const isFpv = typeof fpvMode !== 'undefined' && fpvMode;
  const currentFpvRoom = isFpv ? getCurrentFpvRoomId(camX, camZ) : null;

  Object.values(deviceObjects).forEach(obj => {
    if (!obj.badge) return;
    const yOffset = (obj.data.type === 'vacuum' && obj.data.on) ? 0.55 : 0.25;
    _projVec.set(obj.data.pos[0], obj.data.pos[1] + yOffset, obj.data.pos[2]).project(camera);
    if (isFpv) {
      const sameRoom = !currentFpvRoom || deviceRoomMap[obj.data.id] === currentFpvRoom;
      const dist = Math.hypot(obj.data.pos[0] - camX, (obj.data.pos[1] + yOffset) - camY, obj.data.pos[2] - camZ);
      const inView = sameRoom && _projVec.z < 1 && dist < 6.5 && Math.abs(_projVec.x) < 0.7 && Math.abs(_projVec.y) < 0.7;
      if (!inView) {
        obj.badge.style.display = 'none';
        return;
      }
    }
    obj.badge.style.display = '';
    obj.badge.style.left = `${Math.round(_projVec.x * widthHalf + widthHalf)}px`;
    obj.badge.style.top = `${Math.round(-(_projVec.y * heightHalf) + heightHalf)}px`;
  });

  // Alle Tür-Badges (🚪) im 3D-Raum passgenau an den Türklinken positionieren
  Object.values(apartmentDoors).forEach(door => {
    if (door.badge && door.getBadgePos) {
      const bp = door.getBadgePos();
      _projVec.set(bp.x, bp.y, bp.z).project(camera);
      if (isFpv) {
        const dist = Math.hypot(bp.x - camX, bp.y - camY, bp.z - camZ);
        const inView = _projVec.z < 1 && dist < 4.5 && Math.abs(_projVec.x) < 0.7 && Math.abs(_projVec.y) < 0.7;
        if (!inView) {
          door.badge.style.display = 'none';
          return;
        }
      }
      door.badge.style.display = '';
      door.badge.style.left = `${Math.round(_projVec.x * widthHalf + widthHalf)}px`;
      door.badge.style.top = `${Math.round(-(_projVec.y * heightHalf) + heightHalf)}px`;
    }
  });
}

function animate() {
  requestAnimationFrame(animate);
  if (document.hidden) return; // Wenn Tab im Hintergrund ist: Render-Schleife pausieren (0% GPU/CPU!)
  const now = performance.now();
  const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
  lastFrameTime = now;

  // Sanfte Tür-Schwenkanimation für ALLE Türen
  let doorsMoving = false;
  Object.values(apartmentDoors).forEach(door => {
    if (door.pivot && typeof door.targetRot === 'number') {
      const diff = door.targetRot - door.pivot.rotation.y;
      if (Math.abs(diff) > 0.002) {
        doorsMoving = true;
        door.pivot.rotation.y += diff * Math.min(1, dt * 7.5);
      } else {
        door.pivot.rotation.y = door.targetRot;
      }
    }
  });
  window.doorsMoving = doorsMoving;

  updateRoborockAnimation(dt);
  if (typeof fpvMode !== 'undefined' && fpvMode) {
    updateFPV(dt);
  } else {
    controls.update();
  }
  renderer.render(scene, camera);
  updateLabels();
}

window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  if (typeof updateFpvFov === 'function') updateFpvFov();
  else camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
  updateLabels(true);
});

document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('page-hidden', document.hidden);
  if (!document.hidden) {
    lastFrameTime = performance.now();
    updateLabels(true);
    renderer.render(scene, camera);
    if (homeyConnected) {
      scheduleNextHomeyPoll(300);
    }
  }
});

// =========================================================================
// HINTERGRUND- & WALLPAPER-STIL VERWALTUNG (WINDOWS MICA, IPHONE OLED, ETC.)
// =========================================================================
const BG_THEMES = [
  { id: 'bloom', name: 'Bloom', icon: '🌌', desc: 'Windows 11 Aurora Schein' },
  { id: 'mica', name: 'Mica', icon: '🪟', desc: 'Windows 11 Mica Taskbar Flow' },
  { id: 'oled', name: 'OLED', icon: '📱', desc: 'iPhone OLED Tiefschwarz' },
  { id: 'grid', name: 'Grid', icon: '📐', desc: 'Architektur Blueprint CAD' },
  { id: 'transparent', name: 'Transp.', icon: '✨', desc: 'Lively Desktop Passthrough' }
];

let currentBgTheme = 'bloom';
let groundShadowsEnabled = false;
let wallpaperModeActive = false;
let pedestalEnabled = false;
let gridEnabled = true;
let auroraAnimEnabled = true;

function updateWidgetUrlBox() {
  const box = document.getElementById('widget-url-box');
  if (!box) return;
  const parts = [];
  if (currentBgTheme && currentBgTheme !== 'bloom') parts.push(`bg=${currentBgTheme}`);
  if (pedestalEnabled) parts.push('pedestal=1');
  if (!gridEnabled) parts.push('grid=0');
  if (!auroraAnimEnabled) parts.push('aurora=0');
  if (groundShadowsEnabled) parts.push('shadow=1');
  if (wallpaperModeActive) parts.push('kiosk=1');
  const query = parts.length > 0 ? '?' + parts.join('&') : '';
  const baseUrl = window.location.protocol.startsWith('http')
    ? `${window.location.origin}/index.html`
    : 'http://localhost:8765/index.html';
  box.value = `${baseUrl}${query}`;
}

function setBackgroundTheme(theme, save = true) {
  const match = BG_THEMES.find(t => t.id === theme);
  if (!match) theme = 'mica';
  currentBgTheme = theme;

  // Klassen auf Container & Body setzen
  const containerEl = document.getElementById('canvas-container');
  BG_THEMES.forEach(t => {
    containerEl.classList.remove('theme-' + t.id);
    document.body.classList.remove('theme-' + t.id);
  });
  containerEl.classList.add('theme-' + theme);
  document.body.classList.add('theme-' + theme);

  // Meta theme-color für iPhone & Browser dynamisch setzen
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    const themeHex = {
      mica: '#0c0f16',
      oled: '#000000',
      bloom: '#090c14',
      grid: '#0d1017',
      transparent: '#0c0f16'
    };
    metaThemeColor.setAttribute('content', themeHex[theme] || '#0c0f16');
  }

  // 3D-Nebel an das Theme anpassen für perfekten Horizont
  if (typeof scene !== 'undefined' && scene.fog) {
    if (theme === 'transparent') {
      scene.fog.density = 0.0;
    } else {
      scene.fog.density = theme === 'oled' ? 0.022 : 0.016;
      const fogHex = {
        mica: 0x0c0f16,
        oled: 0x000000,
        bloom: 0x090c14,
        grid: 0x0d1017
      };
      scene.fog.color.setHex(fogHex[theme] || 0x0c0f16);
    }
  }

  // Außenwand-Farbe im eleganten Eierschalenweiß halten (Innenwandfarben bleiben unverändert!)
  if (typeof mats !== 'undefined' && mats.outerFacade && mats.outerWallTop) {
    mats.outerFacade.color.setHex(0xede6d8);
    mats.outerWallTop.color.setHex(0xf7f4ec);
  }

  // Aktiven Button in der Sidebar markieren
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });

  // Quick-Cycle Button in der oberen Leiste aktualisieren
  const cycleText = document.getElementById('btn-theme-cycle-text');
  const cycleIcon = document.getElementById('btn-theme-cycle-icon');
  const curMeta = BG_THEMES.find(t => t.id === theme) || BG_THEMES[0];
  if (cycleText) cycleText.textContent = curMeta.name;
  if (cycleIcon) cycleIcon.textContent = curMeta.icon;
  if (save) {
    try { localStorage.setItem('homey_3d_bg_theme', theme); } catch (e) {}
    scheduleConfigSync();
  }

  if (save) {
    try {
      localStorage.setItem('homey_3d_bg_theme', theme);
    } catch (e) {}
  }
  updateWidgetUrlBox();
}

function cycleBackgroundTheme() {
  const idx = BG_THEMES.findIndex(t => t.id === currentBgTheme);
  const nextIdx = (idx + 1) % BG_THEMES.length;
  const nextTheme = BG_THEMES[nextIdx];
  setBackgroundTheme(nextTheme.id, true);
  showToast(`🎨 Hintergrund: ${nextTheme.name} (${nextTheme.icon})`);
}

function togglePedestal(explicit) {
  pedestalEnabled = typeof explicit === 'boolean' ? explicit : !pedestalEnabled;
  if (typeof pedestalGroup !== 'undefined') {
    pedestalGroup.visible = pedestalEnabled;
  }
  if (typeof groundShadowPlane !== 'undefined') {
    groundShadowPlane.position.y = pedestalEnabled ? -0.266 : -0.125;
  }
  if (typeof groundGrid !== 'undefined') {
    groundGrid.position.y = pedestalEnabled ? -0.264 : -0.122;
  }
  const btn = document.getElementById('btn-toggle-pedestal');
  if (btn) btn.textContent = `🏛️ Modell-Podest: ${pedestalEnabled ? 'AN' : 'AUS'}`;
  try {
    localStorage.setItem('homey_3d_pedestal', pedestalEnabled ? '1' : '0');
  } catch (e) {}
  updateWidgetUrlBox();
}

function toggle3DGrid(explicit) {
  gridEnabled = typeof explicit === 'boolean' ? explicit : !gridEnabled;
  if (typeof groundGrid !== 'undefined') {
    groundGrid.visible = gridEnabled;
  }
  const btn = document.getElementById('btn-toggle-grid');
  if (btn) btn.textContent = `📐 3D-Bodenraster: ${gridEnabled ? 'AN' : 'AUS'}`;
  try {
    localStorage.setItem('homey_3d_grid', gridEnabled ? '1' : '0');
  } catch (e) {}
  updateWidgetUrlBox();
}

function toggleAuroraAnim(explicit) {
  auroraAnimEnabled = typeof explicit === 'boolean' ? explicit : !auroraAnimEnabled;
  document.body.classList.toggle('no-aurora-anim', !auroraAnimEnabled);
  const btn = document.getElementById('btn-toggle-aurora');
  if (btn) btn.textContent = `🌊 Licht-Animation: ${auroraAnimEnabled ? 'AN' : 'AUS'}`;
  try {
    localStorage.setItem('homey_3d_aurora_anim', auroraAnimEnabled ? '1' : '0');
  } catch (e) {}
  updateWidgetUrlBox();
}

function toggleGroundShadow(explicit) {
  groundShadowsEnabled = typeof explicit === 'boolean' ? explicit : !groundShadowsEnabled;
  if (typeof groundShadowPlane !== 'undefined') {
    groundShadowPlane.visible = groundShadowsEnabled;
  }
  const btn = document.getElementById('btn-toggle-shadow');
  if (btn) btn.textContent = `🕶️ Boden-Schatten: ${groundShadowsEnabled ? 'AN' : 'AUS'}`;
  try {
    localStorage.setItem('homey_3d_shadows', groundShadowsEnabled ? '1' : '0');
  } catch (e) {}
  updateWidgetUrlBox();
}

function toggleWallpaperMode(explicit) {
  wallpaperModeActive = typeof explicit === 'boolean' ? explicit : !wallpaperModeActive;
  const topOverlay = document.getElementById('top-overlay');
  if (topOverlay) {
    topOverlay.classList.toggle('compact', wallpaperModeActive);
  }
  const btn = document.getElementById('btn-toggle-kiosk');
  if (btn) btn.textContent = `🖥️ Wallpaper-Dock: ${wallpaperModeActive ? 'Kompakt' : 'Standard'} (Taste H)`;
  try {
    localStorage.setItem('homey_3d_wallpaper_mode', wallpaperModeActive ? '1' : '0');
  } catch (e) {}
  updateWidgetUrlBox();
}

function initBackgroundAndWallpaperSettings() {
  // Einmalige Migration für bestehende Browser-Caches: Standardmäßig Bloom AN, Raster AN, Rest AUS
  if (!localStorage.getItem('homey_3d_defaults_v5')) {
    localStorage.setItem('homey_3d_bg_theme', 'bloom');
    localStorage.setItem('homey_3d_grid', '1');
    localStorage.setItem('homey_3d_aurora_anim', '1');
    localStorage.setItem('homey_3d_pedestal', '0');
    localStorage.setItem('homey_3d_shadows', '0');
    localStorage.setItem('homey_3d_wallpaper_mode', '0');
    localStorage.setItem('homey_3d_defaults_v5', '1');
  }

  // 1. URL Parameter abfragen (?bg=... & ?wallpaper=1 / ?kiosk=1 & ?pedestal=... & ?grid=...)
  const params = new URLSearchParams(window.location.search);
  const isStandalonePWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true || params.get('pwa') === '1';

  // Spezieller PWA-Standard-Reset (stellt sicher, dass installierte Home Screen Apps sofort das 3D-Bodenraster & Bloom haben)
  if (isStandalonePWA && !localStorage.getItem('homey_3d_pwa_defaults_v5')) {
    localStorage.setItem('homey_3d_bg_theme', 'bloom');
    localStorage.setItem('homey_3d_grid', '1');
    localStorage.setItem('homey_3d_aurora_anim', '1');
    localStorage.setItem('homey_3d_pedestal', '0');
    localStorage.setItem('homey_3d_shadows', '0');
    localStorage.setItem('homey_3d_wallpaper_mode', '0');
    localStorage.setItem('homey_3d_pwa_defaults_v5', '1');
  }

  const urlTheme = params.get('bg');
  const isKioskOrWallpaper = params.get('kiosk') === '1' || params.get('wallpaper') === '1';

  // 2. Gespeichertes Theme oder URL-Theme initialisieren (Standard: 'bloom' - Aurora Bloom)
  const savedTheme = urlTheme || localStorage.getItem('homey_3d_bg_theme') || 'bloom';
  setBackgroundTheme(savedTheme, false);

  // 3. 3D-Podest laden (Standard: AUS)
  const urlPedestal = params.get('pedestal');
  if (urlPedestal !== null) {
    togglePedestal(urlPedestal === '1' || urlPedestal === 'true');
  } else {
    const savedPedestal = localStorage.getItem('homey_3d_pedestal');
    togglePedestal(savedPedestal !== null ? savedPedestal === '1' : false);
  }

  // 4. 3D-Bodenraster laden (Standard: AN)
  const urlGrid = params.get('grid');
  if (urlGrid !== null) {
    toggle3DGrid(urlGrid === '1' || urlGrid === 'true');
  } else {
    const savedGrid = localStorage.getItem('homey_3d_grid');
    toggle3DGrid(savedGrid !== null ? savedGrid === '1' : true);
  }

  // 5. Aurora-Lichtanimation laden (Standard: AN)
  const urlAurora = params.get('aurora');
  if (urlAurora !== null) {
    toggleAuroraAnim(urlAurora === '1' || urlAurora === 'true');
  } else {
    const savedAurora = localStorage.getItem('homey_3d_aurora_anim');
    toggleAuroraAnim(savedAurora !== null ? savedAurora === '1' : true);
  }

  // 6. Schattenwurf-Einstellung laden (Standard: AUS)
  const urlShadow = params.get('shadow') || params.get('shadows');
  if (urlShadow !== null) {
    toggleGroundShadow(urlShadow === '1' || urlShadow === 'true');
  } else {
    const savedShadow = localStorage.getItem('homey_3d_shadows');
    toggleGroundShadow(savedShadow !== null ? savedShadow === '1' : false);
  }

  // 7. Wallpaper/Kiosk-Modus initialisieren (in PWA standardmäßig volles Interface)
  const savedWallpaperMode = isKioskOrWallpaper || (!isStandalonePWA && localStorage.getItem('homey_3d_wallpaper_mode') === '1');
  toggleWallpaperMode(savedWallpaperMode);

  // Taste 'H' (Hide UI) als Tastenkürzel für Wallpaper-Modus am PC
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key.toLowerCase() === 'h') {
      toggleWallpaperMode();
      showToast(`🖥️ Wallpaper-Dock: ${wallpaperModeActive ? 'Kompakt' : 'Standard'}`);
    }
  });

  updateWidgetUrlBox();
}

// =========================================================================
// FIRST-PERSON-RUNDGANG (FPV) MIT WAND- & TÜRKOLLISION
// =========================================================================
const deviceRoomMap = {};
window.rebuildDeviceRoomMap = function () {
  Object.keys(deviceRoomMap).forEach(k => delete deviceRoomMap[k]);
  (ROOMS || []).forEach(r => (r.devices || []).forEach(d => { deviceRoomMap[d.id] = r.id; }));
};
window.rebuildDeviceRoomMap();

function getCurrentFpvRoomId(x, z) {
  const cfg = window.currentHouseConfig;
  if (cfg && cfg.mode === 'custom' && Array.isArray(cfg.rooms)) {
    for (const r of cfg.rooms) {
      const minX = Math.min(r.x1, r.x2);
      const maxX = Math.max(r.x1, r.x2);
      const minZ = Math.min(r.z1, r.z2);
      const maxZ = Math.max(r.z1, r.z2);
      if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) return r.id;
    }
    return null;
  }
  if (cfg && (cfg.id === 'wohnung_daniel' || cfg.preset === 'wohnung_daniel')) {
    if (x < -0.6 && z >= -0.6 && z <= 1.65) return 'bad';
    if (x <= 1.0 && z < -0.6) return 'schlafzimmer';
    if (x > 1.0 && z < -0.6) return 'wohnzimmer';
    if (x >= 2.6 && z >= -0.6 && z <= 3.2) return 'kueche';
    if (x >= 2.6 && z > 3.2) return 'arbeitszimmer';
    return 'flur';
  }
  return null;
}

let fpvMode = false;
let fpvYaw = 0;
let fpvPitch = -0.05;
let fpvPrevCamPos = null;
let fpvPrevTarget = null;
const fpvKeys = {};
let fpvJoyX = 0;
let fpvJoyY = 0;
let fpvLookDragging = false;
let fpvLastPointerX = 0;
let fpvLastPointerY = 0;

function distPointToSegment2D(px, pz, x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const lenSq = dx * dx + dz * dz;
  if (lenSq === 0) return Math.hypot(px - x1, pz - z1);
  let t = ((px - x1) * dx + (pz - z1) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), pz - (z1 + t * dz));
}

function isBlockedByWallOrDoor(x, z, radius = 0.16) {
  for (let i = 0; i < collisionWalls.length; i++) {
    const w = collisionWalls[i];
    if (distPointToSegment2D(x, z, w.x1, w.z1, w.x2, w.z2) < radius + w.halfThick) {
      return true;
    }
  }
  const doors = Object.values(apartmentDoors);
  for (let i = 0; i < doors.length; i++) {
    const d = doors[i];
    if (!d.isOpen && d.pivot && d.getBadgePos) {
      const px = d.pivot.position.x;
      const pz = d.pivot.position.z;
      const tip = d.getBadgePos();
      if (distPointToSegment2D(x, z, px, pz, tip.x, tip.z) < radius + 0.05) {
        return true;
      }
    }
  }
  return false;
}

function updateFpvFov() {
  if (fpvMode) {
    // Im Hochformat (Handy) FOV dynamisch verbreitern, damit der horizontale Blickwinkel angenehm bleibt
    const aspect = camera.aspect || (container.clientWidth / container.clientHeight) || 1;
    camera.fov = aspect < 1 ? Math.min(88, Math.max(60, 62 / Math.max(0.58, aspect))) : 60;
  } else {
    camera.fov = 40;
  }
  camera.updateProjectionMatrix();
  const hintEl = document.getElementById('fpv-hint-pill');
  if (hintEl) {
    hintEl.style.display = window.innerWidth < 680 ? 'none' : 'block';
  }
}

function toggleFPVMode(forceState) {
  fpvMode = typeof forceState === 'boolean' ? forceState : !fpvMode;
  const btn = document.getElementById('btn-fpv');
  const hud = document.getElementById('fpv-hud');
  if (fpvMode) {
    fpvPrevCamPos = camera.position.clone();
    fpvPrevTarget = controls.target.clone();
    controls.enabled = false;
    camera.rotation.order = 'YXZ';
    updateFpvFov();
    // Startposition (konfigurierter Rundgang-Startpunkt oder Standard-Flur)
    const customStart = (window.currentHouseConfig && window.currentHouseConfig.fpvStart)
      || window.demoFpvStart
      || (() => { try { return JSON.parse(localStorage.getItem('homey_3d_demo_fpv_start') || 'null'); } catch (e) { return null; } })();
    if (camera.position.x < -3 || camera.position.x > 6.5 || camera.position.z < -4.8 || camera.position.z > 6.8 || camera.position.y > 2.5) {
      const sx = customStart && typeof customStart.x === 'number' ? customStart.x : 0.2;
      const sz = customStart && typeof customStart.z === 'number' ? customStart.z : 2.6;
      const syaw = customStart && typeof customStart.yaw === 'number' ? customStart.yaw : 0;
      camera.position.set(sx, 1.05, sz);
      fpvYaw = syaw;
      fpvPitch = -0.02;
    } else {
      camera.position.y = 1.05;
      fpvYaw = camera.rotation.y;
      fpvPitch = Math.max(-0.9, Math.min(0.9, camera.rotation.x));
    }
    camera.rotation.set(fpvPitch, fpvYaw, 0, 'YXZ');
    if (btn) btn.classList.add('active');
    if (hud) hud.style.display = 'block';
    if (labelsContainer) labelsContainer.style.display = 'block';
    updateLabels(true);
    showToast('🚶 Rundgang-Modus aktiv (WASD + Maus, Taste V zum Beenden)');
  } else {
    controls.enabled = true;
    camera.rotation.order = 'XYZ';
    updateFpvFov();
    if (fpvPrevCamPos && fpvPrevTarget) {
      camera.position.copy(fpvPrevCamPos);
      controls.target.copy(fpvPrevTarget);
    }
    if (btn) btn.classList.remove('active');
    if (hud) hud.style.display = 'none';
    if (labelsContainer) labelsContainer.style.display = labelsVisible ? 'block' : 'none';
    updateLabels(true);
    showToast('🏠 Zurück zur 3D-Ansicht');
  }
}

function updateFPV(dt) {
  let forward = 0;
  let strafe = 0;
  if (fpvKeys['KeyW'] || fpvKeys['ArrowUp']) forward += 1;
  if (fpvKeys['KeyS'] || fpvKeys['ArrowDown']) forward -= 1;
  if (fpvKeys['KeyD'] || fpvKeys['ArrowRight']) strafe += 1;
  if (fpvKeys['KeyA'] || fpvKeys['ArrowLeft']) strafe -= 1;
  forward -= fpvJoyY;
  strafe += fpvJoyX;

  if (Math.abs(forward) > 0.02 || Math.abs(strafe) > 0.02) {
    const len = Math.hypot(forward, strafe);
    if (len > 1) { forward /= len; strafe /= len; }
    const speed = 2.0 * dt;
    const sinY = Math.sin(fpvYaw);
    const cosY = Math.cos(fpvYaw);
    const moveX = (-sinY * forward + cosY * strafe) * speed;
    const moveZ = (-cosY * forward - sinY * strafe) * speed;

    const nx = camera.position.x + moveX;
    const nz = camera.position.z + moveZ;
    if (!isBlockedByWallOrDoor(nx, camera.position.z)) camera.position.x = nx;
    if (!isBlockedByWallOrDoor(camera.position.x, nz)) camera.position.z = nz;
  }
  camera.position.y = 1.05;
  camera.rotation.set(fpvPitch, fpvYaw, 0, 'YXZ');
}

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  fpvKeys[e.code] = true;
  if (e.key.toLowerCase() === 'v') {
    toggleFPVMode();
  }
});
window.addEventListener('keyup', (e) => {
  fpvKeys[e.code] = false;
});

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (!fpvMode) return;
  fpvLookDragging = true;
  fpvLastPointerX = e.clientX;
  fpvLastPointerY = e.clientY;
});
window.addEventListener('pointermove', (e) => {
  if (!fpvMode || !fpvLookDragging) return;
  const dx = e.clientX - fpvLastPointerX;
  const dy = e.clientY - fpvLastPointerY;
  fpvLastPointerX = e.clientX;
  fpvLastPointerY = e.clientY;
  fpvYaw -= dx * 0.0045;
  fpvPitch = Math.max(-1.15, Math.min(1.15, fpvPitch - dy * 0.0045));
});
window.addEventListener('pointerup', () => {
  fpvLookDragging = false;
});

// Touch-Joystick für Handy/Tablet im FPV-Modus
const fpvJoystickEl = document.getElementById('fpv-joystick');
const fpvKnobEl = document.getElementById('fpv-joystick-knob');
if (fpvJoystickEl && fpvKnobEl) {
  let joyActive = false;
  const updateJoy = (clientX, clientY) => {
    const rect = fpvJoystickEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width / 2 - 18;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) { dx = (dx / dist) * maxR; dy = (dy / dist) * maxR; }
    fpvKnobEl.style.transform = `translate(${dx}px, ${dy}px)`;
    fpvJoyX = dx / maxR;
    fpvJoyY = dy / maxR;
  };
  fpvJoystickEl.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    joyActive = true;
    fpvJoystickEl.setPointerCapture(e.pointerId);
    updateJoy(e.clientX, e.clientY);
  });
  fpvJoystickEl.addEventListener('pointermove', (e) => {
    if (!joyActive) return;
    e.stopPropagation();
    updateJoy(e.clientX, e.clientY);
  });
  const resetJoy = () => {
    joyActive = false;
    fpvJoyX = 0;
    fpvJoyY = 0;
    fpvKnobEl.style.transform = 'translate(0px, 0px)';
  };
  fpvJoystickEl.addEventListener('pointerup', resetJoy);
  fpvJoystickEl.addEventListener('pointercancel', resetJoy);
}

initBackgroundAndWallpaperSettings();

animate();

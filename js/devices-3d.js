// =========================================================================
// 4. SMART HOME GERÄTE & DYNAMISCHE LICHTQUELLEN ERSTELLEN
// =========================================================================
const deviceObjects = window.deviceObjects = {};
let labelsVisible = true;

// Erzeugt eine weiche, strahlende Radial-Glow-Textur für echten Lichtschein (Bloom-Halo) um Lampen
function createHaloTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 2, 128, 128, 128);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.18, 'rgba(255, 255, 255, 0.72)');
  grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.25)');
  grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.05)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const sharedHaloTexture = createHaloTexture();

// Erzeugt ein echtes Smart-Display-UI (Uhrzeit, Wetter & Alexa-Cyan-Leuchtstreifen unten) für den Alexa Echo Show im Wohnzimmer
function createEchoShowScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  const bg = ctx.createLinearGradient(0, 0, 256, 160);
  bg.addColorStop(0, '#0f172a');
  bg.addColorStop(0.6, '#1e3a8a');
  bg.addColorStop(1, '#090d16');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 160);

  // Dezente Uhrzeit & Wetter-Widget auf dem Echo Show Display
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 44px Segoe UI, sans-serif';
  ctx.fillText('20:15', 22, 68);
  ctx.fillStyle = '#93c5fd';
  ctx.font = '600 18px Segoe UI, sans-serif';
  ctx.fillText('☀️ 21°C · Smart Home', 24, 102);

  // Typischer Alexa Cyan-Blauer Leuchtstreifen unten am Displayrand
  const bar = ctx.createLinearGradient(0, 0, 256, 0);
  bar.addColorStop(0, '#0284c7');
  bar.addColorStop(0.5, '#00f2fe');
  bar.addColorStop(1, '#0284c7');
  ctx.fillStyle = bar;
  ctx.fillRect(0, 144, 256, 16);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const echoShowScreenTex = createEchoShowScreenTexture();

// Erzeugt ein brillantes 4K-OLED-HDR-Displaybild für den 65" LG OLED evo G-Series (echtes Tiefschwarz + leuchtender Kosmos/Kino-Kontrast)
function createLgOledScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 288;
  const ctx = canvas.getContext('2d');

  // 1. Echtes OLED-Tiefschwarz als Basis
  ctx.fillStyle = '#03050a';
  ctx.fillRect(0, 0, 512, 288);

  // 2. Farbintensiver HDR-Kosmos / Aurora-Horizont (typischer LG OLED Demo-Look mit unendlichem Kontrast)
  const bgGrad = ctx.createLinearGradient(0, 24, 512, 264);
  bgGrad.addColorStop(0.0, '#030712');
  bgGrad.addColorStop(0.28, '#0c2461');
  bgGrad.addColorStop(0.55, '#0984e3');
  bgGrad.addColorStop(0.78, '#6c5ce7');
  bgGrad.addColorStop(1.0, '#050811');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 22, 512, 244);

  // Leuchtender Gold-/Cyan-Nebel im Zentrum für echten OLED-HDR-Strahleffekt
  const glow1 = ctx.createRadialGradient(210, 145, 8, 210, 145, 165);
  glow1.addColorStop(0.0, 'rgba(56, 189, 248, 0.95)');
  glow1.addColorStop(0.35, 'rgba(14, 165, 233, 0.55)');
  glow1.addColorStop(0.7, 'rgba(59, 130, 246, 0.15)');
  glow1.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 22, 512, 244);

  const glow2 = ctx.createRadialGradient(345, 138, 5, 345, 138, 135);
  glow2.addColorStop(0.0, 'rgba(251, 191, 36, 0.92)');
  glow2.addColorStop(0.3, 'rgba(244, 63, 94, 0.52)');
  glow2.addColorStop(0.7, 'rgba(168, 85, 247, 0.18)');
  glow2.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 22, 512, 244);

  // Dunkle Berg-Silhouette am unteren Horizont (zeigt den perfekten OLED-Schwarzwert)
  ctx.fillStyle = '#04070f';
  ctx.beginPath();
  ctx.moveTo(0, 266);
  ctx.lineTo(0, 212);
  ctx.lineTo(75, 178);
  ctx.lineTo(145, 204);
  ctx.lineTo(235, 158);
  ctx.lineTo(315, 195);
  ctx.lineTo(395, 166);
  ctx.lineTo(465, 196);
  ctx.lineTo(512, 182);
  ctx.lineTo(512, 266);
  ctx.closePath();
  ctx.fill();

  // Feine Sterne im oberen Bereich
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  [[48, 54, 1.5], [118, 42, 1.2], [176, 68, 1.8], [284, 48, 1.4], [362, 62, 1.7], [438, 46, 1.3], [472, 78, 1.5]].forEach(([sx, sy, sr]) => {
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  });

  // Dezente Cinemascope-Balken oben & unten + edles LG OLED evo / Dolby Vision Badge
  ctx.fillStyle = '#020409';
  ctx.fillRect(0, 0, 512, 22);
  ctx.fillRect(0, 266, 512, 22);

  // Dezenter diagonaler Hochglanz-Glasreflex
  ctx.fillStyle = 'rgba(255, 255, 255, 0.045)';
  ctx.beginPath();
  ctx.moveTo(140, 0);
  ctx.lineTo(235, 0);
  ctx.lineTo(95, 288);
  ctx.lineTo(0, 288);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(248, 250, 252, 0.78)';
  ctx.font = '600 13px Segoe UI, sans-serif';
  ctx.fillText('LG OLED evo G-Series · 65" 4K HDR', 18, 281);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Erzeugt die edle, tiefschwarze Entspiegelungs-Glasoberfläche für den ausgeschalteten 65" LG OLED G-Series
function createLgOledOffTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 288;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 512, 288);
  grad.addColorStop(0.0, '#050811');
  grad.addColorStop(0.5, '#090e1a');
  grad.addColorStop(1.0, '#04060c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 288);

  // Feiner diagonaler Glas-Schimmer auf dem ausgeschalteten OLED-Panel
  ctx.fillStyle = 'rgba(148, 163, 184, 0.06)';
  ctx.beginPath();
  ctx.moveTo(170, 0);
  ctx.lineTo(260, 0);
  ctx.lineTo(110, 288);
  ctx.lineTo(20, 288);
  ctx.closePath();
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const lgOledScreenTex = createLgOledScreenTexture();
const lgOledOffTex = createLgOledOffTexture();

function getEffectiveLightIntensity(dev) {
  if (dev.type === 'sensor' || dev.type === 'media' || dev.type === 'hub' || dev.type === 'vacuum') {
    return dev.intensity * 0.25;
  }
  if (dev.type === 'light') {
    return dev.intensity * 0.72;
  }
  return dev.intensity * 0.62;
}

function createDeviceLights() {
  ROOMS.forEach(room => {
    const rLabel = document.createElement('div');
    rLabel.className = 'room-label';
    rLabel.innerHTML = `${room.name}`;
    labelsContainer.appendChild(rLabel);
    room.domLabel = rLabel;

    room.devices.forEach(dev => {
      const isLampSource = dev.type === 'light' || dev.type === 'led' || dev.type === 'panel_leds' || dev.type === 'nanoleaf' || dev.type === 'tv';
      const isRoomLamp = isLampSource;
      const maxIntensity = getEffectiveLightIntensity(dev);
      const effectiveDist = dev.distance;

      // Haupt-Punktlicht (exakt begrenzte Raumausleuchtung mit physikalischem Lichtabfall)
      const light = new THREE.PointLight(dev.color, dev.on ? maxIntensity : 0, effectiveDist, 1.6);
      light.position.set(...dev.pos);
      if (isLampSource) {
        light.castShadow = dev.on;
        light.shadow.bias = -0.0012;
        light.shadow.normalBias = 0.025;
        light.shadow.mapSize.set(512, 512);
        light.shadow.camera.near = 0.08;
        light.shadow.camera.far = effectiveDist;
      }
      scene.add(light);

      // Gezielte, lokale Akzent-Lichter ausschließlich für spezielle Möbel (Vitrine / Lowboard-Türen)
      // KEIN ungefiltertes fillLight mehr, das durch Wände in fremde Räume scheinen könnte!
      let fillLight = null;
      if (dev.id === 'wz_lowboard_led') {
        fillLight = new THREE.PointLight(dev.color, dev.on ? maxIntensity * 0.85 : 0, 1.8, 1.8);
        fillLight.position.set(1.34, 1.02, -3.86); // Direkt in der Glasvitrine bei der Saturn V Rakete
        scene.add(fillLight);
      } else if (dev.id === 'sz_lowboard_led') {
        // Schlafzimmer Lowboard LED:
        // Hauptlicht an der LINKEN Tür (Z = -3.28) & Akzentlicht an der RECHTEN Tür (Z = -2.22)
        light.position.set(0.62, 0.24, -3.28);
        fillLight = new THREE.PointLight(dev.color, dev.on ? maxIntensity * 0.85 : 0, 1.8, 1.8);
        fillLight.position.set(0.62, 0.24, -2.22);
        scene.add(fillLight);
      }

      let glowMesh;
      let standbyLedMat = null;
      const glowOpacityOn = dev.type === 'light' ? 0.78 : 0.92;
      const glowMat = new THREE.MeshBasicMaterial({
        color: dev.color,
        transparent: true,
        opacity: dev.on ? glowOpacityOn : 0.14
      });

      if (dev.type === 'tv') {
        // 65" LG OLED evo G-Series (Gallery Edition / One Wall Design: 1,44m breit × 0,81m hoch × 2,4cm flach bündig an der Wand)
        glowMesh = new THREE.Group();

        // 1. Schattenfuge direkt zur Wand (One-Wall Flush Mount)
        const wallMountShadow = new THREE.Mesh(
          new THREE.BoxGeometry(0.008, 0.79, 1.41),
          new THREE.MeshBasicMaterial({ color: 0x020617 })
        );
        wallMountShadow.position.x = -0.020;
        glowMesh.add(wallMountShadow);

        // 2. Edler gebürsteter Titan-/Silber-Metallrahmen der LG G-Series (umlaufende Gallery-Fase)
        const galleryMetalFrame = new THREE.Mesh(
          new THREE.BoxGeometry(0.022, 0.822, 1.452),
          new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.25, metalness: 0.85 })
        );
        galleryMetalFrame.position.x = -0.010;
        galleryMetalFrame.castShadow = true;
        glowMesh.add(galleryMetalFrame);

        // 3. Hauchdünner 4mm schwarzer OLED-Innenrahmen (Cinema Screen Bezel)
        const innerBezel = new THREE.Mesh(
          new THREE.BoxGeometry(0.024, 0.806, 1.436),
          new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.18, metalness: 0.55 })
        );
        innerBezel.position.x = -0.006;
        glowMesh.add(innerBezel);

        // 4. Tiefschwarzes, entspiegeltes OLED-Glaspanel (sichtbar wenn TV ausgeschaltet ist)
        const screenOffPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(1.420, 0.790),
          new THREE.MeshBasicMaterial({ map: lgOledOffTex })
        );
        screenOffPlane.rotation.y = Math.PI / 2;
        screenOffPlane.position.x = 0.007;
        glowMesh.add(screenOffPlane);

        // 5. Brillantes 4K-HDR-OLED-Displaybild (sichtbar wenn TV eingeschaltet ist)
        glowMat.color.setHex(0xffffff);
        glowMat.map = lgOledScreenTex;
        glowMat.opacity = dev.on ? 1.0 : 0.0;
        const screenOnPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.420, 0.790), glowMat);
        screenOnPlane.rotation.y = Math.PI / 2;
        screenOnPlane.position.x = 0.008;
        glowMesh.add(screenOnPlane);

        // 6. Dezente rote Standby-LED unten mittig am LG G-Series Rahmen (leuchtet nur im Standby)
        standbyLedMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          transparent: true,
          opacity: dev.on ? 0.0 : 0.88
        });
        const standbyLed = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.007, 0.026), standbyLedMat);
        standbyLed.position.set(0.008, -0.402, 0);
        glowMesh.add(standbyLed);

        glowMesh.position.set(...dev.pos);
      } else if (dev.id === 'wz_lowboard_led') {
        // Wohnzimmer LED-Beleuchtung:
        // 1) LINKS als LED-Leisten im Hängeregal mit Baumkante (Z = -1.42)
        // 2) RECHTS als Vitrinen-LED-Beleuchtung innen in der Glasvitrine (Z = -3.86)
        glowMesh = new THREE.Group();
        // Vertikale Hintergrund-LED-Leiste im Baumkanten-Wandpanel + 3 Unterboden-LED-Leisten in den Regalböden
        const shelfBackLed = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.90, 0.14), glowMat);
        shelfBackLed.position.set(1.104, 1.20, -1.42);
        glowMesh.add(shelfBackLed);
        [0.89, 1.17, 1.47].forEach(sy => {
          const sStrip = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.014, 0.62), glowMat);
          sStrip.position.set(1.15, sy, sy > 1.4 ? -1.56 : -1.30);
          glowMesh.add(sStrip);
        });

        // Vitrinen-LED-Streifen innen in der Glasvitrine (beleuchtet die LEGO Saturn V Rakete & ISS!)
        const vitrineTopLed = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.016, 0.50), glowMat);
        vitrineTopLed.position.set(1.30, 1.44, -3.86);
        glowMesh.add(vitrineTopLed);
        [-3.61, -4.10].forEach(vz => {
          const vitrineSideLed = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.86, 0.02), glowMat);
          vitrineSideLed.position.set(1.45, 1.01, vz);
          glowMesh.add(vitrineSideLed);
        });
      } else if (dev.id === 'sz_lowboard_led') {
        // Schlafzimmer Lowboard LED: Leuchtet in den Türen LINKS und RECHTS (mittig sitzt das Glaselement!)
        glowMesh = new THREE.Group();
        // LED-Elemente in der LINKEN Tür (Z = -3.28)
        const leftTopLed = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.016, 0.44), glowMat);
        leftTopLed.position.set(0.53, 0.43, -3.28);
        glowMesh.add(leftTopLed);
        const leftGripLed = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.38, 0.018), glowMat);
        leftGripLed.position.set(0.53, 0.22, -3.05);
        glowMesh.add(leftGripLed);
        // LED-Elemente in der RECHTEN Tür (Z = -2.22)
        const rightTopLed = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.016, 0.44), glowMat);
        rightTopLed.position.set(0.53, 0.43, -2.22);
        glowMesh.add(rightTopLed);
        const rightGripLed = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.38, 0.018), glowMat);
        rightGripLed.position.set(0.53, 0.22, -2.45);
        glowMesh.add(rightGripLed);
      } else if (dev.type === 'led') {
        glowMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 1.65), glowMat);
        glowMesh.position.set(...dev.pos);
      } else if (dev.type === 'panel_leds') {
        // Vertikale LED-Streifen zwischen den Akustik-Holzpaneelen + leuchtendes Planet Saturn Neon Sign! (IMG_6414 & IMG_6416)
        glowMesh = new THREE.Group();
        // Vertikale LED-Streifen exakt in den Zwischenräumen der Akustik-Holzlamellen!
        const ledGaps = [3.4875, 3.7125, 3.9375, 4.1625, 4.3875, 4.6125, 4.8375, 5.0625, 5.2875, 5.5125, 5.7375, 5.9625];
        ledGaps.forEach(gx => {
          const strip = new THREE.Mesh(new THREE.BoxGeometry(0.022, 1.62, 0.026), glowMat);
          strip.position.set(gx - dev.pos[0], -0.44, 0.015);
          glowMesh.add(strip);
        });
        // Planet Saturn Neon Sign zentriert an der Rückwand über dem Hauptmonitor (IMG_6414 & IMG_6416)
        const saturnGroup = new THREE.Group();
        saturnGroup.position.set(0, 0.10, -0.02);
        // Äußerer geneigter Neon-Ring (Pink/Magenta 0xff2a85)
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff2a85, side: THREE.DoubleSide, transparent: true, opacity: dev.on ? 0.95 : 0.18 });
        const saturnRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.012, 12, 36), ringMat);
        saturnRing.rotation.x = Math.PI / 2.3;
        saturnRing.rotation.y = 0.22;
        saturnGroup.add(saturnRing);
        // Mittlere leuchtende Planetenscheibe / Sphäre (Cyan/Eisblau 0x00e5ff)
        const planetMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: dev.on ? 0.95 : 0.18 });
        const saturnPlanet = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 16), planetMat);
        saturnGroup.add(saturnPlanet);
        glowMesh.add(saturnGroup);
        glowMesh.position.set(...dev.pos);
      } else if (dev.type === 'nanoleaf') {
        // Nanoleaf Lines: Originalgetreue 12-teilige geometrische Form nach Foto IMG_6418
        // (Hexagon mit vertikalen Seiten, Innensteg ins Zentrum, 4 Auslegern & 2-Segment-Verlängerung oben rechts)
        glowMesh = new THREE.Group();

        const L = 0.21;
        const c30 = L * Math.sqrt(3) / 2; // ca. 0.1819
        const s30 = L * 0.5;             // 0.105

        // 12 Hexagonale Nanoleaf Verbindungs-Hubs [dy, dz] relativ zum Gruppen-Zentrum
        const hubPoints = [
          [0.0, 0.0],                        // 1. Zentrum (Innenknoten)
          [L, 0.0],                          // 2. Hexagon oben (Spitze)
          [s30, -c30],                       // 3. Hexagon oben links
          [-s30, -c30],                      // 4. Hexagon unten links
          [-L, 0.0],                         // 5. Hexagon unten (Spitze)
          [-s30, c30],                       // 6. Hexagon unten rechts
          [s30, c30],                        // 7. Hexagon oben rechts
          [s30 + s30, -c30 - c30],           // 8. Ausleger oben links
          [-s30 - s30, -c30 - c30],          // 9. Ausleger unten links
          [-s30 - s30, c30 + c30],           // 10. Ausleger unten rechts
          [s30 + s30, c30 + c30],            // 11. Ausleger oben rechts (Zwischenknoten)
          [s30 + s30 + s30, c30 + c30 + c30] // 12. Ausleger oben rechts (Endknoten)
        ];

        const hubMat = new THREE.MeshStandardMaterial({
          color: 0xf1f5f9,
          roughness: 0.3,
          metalness: 0.15
        });

        hubPoints.forEach(([hy, hz]) => {
          const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.014, 6), hubMat);
          hub.rotation.z = Math.PI / 2;
          hub.position.set(-0.006, hy, hz);
          hub.userData = { isHub: true };
          glowMesh.add(hub);
        });

        // 12 exakte Nanoleaf Lines Leuchtstäbe nach IMG_6418
        const lineSegments = [
          // Hexagon Außenumfang:
          [[-s30, -c30], [s30, -c30]],                      // 1. Vertikale Kante links
          [[s30, -c30], [L, 0.0]],                          // 2. Kante nach oben zur Spitze
          [[L, 0.0], [s30, c30]],                           // 3. Kante nach oben rechts
          [[s30, c30], [-s30, c30]],                        // 4. Vertikale Kante rechts
          [[-s30, c30], [-L, 0.0]],                         // 5. Kante nach unten zur Spitze
          [[-L, 0.0], [-s30, -c30]],                        // 6. Kante nach unten links
          // Innenspeiche & Ausleger:
          [[-s30, -c30], [0.0, 0.0]],                       // 7. Balken von unten links ins Zentrum
          [[s30, -c30], [s30 + s30, -c30 - c30]],           // 8. Ausleger oben links
          [[-s30, -c30], [-s30 - s30, -c30 - c30]],         // 9. Ausleger unten links
          [[-s30, c30], [-s30 - s30, c30 + c30]],           // 10. Ausleger unten rechts
          [[s30, c30], [s30 + s30, c30 + c30]],             // 11. Ausleger oben rechts (Segment 1)
          [[s30 + s30, c30 + c30], [s30 + s30 + s30, c30 + c30 + c30]] // 12. Ausleger oben rechts (Segment 2)
        ];

        const frontFaceMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.35,
          metalness: 0.05
        });

        lineSegments.forEach(([p1, p2]) => {
          const dy = p2[0] - p1[0];
          const dz = p2[1] - p1[1];
          const len = Math.hypot(dy, dz);
          const angle = Math.atan2(dz, dy);
          const midY = (p1[0] + p2[0]) / 2;
          const midZ = (p1[1] + p2[1]) / 2;

          // 1. Breiterer weicher Backlight-Glow direkt an der Wand (hinter den Lines wie auf IMG_6418!)
          const glowBackMat = new THREE.MeshBasicMaterial({
            color: dev.color,
            transparent: true,
            opacity: dev.on ? 0.65 : 0.0,
            depthWrite: false
          });
          const glowBack = new THREE.Mesh(new THREE.BoxGeometry(0.003, len + 0.02, 0.046), glowBackMat);
          glowBack.rotation.x = angle;
          glowBack.position.set(0.004, midY, midZ);
          glowBack.userData = { isBacklight: true };
          glowMesh.add(glowBack);

          // 2. Leuchtender LED-Stabkörper
          const barMat = new THREE.MeshBasicMaterial({
            color: dev.color,
            transparent: true,
            opacity: dev.on ? 0.95 : 0.20
          });
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.010, len, 0.014), barMat);
          bar.rotation.x = angle;
          bar.position.set(-0.004, midY, midZ);
          bar.userData = { isBar: true };
          glowMesh.add(bar);

          // 3. Matt-weiße Frontleiste (Nanoleaf Lines typische weiße Frontblende)
          const frontBar = new THREE.Mesh(new THREE.BoxGeometry(0.003, len - 0.018, 0.008), frontFaceMat);
          frontBar.rotation.x = angle;
          frontBar.position.set(-0.010, midY, midZ);
          frontBar.userData = { isHub: true };
          glowMesh.add(frontBar);
        });

        // Weißes Stromkabel nach unten ab dem Knoten unten rechts (wie auf IMG_6418 sichtbar)
        const powerCable = new THREE.Mesh(
          new THREE.CylinderGeometry(0.002, 0.002, 0.50, 8),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 })
        );
        powerCable.position.set(-0.006, -0.46, c30 + c30);
        powerCable.userData = { isHub: true };
        glowMesh.add(powerCable);

        glowMesh.position.set(...dev.pos);
      } else if (dev.id === 'wz_alexa') {
        // Alexa Echo Show (Wohnzimmer): Schräg geneigtes Smart-Display + leuchtender Alexa-Cyan-Balken unten
        glowMat.color.setHex(0xffffff);
        glowMat.map = echoShowScreenTex;
        glowMesh = new THREE.Group();
        const screenPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.138), glowMat);
        screenPlane.rotation.y = Math.PI / 2;
        screenPlane.position.set(0.034, -0.015, 0);
        screenPlane.rotation.x = 0;
        // Gleiche Neigung wie das Echo-Show-Gehäuse (0.22 rad)
        const tiltHolder = new THREE.Group();
        tiltHolder.position.set(0.02, -0.015, 0);
        tiltHolder.rotation.z = 0.22;
        const screenFace = new THREE.Mesh(new THREE.PlaneGeometry(0.222, 0.138), glowMat);
        screenFace.rotation.y = Math.PI / 2;
        screenFace.position.set(0.014, 0, 0);
        tiltHolder.add(screenFace);
        glowMesh.add(tiltHolder);
        glowMesh.position.set(...dev.pos);
      } else if (dev.id === 'az_alexa') {
        // Alexa Echo Dot (Arbeitszimmer im IKEA Regal links): Typischer cyan-blauer Alexa-Leuchtring unten am Echo Dot!
        glowMat.color.setHex(0x00e5ff);
        glowMesh = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.008, 12, 32), glowMat);
        glowMesh.rotation.x = Math.PI / 2;
        glowMesh.position.set(dev.pos[0], 1.115, dev.pos[2]);
      } else if (dev.id === 'wz_homey') {
        // Homey Pro: Typischer umlaufender RGB-LED-Ring unten am schwarzen Homey Pro Puck (wie auf IMG_6398)
        glowMesh = new THREE.Mesh(new THREE.TorusGeometry(0.084, 0.008, 12, 32), glowMat);
        glowMesh.rotation.x = Math.PI / 2;
        glowMesh.position.set(dev.pos[0], 0.463, dev.pos[2]);
      } else if (dev.id === 'wz_stehlampe') {
        // Leuchtender vertikaler LED-Stab der Eck-Stehlampe im Wohnzimmer
        glowMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.26, 12), glowMat);
        glowMesh.position.set(5.82, 0.66, -0.95);
      } else if (dev.id === 'flur_licht') {
        // 4 + 1 weiße runde Decken-Einbauspots (Downlights) in einer Linie im Flur (wie auf IMG_6401–6403!)
        glowMesh = new THREE.Group();
        const spotPositions = [
          [0.20, 1.76, 3.05],
          [0.20, 1.76, 2.08],
          [0.20, 1.76, 1.12],
          [0.20, 1.76, 0.15],
          [1.82, 1.76, -0.05]
        ];
        spotPositions.forEach(([sx, sy, sz]) => {
          const spotGroup = new THREE.Group();
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.058, 0.011, 10, 24),
            new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.4 })
          );
          ring.rotation.x = Math.PI / 2;
          spotGroup.add(ring);
          const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.012, 20), glowMat);
          spotGroup.add(lens);
          spotGroup.position.set(sx, sy, sz);
          glowMesh.add(spotGroup);
        });
      } else if (dev.id === 'bad_licht') {
        // Badezimmer-Beleuchtung (IMG_6404–6406): Weiße Decken-Einbauspots + leuchtender LED-Glasboden in der Wandnische + Spiegelschrank-LED!
        glowMesh = new THREE.Group();
        const badSpots = [
          [-1.66, 1.76, 0.85],  // Über Waschtisch / Mittelgang
          [-2.22, 1.76, -0.05], // Über Regendusche rechts
          [-1.15, 1.76, 0.45]   // Nahe Eingang
        ];
        badSpots.forEach(([sx, sy, sz]) => {
          const spotGroup = new THREE.Group();
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.055, 0.010, 10, 24),
            new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.4 })
          );
          ring.rotation.x = Math.PI / 2;
          spotGroup.add(ring);
          const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 20), glowMat);
          spotGroup.add(lens);
          spotGroup.position.set(sx, sy, sz);
          glowMesh.add(spotGroup);
        });
        // Leuchtender LED-Glasboden in der Badezimmer-Wandnische (X = -2.71, Y = 1.29, Z = 0.80, IMG_6404 & IMG_6405!)
        const nicheLedShelf = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.018, 0.47), glowMat);
        nicheLedShelf.position.set(-2.71, 1.29, 0.80);
        glowMesh.add(nicheLedShelf);
        // Leuchtende LED-Spiegelleuchte oben am Spiegelschrank (X = -1.66, Y = 1.66, Z = 1.33)
        const mirrorLedBar = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.016, 0.06), glowMat);
        mirrorLedBar.position.set(-1.66, 1.66, 1.33);
        glowMesh.add(mirrorLedBar);
      } else if (dev.id === 'wz_deckenlicht') {
        // Moderne geschwungene LED-Wellen-Deckenlampe im Wohnzimmer (wie auf IMG_6403 & IMG_6397 an der Decke sichtbar!)
        glowMesh = new THREE.Group();
        const canopy = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.11, 0.032, 24),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.6 })
        );
        canopy.position.y = 0.02;
        glowMesh.add(canopy);
        [-0.28, 0.28].forEach((rotAngle, i) => {
          const waveArm = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.016, 0.024), glowMat);
          waveArm.rotation.y = rotAngle + (i === 1 ? Math.PI / 3 : 0);
          waveArm.position.y = -0.01 - i * 0.012;
          glowMesh.add(waveArm);
        });
        glowMesh.position.set(...dev.pos);
      } else if (dev.id === 'sz_licht') {
        // Moderne geschwungene LED-Ringe Deckenleuchte im Schlafzimmer (IMG_6408 & IMG_6410)
        glowMesh = new THREE.Group();
        const canopy = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.024, 24),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 })
        );
        canopy.position.y = 0.02;
        glowMesh.add(canopy);
        // Großer geschwungener LED-Ring
        const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.012, 16, 48), glowMat);
        ring1.rotation.x = Math.PI / 2;
        ring1.rotation.y = 0.12;
        glowMesh.add(ring1);
        // Kleinerer verschlungener LED-Ring
        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.012, 16, 48), glowMat);
        ring2.rotation.x = Math.PI / 2 + 0.14;
        ring2.rotation.z = Math.PI / 3;
        ring2.position.set(0.08, 0.015, 0.04);
        glowMesh.add(ring2);
        glowMesh.position.set(...dev.pos);
      } else if (dev.id === 'kueche_licht') {
        // Moderne geometrische schwarze LED-Doppelrechteck-Deckenleuchte (IMG_6412 & IMG_6413)
        glowMesh = new THREE.Group();
        const canopy = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.024, 0.12),
          new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.35, metalness: 0.7 })
        );
        canopy.position.y = 0.02;
        glowMesh.add(canopy);
        // Schwarzer LED-Rechteckrahmen 1
        const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.018, 0.30), glowMat);
        r1.rotation.y = 0.22;
        glowMesh.add(r1);
        const r1Inner = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, 0.022, 0.22),
          new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4, metalness: 0.7 })
        );
        r1Inner.rotation.y = 0.22;
        glowMesh.add(r1Inner);
        // Versetzter schwarzer LED-Rechteckrahmen 2
        const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.018, 0.28), glowMat);
        r2.position.set(0.09, -0.012, 0.06);
        r2.rotation.y = -0.32;
        glowMesh.add(r2);
        const r2Inner = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.022, 0.20),
          new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4, metalness: 0.7 })
        );
        r2Inner.position.set(0.09, -0.012, 0.06);
        r2Inner.rotation.y = -0.32;
        glowMesh.add(r2Inner);
        glowMesh.position.set(...dev.pos);
      } else if (dev.id === 'az_deckenlampe') {
        // Geschwungene Edelstahl-/Chrom-Deckenleuchte mit 4 verstellbaren Rundspots (IMG_6416 & IMG_6417)
        glowMesh = new THREE.Group();
        const canopy = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.024, 24),
          new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.25, metalness: 0.85 })
        );
        canopy.position.y = 0.02;
        glowMesh.add(canopy);
        const rodMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.2, metalness: 0.85 });
        const rodCurve = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.014, 0.014), rodMat);
        rodCurve.rotation.y = 0.35;
        glowMesh.add(rodCurve);
        const spotOffsets = [
          [-0.34, -0.02, -0.12, 0.2],
          [-0.11, -0.02, -0.04, -0.15],
          [0.12, -0.02, 0.05, 0.3],
          [0.34, -0.02, 0.13, -0.2]
        ];
        spotOffsets.forEach(([sx, sy, sz, rot]) => {
          const spot = new THREE.Group();
          const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 12), rodMat);
          holder.position.y = 0.015;
          spot.add(holder);
          const head = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.022, 20), rodMat);
          head.rotation.x = rot;
          spot.add(head);
          const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.008, 20), glowMat);
          lens.rotation.x = rot;
          lens.position.y = -0.01;
          spot.add(lens);
          spot.position.set(sx, sy, sz);
          glowMesh.add(spot);
        });
        glowMesh.position.set(...dev.pos);
      } else if (dev.type === 'light' && dev.id !== 'wz_stehlampe') {
        // Moderne flache Smart-LED-Deckenleuchte (etwas kompakter: Anthrazit-Rahmen + Diffusor-Scheibe + Außen-Lichtring)
        glowMesh = new THREE.Group();
        const housing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.185, 0.17, 0.028, 32),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.4 })
        );
        housing.position.y = 0.016;
        glowMesh.add(housing);

        // Leuchtendes Opal-Diffusor-Panel in der Mitte
        const panelDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.015, 32), glowMat);
        panelDisc.position.y = 0.0;
        glowMesh.add(panelDisc);

        // Edler umlaufender LED-Leuchtring um die Deckenlampe
        const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.182, 0.009, 12, 36), glowMat);
        outerRing.rotation.x = Math.PI / 2;
        outerRing.position.y = 0.006;
        glowMesh.add(outerRing);

        glowMesh.position.set(...dev.pos);
      } else if (dev.id === 'az_roborock') {
        // Roborock Status-LED-Ring um den LiDAR-Laserturm
        glowMesh = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.007, 10, 24), glowMat);
        glowMesh.rotation.x = Math.PI / 2;
        glowMesh.position.set(dev.pos[0], 0.088, dev.pos[2]);
      } else {
        glowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), glowMat);
        glowMesh.position.set(...dev.pos);
      }

      scene.add(glowMesh);

      // Dezenter, weicher 3D-Strahlglow (Halo-Sprite) ohne Überstrahlen – damit hauptsächlich der Raum selbst beleuchtet wirkt!
      const haloScale = dev.type === 'light' ? 0.58 : (dev.type === 'tv' ? 0.85 : (isRoomLamp ? 0.54 : 0.32));
      const haloOpacityOn = dev.type === 'light' ? 0.22 : (dev.type === 'tv' ? 0.14 : (isRoomLamp ? 0.20 : 0.14));
      const haloMat = new THREE.SpriteMaterial({
        map: sharedHaloTexture,
        color: dev.color,
        transparent: true,
        opacity: dev.on ? haloOpacityOn : 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const haloSprite = new THREE.Sprite(haloMat);
      haloSprite.scale.set(haloScale, haloScale, 1);
      haloSprite.position.set(...dev.pos);
      scene.add(haloSprite);

      // Bei wz_lowboard_led auch in der Glasvitrine rechts einen sanften Halo-Schein mit demselben Material platzieren
      if (dev.id === 'wz_lowboard_led') {
        const vitrineHalo = new THREE.Sprite(haloMat);
        vitrineHalo.scale.set(0.62, 0.72, 1);
        vitrineHalo.position.set(1.32, 1.02, -3.86);
        scene.add(vitrineHalo);
      } else if (dev.id === 'sz_lowboard_led') {
        // Bei sz_lowboard_led zwei Halos: an der linken Tür und an der rechten Tür!
        haloSprite.position.set(0.53, 0.24, -3.28);
        const rightDoorHalo = new THREE.Sprite(haloMat);
        rightDoorHalo.scale.set(haloScale, haloScale, 1);
        rightDoorHalo.position.set(0.53, 0.24, -2.22);
        scene.add(rightDoorHalo);
      }

      const badge = document.createElement('div');
      badge.className = `device-badge ${dev.on ? 'on' : ''}`;
      badge.title = `${dev.name} (Klicken zum Steuern)`;
      badge.innerHTML = dev.icon;
      const isLedOrDimmable = dev.type === 'led' || dev.type === 'nanoleaf' || dev.type === 'panel_leds';
      badge.onclick = (e) => {
        e.stopPropagation();
        if (isLedOrDimmable) {
          openControlCard(dev.id, e.clientX, e.clientY);
        } else {
          toggleDevice(dev.id);
        }
      };
      if (isLedOrDimmable) {
        badge.oncontextmenu = (e) => {
          e.preventDefault();
          e.stopPropagation();
          openControlCard(dev.id, e.clientX, e.clientY);
        };
      }
      labelsContainer.appendChild(badge);

      deviceObjects[dev.id] = {
        data: dev,
        light,
        fillLight,
        isLampSource,
        maxIntensity,
        glowMesh,
        glowMat,
        standbyLedMat,
        haloMat,
        haloSprite,
        haloOpacityOn,
        badge,
        dim: 1.0,
        currentColor: '#' + dev.color.toString(16).padStart(6, '0')
      };
    });
  });
}

// createDeviceLights() wird zentral über rebuildHouseScene() aufgerufen


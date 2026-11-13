// ============================================================================
// HOMEY 3D — KONFIGURIERBARES HAUS & INTERAKTIVER GRUNDRISS-EDITOR
// ============================================================================
(function () {
  const GRID_SNAP = 0.25;
  const MAX_PICTURES = 5;

  const FLOOR_MATERIALS = {
    wood: () => mats.woodFloor,
    tile: () => mats.tileFloor,
    hall: () => mats.hallFloor,
    kitchen: () => mats.kitchenFloor
  };

  const FURNITURE_CATALOG = [
    { type: 'sofa', label: '🛋️ Sofa', defaultY: 0 },
    { type: 'bed', label: '🛏️ Doppelbett', defaultY: 0 },
    { type: 'desk', label: '🖥️ Schreibtisch', defaultY: 0 },
    { type: 'dining_table', label: '🍽️ Esstisch', defaultY: 0 },
    { type: 'lowboard', label: '📺 TV-Lowboard', defaultY: 0 },
    { type: 'kitchen', label: '🍳 Küchenzeile', defaultY: 0 },
    { type: 'shower', label: '🚿 Dusche', defaultY: 0 },
    { type: 'vanity', label: '🚰 Waschtisch', defaultY: 0 },
    { type: 'toilet', label: '🚽 WC', defaultY: 0 },
    { type: 'shelf', label: '📚 Regal', defaultY: 0 },
    { type: 'plant', label: '🪴 Pflanze', defaultY: 0 },
    { type: 'roborock_dock', label: '🤖 Saugroboter-Dock', defaultY: 0 }
  ];

  const DEVICE_CATALOG = [
    { type: 'light', icon: '💡', label: 'Deckenlicht', defaultY: 1.6, color: '#ffd699', intensity: 1.7, distance: 5.0 },
    { type: 'led', icon: '🌈', label: 'LED-Streifen / Ambient', defaultY: 0.5, color: '#a855f7', intensity: 1.4, distance: 2.8 },
    { type: 'sensor', icon: '📡', label: 'Bewegungs-/Präsenzsensor', defaultY: 1.5, color: '#38bdf8', intensity: 0.45, distance: 1.6 },
    { type: 'tv', icon: '📺', label: 'Fernseher', defaultY: 1.0, color: '#60a5fa', intensity: 1.3, distance: 3.2 },
    { type: 'media', icon: '🗣️', label: 'Smart Speaker / Media', defaultY: 0.7, color: '#38bdf8', intensity: 0.45, distance: 1.4 },
    { type: 'hub', icon: '🌐', label: 'Smart-Home Hub', defaultY: 0.5, color: '#38bdf8', intensity: 0.5, distance: 1.4 }
  ];

  function uid(prefix = 'id') {
    return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function snap(val) {
    return Math.round(val / GRID_SNAP) * GRID_SNAP;
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function createEmptyHouseTemplate(customName = 'Mein Zuhause') {
    return {
      id: uid('house'),
      mode: 'custom',
      name: customName,
      fpvStart: { x: 0, z: 0, yaw: 0 },
      rooms: [
        { id: 'room_main', name: 'Wohnbereich', x1: -3, z1: -3, x2: 3, z2: 3, floor: 'wood' }
      ],
      walls: [
        { id: 'w1', x1: -3, z1: -3, x2: 3, z2: -3, kind: 'outer', thickness: 0.12 },
        { id: 'w2', x1: 3, z1: -3, x2: 3, z2: 3, kind: 'outer', thickness: 0.12 },
        { id: 'w3', x1: 3, z1: 3, x2: -3, z2: 3, kind: 'outer', thickness: 0.12 },
        { id: 'w4', x1: -3, z1: 3, x2: -3, z2: -3, kind: 'outer', thickness: 0.12 }
      ],
      furniture: [],
      devices: [
        {
          id: 'dev_main_light',
          roomId: 'room_main',
          name: 'Deckenlicht',
          icon: '💡',
          type: 'light',
          x: 0,
          y: 1.6,
          z: 0,
          color: '#ffd699',
          intensity: 1.7,
          distance: 5.5,
          on: true
        }
      ]
    };
  }

  function createStarterApartmentTemplate(customName = 'Beispiel-Wohnung (2-Zimmer)') {
    return {
      id: uid('house'),
      mode: 'custom',
      name: customName,
      fpvStart: { x: -2.0, z: 0.5, yaw: 0 },
      rooms: [
        { id: 'room_wz', name: 'Wohnzimmer & Küche', x1: -4, z1: -3.5, x2: 1.5, z2: 2.5, floor: 'wood' },
        { id: 'room_sz', name: 'Schlafzimmer', x1: 1.5, z1: -3.5, x2: 5, z2: 0.5, floor: 'wood' },
        { id: 'room_bad', name: 'Badezimmer', x1: 1.5, z1: 0.5, x2: 5, z2: 2.5, floor: 'tile' }
      ],
      walls: [
        { id: 'w_n1', x1: -4, z1: -3.5, x2: -2.2, z2: -3.5, kind: 'outer', thickness: 0.12 },
        { id: 'win_1', x1: -2.2, z1: -3.5, x2: -0.2, z2: -3.5, kind: 'window', thickness: 0.12 },
        { id: 'w_n2', x1: -0.2, z1: -3.5, x2: 2.5, z2: -3.5, kind: 'outer', thickness: 0.12 },
        { id: 'win_2', x1: 2.5, z1: -3.5, x2: 4.0, z2: -3.5, kind: 'window', thickness: 0.12 },
        { id: 'w_n3', x1: 4.0, z1: -3.5, x2: 5, z2: -3.5, kind: 'outer', thickness: 0.12 },
        { id: 'w_e', x1: 5, z1: -3.5, x2: 5, z2: 2.5, kind: 'outer', thickness: 0.12 },
        { id: 'w_s', x1: 5, z1: 2.5, x2: -4, z2: 2.5, kind: 'outer', thickness: 0.12 },
        { id: 'w_w', x1: -4, z1: 2.5, x2: -4, z2: -3.5, kind: 'outer', thickness: 0.12 },
        { id: 'w_i1', x1: 1.5, z1: -3.5, x2: 1.5, z2: -2.0, kind: 'inner', thickness: 0.10 },
        { id: 'd_sz', x1: 1.5, z1: -2.0, x2: 1.5, z2: -1.1, kind: 'door', thickness: 0.10 },
        { id: 'w_i2', x1: 1.5, z1: -1.1, x2: 1.5, z2: 1.0, kind: 'inner', thickness: 0.10 },
        { id: 'd_bad', x1: 1.5, z1: 1.0, x2: 1.5, z2: 1.9, kind: 'door', thickness: 0.10 },
        { id: 'w_i3', x1: 1.5, z1: 1.9, x2: 1.5, z2: 2.5, kind: 'inner', thickness: 0.10 },
        { id: 'w_i4', x1: 1.5, z1: 0.5, x2: 5, z2: 0.5, kind: 'inner', thickness: 0.10 }
      ],
      furniture: [
        { id: 'f_sofa', type: 'sofa', x: -2.6, z: -1.0, rotY: Math.PI / 2 },
        { id: 'f_low', type: 'lowboard', x: -0.2, z: -1.0, rotY: -Math.PI / 2 },
        { id: 'f_kit', type: 'kitchen', x: -2.2, z: 1.8, rotY: 0 },
        { id: 'f_din', type: 'dining_table', x: -0.2, z: 1.2, rotY: 0 },
        { id: 'f_bed', type: 'bed', x: 3.6, z: -1.6, rotY: -Math.PI / 2 },
        { id: 'f_shw', type: 'shower', x: 4.3, z: 1.8, rotY: 0 },
        { id: 'f_van', type: 'vanity', x: 2.8, z: 2.1, rotY: 0 },
        { id: 'f_plt', type: 'plant', x: -3.5, z: -3.0, rotY: 0 }
      ],
      devices: [
        { id: 'dev_wz_light', roomId: 'room_wz', name: 'Wohnzimmer Licht', icon: '💡', type: 'light', x: -1.4, y: 1.6, z: -1.0, color: '#ffd699', intensity: 1.8, distance: 5.5, on: true },
        { id: 'dev_wz_tv', roomId: 'room_wz', name: 'Smart TV', icon: '📺', type: 'tv', x: -0.2, y: 1.05, z: -1.0, color: '#60a5fa', intensity: 1.2, distance: 3.0, on: true },
        { id: 'dev_sz_light', roomId: 'room_sz', name: 'Schlafzimmer Licht', icon: '💡', type: 'light', x: 3.2, y: 1.6, z: -1.5, color: '#ffcfa0', intensity: 1.6, distance: 4.5, on: false },
        { id: 'dev_bad_light', roomId: 'room_bad', name: 'Bad Licht', icon: '💡', type: 'light', x: 3.2, y: 1.6, z: 1.5, color: '#fff4dc', intensity: 1.6, distance: 3.5, on: false }
      ]
    };
  }

  // ==========================================================================
  // 3D MÖBEL-BAUKASTEN FÜR KONFIGURIERBARE HÄUSER
  // ==========================================================================
  function createFurniturePrefab(type) {
    const group = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b6240, roughness: 0.72 });
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x3b2a1e, roughness: 0.7 });
    const fabric = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.45 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.7 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });

    switch (type) {
      case 'sofa': {
        const base = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.36, 0.9), fabric);
        base.position.y = 0.22;
        const back = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.45, 0.18), fabric);
        back.position.set(0, 0.5, -0.36);
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.9), fabric);
        armL.position.set(-0.96, 0.38, 0);
        const armR = armL.clone();
        armR.position.x = 0.96;
        group.add(base, back, armL, armR);
        break;
      }
      case 'bed': {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.28, 2.1), wood);
        frame.position.y = 0.16;
        const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.18, 1.98), whiteMat);
        mattress.position.y = 0.38;
        const head = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.75, 0.1), darkWood);
        head.position.set(0, 0.42, -1.0);
        const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.1, 0.4), fabric);
        p1.position.set(-0.42, 0.5, -0.72);
        const p2 = p1.clone();
        p2.position.x = 0.42;
        group.add(frame, mattress, head, p1, p2);
        break;
      }
      case 'desk': {
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.75), wood);
        top.position.y = 0.74;
        [[-0.72, -0.3], [0.72, -0.3], [-0.72, 0.3], [0.72, 0.3]].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.74, 0.05), metal);
          leg.position.set(lx, 0.37, lz);
          group.add(leg);
        });
        const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.38, 0.03), darkMat);
        monitor.position.set(0, 1.0, -0.22);
        const chair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), fabric);
        chair.position.set(0, 0.25, 0.55);
        group.add(top, monitor, chair);
        break;
      }
      case 'dining_table': {
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.9), wood);
        top.position.y = 0.74;
        [[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.74, 0.06), darkWood);
          leg.position.set(lx, 0.37, lz);
          group.add(leg);
        });
        [[-0.4, -0.62], [0.4, -0.62], [-0.4, 0.62], [0.4, 0.62]].forEach(([cx, cz]) => {
          const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.42), fabric);
          seat.position.set(cx, 0.22, cz);
          group.add(seat);
        });
        group.add(top);
        break;
      }
      case 'lowboard': {
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.42, 0.44), darkWood);
        body.position.y = 0.24;
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.03, 0.46), wood);
        top.position.y = 0.46;
        group.add(body, top);
        break;
      }
      case 'kitchen': {
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.85, 0.65), whiteMat);
        body.position.y = 0.425;
        const counter = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.05, 0.68), darkMat);
        counter.position.y = 0.875;
        const stove = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.5), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 }));
        stove.position.set(-0.5, 0.91, 0);
        const sink = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 0.44), metal);
        sink.position.set(0.6, 0.91, 0);
        group.add(body, counter, stove, sink);
        break;
      }
      case 'shower': {
        const tray = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 0.95), whiteMat);
        tray.position.y = 0.025;
        const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.35, roughness: 0.1 });
        const g1 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.55, 0.02), glassMat);
        g1.position.set(0, 0.8, -0.46);
        const g2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.55, 0.95), glassMat);
        g2.position.set(-0.46, 0.8, 0);
        group.add(tray, g1, g2);
        break;
      }
      case 'vanity': {
        const cab = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.48), darkWood);
        cab.position.y = 0.4;
        const basin = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.08, 0.46), whiteMat);
        basin.position.y = 0.74;
        const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.03), new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.1 }));
        mirror.position.set(0, 1.25, -0.2);
        group.add(cab, basin, mirror);
        break;
      }
      case 'toilet': {
        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.4, 16), whiteMat);
        bowl.position.set(0, 0.2, 0.06);
        const tank = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.18), whiteMat);
        tank.position.set(0, 0.48, -0.18);
        group.add(bowl, tank);
        break;
      }
      case 'shelf': {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.35, 0.38), whiteMat);
        frame.position.y = 0.675;
        group.add(frame);
        break;
      }
      case 'plant': {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.34, 14), whiteMat);
        pot.position.y = 0.17;
        const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 }));
        leaves.position.y = 0.54;
        group.add(pot, leaves);
        break;
      }
      case 'roborock_dock': {
        const dock = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.22), darkMat);
        dock.position.set(0, 0.07, -0.14);
        const vac = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 20), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 }));
        vac.position.set(0, 0.04, 0.12);
        group.add(dock, vac);
        break;
      }
      default: {
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), wood);
        box.position.y = 0.25;
        group.add(box);
      }
    }

    group.traverse(c => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    return group;
  }

  function createFpvStartMarker(sp) {
    const marker = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.28, 24),
      new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.34, 12),
      new THREE.MeshBasicMaterial({ color: 0x34d399 })
    );
    arrow.rotation.x = -Math.PI / 2;
    arrow.position.set(0, 0.14, -0.32);
    marker.add(ring, arrow);
    marker.position.set((sp && sp.x) || 0, 0, (sp && sp.z) || 0);
    marker.rotation.y = (sp && sp.yaw) || 0;
    return marker;
  }

  function createPictureFrameMesh(pic) {
    const group = new THREE.Group();
    const w = pic.width || 0.95;
    const h = pic.height || 0.65;
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.2 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, h + 0.06, 0.03), frameMat);
    frame.castShadow = true;
    frame.receiveShadow = true;
    group.add(frame);

    let artMat;
    if (pic.imageDataUrl) {
      const img = new Image();
      const tex = new THREE.Texture(img);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      artMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
      img.onload = () => {
        tex.needsUpdate = true;
        artMat.needsUpdate = true;
      };
      img.src = pic.imageDataUrl;
      if (img.complete) {
        tex.needsUpdate = true;
        artMat.needsUpdate = true;
      }
    } else {
      artMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, side: THREE.DoubleSide });
    }
    const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), artMat);
    art.position.z = 0.017;
    group.add(art);

    group.position.set(pic.x || 0, pic.y ?? 1.15, pic.z || 0);
    group.rotation.y = pic.rotY || 0;
    return group;
  }

  // ==========================================================================
  // CUSTOM HOUSE BUILDER
  // ==========================================================================
  function getEditorTargetRoot() {
    return (typeof houseRoot !== 'undefined' && houseRoot) ? houseRoot : scene;
  }

  function tagSceneObjects(startIdx, ref) {
    const root = getEditorTargetRoot();
    for (let i = startIdx; i < root.children.length; i++) {
      const obj = root.children[i];
      obj.userData.editorRef = ref;
      obj.traverse(c => { c.userData.editorRef = ref; });
    }
  }

  function createDeviceEditorHandle(d) {
    const g = new THREE.Group();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 })
    );
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.25, 20),
      new THREE.MeshBasicMaterial({ color: 0x7dd3fc, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
    );
    ring.rotation.x = -Math.PI / 2;
    g.add(sphere, ring);
    g.position.set(d.x || 0, d.y ?? 1.2, d.z || 0);
    g.userData.editorRef = { kind: 'device', id: d.id };
    g.traverse(c => { c.userData.editorRef = { kind: 'device', id: d.id }; });
    return g;
  }

  function buildCustomHouse(houseCfg) {
    if (!houseCfg) return;
    const root = getEditorTargetRoot();

    (houseCfg.rooms || []).forEach(r => {
      const startIdx = root.children.length;
      const matFn = FLOOR_MATERIALS[r.floor] || FLOOR_MATERIALS.wood;
      addFloor(r.x1, r.z1, r.x2, r.z2, matFn());
      tagSceneObjects(startIdx, { kind: 'room', id: r.id });
    });

    (houseCfg.walls || []).forEach((w, idx) => {
      const startIdx = root.children.length;
      const thick = w.thickness || (w.kind === 'outer' ? 0.12 : 0.10);
      if (w.kind === 'window') {
        addWindow(w.x1, w.z1, w.x2, w.z2, true, mats.wzWall, true);
      } else if (w.kind === 'door') {
        const dx = w.x2 - w.x1;
        const dz = w.z2 - w.z1;
        const len = Math.max(0.4, Math.sqrt(dx * dx + dz * dz));
        const angle = Math.atan2(dz, dx);
        const pivot = new THREE.Group();
        pivot.position.set(w.x1, 0, w.z1);
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(len, 1.68, 0.04), mats.woodFloor);
        leaf.position.set(len / 2, 0.84, 0);
        pivot.add(leaf);
        pivot.rotation.y = -angle;
        scene.add(pivot);

        registerDoor({
          id: w.id || `door_${idx}`,
          name: w.name || 'Tür',
          pivot,
          closedAngle: -angle,
          openAngle: -angle + Math.PI / 2 - 0.1,
          isOpen: false,
          getBadgePos: () => {
            const a = pivot.rotation.y;
            return new THREE.Vector3(w.x1 + Math.cos(a) * (len * 0.6), 1.1, w.z1 - Math.sin(a) * (len * 0.6));
          }
        });
      } else {
        const isOuter = w.kind === 'outer';
        const isGlass = w.kind === 'glass';
        addWall(w.x1, w.z1, w.x2, w.z2, thick, isGlass, isOuter ? mats.wzWall : mats.hallWall, isOuter);
      }
      tagSceneObjects(startIdx, { kind: 'wall', id: w.id });
    });

    (houseCfg.furniture || []).forEach(f => {
      const mesh = createFurniturePrefab(f.type);
      mesh.position.set(f.x, f.y || 0, f.z);
      mesh.rotation.y = f.rotY || 0;
      const ref = { kind: 'furniture', id: f.id };
      mesh.userData.editorRef = ref;
      mesh.traverse(c => { c.userData.editorRef = ref; });
      scene.add(mesh);
    });

    (houseCfg.pictures || []).slice(0, MAX_PICTURES).forEach(pic => {
      const picMesh = createPictureFrameMesh(pic);
      const ref = { kind: 'picture', id: pic.id };
      picMesh.userData.editorRef = ref;
      picMesh.traverse(c => { c.userData.editorRef = ref; });
      scene.add(picMesh);
    });

    if (editorState.active) {
      (houseCfg.devices || []).forEach(d => {
        scene.add(createDeviceEditorHandle(d));
      });
      if (houseCfg.fpvStart) {
        const marker = createFpvStartMarker(houseCfg.fpvStart);
        const ref = { kind: 'fpv_start', id: 'fpv_start' };
        marker.userData.editorRef = ref;
        marker.traverse(c => { c.userData.editorRef = ref; });
        scene.add(marker);
      }
    }
  }

  function buildRoomsFromCustomHouse(houseCfg) {
    const rooms = (houseCfg.rooms || []).map(r => ({
      id: r.id,
      name: r.name,
      dims: `${Math.abs(r.x2 - r.x1).toFixed(1)}m × ${Math.abs(r.z2 - r.z1).toFixed(1)}m`,
      labelPos: [(r.x1 + r.x2) / 2, 0.1, (r.z1 + r.z2) / 2],
      devices: []
    }));

    if (rooms.length === 0) {
      rooms.push({
        id: 'room_default',
        name: houseCfg.name || 'Mein Zuhause',
        dims: 'Eigener Grundriss',
        labelPos: [0, 0.1, 0],
        devices: []
      });
    }

    (houseCfg.devices || []).forEach(d => {
      const targetRoom = rooms.find(r => r.id === d.roomId) || rooms[0];
      const hexColor = typeof d.color === 'string'
        ? parseInt(d.color.replace('#', ''), 16)
        : (d.color || 0xffd699);
      targetRoom.devices.push({
        id: d.id,
        name: d.name,
        icon: d.icon || '💡',
        type: d.type || 'light',
        pos: [d.x, d.y ?? 1.5, d.z],
        color: isNaN(hexColor) ? 0xffd699 : hexColor,
        intensity: d.intensity ?? 1.6,
        distance: d.distance ?? 4.5,
        on: d.on !== false
      });
    });

    return rooms;
  }

  // ==========================================================================
  // INTERAKTIVER EDITOR-ZUSTAND & LOGIK
  // ==========================================================================
  const editorState = {
    active: false,
    tool: 'select',       // select | wall | window | door | room | furniture | device | fpv_start | delete
    wallKind: 'outer',    // outer | inner | glass
    roomFloor: 'wood',    // wood | tile | hall | kitchen
    roomName: 'Neuer Raum',
    furnitureType: 'sofa',
    furnitureRotY: 0,
    pictureRotY: 0,
    pendingPictureDataUrl: null,
    fpvYawPreview: 0,
    deviceType: 'light',
    deviceName: 'Neues Licht',
    firstPoint: null,
    selectedItem: null,
    history: []
  };

  let previewGroup = null;
  let groundPlane = null;
  let selectionHelper = null;
  let hoverHelper = null;
  let hoveredRef = null;
  const dragState = {
    active: false,
    moved: false,
    ref: null,
    startPt: null,
    lastDx: 0,
    lastDz: 0,
    targetMeshes: [],
    origPositions: []
  };
  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2();

  function escHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function ensurePreviewGroup() {
    if (!previewGroup) {
      previewGroup = new THREE.Group();
      scene.add(previewGroup);
    }
    if (!groundPlane) {
      groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    }
  }

  function clearPreview() {
    if (!previewGroup) return;
    while (previewGroup.children.length > 0) {
      previewGroup.remove(previewGroup.children[0]);
    }
  }

  function clearHelpers() {
    if (selectionHelper && selectionHelper.parent) selectionHelper.parent.remove(selectionHelper);
    selectionHelper = null;
    if (hoverHelper && hoverHelper.parent) hoverHelper.parent.remove(hoverHelper);
    hoverHelper = null;
  }

  function findSceneObjectsByRef(ref) {
    if (!ref || typeof scene === 'undefined') return [];
    const list = [];
    const checkList = (arr) => {
      arr.forEach(obj => {
        if (obj.userData && obj.userData.editorRef && obj.userData.editorRef.kind === ref.kind && obj.userData.editorRef.id === ref.id) {
          list.push(obj);
        }
      });
    };
    const root = getEditorTargetRoot();
    checkList(root.children);
    if (root !== scene) checkList(scene.children);
    return list;
  }

  function buildBoxHelperForRef(ref, color) {
    const objs = findSceneObjectsByRef(ref);
    if (objs.length === 0) return null;
    const box = new THREE.Box3();
    objs.forEach(o => box.expandByObject(o));
    if (box.isEmpty()) return null;
    return new THREE.Box3Helper(box, color);
  }

  function updateSelectionHighlight() {
    if (selectionHelper && selectionHelper.parent) selectionHelper.parent.remove(selectionHelper);
    selectionHelper = null;
    if (!editorState.active || !editorState.selectedItem) return;
    selectionHelper = buildBoxHelperForRef(editorState.selectedItem, 0x38bdf8);
    if (selectionHelper) scene.add(selectionHelper);
  }

  function updateHoverHighlight(ref) {
    if (hoverHelper && hoverHelper.parent) hoverHelper.parent.remove(hoverHelper);
    hoverHelper = null;
    hoveredRef = ref || null;
    if (!editorState.active || !ref) return;
    if (editorState.selectedItem && editorState.selectedItem.kind === ref.kind && editorState.selectedItem.id === ref.id && editorState.tool !== 'delete') {
      return;
    }
    const color = editorState.tool === 'delete' ? 0xef4444 : 0x7dd3fc;
    hoverHelper = buildBoxHelperForRef(ref, color);
    if (hoverHelper) scene.add(hoverHelper);
  }

  const PICK_PRIORITY = { device: 6, picture: 5, fpv_start: 5, furniture: 4, wall: 3, room: 1 };

  function pickEditorItem(clientX, clientY) {
    if (typeof renderer === 'undefined' || typeof scene === 'undefined') return null;
    const rect = renderer.domElement.getBoundingClientRect();
    pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNDC, camera);

    const pickables = [];
    const collectPickables = (arr) => {
      arr.forEach(obj => {
        if (obj.userData && obj.userData.editorRef) pickables.push(obj);
      });
    };
    const root = getEditorTargetRoot();
    collectPickables(root.children);
    if (root !== scene) collectPickables(scene.children);
    if (pickables.length === 0) return null;

    const hits = raycaster.intersectObjects(pickables, true);
    if (hits.length === 0) return null;

    let bestRef = null;
    let bestScore = -Infinity;
    for (const h of hits) {
      let cur = h.object;
      while (cur && (!cur.userData || !cur.userData.editorRef)) cur = cur.parent;
      const ref = cur && cur.userData && cur.userData.editorRef;
      if (!ref) continue;
      const prio = PICK_PRIORITY[ref.kind] || 1;
      const score = prio * 1000 - h.distance;
      if (score > bestScore) {
        bestScore = score;
        bestRef = { kind: ref.kind, id: ref.id };
      }
    }
    return bestRef;
  }

  function getItemRecord(ref) {
    const cfg = window.currentHouseConfig;
    if (!cfg || !ref) return null;
    if (ref.kind === 'room') return (cfg.rooms || []).find(r => r.id === ref.id) || null;
    if (ref.kind === 'wall') return (cfg.walls || []).find(w => w.id === ref.id) || null;
    if (ref.kind === 'furniture') return (cfg.furniture || []).find(f => f.id === ref.id) || null;
    if (ref.kind === 'device') return (cfg.devices || []).find(d => d.id === ref.id) || null;
    if (ref.kind === 'picture') return (cfg.pictures || []).find(p => p.id === ref.id) || null;
    if (ref.kind === 'fpv_start') return cfg.fpvStart || null;
    return null;
  }

  function getItemLabel(ref) {
    const rec = getItemRecord(ref);
    if (!rec) return 'Objekt';
    if (ref.kind === 'room') return `Raum "${rec.name || 'Unbenannt'}"`;
    if (ref.kind === 'wall') {
      if (rec.kind === 'window') return 'Fenster';
      if (rec.kind === 'door') return `Tür "${rec.name || 'Tür'}"`;
      return rec.kind === 'glass' ? 'Glaswand' : (rec.kind === 'inner' ? 'Innenwand' : 'Außenwand');
    }
    if (ref.kind === 'furniture') {
      const spec = FURNITURE_CATALOG.find(f => f.type === rec.type);
      return spec ? spec.label : rec.type;
    }
    if (ref.kind === 'device') return `Gerät "${rec.name || rec.type}"`;
    if (ref.kind === 'picture') return `Wandbild "${rec.name || 'Bild'}"`;
    if (ref.kind === 'fpv_start') return 'Rundgang-Startpunkt';
    return 'Objekt';
  }

  function deleteItemByRef(ref) {
    const cfg = window.currentHouseConfig;
    if (!cfg || !ref) return false;
    const label = getItemLabel(ref);
    if (ref.kind === 'room') {
      if ((cfg.rooms || []).length <= 1) {
        if (typeof showToast === 'function') showToast('⚠️ Mindestens 1 Raum muss erhalten bleiben.');
        return false;
      }
      pushUndo();
      cfg.rooms = cfg.rooms.filter(r => r.id !== ref.id);
    } else if (ref.kind === 'wall') {
      pushUndo();
      cfg.walls = (cfg.walls || []).filter(w => w.id !== ref.id);
    } else if (ref.kind === 'furniture') {
      pushUndo();
      cfg.furniture = (cfg.furniture || []).filter(f => f.id !== ref.id);
    } else if (ref.kind === 'device') {
      pushUndo();
      cfg.devices = (cfg.devices || []).filter(d => d.id !== ref.id);
    } else if (ref.kind === 'picture') {
      pushUndo();
      cfg.pictures = (cfg.pictures || []).filter(p => p.id !== ref.id);
    } else if (ref.kind === 'fpv_start') {
      pushUndo();
      delete cfg.fpvStart;
    } else {
      return false;
    }
    if (editorState.selectedItem && editorState.selectedItem.kind === ref.kind && editorState.selectedItem.id === ref.id) {
      editorState.selectedItem = null;
    }
    hoveredRef = null;
    commitHouseChange(`🗑️ ${label} gelöscht`);
    return true;
  }

  function getFloorIntersection(clientX, clientY, noSnap = false) {
    ensurePreviewGroup();
    const rect = renderer.domElement.getBoundingClientRect();
    pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNDC, camera);
    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, hit)) {
      return noSnap ? { x: hit.x, z: hit.z } : { x: snap(hit.x), z: snap(hit.z) };
    }
    return null;
  }

  function snapPictureToWall(x, z, fallbackRotY = 0, maxDist = 0.65) {
    const walls = (window.currentHouseConfig && window.currentHouseConfig.walls) || [];
    let best = null;
    let bestDist = maxDist;
    for (const w of walls) {
      const dx = w.x2 - w.x1;
      const dz = w.z2 - w.z1;
      const len = Math.hypot(dx, dz);
      if (len < 0.05) continue;
      const t = Math.max(0, Math.min(1, ((x - w.x1) * dx + (z - w.z1) * dz) / (len * len)));
      const projX = w.x1 + t * dx;
      const projZ = w.z1 + t * dz;
      const dist = Math.hypot(x - projX, z - projZ);
      if (dist < bestDist) {
        bestDist = dist;
        const nx = -dz / len;
        const nz = dx / len;
        const side = ((x - projX) * nx + (z - projZ) * nz) >= 0 ? 1 : -1;
        const thick = w.thickness || (w.kind === 'outer' ? 0.12 : 0.10);
        const offset = thick / 2 + 0.016;
        best = {
          x: projX + side * nx * offset,
          z: projZ + side * nz * offset,
          rotY: Math.atan2(side * nx, side * nz),
          snapped: true
        };
      }
    }
    return best || { x, z, rotY: fallbackRotY, snapped: false };
  }

  function pushUndo() {
    if (!window.currentHouseConfig) return;
    editorState.history.push(clone(window.currentHouseConfig));
    if (editorState.history.length > 25) editorState.history.shift();
  }

  function commitHouseChange(msg) {
    if (typeof window.rebuildHouseScene === 'function') {
      window.rebuildHouseScene(window.currentHouseConfig);
    }
    if (typeof window.saveHouseConfig === 'function') {
      window.saveHouseConfig(window.currentHouseConfig);
    }
    updateSelectionHighlight();
    updateEditorHUD();
    renderInspector();
    if (msg && typeof showToast === 'function') showToast(msg);
  }

  function findRoomAt(x, z) {
    const rooms = (window.currentHouseConfig && window.currentHouseConfig.rooms) || [];
    for (const r of rooms) {
      const minX = Math.min(r.x1, r.x2);
      const maxX = Math.max(r.x1, r.x2);
      const minZ = Math.min(r.z1, r.z2);
      const maxZ = Math.max(r.z1, r.z2);
      if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) return r.id;
    }
    return rooms[0] ? rooms[0].id : 'room_default';
  }

  function updateGhostPreview(pt) {
    clearPreview();
    if (!editorState.active || !pt) return;

    const previewMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 });

    if ((editorState.tool === 'wall' || editorState.tool === 'window' || editorState.tool === 'door') && editorState.firstPoint) {
      const p1 = editorState.firstPoint;
      const dx = pt.x - p1.x;
      const dz = pt.z - p1.z;
      const len = Math.max(0.25, Math.sqrt(dx * dx + dz * dz));
      const angle = Math.atan2(dz, dx);
      const color = editorState.tool === 'window' ? 0x60a5fa : (editorState.tool === 'door' ? 0xfbbf24 : 0x38bdf8);
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(len, 1.5, 0.14),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 })
      );
      bar.position.set((p1.x + pt.x) / 2, 0.75, (p1.z + pt.z) / 2);
      bar.rotation.y = -angle;
      previewGroup.add(bar);
      updateEditorHUD(`Länge: ${len.toFixed(2)} m`);
    } else if (editorState.tool === 'room' && editorState.firstPoint) {
      const p1 = editorState.firstPoint;
      const w = Math.max(0.5, Math.abs(pt.x - p1.x));
      const d = Math.max(0.5, Math.abs(pt.z - p1.z));
      const box = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), previewMat);
      box.position.set((p1.x + pt.x) / 2, 0.04, (p1.z + pt.z) / 2);
      previewGroup.add(box);
      updateEditorHUD(`Fläche: ${w.toFixed(1)}m × ${d.toFixed(1)}m`);
    } else if (editorState.tool === 'furniture') {
      const ghost = createFurniturePrefab(editorState.furnitureType);
      ghost.position.set(pt.x, 0, pt.z);
      ghost.rotation.y = editorState.furnitureRotY;
      ghost.traverse(c => {
        if (c.isMesh) c.material = previewMat;
      });
      previewGroup.add(ghost);
    } else if (editorState.tool === 'device') {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), previewMat);
      sphere.position.set(pt.x, 1.2, pt.z);
      previewGroup.add(sphere);
    } else if (editorState.tool === 'fpv_start') {
      const ghost = createFpvStartMarker({ x: pt.x, z: pt.z, yaw: editorState.fpvYawPreview });
      previewGroup.add(ghost);
    } else if (editorState.tool === 'picture') {
      const snappedPic = snapPictureToWall(pt.x, pt.z, editorState.pictureRotY);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.65, 0.05), previewMat);
      frame.position.set(snappedPic.x, 1.15, snappedPic.z);
      frame.rotation.y = snappedPic.rotY;
      previewGroup.add(frame);
    } else if (editorState.tool === 'wall' || editorState.tool === 'window' || editorState.tool === 'door' || editorState.tool === 'room') {
      const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.4, 12), previewMat);
      marker.position.set(pt.x, 0.2, pt.z);
      previewGroup.add(marker);
    }
  }

  function handleEditorPointerDown(e) {
    if (!editorState.active) return false;
    if (e.button !== 0) return false;

    const pt = getFloorIntersection(e.clientX, e.clientY);
    if (!pt) return false;

    if (!window.currentHouseConfig || window.currentHouseConfig.mode !== 'custom') {
      return false;
    }

    const cfg = window.currentHouseConfig;

    if (editorState.tool === 'fpv_start') {
      pushUndo();
      cfg.fpvStart = { x: pt.x, z: pt.z, yaw: editorState.fpvYawPreview };
      commitHouseChange('🚶 Rundgang-Startpunkt gesetzt (R = Blickrichtung drehen)');
      return true;
    }

    if (editorState.tool === 'wall' || editorState.tool === 'window' || editorState.tool === 'door') {
      if (!editorState.firstPoint) {
        editorState.firstPoint = pt;
        updateGhostPreview(pt);
        return true;
      }
      const p1 = editorState.firstPoint;
      editorState.firstPoint = null;
      clearPreview();
      if (Math.hypot(pt.x - p1.x, pt.z - p1.z) < 0.2) return true;
      pushUndo();
      const kind = editorState.tool === 'wall' ? editorState.wallKind : editorState.tool;
      cfg.walls.push({
        id: uid(kind),
        x1: p1.x,
        z1: p1.z,
        x2: pt.x,
        z2: pt.z,
        kind,
        thickness: kind === 'outer' ? 0.12 : 0.10
      });
      commitHouseChange(kind === 'window' ? '🪟 Fenster hinzugefügt' : (kind === 'door' ? '🚪 Tür hinzugefügt' : '🧱 Wand gezeichnet'));
      return true;
    }

    if (editorState.tool === 'room') {
      if (!editorState.firstPoint) {
        editorState.firstPoint = pt;
        updateGhostPreview(pt);
        return true;
      }
      const p1 = editorState.firstPoint;
      editorState.firstPoint = null;
      clearPreview();
      if (Math.abs(pt.x - p1.x) < 0.4 || Math.abs(pt.z - p1.z) < 0.4) return true;
      pushUndo();
      const nameInput = document.getElementById('ed-room-name');
      const rName = (nameInput && nameInput.value.trim()) || `Raum ${cfg.rooms.length + 1}`;
      cfg.rooms.push({
        id: uid('room'),
        name: rName,
        x1: Math.min(p1.x, pt.x),
        z1: Math.min(p1.z, pt.z),
        x2: Math.max(p1.x, pt.x),
        z2: Math.max(p1.z, pt.z),
        floor: editorState.roomFloor
      });
      commitHouseChange(`⬜ Raum "${rName}" erstellt`);
      return true;
    }

    if (editorState.tool === 'furniture') {
      pushUndo();
      cfg.furniture.push({
        id: uid('furn'),
        type: editorState.furnitureType,
        x: pt.x,
        z: pt.z,
        rotY: editorState.furnitureRotY
      });
      commitHouseChange('🛋️ Möbel platziert');
      return true;
    }

    if (editorState.tool === 'device') {
      pushUndo();
      const spec = DEVICE_CATALOG.find(d => d.type === editorState.deviceType) || DEVICE_CATALOG[0];
      const nameEl = document.getElementById('ed-device-name');
      const devName = (nameEl && nameEl.value.trim()) || spec.label;
      cfg.devices.push({
        id: uid('dev'),
        roomId: findRoomAt(pt.x, pt.z),
        name: devName,
        icon: spec.icon,
        type: spec.type,
        x: pt.x,
        y: spec.defaultY,
        z: pt.z,
        color: spec.color,
        intensity: spec.intensity,
        distance: spec.distance,
        on: true
      });
      commitHouseChange(`💡 Gerät "${devName}" platziert`);
      return true;
    }

    if (editorState.tool === 'picture') {
      cfg.pictures = cfg.pictures || [];
      if (cfg.pictures.length >= MAX_PICTURES) {
        if (typeof showToast === 'function') showToast(`⚠️ Maximal ${MAX_PICTURES} Wandbilder pro Haus (Performance-Limit).`);
        return true;
      }
      const rawPt = getFloorIntersection(e.clientX, e.clientY, true) || pt;
      const snappedPic = snapPictureToWall(rawPt.x, rawPt.z, editorState.pictureRotY);
      pushUndo();
      cfg.pictures.push({
        id: uid('pic'),
        name: `Wandbild ${cfg.pictures.length + 1}`,
        x: snappedPic.x,
        y: 1.15,
        z: snappedPic.z,
        rotY: snappedPic.rotY,
        width: 0.95,
        height: 0.65,
        imageDataUrl: editorState.pendingPictureDataUrl || null
      });
      commitHouseChange(`🖼️ Wandbild (${cfg.pictures.length}/${MAX_PICTURES}) platziert`);
      return true;
    }

    if (editorState.tool === 'delete') {
      const hitRef = pickEditorItem(e.clientX, e.clientY);
      if (hitRef) {
        deleteItemByRef(hitRef);
      } else if (typeof showToast === 'function') {
        showToast('ℹ️ Zeige genau auf ein Objekt, bis es rot markiert wird, und klicke dann.');
      }
      return true;
    }

    if (editorState.tool === 'select') {
      const hitRef = pickEditorItem(e.clientX, e.clientY);
      if (hitRef) {
        editorState.selectedItem = hitRef;
        updateSelectionHighlight();
        renderInspector();
        updateEditorHUD(`${getItemLabel(hitRef)} ausgewählt – Ziehen zum Verschieben, R = Drehen, Entf = Löschen`);
        return true;
      }
      if (editorState.selectedItem) {
        editorState.selectedItem = null;
        updateSelectionHighlight();
        renderInspector();
        updateEditorHUD();
        return true;
      }
    }

    return false;
  }

  function updateSubpanels() {
    const map = {
      wall: 'ed-sub-wall',
      room: 'ed-sub-room',
      furniture: 'ed-sub-furniture',
      device: 'ed-sub-device',
      picture: 'ed-sub-picture'
    };
    Object.entries(map).forEach(([tool, id]) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', editorState.tool !== tool);
    });
  }

  function renderInspector() {
    const box = document.getElementById('ed-inspector');
    if (!box) return;
    const _t = typeof window.t === 'function' ? window.t : (k, f) => f;
    if (!editorState.active) {
      box.innerHTML = `<div class="editor-step-hint" style="margin-bottom:0;">${_t('ed.insp_inactive', 'Starte in <b>Schritt 1</b> den Haus-Editor, um Objekte im 3D-Haus anzuklicken, zu verschieben, zu drehen oder zu löschen.')}</div>`;
      return;
    }
    const ref = editorState.selectedItem;
    const rec = ref ? getItemRecord(ref) : null;
    if (!ref || !rec) {
      box.innerHTML = `<div class="editor-step-hint" style="margin-bottom:0;">${_t('ed.insp_empty', 'Klicke im 3D-Haus auf ein Objekt (Möbel, Gerät, Wandbild, Wand, Raum oder Startpunkt), um es direkt per <b>Drag &amp; Drop</b> zu verschieben, zu drehen, umzubenennen oder gezielt zu löschen.')}</div>`;
      return;
    }

    const label = escHtml(getItemLabel(ref));
    let fieldsHtml = '';
    const hasRotation = ref.kind === 'furniture' || ref.kind === 'picture' || ref.kind === 'fpv_start';
    const rotDeg = Math.round((((ref.kind === 'fpv_start' ? rec.yaw : rec.rotY) || 0) * 180 / Math.PI) % 360);

    if (ref.kind === 'room') {
      fieldsHtml += `
        <label style="font-size:0.7rem;color:var(--muted);">Raum-Name:</label>
        <input type="text" class="input-field" value="${escHtml(rec.name || '')}" onchange="HouseEditor.updateSelectedField('name', this.value)" style="margin:3px 0 6px;" />
        <label style="font-size:0.7rem;color:var(--muted);">Bodenbelag:</label>
        <select class="input-field" onchange="HouseEditor.updateSelectedField('floor', this.value)" style="margin:3px 0 6px;">
          <option value="wood" ${rec.floor === 'wood' ? 'selected' : ''}>Eiche</option>
          <option value="tile" ${rec.floor === 'tile' ? 'selected' : ''}>Badfliese</option>
          <option value="hall" ${rec.floor === 'hall' ? 'selected' : ''}>Flur</option>
          <option value="kitchen" ${rec.floor === 'kitchen' ? 'selected' : ''}>Küche</option>
        </select>`;
    } else if (ref.kind === 'wall') {
      fieldsHtml += `
        <label style="font-size:0.7rem;color:var(--muted);">Wand-Art:</label>
        <select class="input-field" onchange="HouseEditor.updateSelectedField('kind', this.value)" style="margin:3px 0 6px;">
          <option value="outer" ${rec.kind === 'outer' ? 'selected' : ''}>Außenwand</option>
          <option value="inner" ${rec.kind === 'inner' ? 'selected' : ''}>Innenwand</option>
          <option value="glass" ${rec.kind === 'glass' ? 'selected' : ''}>Glaswand</option>
          <option value="window" ${rec.kind === 'window' ? 'selected' : ''}>Fenster</option>
          <option value="door" ${rec.kind === 'door' ? 'selected' : ''}>Tür</option>
        </select>`;
    } else if (ref.kind === 'furniture') {
      fieldsHtml += `
        <label style="font-size:0.7rem;color:var(--muted);">Möbel-Typ:</label>
        <select class="input-field" onchange="HouseEditor.updateSelectedField('type', this.value)" style="margin:3px 0 6px;">
          ${FURNITURE_CATALOG.map(f => `<option value="${f.type}" ${rec.type === f.type ? 'selected' : ''}>${escHtml(f.label)}</option>`).join('')}
        </select>`;
    } else if (ref.kind === 'device') {
      fieldsHtml += `
        <label style="font-size:0.7rem;color:var(--muted);">Geräte-Name:</label>
        <input type="text" class="input-field" value="${escHtml(rec.name || '')}" onchange="HouseEditor.updateSelectedField('name', this.value)" style="margin:3px 0 6px;" />
        <label style="font-size:0.7rem;color:var(--muted);">Höhe Y (${Number(rec.y ?? 1.2).toFixed(2)} m):</label>
        <input type="range" min="0.1" max="2.5" step="0.05" value="${Number(rec.y ?? 1.2)}" onchange="HouseEditor.updateSelectedField('y', parseFloat(this.value))" style="width:100%;margin:3px 0 6px;" />`;
    } else if (ref.kind === 'picture') {
      fieldsHtml += `
        <label style="font-size:0.7rem;color:var(--muted);">Bild-Name:</label>
        <input type="text" class="input-field" value="${escHtml(rec.name || '')}" onchange="HouseEditor.updateSelectedField('name', this.value)" style="margin:3px 0 6px;" />
        <label style="font-size:0.7rem;color:var(--muted);">Höhe Y (${Number(rec.y ?? 1.15).toFixed(2)} m):</label>
        <input type="range" min="0.4" max="2.2" step="0.05" value="${Number(rec.y ?? 1.15)}" onchange="HouseEditor.updateSelectedField('y', parseFloat(this.value))" style="width:100%;margin:3px 0 6px;" />
        <div class="btn-row" style="margin-bottom:6px;">
          <button onclick="document.getElementById('ed-replace-picture-file').click()">🖼️ Bilddatei tauschen</button>
        </div>
        <input type="file" id="ed-replace-picture-file" accept="image/*" style="display:none" onchange="HouseEditor.replaceSelectedPictureFile(this)" />`;
    }

    const rotateHtml = hasRotation ? `
      <div style="margin-top:6px;">
        <div style="font-size:0.7rem;color:var(--muted);margin-bottom:4px;">Drehen (${rotDeg}°):</div>
        <div class="btn-row">
          <button onclick="HouseEditor.rotateSelectionOrGhost(-Math.PI/4)">↺ -45°</button>
          <button onclick="HouseEditor.rotateSelectionOrGhost(Math.PI/4)">↻ +45°</button>
          <button onclick="HouseEditor.rotateSelectionOrGhost(Math.PI/2)">↻ +90°</button>
        </div>
      </div>` : '';

    const nudgeHtml = `
      <div style="margin-top:6px;">
        <div style="font-size:0.7rem;color:var(--muted);">Verschieben (Drag &amp; Drop oder 0.25m):</div>
        <div class="editor-nudge-grid">
          <button onclick="HouseEditor.nudgeSelectedItem(-0.25, 0)" title="Links">⬅️</button>
          <button onclick="HouseEditor.nudgeSelectedItem(0, -0.25)" title="Hoch">⬆️</button>
          <button onclick="HouseEditor.nudgeSelectedItem(0, 0.25)" title="Runter">⬇️</button>
          <button onclick="HouseEditor.nudgeSelectedItem(0.25, 0)" title="Rechts">➡️</button>
        </div>
      </div>`;

    box.innerHTML = `
      <div class="editor-inspector-title">
        <span>✨ ${label}</span>
        <button onclick="HouseEditor.clearSelection()" style="padding:2px 6px;font-size:0.68rem;">✕</button>
      </div>
      ${fieldsHtml}
      ${rotateHtml}
      ${nudgeHtml}
      <div class="btn-row" style="margin-top:8px;">
        <button onclick="HouseEditor.deleteSelectedItem()" style="border-color:rgba(239,68,68,0.55);color:#fca5a5;">🗑️ Dieses Objekt löschen</button>
      </div>`;
  }

  function updateEditorHUD(extra = '') {
    const hud = document.getElementById('house-editor-hud');
    if (!hud) return;
    hud.classList.toggle('hidden', !editorState.active);
    const infoEl = document.getElementById('hud-editor-info');
    if (infoEl) {
      const _t = typeof window.t === 'function' ? window.t : (k, f) => f;
      const toolLabel = _t('hud.' + editorState.tool, editorState.tool);
      infoEl.textContent = extra ? `${toolLabel} • ${extra}` : toolLabel;
    }
    document.querySelectorAll('[data-ed-tool]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.edTool === editorState.tool);
    });
    updateSubpanels();
  }

  window.HouseEditor = {
    FURNITURE_CATALOG,
    DEVICE_CATALOG,
    createEmptyHouseTemplate,
    createStarterApartmentTemplate,
    buildCustomHouse,
    buildRoomsFromCustomHouse,
    state: editorState,

    renderHouseSelector() {
      const sel = document.getElementById('house-selector');
      if (!sel) return;
      const houses = window.savedHouses || [];
      const activeId = window.activeHouseId || 'demo';
      const defId = window.defaultHouseId || 'demo';
      const demoStar = defId === 'demo' ? '⭐ ' : '';
      sel.innerHTML = `<option value="demo">${demoStar}🏠 Demo-Wohnung (2-Zimmer)</option>` +
        houses.map(h => {
          const star = h.id === defId ? '⭐ ' : '';
          const suffix = h.id === defId ? ' (Standard)' : '';
          return `<option value="${h.id}">${star}🏡 ${h.name || 'Unbenanntes Haus'}${suffix}</option>`;
        }).join('');
      sel.value = activeId;
    },

    setAsDefaultHouse() {
      const targetId = window.activeHouseId || 'demo';
      window.defaultHouseId = targetId;
      try { localStorage.setItem('homey_3d_default_house', targetId); } catch (e) {}
      this.renderHouseSelector();
      if (typeof pushConfigToServer === 'function') pushConfigToServer(false);
      const label = (window.currentHouseConfig && window.currentHouseConfig.name) || 'Demo-Wohnung';
      if (typeof showToast === 'function') showToast(`⭐ "${label}" als Standard beim Start festgelegt!`);
    },

    selectHouse(houseId) {
      editorState.firstPoint = null;
      editorState.selectedItem = null;
      editorState.history = [];
      clearPreview();

      if (houseId === 'demo') {
        this.toggle(false);
        window.activeHouseId = 'demo';
        window.currentHouseConfig = null;
        if (typeof window.rebuildHouseScene === 'function') window.rebuildHouseScene(null);
        if (typeof window.saveHouseConfig === 'function') window.saveHouseConfig(null);
        if (typeof showToast === 'function') showToast('🏠 Demo-Wohnung geladen');
        return;
      }

      const found = (window.savedHouses || []).find(h => h.id === houseId);
      if (!found) return;
      window.activeHouseId = found.id;
      window.currentHouseConfig = found;
      if (typeof window.rebuildHouseScene === 'function') window.rebuildHouseScene(found);
      if (typeof window.saveHouseConfig === 'function') window.saveHouseConfig(found);
      if (typeof showToast === 'function') showToast(`🏡 "${found.name}" geladen`);
    },

    addHouse(preset = 'starter') {
      const nameInput = document.getElementById('new-house-name');
      const rawName = nameInput && nameInput.value.trim();
      const count = (window.savedHouses || []).length + 1;
      const name = rawName || (preset === 'empty' ? `Neues Haus ${count}` : `Wohnung ${count}`);
      if (nameInput) nameInput.value = '';

      const newHouse = preset === 'empty'
        ? createEmptyHouseTemplate(name)
        : createStarterApartmentTemplate(name);

      window.savedHouses = window.savedHouses || [];
      window.savedHouses.push(newHouse);
      window.activeHouseId = newHouse.id;
      window.currentHouseConfig = newHouse;
      editorState.history = [];
      commitHouseChange(`➕ "${name}" hinzugefügt!`);
      this.toggle(true);
    },

    renameActiveHouse() {
      if (!window.currentHouseConfig || window.activeHouseId === 'demo') {
        if (typeof showToast === 'function') showToast('ℹ️ Die Demo-Wohnung kann nicht umbenannt werden.');
        return;
      }
      const nextName = prompt('Neuer Name für dieses Haus:', window.currentHouseConfig.name || 'Mein Zuhause');
      if (!nextName || !nextName.trim()) return;
      window.currentHouseConfig.name = nextName.trim();
      commitHouseChange(`✏️ Umbenannt in "${window.currentHouseConfig.name}"`);
    },

    deleteActiveHouse() {
      if (!window.currentHouseConfig || window.activeHouseId === 'demo') {
        if (typeof showToast === 'function') showToast('ℹ️ Die Demo-Wohnung bleibt immer erhalten.');
        return;
      }
      const delName = window.currentHouseConfig.name || 'Haus';
      window.savedHouses = (window.savedHouses || []).filter(h => h.id !== window.activeHouseId);
      this.selectHouse('demo');
      if (typeof showToast === 'function') showToast(`🗑️ "${delName}" gelöscht`);
    },

    setFpvStartFromCurrentCamera() {
      if (typeof camera === 'undefined') return;
      const sp = {
        x: Number(camera.position.x.toFixed(2)),
        z: Number(camera.position.z.toFixed(2)),
        yaw: typeof fpvYaw === 'number' ? Number(fpvYaw.toFixed(3)) : 0
      };
      if (window.currentHouseConfig && window.activeHouseId !== 'demo') {
        pushUndo();
        window.currentHouseConfig.fpvStart = sp;
        commitHouseChange(`📍 Rundgang-Startpunkt für "${window.currentHouseConfig.name}" gespeichert!`);
      } else {
        window.demoFpvStart = sp;
        try { localStorage.setItem('homey_3d_demo_fpv_start', JSON.stringify(sp)); } catch (e) {}
        if (typeof pushConfigToServer === 'function') pushConfigToServer(false);
        if (typeof showToast === 'function') showToast('📍 Rundgang-Startpunkt für Demo-Wohnung gespeichert!');
      }
    },

    toggle(forceState) {
      const next = typeof forceState === 'boolean' ? forceState : !editorState.active;
      editorState.active = next;
      editorState.firstPoint = null;
      editorState.selectedItem = null;
      clearPreview();
      clearHelpers();

      if (next) {
        if (!window.currentHouseConfig || window.currentHouseConfig.mode !== 'custom') {
          this.addHouse('starter');
          return;
        }
        if (typeof window.rebuildHouseScene === 'function') {
          window.rebuildHouseScene(window.currentHouseConfig);
        }
        if (typeof setCameraPreset === 'function') setCameraPreset('top');
      } else if (window.currentHouseConfig && window.currentHouseConfig.mode === 'custom') {
        if (typeof window.rebuildHouseScene === 'function') {
          window.rebuildHouseScene(window.currentHouseConfig);
        }
      }
      updateEditorHUD();
      renderInspector();
      const toggleBtn = document.getElementById('btn-toggle-house-editor');
      if (toggleBtn) {
        const _t = typeof window.t === 'function' ? window.t : (k, f) => f;
        toggleBtn.textContent = next ? _t('ed.stop', '✅ Haus-Editor beenden') : _t('ed.start', '✏️ Haus-Editor starten');
        toggleBtn.classList.toggle('success', next);
      }
    },

    refreshUI() {
      updateEditorHUD();
      renderInspector();
      this.renderHouseSelector();
    },

    setTool(tool) {
      editorState.tool = tool;
      editorState.firstPoint = null;
      if (tool !== 'select') editorState.selectedItem = null;
      clearPreview();
      clearHelpers();
      updateSelectionHighlight();
      updateEditorHUD();
      renderInspector();
    },

    clearSelection() {
      editorState.selectedItem = null;
      updateSelectionHighlight();
      updateEditorHUD();
      renderInspector();
    },

    deleteSelectedItem() {
      if (editorState.selectedItem) {
        deleteItemByRef(editorState.selectedItem);
      }
    },

    updateSelectedField(field, value) {
      const ref = editorState.selectedItem;
      const rec = getItemRecord(ref);
      if (!ref || !rec) return;
      pushUndo();
      rec[field] = value;
      commitHouseChange('✏️ Eigenschaft aktualisiert');
    },

    nudgeSelectedItem(dx, dz) {
      const ref = editorState.selectedItem;
      const rec = getItemRecord(ref);
      if (!ref || !rec) return;
      const scale = ref.kind === 'picture' ? 0.2 : 1; // 0.05m Feinschritt für Wandbilder
      const sdx = dx * scale;
      const sdz = dz * scale;
      pushUndo();
      if (ref.kind === 'wall' || ref.kind === 'room') {
        rec.x1 += sdx; rec.x2 += sdx;
        rec.z1 += sdz; rec.z2 += sdz;
      } else {
        rec.x = (rec.x || 0) + sdx;
        rec.z = (rec.z || 0) + sdz;
        if (ref.kind === 'device') rec.roomId = findRoomAt(rec.x, rec.z);
      }
      commitHouseChange();
    },

    replaceSelectedPictureFile(inputEl) {
      const ref = editorState.selectedItem;
      const rec = getItemRecord(ref);
      if (!ref || ref.kind !== 'picture' || !rec) return;
      const file = inputEl.files && inputEl.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 768;
          let w = img.width, h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w >= h) { h = Math.round(h * (maxDim / w)); w = maxDim; }
            else { w = Math.round(w * (maxDim / h)); h = maxDim; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          pushUndo();
          rec.imageDataUrl = canvas.toDataURL('image/jpeg', 0.78);
          commitHouseChange('🖼️ Wandbild aktualisiert');
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
      inputEl.value = '';
    },

    setWallKind(kind) { editorState.wallKind = kind; },
    setRoomFloor(floor) { editorState.roomFloor = floor; },
    setFurnitureType(type) { editorState.furnitureType = type; },
    setDeviceType(type) { editorState.deviceType = type; },

    setPendingPictureFile(inputEl) {
      const file = inputEl.files && inputEl.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 768;
          let w = img.width, h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w >= h) { h = Math.round(h * (maxDim / w)); w = maxDim; }
            else { w = Math.round(w * (maxDim / h)); h = maxDim; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          editorState.pendingPictureDataUrl = canvas.toDataURL('image/jpeg', 0.78);
          const prevEl = document.getElementById('ed-picture-preview');
          if (prevEl) {
            prevEl.innerHTML = `<div style="display:flex;align-items:center;gap:8px;"><img src="${editorState.pendingPictureDataUrl}" style="width:48px;height:36px;object-fit:cover;border-radius:4px;border:1px solid rgba(56,189,248,0.5);" /><span>✅ Bereit! Klicke ins 3D-Haus zum Platzieren.</span></div>`;
          }
          this.setTool('picture');
          if (typeof showToast === 'function') showToast('🖼️ Bild geladen – klicke im Grundriss zum Platzieren!');
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
      inputEl.value = '';
    },

    rotateSelectionOrGhost(delta = Math.PI / 4) {
      if (editorState.selectedItem) {
        const ref = editorState.selectedItem;
        const rec = getItemRecord(ref);
        if (rec) {
          if (ref.kind === 'furniture' || ref.kind === 'picture') {
            pushUndo();
            rec.rotY = (rec.rotY || 0) + delta;
            commitHouseChange('🔄 Objekt gedreht');
            return;
          }
          if (ref.kind === 'fpv_start') {
            pushUndo();
            rec.yaw = (rec.yaw || 0) + delta;
            commitHouseChange('🔄 Start-Blickrichtung gedreht');
            return;
          }
        }
      }
      if (editorState.tool === 'picture') {
        editorState.pictureRotY += delta;
        if (typeof showToast === 'function') showToast('🔄 Wandbild-Vorschau gedreht');
        return;
      }
      if (editorState.tool === 'fpv_start') {
        editorState.fpvYawPreview += delta;
        if (window.currentHouseConfig && window.currentHouseConfig.fpvStart) {
          pushUndo();
          window.currentHouseConfig.fpvStart.yaw = (window.currentHouseConfig.fpvStart.yaw || 0) + delta;
          commitHouseChange('🔄 Start-Blickrichtung gedreht');
        }
        return;
      }
      editorState.furnitureRotY += delta;
      if (typeof showToast === 'function') showToast('🔄 Vorschau gedreht');
    },

    undo() {
      if (editorState.history.length === 0) {
        if (typeof showToast === 'function') showToast('Nichts zum Rückgängig machen');
        return;
      }
      window.currentHouseConfig = editorState.history.pop();
      commitHouseChange('↩️ Schritt rückgängig gemacht');
    },

    exportHouse() {
      const data = window.currentHouseConfig || createStarterApartmentTemplate();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'homey-3d-house.json';
      a.click();
    },

    importHouse(inputEl) {
      const file = inputEl.files && inputEl.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          if (!parsed || !Array.isArray(parsed.rooms) || !Array.isArray(parsed.walls)) {
            throw new Error('Ungültiges Haus-Format');
          }
          parsed.mode = 'custom';
          parsed.id = uid('house');
          parsed.name = parsed.name || `Importiertes Haus ${(window.savedHouses || []).length + 1}`;
          window.savedHouses = window.savedHouses || [];
          window.savedHouses.push(parsed);
          window.activeHouseId = parsed.id;
          window.currentHouseConfig = parsed;
          commitHouseChange(`📥 "${parsed.name}" als neues Haus importiert!`);
        } catch (err) {
          if (typeof showToast === 'function') showToast('❌ Fehler beim Import: ' + err.message);
        }
      };
      reader.readAsText(file);
      inputEl.value = '';
    },

    onPointerDragStart(e) {
      if (!editorState.active || editorState.tool !== 'select' || e.button !== 0) return false;
      const hitRef = pickEditorItem(e.clientX, e.clientY);
      if (!hitRef) return false;
      const freeMove = hitRef.kind === 'picture';
      const pt = getFloorIntersection(e.clientX, e.clientY, freeMove);
      if (!pt) return false;

      editorState.selectedItem = hitRef;
      updateSelectionHighlight();
      renderInspector();
      const targetMeshes = findSceneObjectsByRef(hitRef);
      dragState.active = true;
      dragState.moved = false;
      dragState.ref = hitRef;
      dragState.startPt = pt;
      dragState.lastDx = 0;
      dragState.lastDz = 0;
      dragState.lastRotY = null;
      dragState.targetMeshes = targetMeshes;
      dragState.origPositions = targetMeshes.map(m => ({ x: m.position.x, z: m.position.z, rotY: m.rotation.y }));
      updateEditorHUD(`${getItemLabel(hitRef)} – Ziehen zum Verschieben`);
      return true;
    },

    onPointerDragEnd() {
      if (!dragState.active) return;
      const { ref, lastDx, lastDz, lastRotY, moved } = dragState;
      dragState.active = false;
      dragState.targetMeshes = [];
      dragState.origPositions = [];
      if (moved && (lastDx !== 0 || lastDz !== 0 || lastRotY !== null)) {
        const rec = getItemRecord(ref);
        if (rec) {
          pushUndo();
          if (ref.kind === 'wall' || ref.kind === 'room') {
            rec.x1 += lastDx; rec.x2 += lastDx;
            rec.z1 += lastDz; rec.z2 += lastDz;
          } else {
            rec.x = (rec.x || 0) + lastDx;
            rec.z = (rec.z || 0) + lastDz;
            if (ref.kind === 'picture' && lastRotY !== null) rec.rotY = lastRotY;
            if (ref.kind === 'device') rec.roomId = findRoomAt(rec.x, rec.z);
          }
          commitHouseChange(`📍 ${getItemLabel(ref)} verschoben`);
        }
      }
    },

    onPointerMove(e) {
      if (!editorState.active) return;
      const freeMove = (dragState.active && dragState.ref && dragState.ref.kind === 'picture') || editorState.tool === 'picture';
      const pt = getFloorIntersection(e.clientX, e.clientY, freeMove);
      if (dragState.active && pt) {
        const dx = pt.x - dragState.startPt.x;
        const dz = pt.z - dragState.startPt.z;
        if (dx !== 0 || dz !== 0) dragState.moved = true;
        if (dragState.ref && dragState.ref.kind === 'picture' && dragState.origPositions[0]) {
          const orig = dragState.origPositions[0];
          const snappedPic = snapPictureToWall(orig.x + dx, orig.z + dz, orig.rotY);
          dragState.lastDx = snappedPic.x - orig.x;
          dragState.lastDz = snappedPic.z - orig.z;
          dragState.lastRotY = snappedPic.rotY;
          dragState.targetMeshes.forEach(m => {
            m.position.x = snappedPic.x;
            m.position.z = snappedPic.z;
            m.rotation.y = snappedPic.rotY;
          });
        } else {
          dragState.lastDx = dx;
          dragState.lastDz = dz;
          dragState.targetMeshes.forEach((m, idx) => {
            const orig = dragState.origPositions[idx];
            m.position.x = orig.x + dx;
            m.position.z = orig.z + dz;
          });
        }
        updateSelectionHighlight();
        return;
      }
      if (editorState.tool === 'select' || editorState.tool === 'delete') {
        const hitRef = pickEditorItem(e.clientX, e.clientY);
        updateHoverHighlight(hitRef);
        if (hitRef) {
          const prefix = editorState.tool === 'delete' ? '🗑️ Klicken zum Löschen' : '👆 Klicken/Ziehen';
          updateEditorHUD(`${prefix}: ${getItemLabel(hitRef)}`);
        } else {
          updateEditorHUD();
        }
        return;
      }
      if (pt) updateGhostPreview(pt);
    },

    onPointerDown(e) {
      return handleEditorPointerDown(e);
    }
  };

  window.addEventListener('keydown', e => {
    if (!editorState.active) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;
    if (e.key === 'r' || e.key === 'R') {
      window.HouseEditor.rotateSelectionOrGhost();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (editorState.selectedItem) {
        e.preventDefault();
        window.HouseEditor.deleteSelectedItem();
      }
    } else if (e.key === 'Escape') {
      editorState.firstPoint = null;
      editorState.selectedItem = null;
      clearPreview();
      clearHelpers();
      updateEditorHUD();
      renderInspector();
    }
  });

  // Sofortiges einmaliges Bauen des Standard-Hauses (0ms ohne Demo-Flackern)
  if (typeof window.rebuildHouseScene === 'function' && !window._initialHouseBuilt) {
    if (window.activeHouseId && window.activeHouseId !== 'demo' && Array.isArray(window.savedHouses)) {
      const targetHouse = window.savedHouses.find(h => h.id === window.activeHouseId);
      if (targetHouse) {
        window.rebuildHouseScene(targetHouse);
      } else {
        window.rebuildHouseScene(null);
      }
    } else {
      window.rebuildHouseScene(null);
    }
  }
})();

// ============================================================================
// HOMEY 3D — INTERNATIONALISIERUNG (DE / EN, Browser-Default + Auswahl)
// ============================================================================
(function () {
  const LANG_STORAGE_KEY = 'homey_3d_lang';

  const TRANSLATIONS = {
    de: {
      // Top Overlay
      'top.iso': '3D-Ansicht',
      'top.iso_title': '3D Schrägansicht',
      'top.top': 'Draufsicht',
      'top.top_title': 'Draufsicht von oben',
      'top.fpv': 'Rundgang',
      'top.fpv_title': 'First-Person-Rundgang durch die Wohnung (Taste V)',
      'top.fpv_exit': 'Beenden',
      'top.labels_on': 'Icons: AN',
      'top.labels_off': 'Icons: AUS',
      'top.labels_title': 'Raum- & Geräte-Icons ein-/ausblenden',
      'top.theme_title': 'Hintergrund-Design wechseln (Bloom / Mica / OLED / Grid / Transparent)',
      'top.settings': 'Einstellungen',
      'top.settings_title': 'Einstellungen ein-/ausblenden',
      'top.reload_title': 'Ansicht neu laden',

      // Sidebar Header & Tabs
      'sidebar.subtitle': 'Steuere dein Smart Home live im 3D-Grundriss & passe dein Zuhause flexibel an.',
      'sidebar.close_title': 'Einstellungen schließen',
      'tab.conn': 'Verbindung',
      'tab.devices': 'Geräte',
      'tab.display': 'Optik',
      'tab.house': 'Haus',

      // Tab 1: Verbindung & Sprache
      'conn.title': '🔗 Live-Verbindung zu Homey Pro',
      'conn.offline': 'Simulation (Offline)',
      'conn.online': 'Verbunden',
      'conn.ip_placeholder': 'Homey Pro IP-Adresse (z.B. 192.168.178.50)',
      'conn.token_placeholder': 'Homey API-Key (aus my.homey.app -> Einstellungen -> API Keys)',
      'conn.connect_btn': '🔌 Verbinden & in config.json speichern',
      'conn.hint': '💡 <strong>So bekommst du den Key:</strong> Öffne <code>my.homey.app</code> → Zahnrad unten links → <em>API-Keys</em> → <em>Neuer API-Key</em>. Änderungen werden automatisch in <code>config.json</code> gesichert.',
      'conn.widget_title': '📱 Homey Dashboard Widget',
      'conn.widget_hint': 'In der Homey App: <strong>Dashboards → Stift → Widget (+) → Web</strong>:',
      'conn.config_title': '💾 Konfiguration (config.json)',
      'conn.export': '📤 Export JSON',
      'conn.import': '📥 Import JSON',
      'lang.title': '🌐 Sprache / Language',
      'lang.auto': '🌐 Automatisch (Browser)',
      'lang.de': '🇩🇪 Deutsch',
      'lang.en': '🇬🇧 English',

      // Tab 2: Geräte
      'dev.title': '🔌 Räume & Geräte-Verknüpfung',
      'dev.hint': 'Klicke auf ein Gerät zum Schalten oder weise ihm im Dropdown dein echtes Homey-Gerät zu.',

      // Tab 3: Optik
      'disp.title': '🖼️ Hintergrund & Wallpaper-Stil',
      'disp.transparent': 'Transparenter Hintergrund',
      'disp.transparent_desc': 'Lässt dein eigenes Desktop-/Lively-Wallpaper durchscheinen',
      'disp.lights_title': '💡 Beleuchtung & Wände',
      'disp.all_off': '🌑 Alle AUS',
      'disp.all_on': '💡 Alle AN',
      'disp.ambient': 'Grundhelligkeit:',
      'disp.wall_height': 'Wandhöhe:',
      'disp.pic1_demo': '🖼️ Wandbild 1 (Demo)',
      'disp.pic2_demo': '🖼️ Wandbild 2 (Demo)',
      'disp.kiosk_default': '🖥️ Wallpaper-Dock: Standard (Taste H)',

      // Tab 4: Haus-Editor (4 Schritte)
      'ed.step1_title': 'Haus wählen & Editor starten',
      'ed.step1_hint': 'Wähle eine bestehende Wohnung oder lege eine neue an. Starte dann den Editor.',
      'ed.btn_default': '⭐ Standard',
      'ed.btn_rename': '✏️ Name',
      'ed.btn_delete_house': '🗑️ Löschen',
      'ed.start': '✏️ Haus-Editor starten',
      'ed.stop': '✅ Haus-Editor beenden',
      'ed.create_label': 'Neues Haus anlegen:',
      'ed.new_name_ph': 'Name (z.B. Erdgeschoss)',
      'ed.new_starter': '➕ 2-Zimmer-Vorlage',
      'ed.new_empty': '➕ Leeres Haus',
      'ed.step2_title': 'Grundriss bauen (Räume & Wände)',
      'ed.step2_hint': 'Wähle ein Werkzeug und klicke 2× im Grundriss (Startpunkt → Endpunkt).',
      'ed.tool_room': '⬜ Raum',
      'ed.tool_wall': '🧱 Wand',
      'ed.tool_window': '🪟 Fenster',
      'ed.tool_door': '🚪 Tür',
      'ed.wall_type': 'Wand-Typ:',
      'ed.wall_outer': 'Außenwand (dick)',
      'ed.wall_inner': 'Innenwand',
      'ed.wall_glass': 'Glaswand',
      'ed.room_name_floor': 'Raum-Name & Boden:',
      'ed.floor_wood': 'Eiche',
      'ed.floor_tile': 'Badfliese',
      'ed.floor_hall': 'Flur',
      'ed.floor_kitchen': 'Küche',
      'ed.step3_title': 'Einrichten & Geräte platzieren',
      'ed.step3_hint': 'Klicke ins 3D-Haus zum Platzieren. Mit <b>R</b> drehst du die Vorschau.',
      'ed.tool_furniture': '🛋️ Möbel',
      'ed.tool_device': '💡 Gerät',
      'ed.tool_picture': '🖼️ Bild (max. 5)',
      'ed.tool_fpv_start': '🚶 Startpunkt',
      'ed.furn_label': 'Möbelstück & Drehung:',
      'ed.dev_label': 'Gerät (Typ & Name):',
      'ed.pic_label': 'Wandbild (max. 5 pro Haus):',
      'ed.pic_choose': '🖼️ Bilddatei wählen',
      'ed.pic_rotate': '↻ 45° drehen',
      'ed.pic_none': 'Noch kein Bild gewählt (es wird ein grauer Rahmen platziert).',
      'ed.step4_title': 'Bearbeiten, Verschieben & Löschen',
      'ed.tool_select': '👆 Auswählen',
      'ed.tool_delete': '🗑️ Gezielt löschen',
      'ed.insp_inactive': 'Starte in <b>Schritt 1</b> den Haus-Editor, um Objekte im 3D-Haus anzuklicken, zu verschieben, zu drehen oder zu löschen.',
      'ed.insp_empty': 'Klicke im 3D-Haus auf ein Objekt (Möbel, Gerät, Wandbild, Wand, Raum oder Startpunkt), um es direkt per <b>Drag &amp; Drop</b> zu verschieben, zu drehen, umzubenennen oder gezielt zu löschen.',
      'ed.file_title': '📦 Haus-Datei Export / Import',
      'ed.export_house': '📤 Haus exportieren',
      'ed.import_house': '📥 Haus importieren',

      // HUD & FPV
      'hud.select': 'Auswählen & Ziehen',
      'hud.wall': 'Wand zeichnen (2 Klicks)',
      'hud.window': 'Fenster zeichnen (2 Klicks)',
      'hud.door': 'Tür zeichnen (2 Klicks)',
      'hud.room': 'Raum aufziehen (2 Klicks)',
      'hud.furniture': 'Möbel platzieren (R = Drehen)',
      'hud.device': 'Gerät platzieren',
      'hud.picture': 'Wandbild platzieren (max. 5, R = Drehen)',
      'hud.fpv_start': 'Rundgang-Startpunkt setzen (R = Richtung)',
      'hud.delete': 'Objekt anvisieren & löschen',
      'hud.undo': '↩️ Undo',
      'hud.done': '✅ Fertig',
      'fpv.hint': '🚶 <strong>Rundgang:</strong> WASD / Joystick · Ziehen = Umschauen · <code>V</code> = Ende',
      'fpv.set_start': '📍 Startpunkt hier setzen',

      // Control Card
      'ctrl.power_off': 'GERÄT AUSSCHALTEN',
      'ctrl.power_on': 'GERÄT EINSCHALTEN',
      'ctrl.brightness': '🔅 Helligkeit (Dimmen)',
      'ctrl.color': '🎨 LED-Farbe',
      'ctrl.custom_color': 'Eigene Wunschfarbe:'
    },
    en: {
      // Top Overlay
      'top.iso': '3D View',
      'top.iso_title': '3D Isometric View',
      'top.top': 'Top View',
      'top.top_title': 'Top-down Floorplan View',
      'top.fpv': 'Walkthrough',
      'top.fpv_title': 'First-person walkthrough (Key V)',
      'top.fpv_exit': 'Exit',
      'top.labels_on': 'Icons: ON',
      'top.labels_off': 'Icons: OFF',
      'top.labels_title': 'Toggle room & device icons',
      'top.theme_title': 'Switch background style (Bloom / Mica / OLED / Grid / Transparent)',
      'top.settings': 'Settings',
      'top.settings_title': 'Toggle settings sidebar',
      'top.reload_title': 'Reload view',

      // Sidebar Header & Tabs
      'sidebar.subtitle': 'Control your smart home live in 3D and customize your floorplan.',
      'sidebar.close_title': 'Close settings',
      'tab.conn': 'Connect',
      'tab.devices': 'Devices',
      'tab.display': 'Look',
      'tab.house': 'House',

      // Tab 1: Connect & Language
      'conn.title': '🔗 Live Homey Pro Connection',
      'conn.offline': 'Simulation (Offline)',
      'conn.online': 'Connected',
      'conn.ip_placeholder': 'Homey Pro IP address (e.g. 192.168.178.50)',
      'conn.token_placeholder': 'Homey API Key (my.homey.app -> Settings -> API Keys)',
      'conn.connect_btn': '🔌 Connect & save to config.json',
      'conn.hint': '💡 <strong>How to get your key:</strong> Open <code>my.homey.app</code> → Gear icon bottom-left → <em>API Keys</em> → <em>New API Key</em>. Changes are saved automatically to <code>config.json</code>.',
      'conn.widget_title': '📱 Homey Dashboard Widget',
      'conn.widget_hint': 'In the Homey App: <strong>Dashboards → Pencil → Widget (+) → Web</strong>:',
      'conn.config_title': '💾 Configuration (config.json)',
      'conn.export': '📤 Export JSON',
      'conn.import': '📥 Import JSON',
      'lang.title': '🌐 Language / Sprache',
      'lang.auto': '🌐 Automatic (Browser)',
      'lang.de': '🇩🇪 Deutsch',
      'lang.en': '🇬🇧 English',

      // Tab 2: Devices
      'dev.title': '🔌 Rooms & Device Mapping',
      'dev.hint': 'Click a device to toggle it or link it to your real Homey device via the dropdown.',

      // Tab 3: Look
      'disp.title': '🖼️ Background & Wallpaper Style',
      'disp.transparent': 'Transparent Background',
      'disp.transparent_desc': 'Lets your desktop or Lively wallpaper shine through',
      'disp.lights_title': '💡 Lighting & Walls',
      'disp.all_off': '🌑 All OFF',
      'disp.all_on': '💡 All ON',
      'disp.ambient': 'Ambient Light:',
      'disp.wall_height': 'Wall Height:',
      'disp.pic1_demo': '🖼️ Wall Picture 1 (Demo)',
      'disp.pic2_demo': '🖼️ Wall Picture 2 (Demo)',
      'disp.kiosk_default': '🖥️ Wallpaper Dock: Default (Key H)',

      // Tab 4: House Editor (4 Steps)
      'ed.step1_title': 'Select House & Start Editor',
      'ed.step1_hint': 'Choose an existing home or create a new one, then start the editor.',
      'ed.btn_default': '⭐ Default',
      'ed.btn_rename': '✏️ Name',
      'ed.btn_delete_house': '🗑️ Delete',
      'ed.start': '✏️ Start House Editor',
      'ed.stop': '✅ Finish Editing',
      'ed.create_label': 'Create new house:',
      'ed.new_name_ph': 'Name (e.g. Ground Floor)',
      'ed.new_starter': '➕ 2-Room Template',
      'ed.new_empty': '➕ Empty House',
      'ed.step2_title': 'Build Floorplan (Rooms & Walls)',
      'ed.step2_hint': 'Pick a tool and click twice in 3D (start → end point).',
      'ed.tool_room': '⬜ Room',
      'ed.tool_wall': '🧱 Wall',
      'ed.tool_window': '🪟 Window',
      'ed.tool_door': '🚪 Door',
      'ed.wall_type': 'Wall type:',
      'ed.wall_outer': 'Outer wall (thick)',
      'ed.wall_inner': 'Inner wall',
      'ed.wall_glass': 'Glass wall',
      'ed.room_name_floor': 'Room name & floor:',
      'ed.floor_wood': 'Oak',
      'ed.floor_tile': 'Bathroom tile',
      'ed.floor_hall': 'Hallway',
      'ed.floor_kitchen': 'Kitchen',
      'ed.step3_title': 'Furnish & Place Devices',
      'ed.step3_hint': 'Click in the 3D house to place. Press <b>R</b> to rotate preview.',
      'ed.tool_furniture': '🛋️ Furniture',
      'ed.tool_device': '💡 Device',
      'ed.tool_picture': '🖼️ Picture (max 5)',
      'ed.tool_fpv_start': '🚶 Start Point',
      'ed.furn_label': 'Furniture & rotation:',
      'ed.dev_label': 'Device (type & name):',
      'ed.pic_label': 'Wall picture (max 5 per house):',
      'ed.pic_choose': '🖼️ Choose image file',
      'ed.pic_rotate': '↻ Rotate 45°',
      'ed.pic_none': 'No image chosen yet (places a gray frame).',
      'ed.step4_title': 'Edit, Move & Delete',
      'ed.tool_select': '👆 Select',
      'ed.tool_delete': '🗑️ Delete Target',
      'ed.insp_inactive': 'Start the House Editor in <b>Step 1</b> to click, move, rotate, or delete objects in 3D.',
      'ed.insp_empty': 'Click any object in the 3D house (furniture, device, picture, wall, room, or start point) to move it via <b>Drag &amp; Drop</b>, rotate, rename, or delete it.',
      'ed.file_title': '📦 House File Export / Import',
      'ed.export_house': '📤 Export House',
      'ed.import_house': '📥 Import House',

      // HUD & FPV
      'hud.select': 'Select & Drag',
      'hud.wall': 'Draw wall (2 clicks)',
      'hud.window': 'Draw window (2 clicks)',
      'hud.door': 'Draw door (2 clicks)',
      'hud.room': 'Draw room (2 clicks)',
      'hud.furniture': 'Place furniture (R = Rotate)',
      'hud.device': 'Place device',
      'hud.picture': 'Place picture (max 5, R = Rotate)',
      'hud.fpv_start': 'Set walkthrough start (R = Direction)',
      'hud.delete': 'Aim at object & click to delete',
      'hud.undo': '↩️ Undo',
      'hud.done': '✅ Done',
      'fpv.hint': '🚶 <strong>Walkthrough:</strong> WASD / Joystick · Drag = Look around · <code>V</code> = Exit',
      'fpv.set_start': '📍 Set start point here',

      // Control Card
      'ctrl.power_off': 'TURN OFF',
      'ctrl.power_on': 'TURN ON',
      'ctrl.brightness': '🔅 Brightness (Dim)',
      'ctrl.color': '🎨 LED Color',
      'ctrl.custom_color': 'Custom color:'
    }
  };

  function detectBrowserLang() {
    const navLang = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    return String(navLang).toLowerCase().startsWith('de') ? 'de' : 'en';
  }

  function getConfiguredPref() {
    const bootLang = window.__INITIAL_CONFIG__ && window.__INITIAL_CONFIG__.settings && window.__INITIAL_CONFIG__.settings.lang;
    try {
      return localStorage.getItem(LANG_STORAGE_KEY) || bootLang || 'auto';
    } catch (e) {
      return bootLang || 'auto';
    }
  }

  function resolveLang(pref) {
    if (pref === 'de' || pref === 'en') return pref;
    return detectBrowserLang();
  }

  let currentPref = getConfiguredPref();
  let currentLang = resolveLang(currentPref);
  document.documentElement.lang = currentLang;

  window.getLanguagePref = () => currentPref;
  window.getCurrentLanguage = () => currentLang;

  window.t = function (key, fallback) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (key in dict) return dict[key];
    if (key in TRANSLATIONS.de) return TRANSLATIONS.de[key];
    return fallback !== undefined ? fallback : key;
  };

  window.applyTranslations = function () {
    document.documentElement.lang = currentLang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = window.t(el.dataset.i18n, el.textContent);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      el.innerHTML = window.t(el.dataset.i18nHtml, el.innerHTML);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = window.t(el.dataset.i18nPlaceholder, el.placeholder);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = window.t(el.dataset.i18nTitle, el.title);
    });

    const sel = document.getElementById('lang-select');
    if (sel) sel.value = currentPref;

    const edBtn = document.getElementById('btn-toggle-house-editor');
    if (edBtn && window.HouseEditor) {
      edBtn.textContent = window.HouseEditor.state.active ? window.t('ed.stop') : window.t('ed.start');
    }
    if (window.HouseEditor && typeof window.HouseEditor.refreshUI === 'function') {
      window.HouseEditor.refreshUI();
    }
    if (typeof requestSidebarRender === 'function') {
      requestSidebarRender(true);
    }
  };

  window.setLanguage = function (pref, silent = false) {
    currentPref = (pref === 'de' || pref === 'en' || pref === 'auto') ? pref : 'auto';
    currentLang = resolveLang(currentPref);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, currentPref);
    } catch (e) {}
    window.applyTranslations();
    if (!silent && typeof pushConfigToServer === 'function') {
      pushConfigToServer(false);
    }
    if (!silent && typeof showToast === 'function') {
      showToast(currentLang === 'de' ? '🇩🇪 Sprache: Deutsch' : '🇬🇧 Language: English');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.applyTranslations());
  } else {
    setTimeout(() => window.applyTranslations(), 0);
  }
})();

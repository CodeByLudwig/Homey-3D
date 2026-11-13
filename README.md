# 🏠 Homey 3D · Living

[![Three.js](https://img.shields.io/badge/Three.js-r128-000000?logo=threedotjs)](https://threejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A516-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Homey Pro](https://img.shields.io/badge/Homey%20Pro-Live%20API-00A4E4)](https://homey.app/)
[![Languages](https://img.shields.io/badge/Languages-DE%20%7C%20EN-blue)](#)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8)](https://web.dev/progressive-web-apps/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

Ein interaktives **3D-Smart-Home-Dashboard mit eigenem 3D-Haus-Editor** für **Homey Pro** auf Basis von Three.js.  
*Hinweis: Diese Anwendung ist komplett **vibecoded** - entstanden in interaktiven KI-Sessions als pragmatisches Smart-Home-Projekt.*

Die gesamte Wohnung lässt sich frei drehen, zoomen, im **First-Person-Rundgang** begehen und direkt im 3D-Raum steuern - optimiert für Desktop, Tablet, Smartphone (PWA), **Lively Wallpaper** und **Homey Dashboards**.

---

## ✨ Features

- **Interaktiver 4-Schritte-Haus-Editor:**
  - Mehrere eigene Häuser/Wohnungen anlegen, als **Standard** festlegen oder die eingebaute **2-Zimmer-Demo-Wohnung** nutzen
  - **Grundriss bauen:** Räume (mit verschiedenen Bodenbelägen), Außen-/Innen-/Glaswände, Fenster und schwenkbare Türen
  - **Einrichten & Geräte:** Möbel, Smart-Home-Geräte (Lichter, LEDs, Sensoren, TV, Speaker, Hub), bis zu **5 Wandbilder pro Haus** (mit automatischem Wand-Snap) und einen eigenen **Rundgang-Startpunkt**
  - **Direkte 3D-Bearbeitung:** Objekte im 3D-Modell anklicken, per **Drag & Drop** verschieben, drehen (`R` oder Buttons), umbenennen und gezielt löschen
- **Homey Pro Live-Steuerung & Sync:**
  - Geräte direkt im 3D-Modell oder über die Sidebar schalten, dimmen und RGB-Farben anpassen
  - Geräte-Verknüpfung (Mapping) zwischen 3D-Objekten und deinen echten Homey-Geräten
  - **Schneller Start:** `/api/bootstrap.js` + `localStorage`-Cache für verzögerungsfreies Laden
- **First-Person-Rundgang (`V`):** Mit WASD oder Touch-Joystick durch deine Wohnung laufen inkl. Raum-Icons
- **Mehrsprachig (Deutsch & Englisch):** Automatische Erkennung der Browsersprache (`auto`) oder manuelle Umschaltung unter *Verbindung → Sprache*
- **5 Hintergrund- & Wallpaper-Themes:** `mica`, `bloom`, `oled`, `grid`, `transparent` (z. B. für Lively Wallpaper)
- **Kiosk- & PWA-Modus:** Minimales UI per Taste `H` oder `?kiosk=1`, installierbar als App auf iOS, Android & Desktop
- **Zero-Dependency Node.js Server:** Leichtgewichtiger Server (`server.js`) mit `/api/config`-Sync (funktioniert alternativ auch auf einem statischen Webserver wie dem Homey Micro Web Server)

---

## 📁 Projektstruktur

```text
homey-3d/
├── index.html              # Haupt-App & UI (Top-Dock, Sidebar, 4-Schritte-Editor)
├── css/
│   └── styles.css          # Glassmorphism-, Theme-, HUD- & Editor-Styles
├── js/
│   ├── i18n.js             # Mehrsprachigkeit (DE / EN, Browser-Auto-Detect)
│   ├── scene-core.js       # Three.js Szene, Themes, Materialien, Wände & Wandbilder
│   ├── devices-3d.js       # 3D-Geräte-Meshes, Lichter, Halos & Control-Card
│   ├── homey-api.js        # Homey Pro API-Client, Sync, Mapping & Bootstrap-Loader
│   ├── animations-fpv.js   # Render-Loop, Animationen, Raycasting & First-Person-Rundgang
│   └── house-editor.js     # 3D-Haus-Editor (Vorlagen, Drag & Drop, Inspector, Export/Import)
├── server.js               # Node.js HTTP-Server mit /api/bootstrap.js & /api/config
├── config.example.json     # Saubere Vorlage für die Konfiguration
├── config.json             # (Lokal, in .gitignore) Deine Homey-IP, API-Key, Mapping & Häuser
├── local/                  # (Optional & in .gitignore) Lokale Custom-Skripte / Presets
├── manifest.json           # PWA-Manifest
├── Start-3D-Server.bat     # Windows-Schnellstart für server.js
└── package.json            # Projekt-Metadaten & npm start Script
```

---

## 🚀 Schnellstart

### Voraussetzungen
- [Node.js](https://nodejs.org/) (ab Version 16) - keine weiteren `npm`-Pakete erforderlich
- Ein **Homey Pro** im lokalen Netzwerk *(optional: ohne Verbindung läuft die App direkt mit der Demo-Wohnung im Simulations-Modus)*

### 1. Repository klonen & Konfiguration anlegen

```bash
git clone https://github.com/CodeByLudwig/homey-3d.git
cd homey-3d
cp config.example.json config.json
```

*(Alternativ kannst du die Daten auch einfach direkt in der Weboberfläche unter **Verbindung** eingeben - `server.js` legt `config.json` dann automatisch an.)*

### 2. Server starten

**Via Node.js / npm:**
```bash
npm start
```

**Oder unter Windows per Doppelklick:**
```text
Start-3D-Server.bat
```

Der Server läuft standardmäßig auf Port **`8765`** (konfigurierbar über `PORT=8080 npm start`) und zeigt beim Start die lokale URL (`http://localhost:8765/`) sowie deine LAN-IP für Smartphone/Tablet an.

---

## 🔗 Mit Homey Pro verbinden

1. Öffne [my.homey.app](https://my.homey.app/) → **Einstellungen (Zahnrad)** → **API-Keys** → **Neuer API-Key**.
2. Öffne das 3D-Dashboard im Browser und klicke oben auf **⚙️ Einstellungen**.
3. Trage deine **Homey Pro IP-Adresse** und den **API-Key** ein und klicke auf **„🔌 Verbinden & in config.json speichern“**.
4. Ordne im Tab **🔌 Geräte** deine 3D-Objekte per Dropdown den echten Homey-Geräten zu.
5. Alle Einstellungen, Grundrisse und Mappings werden automatisch in `config.json` gespeichert und bleiben auf allen Geräten im Heimnetz synchron.

---

## 🎛️ URL-Parameter

Ideal für **Lively Wallpaper**, **Wand-Tablets** oder **Homey Dashboard Web-Widgets**:

| Parameter | Werte | Standard | Beschreibung |
| :--- | :--- | :--- | :--- |
| `bg` | `mica`, `bloom`, `oled`, `grid`, `transparent` | `mica` | Hintergrund-Theme festlegen |
| `kiosk` / `wallpaper` | `1`, `0` | `0` | Kompaktes Wallpaper-Dock aktivieren (auch Taste `H`) |
| `grid` | `1`, `0` | `1` | 3D-Bodenraster ein-/ausblenden |
| `pedestal` | `1`, `0` | `0` | 3D-Modell-Podest ein-/ausblenden |
| `aurora` | `1`, `0` | `1` | Animierte Aurora-Lichteffekte |
| `shadow` / `shadows` | `1`, `0` | `0` | Boden-Schattenwurf aktivieren |
| `pwa` | `1` | - | PWA-Startmodus |

**Beispiel für Kiosk-/Wallpaper-Ansicht:**
```text
http://localhost:8765/?bg=transparent&kiosk=1&grid=0
```

---

## 🔒 Sicherheitshinweis

Die Dateien `config.json` und der Ordner `local/` stehen in der `.gitignore`, damit deine lokale Homey-IP, dein persönlicher **Homey API-Key** und private Grundrisse **nicht** versehentlich in öffentliche Git-Repositories gepusht werden. Nutze für Vorlagen immer `config.example.json`.

---

## 📄 Lizenz

Dieses Projekt steht unter der [GNU General Public License v3.0 (GPLv3)](LICENSE).  
Für eine kommerzielle Nutzung ohne Open-Source-Pflicht oder individuelle Anpassungen ist eine separate Lizenzierung auf Anfrage möglich.

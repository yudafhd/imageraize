# 🖼️ ImageRis — Image Network Capture

**Chrome Extension to capture all image network requests in real-time.**

---

## Installation Guide (Chrome / Edge)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle switch in the top-right corner)
3. Click on the **"Load unpacked"** button
4. Select the project directory: `TikTok-Imageris/`
5. The extension is ready to use! 🎉

---

## Features

| Feature | Description |
|-------|------------|
| 🔴 Capture Toggle | Turn the real-time image capture on or off |
| 🎛️ Dual Layout Toggle | Switch between **Grid View** (3-column photo cards) and **List View** (detailed rows) |
| 📋 Image List / Grid | Live view of all captured images with automatic sorting by time |
| 🖼️ Live Thumbnail | View instant image previews in the list or grid |
| 🔍 Search | Query captured images instantly by URL |
| 🏷️ Filter by Type | Filter captured images by JPEG, PNG, WEBP, GIF, SVG |
| 📦 File Size | Display formatted file size (KB, MB) |
| ⬇️ Download | Download any captured image directly from the popup |
| 🔄 URL Replacer | Dynamically replace URL patterns (e.g. `300:300` -> `900:1200`) for download, copy, and open actions |
| 📂 Export JSON | Export all captured metadata to a JSON file |
| 🔗 Open in Tab | Open any image in a new tab |
| 📋 Copy URL | Copy the image URL to your clipboard |

---

## File Structure

```
TikTok-Imageris/
├── manifest.json       # Extension manifest (v3)
├── background.js       # Service worker (webRequest listener)
├── popup.html          # UI popup markup
├── popup.css           # Premium dark theme stylesheet
├── popup.js            # Popup logic & state management
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## How to Use

1. Click on the **ImageRis** icon in your Chrome toolbar.
2. Toggle **Capture** to ON (green indicator).
3. Browse any website (e.g., TikTok, Instagram, etc.).
4. All image requests will load into the popup in real-time.
5. Switch between **Grid** and **List** layout using the top-right toolbar buttons.
6. Click any card/item to view full details (Resolution, status, timestamps) or download/copy the URL.

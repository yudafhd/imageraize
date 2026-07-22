# 🖼️ ImageRis — Image Network Capture

**Chrome Extension untuk menangkap semua image network request secara real-time**

---

## Cara Install di Chrome

1. Buka Chrome → pergi ke `chrome://extensions/`
2. Aktifkan **Developer mode** (toggle kanan atas)
3. Klik **"Load unpacked"**
4. Pilih folder: `TikTok-Imageris/`
5. Extension siap digunakan 🎉

---

## Fitur

| Fitur | Keterangan |
|-------|------------|
| 🔴 Capture Toggle | Aktifkan/nonaktifkan penangkapan image |
| 📋 Image List | List real-time semua image yang tertangkap |
| 🖼️ Thumbnail | Preview thumbnail langsung di list |
| 🔍 Search | Cari image berdasarkan URL |
| 🏷️ Filter by Type | Filter JPEG, PNG, WEBP, GIF, SVG |
| 📦 File Size | Tampilkan ukuran file |
| ⬇️ Download | Download image langsung dari popup |
| 🔄 URL Replacer | Ganti pola URL secara otomatis saat download, copy, & open (misal `300:300` -> `900:1200`) |
| 📂 Export JSON | Export semua data sebagai JSON |
| 🔗 Open in Tab | Buka image di tab baru |
| 📋 Copy URL | Salin URL image ke clipboard |

---

## Struktur File

```
TikTok-Imageris/
├── manifest.json       # Extension manifest (v3)
├── background.js       # Service worker (webRequest listener)
├── popup.html          # UI popup
├── popup.css           # Styling premium dark theme
├── popup.js            # Popup logic & state management
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## Cara Pakai

1. Klik icon **ImageRis** di toolbar Chrome
2. Toggle **Capture** ke posisi ON (hijau)
3. Browse website apapun
4. Semua image network request akan muncul di list secara real-time
5. Klik item untuk melihat detail, download, atau copy URL

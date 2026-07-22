// ============================================================
// ImageRis - Background Service Worker
// Captures all image network requests and stores them
// ============================================================

const IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  'image/avif',
  'image/ico',
  'image/x-icon',
];

const IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.svg', '.bmp', '.tiff', '.tif', '.avif',
  '.ico', '.jfif', '.pjpeg', '.pjp'
];

// State
let isCapturing = false;
let capturedImages = {};

// ---- Helpers ----

function getImageType(url, contentType) {
  if (contentType) {
    const ct = contentType.toLowerCase();
    if (ct.includes('jpeg') || ct.includes('jpg')) return 'JPEG';
    if (ct.includes('png')) return 'PNG';
    if (ct.includes('gif')) return 'GIF';
    if (ct.includes('webp')) return 'WEBP';
    if (ct.includes('svg')) return 'SVG';
    if (ct.includes('bmp')) return 'BMP';
    if (ct.includes('avif')) return 'AVIF';
    if (ct.includes('ico')) return 'ICO';
    if (ct.includes('tiff')) return 'TIFF';
  }
  // Fallback: detect from URL
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase().split('?')[0];
    for (const ext of IMAGE_EXTENSIONS) {
      if (pathname.endsWith(ext)) {
        return ext.replace('.', '').toUpperCase().replace('JPEG', 'JPEG').replace('JPG', 'JPEG');
      }
    }
  } catch (e) {}
  return 'IMAGE';
}

function isImageRequest(details) {
  // Check resource type
  if (details.type === 'image') return true;

  // Check URL for image extensions
  try {
    const urlObj = new URL(details.url);
    const pathname = urlObj.pathname.toLowerCase().split('?')[0];
    for (const ext of IMAGE_EXTENSIONS) {
      if (pathname.endsWith(ext)) return true;
    }
  } catch (e) {}

  return false;
}

function isImageResponse(contentType) {
  if (!contentType) return false;
  const ct = contentType.toLowerCase();
  return IMAGE_CONTENT_TYPES.some(type => ct.includes(type));
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return 'Unknown';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function generateId(url) {
  // Simple hash of URL
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'img_' + Math.abs(hash) + '_' + Date.now();
}

// ---- Load saved state ----

chrome.storage.local.get(['isCapturing', 'capturedImages'], (result) => {
  isCapturing = result.isCapturing || false;
  capturedImages = result.capturedImages || {};
});

// ---- webRequest Listener (onBeforeRequest) ----
// Intercept image requests early

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!isCapturing) return;
    if (!isImageRequest(details)) return;
    if (capturedImages[details.url]) return; // deduplicate

    const entry = {
      id: generateId(details.url),
      url: details.url,
      tabId: details.tabId,
      timestamp: Date.now(),
      type: getImageType(details.url, null),
      size: null,
      contentType: null,
      status: 'pending',
    };

    capturedImages[details.url] = entry;
    persistAndNotify();
  },
  { urls: ['<all_urls>'] },
  []
);

// ---- webRequest Listener (onCompleted) ----
// Update with response headers (content-type, size)

chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (!isCapturing) return;

    let contentType = null;
    let contentLength = null;

    for (const header of (details.responseHeaders || [])) {
      const name = header.name.toLowerCase();
      if (name === 'content-type') contentType = header.value;
      if (name === 'content-length') contentLength = parseInt(header.value, 10);
    }

    const isImg = isImageRequest(details) || isImageResponse(contentType);
    if (!isImg) return;

    if (capturedImages[details.url]) {
      // Update existing entry
      capturedImages[details.url].contentType = contentType;
      capturedImages[details.url].size = contentLength;
      capturedImages[details.url].status = details.statusCode === 200 ? 'ok' : 'error';
      capturedImages[details.url].type = getImageType(details.url, contentType);
      capturedImages[details.url].statusCode = details.statusCode;
    } else {
      // New entry found from response headers
      const entry = {
        id: generateId(details.url),
        url: details.url,
        tabId: details.tabId,
        timestamp: Date.now(),
        type: getImageType(details.url, contentType),
        size: contentLength,
        contentType: contentType,
        status: details.statusCode === 200 ? 'ok' : 'error',
        statusCode: details.statusCode,
      };
      capturedImages[details.url] = entry;
    }

    persistAndNotify();
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

// ---- Tab Reload → Clear images for that tab ----

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  // 'loading' fires at the very start of a navigation/reload
  if (changeInfo.status !== 'loading') return;

  // Remove every captured image that came from this tab
  const before = Object.keys(capturedImages).length;
  for (const url of Object.keys(capturedImages)) {
    if (capturedImages[url].tabId === tabId) {
      delete capturedImages[url];
    }
  }
  const after = Object.keys(capturedImages).length;

  if (before !== after) {
    // Something was removed — persist and tell popup
    persistAndNotify();
  }
});

// ---- Persist & Notify ----

let persistDebounce = null;

function persistAndNotify() {
  if (persistDebounce) clearTimeout(persistDebounce);
  persistDebounce = setTimeout(() => {
    chrome.storage.local.set({ capturedImages });
    // Notify all extension pages
    chrome.runtime.sendMessage({ type: 'IMAGES_UPDATED', images: Object.values(capturedImages) })
      .catch(() => {}); // popup might be closed, ignore error
  }, 100);
}

// ---- Message Handler ----

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_STATE':
      sendResponse({
        isCapturing,
        images: Object.values(capturedImages),
      });
      return true;

    case 'SET_CAPTURING':
      isCapturing = message.value;
      chrome.storage.local.set({ isCapturing });
      sendResponse({ ok: true });
      return true;

    case 'CLEAR_IMAGES':
      capturedImages = {};
      chrome.storage.local.set({ capturedImages });
      chrome.runtime.sendMessage({ type: 'IMAGES_UPDATED', images: [] }).catch(() => {});
      sendResponse({ ok: true });
      return true;

    case 'DOWNLOAD_IMAGE':
      chrome.downloads.download({
        url: message.url,
        filename: message.filename,
      });
      sendResponse({ ok: true });
      return true;
  }
});

// ---- Badge update ----

function updateBadge() {
  const count = Object.keys(capturedImages).length;
  const text = isCapturing ? (count > 0 ? String(count) : '') : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: isCapturing ? '#7c3aed' : '#555555' });
}

// Watch for changes and update badge
setInterval(updateBadge, 500);

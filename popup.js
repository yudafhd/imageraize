// ============================================================
// ImageRis - Popup Script
// Manages UI state, communicates with background service worker
// ============================================================

// ---- DOM References ----
const captureToggle   = document.getElementById('captureToggle');
const toggleWrapper   = document.getElementById('captureToggleLabel');
const clearBtn        = document.getElementById('clearBtn');
const exportBtn       = document.getElementById('exportBtn');
const imageList       = document.getElementById('imageList');
const emptyState      = document.getElementById('emptyState');
const imageCount      = document.getElementById('imageCount');
const searchInput     = document.getElementById('searchInput');
const typeFilters     = document.getElementById('typeFilters');
const statusDot       = document.getElementById('statusDot');
const statusText      = document.getElementById('statusText');
const totalSizeText   = document.getElementById('totalSizeText');
const modalOverlay    = document.getElementById('modalOverlay');
const modalClose      = document.getElementById('modalClose');
const modalPreview    = document.getElementById('modalPreview');
const modalInfo       = document.getElementById('modalInfo');
const modalCopyUrl    = document.getElementById('modalCopyUrl');
const modalDownload   = document.getElementById('modalDownload');
const modalOpen       = document.getElementById('modalOpen');

// URL Replacer DOM References
const replacerBar     = document.querySelector('.replacer-bar');
const replacerEnable  = document.getElementById('replacerEnable');
const replacerFind    = document.getElementById('replacerFind');
const replacerReplace = document.getElementById('replacerReplace');

// View Toggle DOM References
const viewGridBtn     = document.getElementById('viewGridBtn');
const viewListBtn     = document.getElementById('viewListBtn');

// ---- State ----
let allImages = [];
let currentFilter = 'ALL';
let searchQuery = '';
let selectedImage = null;
let viewMode = 'grid'; // 'grid' or 'list'

// ---- Helpers ----

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function getFilename(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/');
    const name = parts[parts.length - 1] || 'image';
    const decodedName = decodeURIComponent(name.split('?')[0] || 'image');
    // Replace characters that are illegal in filenames: \ : * ? " < > |
    return decodedName.replace(/[\\:*?"<>|]/g, '_');
  } catch {
    return 'image';
  }
}

function getShortUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname;
    if (path.length > 32) return '...' + path.slice(-32);
    return path || '/';
  } catch {
    return url.slice(0, 40);
  }
}

function getTotalSize() {
  const total = allImages.reduce((sum, img) => sum + (img.size || 0), 0);
  return formatSize(total);
}

function updateViewModeUI() {
  if (viewMode === 'grid') {
    imageList.classList.add('view-grid');
    imageList.classList.remove('view-list');
    viewGridBtn.classList.add('active');
    viewListBtn.classList.remove('active');
  } else {
    imageList.classList.add('view-list');
    imageList.classList.remove('view-grid');
    viewListBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
  }
}

// ---- Filter & Render ----

function getFilteredImages() {
  return allImages.filter(img => {
    const typeMatch = currentFilter === 'ALL' || img.type === currentFilter;
    const searchMatch = !searchQuery || img.url.toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatch && searchMatch;
  });
}

function renderImageItem(img) {
  const item = document.createElement('div');
  item.className = 'image-item';
  item.dataset.url = img.url;

  // Thumbnail
  const thumb = document.createElement('div');
  thumb.className = 'item-thumb';

  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = img.url;
  image.onload = () => {
    thumb.innerHTML = '';
    thumb.appendChild(image);
  };
  image.onerror = () => {
    thumb.innerHTML = `
      <div class="thumb-placeholder">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
          <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
        </svg>
      </div>`;
  };
  thumb.appendChild(image);

  // Info
  const info = document.createElement('div');
  info.className = 'item-info';

  const urlEl = document.createElement('div');
  urlEl.className = 'item-url';
  urlEl.textContent = getShortUrl(img.url);
  urlEl.title = img.url;

  const meta = document.createElement('div');
  meta.className = 'item-meta';

  const domain = document.createElement('span');
  domain.className = 'item-domain';
  domain.textContent = getDomain(img.url);
  domain.title = img.url;

  const time = document.createElement('span');
  time.className = 'item-time';
  time.textContent = formatTime(img.timestamp);

  meta.appendChild(domain);
  meta.appendChild(time);
  info.appendChild(urlEl);
  info.appendChild(meta);

  // Right side
  const right = document.createElement('div');
  right.className = 'item-right';

  const badge = document.createElement('span');
  const imgType = img.type || 'IMAGE';
  badge.className = `type-badge type-${imgType}`;
  badge.textContent = imgType;

  const size = document.createElement('span');
  size.className = 'item-size';
  size.textContent = formatSize(img.size);

  const dlBtn = document.createElement('button');
  dlBtn.className = 'item-download-btn';
  dlBtn.title = 'Download image';
  dlBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  dlBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    downloadImage(img);
  });

  right.appendChild(badge);
  right.appendChild(size);
  right.appendChild(dlBtn);

  item.appendChild(thumb);
  item.appendChild(info);
  item.appendChild(right);

  item.addEventListener('click', () => openModal(img));

  return item;
}

function renderList() {
  const filtered = getFilteredImages();

  // Remove existing items (not emptyState)
  const existingItems = imageList.querySelectorAll('.image-item, .no-results');
  existingItems.forEach(el => el.remove());

  imageCount.textContent = allImages.length;

  if (allImages.length === 0) {
    emptyState.style.display = 'flex';
    totalSizeText.textContent = '';
    return;
  }

  emptyState.style.display = 'none';
  totalSizeText.textContent = 'Total: ' + getTotalSize();

  if (filtered.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" style="color:var(--text-muted)">
      <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5"/>
      <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <p>No images match your filter</p>`;
    imageList.appendChild(noResults);
    return;
  }

  // Sort by timestamp desc
  const sorted = [...filtered].sort((a, b) => b.timestamp - a.timestamp);
  sorted.forEach(img => {
    imageList.appendChild(renderImageItem(img));
  });
}

// ---- State Update ----

function updateCaptureUI(capturing) {
  if (capturing) {
    toggleWrapper.classList.add('active');
    captureToggle.checked = true;
    statusDot.classList.add('active');
    statusText.textContent = 'Capturing image requests...';
  } else {
    toggleWrapper.classList.remove('active');
    captureToggle.checked = false;
    statusDot.classList.remove('active');
    statusText.textContent = 'Capture is off';
  }
}

function updateImages(images) {
  allImages = images || [];
  renderList();
}

// ---- URL Replacer Helper ----

function getProcessedUrl(url) {
  if (replacerEnable && replacerEnable.checked && replacerFind.value) {
    return url.replace(replacerFind.value, replacerReplace.value || '');
  }
  return url;
}

// ---- Download ----

function downloadImage(img) {
  const processedUrl = getProcessedUrl(img.url);
  const filename = getFilename(processedUrl);
  chrome.runtime.sendMessage({
    type: 'DOWNLOAD_IMAGE',
    url: processedUrl,
    filename: filename,
  });
  const displayFilename = filename.length > 25 ? filename.substring(0, 22) + '...' : filename;
  showToast('Downloading ' + displayFilename);
}

// ---- Export ----

function exportJSON() {
  const data = {
    exported_at: new Date().toISOString(),
    total: allImages.length,
    images: allImages.map(img => ({
      url: img.url,
      type: img.type,
      size_bytes: img.size,
      size_formatted: formatSize(img.size),
      domain: getDomain(img.url),
      captured_at: new Date(img.timestamp).toISOString(),
      status: img.status,
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  chrome.runtime.sendMessage({
    type: 'DOWNLOAD_IMAGE',
    url: url,
    filename: `imageris-export-${Date.now()}.json`,
  });
  showToast('Exporting ' + allImages.length + ' images...');
}

// ---- Toast ----

let toastTimeout = null;
let toastEl = null;

function showToast(msg) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2000);
}

// ---- Modal ----

function openModal(img) {
  selectedImage = img;
  modalOverlay.removeAttribute('hidden');

  // Preview
  modalPreview.innerHTML = '';
  const previewImg = new Image();
  previewImg.src = img.url;
  previewImg.style.cssText = 'max-width:100%; max-height:220px; object-fit:contain;';
  previewImg.onerror = () => {
    modalPreview.innerHTML = `<div style="color:var(--text-muted);font-size:12px;padding:20px;">Preview not available</div>`;
  };
  modalPreview.appendChild(previewImg);

  // Info rows
  modalInfo.innerHTML = '';
  const rows = [
    { label: 'URL',    value: img.url },
    { label: 'Domain', value: getDomain(img.url) },
    { label: 'Type',   value: img.type || 'Unknown' },
    { label: 'Size',   value: formatSize(img.size) },
    { label: 'Status', value: img.statusCode ? `${img.statusCode}` : img.status || '—' },
    { label: 'Captured', value: formatTime(img.timestamp) },
  ];

  rows.forEach(({ label, value }) => {
    const row = document.createElement('div');
    row.className = 'info-row';
    row.innerHTML = `<span class="info-label">${label}</span><span class="info-value">${escHtml(value)}</span>`;
    modalInfo.appendChild(row);
  });
}

function closeModal() {
  modalOverlay.setAttribute('hidden', '');
  selectedImage = null;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---- Event Listeners ----

// Capture toggle
toggleWrapper.addEventListener('click', () => {
  const newVal = !captureToggle.checked;
  captureToggle.checked = newVal;
  updateCaptureUI(newVal);
  chrome.runtime.sendMessage({ type: 'SET_CAPTURING', value: newVal });
  showToast(newVal ? '🟢 Capture started' : '⏸ Capture paused');
});

// Clear
clearBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'CLEAR_IMAGES' }, () => {
    updateImages([]);
    showToast('✨ List cleared');
  });
});

// Export
exportBtn.addEventListener('click', exportJSON);

// View toggle listeners
viewGridBtn.addEventListener('click', () => {
  if (viewMode === 'grid') return;
  viewMode = 'grid';
  chrome.storage.local.set({ viewMode: 'grid' });
  updateViewModeUI();
});

viewListBtn.addEventListener('click', () => {
  if (viewMode === 'list') return;
  viewMode = 'list';
  chrome.storage.local.set({ viewMode: 'list' });
  updateViewModeUI();
});

// Search
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  renderList();
});

// Type filters
typeFilters.addEventListener('click', (e) => {
  const chip = e.target.closest('.filter-chip');
  if (!chip) return;
  typeFilters.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  currentFilter = chip.dataset.type;
  renderList();
});

// Modal close
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// Modal actions
modalCopyUrl.addEventListener('click', () => {
  if (!selectedImage) return;
  const processedUrl = getProcessedUrl(selectedImage.url);
  navigator.clipboard.writeText(processedUrl).then(() => {
    showToast('📋 URL copied!');
  });
});

modalDownload.addEventListener('click', () => {
  if (!selectedImage) return;
  downloadImage(selectedImage);
  closeModal();
});

modalOpen.addEventListener('click', () => {
  if (!selectedImage) return;
  const processedUrl = getProcessedUrl(selectedImage.url);
  chrome.tabs.create({ url: processedUrl });
  closeModal();
});

// Listen for live updates from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'IMAGES_UPDATED') {
    updateImages(message.images);
  }
});

// ---- URL Replacer Event Listeners ----

replacerEnable.addEventListener('change', () => {
  const isEnabled = replacerEnable.checked;
  if (isEnabled) {
    replacerBar.classList.add('active');
  } else {
    replacerBar.classList.remove('active');
  }
  chrome.storage.local.set({
    replacerEnable: isEnabled
  });
});

replacerFind.addEventListener('input', () => {
  chrome.storage.local.set({
    replacerFind: replacerFind.value
  });
});

replacerReplace.addEventListener('input', () => {
  chrome.storage.local.set({
    replacerReplace: replacerReplace.value
  });
});

// ---- Init ----

// Load URL Replacer values
chrome.storage.local.get(['replacerEnable', 'replacerFind', 'replacerReplace', 'viewMode'], (result) => {
  if (result.replacerEnable !== undefined) {
    replacerEnable.checked = result.replacerEnable;
    if (result.replacerEnable) {
      replacerBar.classList.add('active');
    }
  }
  if (result.replacerFind !== undefined) {
    replacerFind.value = result.replacerFind;
  }
  if (result.replacerReplace !== undefined) {
    replacerReplace.value = result.replacerReplace;
  }
  if (result.viewMode !== undefined) {
    viewMode = result.viewMode;
  }
  updateViewModeUI();
});

chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
  if (chrome.runtime.lastError) {
    console.warn('Background not ready:', chrome.runtime.lastError.message);
    return;
  }
  if (response) {
    updateCaptureUI(response.isCapturing);
    updateImages(response.images);
  }
});

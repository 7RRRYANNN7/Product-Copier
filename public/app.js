const state = {
  productData: null,
  chats: JSON.parse(localStorage.getItem('chats') || '[]'),
  currentChatId: null,
  view: 'idle',
  language: localStorage.getItem('language') || 'en',
  theme: localStorage.getItem('theme') || 'light',
  username: localStorage.getItem('username') || 'Guest',
  avatar: localStorage.getItem('avatar') || ''
};

const refs = {
  views: {
    idle: document.getElementById('stateIdle'),
    loading: document.getElementById('stateLoading'),
    result: document.getElementById('stateResult'),
    search: document.getElementById('stateSearch')
  },
  nav: {
    newCopy: document.getElementById('newCopyBtn'),
    search: document.getElementById('searchViewBtn')
  },
  sidebarButtons: {
    search: document.getElementById('sidebarSearchBtn'),
    new: document.getElementById('sidebarNewBtn'),
    settings: document.getElementById('sidebarSettingsBtn')
  },
  topbar: {
    settings: document.getElementById('quickSettingsBtn'),
    language: document.getElementById('quickLanguageBtn'),
    langLabel: document.getElementById('inlineLangLabel'),
    profile: document.getElementById('profileBtn'),
    profileAvatar: document.getElementById('profileAvatar'),
    profileInitial: document.getElementById('profileInitial')
  },
  input: {
    url: document.getElementById('productUrl'),
    scrapeBtn: document.getElementById('scrapeBtn')
  },
  errorBanner: document.getElementById('errorMessage'),
  productTitle: document.getElementById('productTitle'),
  platformTag: document.getElementById('platformTag'),
  productDescription: document.getElementById('productDescription'),
  copyDescriptionBtn: document.getElementById('copyDescriptionBtn'),
  imageGallery: document.getElementById('imageGallery'),
  imageCount: document.getElementById('imageCount'),
  selectDownloadBtn: document.getElementById('selectDownloadBtn'),
  downloadAllBtn: document.getElementById('downloadAllBtn'),
  imageFormat: document.getElementById('imageFormat'),
  chatList: document.getElementById('chatList'),
  selectSearchInput: document.getElementById('searchInput'),
  searchResults: document.getElementById('searchResults'),
  modal: document.getElementById('settingsModal'),
  modalOverlay: document.querySelector('#settingsModal .modal-overlay'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  themeToggle: document.getElementById('themeToggle'),
  languageSelect: document.getElementById('languageSelect'),
  changeAvatarBtn: document.getElementById('changeAvatarBtn'),
  avatarInput: document.getElementById('avatarInput'),
  avatarPreview: document.getElementById('settingsAvatarPreview'),
  usernameInput: document.getElementById('usernameInput'),
  saveUsernameBtn: document.getElementById('saveUsernameBtn')
};

let productData = null;
let selectedImages = new Set();
let selectionMode = false;

const translations = {
  en: {
    title: 'Product Copier',
    subtitle: 'Extract product descriptions and images from eBay and Amazon listings',
    urlPlaceholder: 'Paste product link (eBay, Amazon, or AliExpress)',
    submitBtn: 'Submit',
    newCopies: 'New Copies',
    searchCopies: 'Search Copies',
    pastCopies: 'Your Past Copies',
    noCopies: 'No copies yet. Start by submitting a link.',
    descriptionTitle: 'Product Description',
    copyDescription: '📋 Copy Description',
    imagesTitle: 'Product Images',
    selectDownload: '🎯 Selection Download',
    downloadAll: '⬇️ Download All',
    downloadSelected: '✓ Download Selected',
    searchPlaceholder: 'Search saved copies...',
    searchEmpty: 'No matches yet. Try another name.',
    settingsTitle: 'Settings',
    displaySettings: 'Display Settings',
    themeLabel: 'Theme',
    themeHint: 'Toggle between light and dark modes',
    languageLabel: 'Language',
    languageHint: 'Choose interface language',
    accountSettings: 'Account Settings',
    changeAvatar: 'Change Picture',
    usernameLabel: 'Username',
    saveUsername: 'Save',
    errors: {
      noUrl: 'Please enter a product URL',
      invalidUrl: 'Please enter a valid eBay, Amazon, or AliExpress URL',
      scrapeFailed: 'Failed to scrape product. Please check the URL and try again.',
      noImages: 'Please select at least one image',
      copySuccess: '✓ Description copied to clipboard!',
      noDescription: 'No description available',
      noImagesFound: 'No images found'
    }
  },
  es: {
    title: 'Copiador de Productos',
    subtitle: 'Extrae descripciones e imágenes de productos de eBay, Amazon y AliExpress',
    urlPlaceholder: 'Pega el enlace del producto (eBay, Amazon o AliExpress)',
    submitBtn: 'Enviar',
    newCopies: 'Copias Nuevas',
    searchCopies: 'Buscar Copias',
    pastCopies: 'Tus Copias',
    noCopies: 'Aún no tienes copias. Envía un enlace para comenzar.',
    descriptionTitle: 'Descripción del Producto',
    copyDescription: '📋 Copiar Descripción',
    imagesTitle: 'Imágenes del Producto',
    selectDownload: '🎯 Descarga Selectiva',
    downloadAll: '⬇️ Descargar Todo',
    downloadSelected: '✓ Descargar Seleccionadas',
    searchPlaceholder: 'Busca copias guardadas...',
    searchEmpty: 'Sin coincidencias. Prueba otro nombre.',
    settingsTitle: 'Configuración',
    displaySettings: 'Configuración de Pantalla',
    themeLabel: 'Tema',
    themeHint: 'Alterna entre modo claro y oscuro',
    languageLabel: 'Idioma',
    languageHint: 'Elige el idioma de la interfaz',
    accountSettings: 'Configuración de Cuenta',
    changeAvatar: 'Cambiar Foto',
    usernameLabel: 'Nombre de usuario',
    saveUsername: 'Guardar',
    errors: {
      noUrl: 'Por favor ingresa un enlace de producto',
      invalidUrl: 'Ingresa un enlace válido de eBay, Amazon o AliExpress',
      scrapeFailed: 'No se pudo extraer el producto. Verifica el enlace y vuelve a intentar.',
      noImages: 'Selecciona al menos una imagen',
      copySuccess: '✓ ¡Descripción copiada al portapapeles!',
      noDescription: 'No hay descripción disponible',
      noImagesFound: 'No se encontraron imágenes'
    }
  }
};

function t(key) {
  const keys = key.split('.');
  let value = translations[state.language];
  for (const k of keys) value = value?.[k];
  if (!value) {
    value = translations.en;
    for (const k of keys) value = value?.[k];
  }
  return value || key;
}

function updateLanguage(lang) {
  state.language = lang;
  localStorage.setItem('language', lang);
  document.documentElement.lang = lang;
  refs.topbar.langLabel.textContent = lang.toUpperCase();
  refs.languageSelect.value = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
  refs.input.scrapeBtn.querySelector('.btn-text').textContent = t('submitBtn');
  const btnText = refs.selectDownloadBtn.querySelector('span');
  btnText.textContent = selectionMode ? t('downloadSelected') : t('selectDownload');
  renderChatState();
  renderSearchResults(refs.selectSearchInput.value);
  renderChatList();
}

function applyTheme(theme) {
  state.theme = theme;
  document.body.dataset.theme = theme;
  refs.themeToggle.checked = theme === 'dark';
  localStorage.setItem('theme', theme);
}

function setView(view) {
  state.view = view;
  Object.values(refs.views).forEach((el) => el.classList.remove('active'));
  refs.views[view].classList.add('active');
  refs.nav.newCopy.classList.toggle('active', view === 'idle' || view === 'result');
  refs.nav.search.classList.toggle('active', view === 'search');
}

function showError(message) {
  refs.errorBanner.textContent = message;
  refs.errorBanner.classList.remove('hidden');
}

function hideError() {
  refs.errorBanner.classList.add('hidden');
}

async function scrapeProduct() {
  let url = refs.input.url.value.trim();
  if (!url) {
    showError(t('errors.noUrl'));
    return;
  }

  // Check if it's just query parameters (starts with ? or & or contains = but no http)
  if ((url.startsWith('?') || url.startsWith('&') || (url.includes('=') && !url.includes('http'))) && 
      (url.includes('amazon') || url.includes('dp/') || url.includes('product'))) {
    showError('This looks like a partial Amazon URL. Please paste the complete URL starting with https://www.amazon.com/...');
    return;
  }

  // Check if URL is complete (starts with http)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // Try to construct a full URL if it looks like a domain
    if (url.includes('amazon.com') || url.includes('ebay.com') || url.includes('aliexpress.com')) {
      url = 'https://' + url;
      refs.input.url.value = url;
    } else {
      showError('Please enter a complete URL starting with http:// or https://');
      return;
    }
  }

  const isEbay = url.includes('ebay.com') || url.includes('ebay.');
  const isAmazon =
    url.includes('amazon.com') ||
    url.includes('amazon.co.uk') ||
    url.includes('amazon.co.jp') ||
    url.includes('amazon.de') ||
    url.includes('amazon.fr') ||
    url.includes('amazon.es') ||
    url.includes('amazon.it') ||
    url.includes('amazon.ca') ||
    url.includes('amazon.com.mx') ||
    url.includes('amazon.in') ||
    url.includes('amazon.com.au');
  const isAliExpress = url.includes('aliexpress.com') || url.includes('aliexpress.us');
  
  if (!isEbay && !isAmazon && !isAliExpress) {
    showError(t('errors.invalidUrl'));
    return;
  }
  hideError();
  setView('loading');
  refs.input.scrapeBtn.classList.add('loading');
  try {
    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || t('errors.scrapeFailed'));
    productData = data;
    handleNewChat(data);
  } catch (error) {
    showError(error.message || t('errors.scrapeFailed'));
    setView('idle');
  } finally {
    refs.input.scrapeBtn.classList.remove('loading');
  }
}

function handleNewChat(data) {
  const chat = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    title: data.title || 'Product',
    description: data.description || t('errors.noDescription'),
    images: data.images || [],
    platform: data.platform || (isEbay ? 'eBay' : (isAmazon ? 'Amazon' : 'AliExpress')),
    createdAt: new Date().toISOString()
  };
  state.chats = [chat, ...state.chats];
  localStorage.setItem('chats', JSON.stringify(state.chats));
  state.currentChatId = chat.id;
  renderChatList();
  displayChat(chat);
}

function renderChatList() {
  const list = refs.chatList;
  list.innerHTML = '';
  if (!state.chats.length) {
    list.classList.add('empty');
    const p = document.createElement('p');
    p.className = 'empty-copy';
    p.textContent = t('noCopies');
    list.appendChild(p);
    return;
  }
  list.classList.remove('empty');
  state.chats.forEach((chat) => {
    const item = document.createElement('button');
    item.className = 'chat-item';
    if (chat.id === state.currentChatId) item.classList.add('active');
    item.innerHTML = `<h4>${chat.title}</h4><small>${new Date(chat.createdAt).toLocaleString()}</small>`;
    item.addEventListener('click', () => {
      state.currentChatId = chat.id;
      displayChat(chat);
      renderChatList();
    });
    list.appendChild(item);
  });
}

function renderChatState() {
  if (state.view === 'result' && state.currentChatId) {
    const chat = state.chats.find((c) => c.id === state.currentChatId);
    if (chat) displayChat(chat);
  }
}

function displayChat(chat) {
  productData = {
    title: chat.title,
    description: chat.description,
    images: chat.images,
    platform: chat.platform
  };
  refs.productTitle.textContent = chat.title;
  const platform = chat.platform?.toLowerCase() || '';
  if (platform.includes('amazon')) {
    refs.platformTag.textContent = 'Amazon';
  } else if (platform.includes('aliexpress')) {
    refs.platformTag.textContent = 'AliExpress';
  } else {
    refs.platformTag.textContent = 'eBay';
  }
  refs.productDescription.textContent = chat.description || t('errors.noDescription');
  refs.imageCount.textContent = chat.images.length;
  refs.imageGallery.innerHTML = '';
  selectedImages.clear();
  selectionMode = false;
  refs.selectDownloadBtn.querySelector('span').textContent = t('selectDownload');
  chat.images.forEach((url, idx) => refs.imageGallery.appendChild(createImageItem(url, idx)));
  if (!chat.images.length) {
    const msg = document.createElement('p');
    msg.style.gridColumn = '1/-1';
    msg.style.textAlign = 'center';
    msg.style.color = 'var(--text-muted)';
    msg.textContent = t('errors.noImagesFound');
    refs.imageGallery.appendChild(msg);
  }
  setView('result');
}

function createImageItem(url, index) {
  const item = document.createElement('div');
  item.className = 'image-item';
  item.dataset.index = index;
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.style.display = selectionMode ? 'block' : 'none';
  checkbox.addEventListener('change', (e) => {
    if (e.target.checked) selectedImages.add(index);
    else selectedImages.delete(index);
    item.classList.toggle('selected', checkbox.checked);
  });
  const img = document.createElement('img');
  img.src = url;
  img.alt = `Product image ${index + 1}`;
  img.loading = 'lazy';
  img.onerror = () => {
    item.classList.add('broken');
    item.innerHTML = '<p style="padding:16px;text-align:center;">Image unavailable</p>';
  };
  item.appendChild(checkbox);
  item.appendChild(img);
  item.addEventListener('click', (e) => {
    if (selectionMode && e.target !== checkbox) {
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
    }
  });
  return item;
}

async function downloadImages(indices, isSelection) {
  if (!productData || !indices.length) return;
  const imagesToDownload = indices.map((i) => ({ url: productData.images[i], index: i + 1 }));
  const btn = isSelection ? refs.selectDownloadBtn : refs.downloadAllBtn;
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⏳';
  try {
    if (imagesToDownload.length > 1) {
      await downloadAsZip(imagesToDownload);
    } else {
      const img = imagesToDownload[0];
      const format = refs.imageFormat.value;
      const ext = format === 'original' ? (img.url.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg') : format;
      await downloadImage(img.url, `${sanitizeFileName(productData.title)}-${img.index}.${ext}`, format);
    }
  } catch (err) {
    console.error(err);
    alert(t('errors.scrapeFailed'));
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

async function downloadAsZip(images) {
  const format = refs.imageFormat.value;
  if (typeof JSZip === 'undefined') {
    for (const image of images) {
      const ext = format === 'original' ? (image.url.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg') : format;
      await downloadImage(image.url, `${sanitizeFileName(productData.title)}-${image.index}.${ext}`, format);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return;
  }
  const zip = new JSZip();
  const folderName = sanitizeFileName(productData.title || 'product');
  const folder = zip.folder(folderName);
  for (const image of images) {
    try {
      const ext = format === 'original' ? (image.url.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg') : format;
      const convertedBlob = await convertImageFormat(image.url, format);
      folder.file(`image-${image.index}.${ext}`, convertedBlob);
    } catch (err) {
      console.error('Image fetch/fetch failed', err);
    }
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const blobUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `${folderName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

async function convertImageFormat(imageUrl, targetFormat) {
  if (targetFormat === 'original') {
    const response = await fetch(imageUrl);
    return await response.blob();
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Conversion failed'));
        }
      }, `image/${targetFormat}`, 0.95);
    };
    
    img.onerror = () => {
      // Fallback: return original blob
      fetch(imageUrl)
        .then(res => res.blob())
        .then(resolve)
        .catch(reject);
    };
    
    img.src = imageUrl;
  });
}

async function downloadImage(url, filename, format = 'original') {
  const blob = await convertImageFormat(url, format);
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

function sanitizeFileName(name) {
  return name.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'product';
}

function handleSelectionToggle() {
  if (!productData || !productData.images.length) return;
  selectionMode = !selectionMode;
  const btnText = refs.selectDownloadBtn.querySelector('span');
  btnText.textContent = selectionMode ? t('downloadSelected') : t('selectDownload');
  document.querySelectorAll('.image-item input').forEach((input) => {
    input.style.display = selectionMode ? 'block' : 'none';
    input.checked = false;
  });
  selectedImages.clear();
}

function handleCopyDescription() {
  const text = refs.productDescription.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const msg = document.createElement('div');
    msg.className = 'copy-success';
    msg.textContent = t('errors.copySuccess');
    refs.copyDescriptionBtn.parentElement.appendChild(msg);
    setTimeout(() => msg.remove(), 2500);
  }).catch(() => {
    alert(t('errors.copySuccess'));
  });
}

function openSearchView() {
  refs.selectSearchInput.value = '';
  renderSearchResults('');
  setView('search');
  refs.selectSearchInput.focus();
}

function renderSearchResults(query) {
  const container = refs.searchResults;
  container.innerHTML = '';
  const results = state.chats.filter((chat) => chat.title.toLowerCase().includes((query || '').toLowerCase()));
  if (!results.length) {
    container.classList.add('empty');
    const p = document.createElement('p');
    p.className = 'empty-copy';
    p.textContent = t('searchEmpty');
    container.appendChild(p);
    return;
  }
  container.classList.remove('empty');
  results.forEach((chat) => {
    const item = document.createElement('div');
    item.className = 'search-result';
    item.innerHTML = `<strong>${chat.title}</strong><br><small>${new Date(chat.createdAt).toLocaleString()}</small>`;
    item.addEventListener('click', () => {
      state.currentChatId = chat.id;
      displayChat(chat);
      renderChatList();
    });
    container.appendChild(item);
  });
}

function openSettings() {
  refs.modal.classList.remove('hidden');
}

function closeSettings() {
  refs.modal.classList.add('hidden');
}

function updateProfileDisplay() {
  refs.usernameInput.value = state.username;
  refs.avatarPreview.src = state.avatar || 'https://ui-avatars.com/api/?background=random&name=' + encodeURIComponent(state.username);
  if (state.avatar) {
    refs.topbar.profileAvatar.style.display = 'block';
    refs.topbar.profileAvatar.src = state.avatar;
    refs.topbar.profileInitial.style.display = 'none';
  } else {
    refs.topbar.profileAvatar.style.display = 'none';
    refs.topbar.profileInitial.style.display = 'inline';
    refs.topbar.profileInitial.textContent = state.username?.[0]?.toUpperCase() || '👤';
  }
}

// Event listeners
refs.input.scrapeBtn.addEventListener('click', scrapeProduct);
refs.input.url.addEventListener('keypress', (e) => { if (e.key === 'Enter') scrapeProduct(); });
refs.copyDescriptionBtn.addEventListener('click', handleCopyDescription);
refs.selectDownloadBtn.addEventListener('click', () => {
  if (selectionMode && !selectedImages.size) {
    alert(t('errors.noImages'));
    return;
  }
  if (selectionMode) {
    downloadImages(Array.from(selectedImages), true);
    handleSelectionToggle();
  } else {
    handleSelectionToggle();
  }
});
refs.downloadAllBtn.addEventListener('click', () => {
  if (!productData || !productData.images.length) return;
  downloadImages(productData.images.map((_, idx) => idx), false);
});
refs.nav.newCopy.addEventListener('click', () => setView('idle'));
refs.sidebarButtons.new.addEventListener('click', () => setView('idle'));
refs.nav.search.addEventListener('click', openSearchView);
refs.sidebarButtons.search.addEventListener('click', openSearchView);
refs.topbar.settings.addEventListener('click', openSettings);
refs.sidebarButtons.settings.addEventListener('click', openSettings);
refs.topbar.profile.addEventListener('click', openSettings);
refs.topbar.language.addEventListener('click', () => {
  const next = state.language === 'en' ? 'es' : 'en';
  updateLanguage(next);
});
refs.selectSearchInput.addEventListener('input', (e) => renderSearchResults(e.target.value));
refs.closeSettingsBtn.addEventListener('click', closeSettings);
refs.modalOverlay.addEventListener('click', closeSettings);
refs.themeToggle.addEventListener('change', (e) => applyTheme(e.target.checked ? 'dark' : 'light'));
refs.languageSelect.addEventListener('change', (e) => updateLanguage(e.target.value));
refs.changeAvatarBtn.addEventListener('click', () => refs.avatarInput.click());
refs.avatarInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.avatar = reader.result;
    localStorage.setItem('avatar', state.avatar);
    updateProfileDisplay();
  };
  reader.readAsDataURL(file);
});
refs.saveUsernameBtn.addEventListener('click', () => {
  state.username = refs.usernameInput.value.trim() || 'Guest';
  localStorage.setItem('username', state.username);
  updateProfileDisplay();
});

// Initialize
applyTheme(state.theme);
updateLanguage(state.language);
updateProfileDisplay();
renderChatList();
if (state.chats.length) {
  state.currentChatId = state.chats[0].id;
  displayChat(state.chats[0]);
} else {
  setView('idle');
}


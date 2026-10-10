/**
 * ==============================================================================
 * 🛠️ BDAY SURPRISE — ADMIN CONTROLLER
 * Handles password login, photo uploads, video uploads, and setting sync.
 * ==============================================================================
 */

(function () {
  'use strict';

  const DEFAULT_PASSCODE = 'love123';
  let currentSettings = null;

  // DOM Elements
  const DOM = {
    loginOverlay: document.getElementById('login-overlay'),
    loginForm: document.getElementById('login-form'),
    adminPasscode: document.getElementById('admin-passcode'),
    adminContainer: document.getElementById('admin-container'),
    btnLogout: document.getElementById('btn-logout'),

    // Photos
    dropPortrait: document.getElementById('drop-portrait'),
    filePortrait: document.getElementById('file-portrait'),
    prevPortrait: document.getElementById('prev-portrait'),

    dropDate: document.getElementById('drop-memory-1'),
    fileDate: document.getElementById('file-date'),
    prevDate: document.getElementById('prev-date'),

    dropSunset: document.getElementById('drop-memory-2'),
    fileSunset: document.getElementById('file-sunset'),
    prevSunset: document.getElementById('prev-sunset'),

    dropCouple: document.getElementById('drop-memory-3'),
    fileCouple: document.getElementById('file-couple'),
    prevCouple: document.getElementById('prev-couple'),

    btnSlotRemoves: document.querySelectorAll('.btn-slot-remove'),

    // Video
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanels: document.querySelectorAll('.tab-panel'),
    dropVideo: document.getElementById('drop-video'),
    fileVideo: document.getElementById('file-video'),
    videoPreviewWrapper: document.getElementById('video-preview-wrapper'),
    adminVideoPlayer: document.getElementById('admin-video-player'),
    btnRemoveVideo: document.getElementById('btn-remove-video'),
    inputYoutubeUrl: document.getElementById('input-youtube-url'),
    inputVideoQuote: document.getElementById('input-video-quote'),

    // Text info
    inputGfName: document.getElementById('input-gf-name'),
    inputSenderName: document.getElementById('input-sender-name'),
    inputBdayDate: document.getElementById('input-bday-date'),
    inputBgmUrl: document.getElementById('input-bgm-url'),
    inputScratchSecret: document.getElementById('input-scratch-secret'),
    inputLetterParagraphs: document.getElementById('input-letter-paragraphs'),

    // Actions
    btnSaveAll: document.getElementById('btn-save-all'),
    btnExportConfig: document.getElementById('btn-export-config'),
    btnResetAll: document.getElementById('btn-reset-all'),
    adminToast: document.getElementById('admin-toast')
  };

  function showToast(msg) {
    DOM.adminToast.textContent = msg;
    DOM.adminToast.classList.add('show');
    setTimeout(() => {
      DOM.adminToast.classList.remove('show');
    }, 3000);
  }

  // ==============================================================================
  // 🔒 AUTHENTICATION
  // ==============================================================================
  function checkAuth() {
    const isAuthed = sessionStorage.getItem('bday_admin_authed');
    if (isAuthed === 'true') {
      DOM.loginOverlay.style.display = 'none';
      DOM.adminContainer.style.display = 'flex';
      initDashboard();
    } else {
      DOM.loginOverlay.style.display = 'flex';
      DOM.adminContainer.style.display = 'none';
    }
  }

  DOM.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const entered = DOM.adminPasscode.value.trim();
    if (entered === DEFAULT_PASSCODE || entered === 'bday2026') {
      sessionStorage.setItem('bday_admin_authed', 'true');
      DOM.loginOverlay.style.display = 'none';
      DOM.adminContainer.style.display = 'flex';
      initDashboard();
      showToast('Welcome, Architect! 💖');
    } else {
      alert('Incorrect passcode! The default is: love123');
      DOM.adminPasscode.value = '';
      DOM.adminPasscode.focus();
    }
  });

  DOM.btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('bday_admin_authed');
    location.reload();
  });

  // ==============================================================================
  // 📋 DASHBOARD INITIALIZATION & POPULATION
  // ==============================================================================
  async function initDashboard() {
    // 1. Load settings
    const saved = await BdayStorage.getSettings();
    currentSettings = saved ? saved : JSON.parse(JSON.stringify(window.SURPRISE_CONFIG));

    // Populate inputs
    DOM.inputGfName.value = currentSettings.recipientName || '';
    DOM.inputSenderName.value = currentSettings.senderName || '';
    DOM.inputBdayDate.value = currentSettings.birthdayDate || '';
    DOM.inputBgmUrl.value = currentSettings.bgmUrl || '';
    DOM.inputScratchSecret.value = (currentSettings.scratchCard && currentSettings.scratchCard.secretMessage) || '';
    DOM.inputVideoQuote.value = (currentSettings.video && currentSettings.video.endQuote) || '';
    
    if (currentSettings.video && currentSettings.video.videoSrc) {
      DOM.inputYoutubeUrl.value = currentSettings.video.videoSrc;
    }

    if (currentSettings.loveLetter && currentSettings.loveLetter.paragraphs) {
      DOM.inputLetterParagraphs.value = currentSettings.loveLetter.paragraphs.join('\n\n');
    }

    // 2. Load custom photos if already stored in IndexedDB
    loadPhotoPreview('photo_portrait', DOM.prevPortrait, 'assets/girlfriend_portrait.jpg');
    loadPhotoPreview('photo_date', DOM.prevDate, 'assets/memory_date.jpg');
    loadPhotoPreview('photo_sunset', DOM.prevSunset, 'assets/memory_sunset.jpg');
    loadPhotoPreview('photo_couple', DOM.prevCouple, 'assets/hero_couple.jpg');

    // 3. Load custom video if stored in IndexedDB
    loadSavedVideo();

    setupPhotoDropzones();
    setupVideoManager();
    setupTabs();
  }

  async function loadPhotoPreview(key, imgElement, defaultFallback) {
    const customData = await BdayStorage.getMedia(key);
    if (customData) {
      imgElement.src = customData;
    } else {
      imgElement.src = defaultFallback;
    }
  }

  async function loadSavedVideo() {
    const videoData = await BdayStorage.getMedia('custom_wish_video');
    if (videoData) {
      let videoUrl = '';
      if (typeof videoData === 'string') {
        videoUrl = videoData;
      } else if (videoData instanceof Blob) {
        videoUrl = URL.createObjectURL(videoData);
      }
      DOM.adminVideoPlayer.src = videoUrl;
      DOM.videoPreviewWrapper.style.display = 'block';
    }
  }

  // ==============================================================================
  // 📸 PHOTO UPLOADS
  // ==============================================================================
  function setupPhotoDropzones() {
    bindDropzone(DOM.dropPortrait, DOM.filePortrait, 'photo_portrait', DOM.prevPortrait);
    bindDropzone(DOM.dropDate, DOM.fileDate, 'photo_date', DOM.prevDate);
    bindDropzone(DOM.dropSunset, DOM.fileSunset, 'photo_sunset', DOM.prevSunset);
    bindDropzone(DOM.dropCouple, DOM.fileCouple, 'photo_couple', DOM.prevCouple);

    // Reset photo buttons
    DOM.btnSlotRemoves.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const targetKey = btn.dataset.target;
        if (!targetKey) return;
        await BdayStorage.deleteMedia(targetKey);
        showToast('Photo reset to default!');
        if (targetKey === 'photo_portrait') DOM.prevPortrait.src = 'assets/girlfriend_portrait.jpg';
        if (targetKey === 'photo_date') DOM.prevDate.src = 'assets/memory_date.jpg';
        if (targetKey === 'photo_sunset') DOM.prevSunset.src = 'assets/memory_sunset.jpg';
        if (targetKey === 'photo_couple') DOM.prevCouple.src = 'assets/hero_couple.jpg';
      });
    });
  }

  function bindDropzone(dropzone, fileInput, storageKey, imgPreview) {
    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        handleImageFile(fileInput.files[0], storageKey, imgPreview);
      }
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#ff6584';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = '';
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImageFile(e.dataTransfer.files[0], storageKey, imgPreview);
      }
    });
  }

  function handleImageFile(file, storageKey, imgPreview) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file!');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      imgPreview.src = dataUrl;
      await BdayStorage.saveMedia(storageKey, dataUrl, { name: file.name, type: file.type });
      showToast('Image uploaded and saved! ✨');
    };
    reader.readAsDataURL(file);
  }

  // ==============================================================================
  // 🎬 VIDEO MANAGER
  // ==============================================================================
  function setupVideoManager() {
    DOM.dropVideo.addEventListener('click', () => DOM.fileVideo.click());

    DOM.fileVideo.addEventListener('change', () => {
      if (DOM.fileVideo.files && DOM.fileVideo.files[0]) {
        handleVideoFile(DOM.fileVideo.files[0]);
      }
    });

    DOM.dropVideo.addEventListener('dragover', (e) => {
      e.preventDefault();
      DOM.dropVideo.style.borderColor = '#ff6584';
    });

    DOM.dropVideo.addEventListener('dragleave', () => {
      DOM.dropVideo.style.borderColor = '';
    });

    DOM.dropVideo.addEventListener('drop', (e) => {
      e.preventDefault();
      DOM.dropVideo.style.borderColor = '';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleVideoFile(e.dataTransfer.files[0]);
      }
    });

    DOM.btnRemoveVideo.addEventListener('click', async () => {
      await BdayStorage.deleteMedia('custom_wish_video');
      DOM.adminVideoPlayer.src = '';
      DOM.videoPreviewWrapper.style.display = 'none';
      showToast('Uploaded video removed!');
    });
  }

  async function handleVideoFile(file) {
    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file (.mp4, .mov, .webm)!');
      return;
    }

    showToast('Saving video to browser database...');
    await BdayStorage.saveMedia('custom_wish_video', file, { name: file.name, type: file.type });

    const objUrl = URL.createObjectURL(file);
    DOM.adminVideoPlayer.src = objUrl;
    DOM.videoPreviewWrapper.style.display = 'block';
    showToast('Wish video uploaded successfully! 🎬✨');
  }

  function setupTabs() {
    DOM.tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        DOM.tabBtns.forEach((b) => b.classList.remove('active'));
        DOM.tabPanels.forEach((p) => p.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.dataset.tab;
        document.getElementById(targetId).classList.add('active');
      });
    });
  }

  // ==============================================================================
  // 💾 SAVE & EXPORT ACTIONS
  // ==============================================================================
  DOM.btnSaveAll.addEventListener('click', async () => {
    if (!currentSettings) currentSettings = {};

    currentSettings.recipientName = DOM.inputGfName.value.trim() || currentSettings.recipientName;
    currentSettings.senderName = DOM.inputSenderName.value.trim() || currentSettings.senderName;
    currentSettings.birthdayDate = DOM.inputBdayDate.value.trim() || currentSettings.birthdayDate;
    currentSettings.bgmUrl = DOM.inputBgmUrl.value.trim();

    if (!currentSettings.scratchCard) currentSettings.scratchCard = {};
    currentSettings.scratchCard.secretMessage = DOM.inputScratchSecret.value.trim() || currentSettings.scratchCard.secretMessage;

    if (!currentSettings.video) currentSettings.video = {};
    currentSettings.video.endQuote = DOM.inputVideoQuote.value.trim() || currentSettings.video.endQuote;

    const ytUrl = DOM.inputYoutubeUrl.value.trim();
    if (ytUrl) {
      currentSettings.video.videoSrc = ytUrl;
    }

    const parasRaw = DOM.inputLetterParagraphs.value.trim();
    if (parasRaw) {
      if (!currentSettings.loveLetter) currentSettings.loveLetter = {};
      currentSettings.loveLetter.paragraphs = parasRaw.split('\n\n').filter(p => p.trim().length > 0);
    }

    await BdayStorage.saveSettings(currentSettings);
    showToast('Everything saved perfectly! 🎉');

    setTimeout(() => {
      if (confirm('Updates saved! Open the live surprise app to preview now?')) {
        window.open('index.html', '_blank');
      }
    }, 400);
  });

  DOM.btnExportConfig.addEventListener('click', () => {
    if (!currentSettings) return;
    const content = `// Auto-generated configuration by Birthday Surprise Architect\nwindow.SURPRISE_CONFIG = ${JSON.stringify(currentSettings, null, 2)};\n`;
    const blob = new Blob([content], { type: 'application/javascript' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'config.js';
    link.click();
    showToast('config.js downloaded! 📥');
  });

  DOM.btnResetAll.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete all uploaded photos, videos, and custom messages and return to default?')) {
      await BdayStorage.clearAll();
      showToast('Reset complete! Reloading...');
      setTimeout(() => location.reload(), 600);
    }
  });

  // Start Auth check
  checkAuth();

})();

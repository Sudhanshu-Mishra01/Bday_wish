/**
 * ==============================================================================
 * 💖 ROMANTIC BIRTHDAY SURPRISE — INTERACTIVE ENGINE
 * Multi-Stage Journey, Interactive Cake Cutting, Scratch Card & Video Screening
 * ==============================================================================
 */

(function () {
  'use strict';

  // 1. Load Configuration with LocalStorage overrides (from Customizer)
  const savedConfig = localStorage.getItem('romantic_bday_custom_config');
  const CFG = savedConfig ? JSON.parse(savedConfig) : window.SURPRISE_CONFIG;

  // State Management
  const state = {
    currentStage: 1,
    loveClicks: 0,
    envelopeOpened: false,
    crystalsFound: 0,
    scratchRevealed: false,
    candlesLit: 3,
    cakeSliced: false,
    audioPlaying: false,
    activeReelSlide: 0,
    reelInterval: null,
    unlockedCoupons: new Set(),
    redeemedCoupons: new Set(),
    quizAnswers: {},
    task1Completed: false,
    loveMeterMaxed: false
  };

  // DOM Elements
  const DOM = {
    navGfName: document.getElementById('nav-gf-name'),
    stepDots: document.querySelectorAll('.step-dot'),
    totalClicksCount: document.getElementById('total-clicks-count'),
    audioToggleBtn: document.getElementById('audio-toggle-btn'),
    audioPlayer: document.getElementById('custom-audio-player'),
    floatingMascot: document.getElementById('floating-mascot'),
    ambientCanvas: document.getElementById('ambient-canvas'),
    easterEggsLayer: document.getElementById('easter-eggs-layer'),

    // Coupons, Tasks & Toast
    btnOpenWallet: document.getElementById('btn-open-wallet'),
    walletCouponsCount: document.getElementById('wallet-coupons-count'),
    couponWalletDialog: document.getElementById('coupon-wallet-dialog'),
    walletClose: document.getElementById('wallet-close'),
    couponsGrid: document.getElementById('coupons-grid'),
    toastContainer: document.getElementById('toast-container'),

    // Stage 1
    envelopeWrapper: document.getElementById('envelope-wrapper'),
    envelopeFlap: document.getElementById('envelope-flap'),
    waxSeal: document.getElementById('wax-seal'),
    sealStampText: document.getElementById('seal-stamp-text'),
    envelopeTagline: document.getElementById('envelope-tagline'),
    letterTeaserTitle: document.getElementById('letter-teaser-title'),
    letterTeaserBody: document.getElementById('letter-teaser-body'),
    letterDateDisplay: document.getElementById('letter-date-display'),
    btnStartQuest: document.getElementById('btn-start-quest'),
    envelopePromptText: document.getElementById('envelope-prompt-text'),
    affirmationButtons: document.querySelectorAll('.btn-affirmation'),
    affirmationFeedback: document.getElementById('affirmation-feedback'),

    // Stage 2
    crystalsFoundCount: document.getElementById('crystals-found-count'),
    crystalsProgressFill: document.getElementById('crystals-progress-fill'),
    crystalPlayground: document.getElementById('crystal-playground'),
    revealedReasonsGrid: document.getElementById('revealed-reasons-grid'),
    stage2UnlockBanner: document.getElementById('stage2-unlock-banner'),
    soulmateQuizContainer: document.getElementById('soulmate-quiz-container'),
    quizQuestionsFlow: document.getElementById('quiz-questions-flow'),
    quizScoreCard: document.getElementById('quiz-score-card'),
    btnGotoStage3: document.getElementById('btn-goto-stage-3'),

    // Stage 3
    polaroidGallery: document.getElementById('polaroid-gallery'),
    scratchBox: document.getElementById('scratch-box'),
    scratchCanvas: document.getElementById('scratch-canvas'),
    scratchSecretTitle: document.getElementById('scratch-secret-title'),
    scratchSecretBody: document.getElementById('scratch-secret-body'),
    scratchPercent: document.getElementById('scratch-percent'),
    btnScratchInstant: document.getElementById('btn-scratch-instant'),
    stage3UnlockBanner: document.getElementById('stage3-unlock-banner'),
    btnGotoStage4: document.getElementById('btn-goto-stage-4'),

    // Stage 4
    letterSalutationText: document.getElementById('letter-salutation-text'),
    letterParagraphsContainer: document.getElementById('letter-paragraphs-container'),
    letterClosingText: document.getElementById('letter-closing-text'),
    letterSignatureText: document.getElementById('letter-signature-text'),
    tokenButtons: document.querySelectorAll('.token-btn'),
    btnGotoStage5: document.getElementById('btn-goto-stage-5'),

    // Stage 5
    candlesTracker: document.getElementById('candles-tracker'),
    candlesRemainingCount: document.getElementById('candles-remaining-count'),
    candlesRow: document.getElementById('candles-row'),
    candleItems: document.querySelectorAll('.candle-item'),
    sliceLine: document.getElementById('slice-line'),
    cakeSlicePiece: document.getElementById('cake-slice-piece'),
    goldenKnife: document.getElementById('golden-knife'),
    btnBlowAll: document.getElementById('btn-blow-all'),
    btnTriggerCut: document.getElementById('btn-trigger-cut'),
    cakeSuccessCard: document.getElementById('cake-success-card'),
    cakeSuccessTitle: document.getElementById('cake-success-title'),
    cakeSuccessMsg: document.getElementById('cake-success-msg'),
    btnGotoStage6: document.getElementById('btn-goto-stage-6'),

    // Stage 6
    videoEmbedBox: document.getElementById('video-embed-box'),
    animatedMemoryReel: document.getElementById('animated-memory-reel'),
    videoEndQuote: document.getElementById('video-end-quote'),
    btnBlastConfetti: document.getElementById('btn-blast-confetti'),
    btnShareWhatsapp: document.getElementById('btn-share-whatsapp'),
    btnDownloadCard: document.getElementById('btn-download-card'),
    btnRestartQuest: document.getElementById('btn-restart-quest'),

    // Modals
    lightboxDialog: document.getElementById('lightbox-dialog'),
    lightboxImg: document.getElementById('lightbox-img'),
    lightboxCaptionText: document.getElementById('lightbox-caption-text'),
    lightboxClose: document.getElementById('lightbox-close'),

    reasonDialog: document.getElementById('reason-dialog'),
    reasonPopIcon: document.getElementById('reason-pop-icon'),
    reasonPopTitle: document.getElementById('reason-pop-title'),
    reasonPopText: document.getElementById('reason-pop-text'),
    reasonPopClose: document.getElementById('reason-pop-close'),

    customizerDialog: document.getElementById('customizer-dialog'),
    btnOpenCustomizer: document.getElementById('btn-open-customizer'),
    customizerClose: document.getElementById('customizer-close'),
    btnSaveCustomizer: document.getElementById('btn-save-customizer'),
    btnResetDefaults: document.getElementById('btn-reset-defaults'),

    // Interactive Bombardment & Love Meter
    btnKissStorm: document.getElementById('btn-kiss-storm'),
    loveMeterFill: document.getElementById('love-meter-fill'),
    loveMeterText: document.getElementById('love-meter-text'),
    floatingStickers: document.querySelectorAll('.floating-sticker')
  };

  // ==============================================================================
  // 🎵 WEB AUDIO API: PROCEDURAL ROMANTIC SYNTHESIZER & SOUND FX
  // Works out of the box with zero external mp3 files required!
  // ==============================================================================
  let audioCtx = null;
  let bgmOscInterval = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.5, gainVal = 0.15) {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio tone err:', e);
    }
  }

  // Romantic Sound Effects
  function playChime() {
    initAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => playTone(freq, 'sine', 0.8, 0.18), idx * 110);
    });
  }

  function playBubblePop() {
    initAudioContext();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(950, audioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  }

  function playCandleBlow() {
    initAudioContext();
    // Gentle soft whoosh
    playTone(180, 'sine', 0.4, 0.15);
  }

  function playSliceSound() {
    initAudioContext();
    if (!audioCtx) return;
    playTone(880, 'triangle', 0.2, 0.2);
    setTimeout(() => playTone(1320, 'sine', 0.4, 0.25), 80);
  }

  function playFanfare() {
    initAudioContext();
    const melody = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    melody.forEach((note, i) => {
      setTimeout(() => playTone(note, 'sine', 0.7, 0.22), i * 140);
    });
  }

  function playKissSound() {
    initAudioContext();
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, audioCtx.currentTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(1100, audioCtx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } catch (e) {}
  }

  // Built-in Romantic Procedural Background Arpeggio
  function startProceduralBGM() {
    initAudioContext();
    if (bgmOscInterval) clearInterval(bgmOscInterval);

    // Ethereal Pentatonic progression: C Major / A Minor romantic arpeggios
    const romanticChords = [
      [261.63, 329.63, 392.00, 523.25], // C Maj
      [220.00, 261.63, 329.63, 440.00], // A Min
      [174.61, 220.00, 261.63, 349.23], // F Maj
      [196.00, 246.94, 293.66, 392.00]  // G Maj
    ];

    let chordIdx = 0;
    let noteIdx = 0;

    bgmOscInterval = setInterval(() => {
      if (!state.audioPlaying) return;
      const currentChord = romanticChords[chordIdx];
      const freq = currentChord[noteIdx];
      playTone(freq, 'sine', 1.8, 0.08);

      noteIdx++;
      if (noteIdx >= currentChord.length) {
        noteIdx = 0;
        chordIdx = (chordIdx + 1) % romanticChords.length;
      }
    }, 600);
  }

  function stopProceduralBGM() {
    if (bgmOscInterval) {
      clearInterval(bgmOscInterval);
      bgmOscInterval = null;
    }
  }

  function toggleMusic() {
    initAudioContext();
    state.audioPlaying = !state.audioPlaying;

    if (state.audioPlaying) {
      DOM.audioToggleBtn.classList.add('playing');
      const statusText = DOM.audioToggleBtn.querySelector('.music-status-text');
      if (statusText) statusText.textContent = 'Pause Music';

      if (CFG.bgmUrl && CFG.bgmUrl.trim() !== '') {
        DOM.audioPlayer.src = CFG.bgmUrl;
        DOM.audioPlayer.play().catch(e => {
          console.log('Audio autoplay prevented, using synth fallback', e);
          startProceduralBGM();
        });
      } else {
        startProceduralBGM();
      }
    } else {
      DOM.audioToggleBtn.classList.remove('playing');
      const statusText = DOM.audioToggleBtn.querySelector('.music-status-text');
      if (statusText) statusText.textContent = 'Play Melody';

      if (DOM.audioPlayer) DOM.audioPlayer.pause();
      stopProceduralBGM();
    }
  }

  // ==============================================================================
  // 💖 LOVE CLICKS, LOVE METER & KISS BOMBARDMENT ENGINE
  // ==============================================================================
  let currentLoveMeter = 20;

  function updateLoveMeter(amount = 3) {
    currentLoveMeter = Math.min(100, currentLoveMeter + amount);
    if (DOM.loveMeterFill) DOM.loveMeterFill.style.width = `${currentLoveMeter}%`;
    if (DOM.loveMeterText) DOM.loveMeterText.textContent = `${currentLoveMeter}% Love`;

    if (currentLoveMeter >= 100 && !state.loveMeterMaxed) {
      state.loveMeterMaxed = true;
      triggerGrandConfettiShow();
      playFanfare();
      triggerKissBombardment(window.innerWidth / 2, window.innerHeight / 2);
    }
  }

  function registerLoveClick(x, y) {
    state.loveClicks++;
    DOM.totalClicksCount.textContent = state.loveClicks;
    updateLoveMeter(2);

    // Trigger subtle floating heart at click location
    if (x && y) {
      spawnFloatingHeart(x, y);
    }
  }

  function triggerKissBombardment(originX, originY) {
    playKissSound();
    registerLoveClick(originX, originY);
    updateLoveMeter(5);

    const emojis = ['💋', '💖', '🧸', '🤗', '🌸', '✨', '👑', '🥰', '💕', '🌹'];
    const count = 36;
    const startX = originX || (window.innerWidth / 2);
    const startY = originY || (window.innerHeight / 2);

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const p = document.createElement('div');
        p.className = 'kiss-storm-particle';
        p.textContent = emojis[Math.floor(Math.random() * emojis.length)];

        const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
        const dist = Math.random() * 300 + 100;
        const vx = Math.cos(angle) * dist;
        const vy = Math.sin(angle) * dist - (Math.random() * 160 + 60);
        const rot = Math.random() * 50 - 25;
        const rotEnd = rot + (Math.random() * 100 - 50);

        p.style.left = `${startX}px`;
        p.style.top = `${startY}px`;
        p.style.setProperty('--vx', `${vx}px`);
        p.style.setProperty('--vy', `${vy}px`);
        p.style.setProperty('--rot', `${rot}deg`);
        p.style.setProperty('--rot-end', `${rotEnd}deg`);

        document.body.appendChild(p);
        setTimeout(() => p.remove(), 2300);
      }, i * 32);
    }

    // Affectionate alert banner
    const quotes = [
      '💋 EMERGENCY KISS SHOWER ACTIVATED! 💋',
      '🫂 Sending 100,000 warm hugs directly to your heart! 🧸',
      '🥰 He is absolutely, irrevocably in love with you! 💖',
      '👑 Royal Alert: The Birthday Queen deserves endless love! ✨',
      '🌸 You are the sweetest girl in the entire universe! 💖'
    ];
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    const bubble = document.createElement('div');
    bubble.className = 'stage-badge';
    bubble.style.position = 'fixed';
    bubble.style.top = '78px';
    bubble.style.left = '50%';
    bubble.style.transform = 'translateX(-50%)';
    bubble.style.zIndex = '9999';
    bubble.style.background = 'linear-gradient(135deg, #ff477e, #e84393)';
    bubble.style.color = '#ffffff';
    bubble.style.boxShadow = '0 10px 30px rgba(232, 67, 147, 0.6)';
    bubble.style.fontSize = '0.92rem';
    bubble.textContent = q;
    document.body.appendChild(bubble);

    setTimeout(() => {
      bubble.style.transition = 'opacity 0.6s ease';
      bubble.style.opacity = '0';
      setTimeout(() => bubble.remove(), 600);
    }, 2800);
  }

  function spawnFloatingHeart(x, y, emoji = '💖') {
    const bubble = document.createElement('div');
    bubble.className = 'easter-egg-bubble';
    bubble.textContent = emoji;
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    DOM.easterEggsLayer.appendChild(bubble);

    setTimeout(() => {
      bubble.remove();
    }, 1800);
  }

  // Confetti helper
  function triggerConfettiBurst(origin = { x: 0.5, y: 0.5 }) {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: origin,
        colors: ['#ff6584', '#ffd166', '#e84393', '#ffffff', '#a855f7']
      });
    }
  }

  function triggerGrandConfettiShow() {
    if (typeof confetti !== 'function') return;
    const duration = 3.5 * 1000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      confetti({
        particleCount: 30,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 }
      });
      confetti({
        particleCount: 30,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 }
      });
    }, 250);
  }

  // ==============================================================================
  // 🗺️ STAGE NAVIGATION
  // ==============================================================================
  let renderScratchFoil = null;

  function switchStage(stageNum) {
    if (stageNum < 1 || stageNum > 6) return;
    state.currentStage = stageNum;

    // Update Stage Sections
    document.querySelectorAll('.stage-section').forEach((section, idx) => {
      const isActive = idx + 1 === stageNum;
      section.classList.toggle('active', isActive);
      if (isActive) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    // Update Navigation Dots
    DOM.stepDots.forEach((dot, idx) => {
      const stepIdx = idx + 1;
      dot.classList.toggle('active', stepIdx === stageNum);
      dot.classList.toggle('completed', stepIdx < stageNum);
    });

    // When entering Stage 3, ensure scratch foil is freshly and accurately drawn
    if (stageNum === 3) {
      setTimeout(() => {
        if (typeof renderScratchFoil === 'function') {
          renderScratchFoil();
        }
      }, 50);
      setTimeout(() => {
        if (typeof renderScratchFoil === 'function') {
          renderScratchFoil();
        }
      }, 250);
    }

    playChime();
    registerLoveClick();
  }

  // ==============================================================================
  // 🎟️ LOVE COUPONS & FLOATING REWARD TOAST SYSTEM
  // ==============================================================================
  function showLoveToast(icon, title, desc, duration = 4000) {
    if (!DOM.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'love-toast';
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <div class="toast-text">
        <div><strong>${title}</strong></div>
        <div style="font-size: 0.78rem; opacity: 0.88; margin-top: 2px;">${desc}</div>
      </div>
    `;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  function unlockCouponByIndex(index, silent = false) {
    const coupons = CFG.loveCoupons || [];
    if (index < 0 || index >= coupons.length) return;
    const coupon = coupons[index];
    if (state.unlockedCoupons.has(coupon.id)) return;

    state.unlockedCoupons.add(coupon.id);
    if (DOM.walletCouponsCount) {
      DOM.walletCouponsCount.textContent = state.unlockedCoupons.size;
    }

    // Pulse wallet chip in navbar
    if (DOM.btnOpenWallet) {
      DOM.btnOpenWallet.classList.add('pulse-hover');
      setTimeout(() => {
        if (DOM.btnOpenWallet) DOM.btnOpenWallet.classList.remove('pulse-hover');
      }, 2500);
    }

    if (!silent) {
      showLoveToast(coupon.icon, `🎟️ COUPON WON: ${coupon.title}`, `Added to your Love Wallet! Tap Wallet to view.`);
      triggerConfettiBurst();
      playFanfare();
    }
  }

  function renderCouponWallet() {
    if (!DOM.couponsGrid) return;
    DOM.couponsGrid.innerHTML = '';

    const coupons = CFG.loveCoupons || [];
    coupons.forEach((coupon) => {
      const isUnlocked = state.unlockedCoupons.has(coupon.id);
      const isRedeemed = state.redeemedCoupons.has(coupon.id);

      const card = document.createElement('div');
      card.className = `coupon-card ${isUnlocked ? '' : 'locked'}`;

      card.innerHTML = `
        <div class="coupon-top-row">
          <span class="coupon-icon">${coupon.icon}</span>
          <span class="coupon-tag">${isUnlocked ? coupon.tag : '🔒 LOCKED'}</span>
        </div>
        <h4 class="coupon-title">${coupon.title}</h4>
        <p class="coupon-desc">${isUnlocked ? coupon.desc : 'Complete quest tasks on screen to unlock this voucher!'}</p>
        ${isUnlocked ? (
          isRedeemed ? `
            <div class="coupon-redeemed-badge">✅ REDEEMED! (Boyfriend owes you a kiss 💋)</div>
          ` : `
            <button type="button" class="btn-redeem-coupon" data-id="${coupon.id}">
              💋 Redeem with a Kiss
            </button>
          `
        ) : ''}
      `;

      if (isUnlocked && !isRedeemed) {
        const btnRedeem = card.querySelector('.btn-redeem-coupon');
        if (btnRedeem) {
          btnRedeem.addEventListener('click', (e) => {
            e.stopPropagation();
            state.redeemedCoupons.add(coupon.id);
            playKissSound();
            triggerKissBombardment(e.clientX, e.clientY);
            showLoveToast('💋', 'COUPON REDEEMED!', `Go claim your sweet kiss from him right now! 🥰`);
            renderCouponWallet();
          });
        }
      }

      DOM.couponsGrid.appendChild(card);
    });
  }

  function initWalletModal() {
    if (DOM.btnOpenWallet && DOM.couponWalletDialog) {
      DOM.btnOpenWallet.addEventListener('click', () => {
        renderCouponWallet();
        DOM.couponWalletDialog.showModal();
        playChime();
      });
    }

    if (DOM.walletClose && DOM.couponWalletDialog) {
      DOM.walletClose.addEventListener('click', () => {
        DOM.couponWalletDialog.close();
      });
    }
  }

  // ==============================================================================
  // 💌 STAGE 1: ENVELOPE & WAX SEAL INTERACTION
  // ==============================================================================
  function initStage1() {
    DOM.navGfName.textContent = CFG.recipientName || 'My Princess';
    if (DOM.sealStampText) DOM.sealStampText.textContent = CFG.envelope.stampText || 'FOR HER';
    if (DOM.envelopeTagline) DOM.envelopeTagline.textContent = `✨ ${CFG.envelope.tagline} ✨`;
    if (DOM.letterTeaserTitle) DOM.letterTeaserTitle.textContent = `${CFG.envelope.teaserTitle} 💕`;
    if (DOM.letterDateDisplay) DOM.letterDateDisplay.textContent = CFG.birthdayDate || 'Today is your day!';
    if (DOM.letterTeaserBody) DOM.letterTeaserBody.textContent = CFG.envelope.teaserBody;
    if (DOM.btnStartQuest) DOM.btnStartQuest.textContent = CFG.envelope.startButtonText || 'Begin Love Quest 🗝️';

    // Break Wax Seal Click
    DOM.waxSeal.addEventListener('click', function (e) {
      if (state.envelopeOpened) return;
      state.envelopeOpened = true;

      const rect = DOM.waxSeal.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      triggerConfettiBurst({ x, y });
      playChime();
      registerLoveClick(e.clientX, e.clientY);

      DOM.envelopeWrapper.classList.add('open');
      DOM.envelopePromptText.innerHTML = '🎉 <strong>Seal Broken!</strong> Complete your sweet task on the letter above!';

      // Auto start music on first envelope click
      if (!state.audioPlaying) {
        toggleMusic();
      }
    });

    // Cute Task 1: Sweet Security Check (Affirmation Verification)
    if (DOM.affirmationButtons) {
      DOM.affirmationButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          DOM.affirmationButtons.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');

          playKissSound();
          registerLoveClick(e.clientX, e.clientY);
          triggerConfettiBurst({
            x: e.clientX / window.innerWidth,
            y: e.clientY / window.innerHeight
          });

          if (DOM.affirmationFeedback) {
            DOM.affirmationFeedback.classList.remove('hidden');
            DOM.affirmationFeedback.innerHTML = `🎉 <strong>100% CORRECT!</strong> Key Unlocked & You won Coupon #1: <em>Infinite Tight Hugs Pass</em>! 🫂`;
          }

          // Award Coupon #1 (index 0)
          unlockCouponByIndex(0);

          if (DOM.btnStartQuest) {
            DOM.btnStartQuest.classList.add('pulse-hover');
          }
          state.task1Completed = true;
        });
      });
    }

    DOM.btnStartQuest.addEventListener('click', function (e) {
      registerLoveClick(e.clientX, e.clientY);
      switchStage(2);
    });
  }

  // ==============================================================================
  // ✨ STAGE 2: CONSTELLATION OF LOVE CRYSTALS (CLICK HUNT)
  // ==============================================================================
  function initStage2() {
    DOM.crystalPlayground.innerHTML = '';
    DOM.revealedReasonsGrid.innerHTML = '';

    const reasons = CFG.loveReasons || [];
    const totalReasons = reasons.length;
    DOM.crystalsFoundCount.textContent = '0';
    DOM.crystalsProgressFill.style.width = '0%';

    reasons.forEach((reason, index) => {
      // 1. Create Floating Interactive Orb in playground
      const orb = document.createElement('div');
      orb.className = 'crystal-orb';
      orb.style.setProperty('--orb-color', reason.color || '#ff6b8b');
      
      // Random coordinates within playground box
      const posX = 10 + (index * (75 / totalReasons)) + (Math.random() * 8);
      const posY = 15 + ((index % 3) * 28) + (Math.random() * 10);
      orb.style.left = `${posX}%`;
      orb.style.top = `${posY}%`;
      orb.style.animationDelay = `${index * 0.4}s`;

      orb.innerHTML = `
        <span class="orb-icon">${reason.icon || '💖'}</span>
        <span class="orb-num">#${reason.id}</span>
      `;

      orb.addEventListener('click', (e) => {
        if (orb.classList.contains('popped')) return;
        
        orb.classList.add('popped');
        playBubblePop();
        registerLoveClick(e.clientX, e.clientY);

        // Particle burst at orb position
        const rect = orb.getBoundingClientRect();
        triggerConfettiBurst({
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight
        });

        // Show Reason Pop Modal
        showReasonModal(reason);

        // Add to revealed list
        addRevealedReasonCard(reason);

        // Update progress
        state.crystalsFound++;
        DOM.crystalsFoundCount.textContent = state.crystalsFound;
        const pct = (state.crystalsFound / totalReasons) * 100;
        DOM.crystalsProgressFill.style.width = `${pct}%`;

        // Award Love Coupon for this crystal (coupons 1 to 5)
        if (index + 1 < (CFG.loveCoupons || []).length) {
          unlockCouponByIndex(index + 1);
        }

        // Check completion
        if (state.crystalsFound >= totalReasons) {
          setTimeout(() => {
            playFanfare();
            triggerGrandConfettiShow();
            DOM.stage2UnlockBanner.classList.remove('hidden');
            renderSoulmateQuiz();
          }, 800);
        }
      });

      DOM.crystalPlayground.appendChild(orb);
    });

    DOM.btnGotoStage3.addEventListener('click', (e) => {
      registerLoveClick(e.clientX, e.clientY);
      switchStage(3);
    });
  }

  // ==============================================================================
  // 🧩 TASK 2: SOULMATE COMPATIBILITY QUIZ
  // ==============================================================================
  function renderSoulmateQuiz() {
    if (!DOM.quizQuestionsFlow) return;
    DOM.quizQuestionsFlow.innerHTML = '';
    const questions = CFG.soulmateQuiz || [];
    let answeredCount = 0;

    questions.forEach((q, qIndex) => {
      const qBox = document.createElement('div');
      qBox.className = 'quiz-question-box';
      qBox.innerHTML = `
        <div class="quiz-q-text">Q${qIndex + 1}: ${q.question}</div>
        <div class="quiz-options-list"></div>
        <div class="quiz-feedback hidden"></div>
      `;

      const optionsList = qBox.querySelector('.quiz-options-list');
      const feedbackEl = qBox.querySelector('.quiz-feedback');

      (q.options || []).forEach((opt) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-opt-btn';
        btn.textContent = opt.text;

        btn.addEventListener('click', (e) => {
          if (qBox.dataset.answered === 'true') return;
          qBox.dataset.answered = 'true';

          optionsList.querySelectorAll('.quiz-opt-btn').forEach(b => b.classList.remove('answered'));
          btn.classList.add('answered');

          playKissSound();
          registerLoveClick(e.clientX, e.clientY);
          triggerConfettiBurst({
            x: e.clientX / window.innerWidth,
            y: e.clientY / window.innerHeight
          });

          if (feedbackEl) {
            feedbackEl.classList.remove('hidden');
            feedbackEl.textContent = `✨ ${opt.feedback}`;
          }

          answeredCount++;
          if (answeredCount >= questions.length) {
            setTimeout(() => {
              playFanfare();
              triggerGrandConfettiShow();
              if (DOM.quizScoreCard) {
                DOM.quizScoreCard.classList.remove('hidden');
              }
              if (DOM.btnGotoStage3) {
                DOM.btnGotoStage3.classList.add('pulse-hover');
              }
              showLoveToast('👑', 'SOULMATE TEST: 10,000,000% MATCH!', 'Memory Lane is officially unlocked!');
            }, 600);
          }
        });

        optionsList.appendChild(btn);
      });

      DOM.quizQuestionsFlow.appendChild(qBox);
    });
  }

  function showReasonModal(reason) {
    DOM.reasonPopIcon.textContent = reason.icon || '💖';
    DOM.reasonPopTitle.textContent = reason.title;
    DOM.reasonPopText.textContent = reason.text;
    DOM.reasonDialog.showModal();
  }

  DOM.reasonPopClose.addEventListener('click', () => {
    DOM.reasonDialog.close();
  });

  function addRevealedReasonCard(reason) {
    const card = document.createElement('div');
    card.className = 'reason-card';
    card.innerHTML = `
      <div class="reason-card-icon">${reason.icon || '💖'}</div>
      <div>
        <h4 class="reason-card-title">${reason.title}</h4>
        <p class="reason-card-text">${reason.text}</p>
      </div>
    `;
    DOM.revealedReasonsGrid.appendChild(card);
  }

  // ==============================================================================
  // 📸 STAGE 3: POLAROIDS & INTERACTIVE SCRATCH-OFF CARD
  // ==============================================================================
  function initStage3() {
    DOM.polaroidGallery.innerHTML = '';
    const gallery = CFG.gallery || [];

    gallery.forEach((item) => {
      const polaroid = document.createElement('div');
      polaroid.className = 'polaroid-item';
      polaroid.innerHTML = `
        <div class="polaroid-inner">
          <div class="polaroid-front">
            <div class="polaroid-tape"></div>
            <div class="polaroid-image-frame">
              <img src="${item.image}" alt="${item.title}" loading="lazy">
            </div>
            <div class="polaroid-caption">
              <h3 class="polaroid-title">${item.title}</h3>
              <p class="polaroid-date">${item.date || 'Sweet Memory'}</p>
            </div>
          </div>
          <div class="polaroid-back">
            <span class="back-doodle">💌</span>
            <p class="back-text">"${item.caption}"</p>
            <p class="back-hint">(Tap to flip back)</p>
          </div>
        </div>
      `;

      // 3D Parallax Tilt for ultra-smooth responsiveness
      polaroid.addEventListener('mousemove', (e) => {
        if (polaroid.classList.contains('flipped')) return;
        const rect = polaroid.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotX = -(y / rect.height) * 12;
        const rotY = (x / rect.width) * 12;
        polaroid.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.04, 1.04, 1.04) translateY(-6px)`;
      });

      polaroid.addEventListener('mouseleave', () => {
        if (!polaroid.classList.contains('flipped')) {
          polaroid.style.transform = '';
        }
      });

      // Flip on click
      polaroid.addEventListener('click', (e) => {
        // If image itself was clicked on front, open zoom lightbox
        if (e.target.tagName === 'IMG' && !polaroid.classList.contains('flipped')) {
          e.stopPropagation();
          openLightbox(item.image, `${item.title} — ${item.caption}`);
          registerLoveClick(e.clientX, e.clientY);
          return;
        }

        polaroid.classList.toggle('flipped');
        if (polaroid.classList.contains('flipped')) {
          polaroid.style.transform = '';
        }
        playChime();
        registerLoveClick(e.clientX, e.clientY);
      });

      DOM.polaroidGallery.appendChild(polaroid);
    });

    // Scratch Card Setup
    initScratchCard();

    DOM.btnGotoStage4.addEventListener('click', (e) => {
      registerLoveClick(e.clientX, e.clientY);
      switchStage(4);
    });
  }

  function openLightbox(src, caption) {
    DOM.lightboxImg.src = src;
    DOM.lightboxCaptionText.textContent = caption;
    DOM.lightboxDialog.showModal();
  }

  DOM.lightboxClose.addEventListener('click', () => {
    DOM.lightboxDialog.close();
  });

  // Interactive HTML5 Canvas Scratch Card
  function initScratchCard() {
    const cardData = CFG.scratchCard || {};
    DOM.scratchSecretTitle.textContent = cardData.secretTitle || 'My Eternal Promise 💖';
    DOM.scratchSecretBody.textContent = cardData.secretMessage || 'I love you with all my heart!';

    const canvas = DOM.scratchCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const box = DOM.scratchBox;

    let foilDrawn = false;

    renderScratchFoil = function () {
      if (state.scratchRevealed) return;

      const rect = box.getBoundingClientRect();
      const w = Math.round(rect.width || box.clientWidth || 440);
      const h = Math.round(rect.height || box.clientHeight || 220);

      // If dimensions are still 0 (hidden), retry shortly
      if (w <= 0 || h <= 0) {
        setTimeout(renderScratchFoil, 60);
        return;
      }

      // If dimensions are identical and foil is already drawn, do not redraw
      if (canvas.width === w && canvas.height === h && foilDrawn) {
        return;
      }

      canvas.width = w;
      canvas.height = h;
      canvas.style.opacity = '1';
      canvas.style.display = 'block';

      ctx.globalCompositeOperation = 'source-over';

      // Draw rich metallic rose-gold foil gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#f6d365');
      grad.addColorStop(0.25, '#fda085');
      grad.addColorStop(0.55, '#ffd166');
      grad.addColorStop(0.85, '#ff758c');
      grad.addColorStop(1, '#e84393');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Gold shimmer sparkle dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 40; i++) {
        const sx = (i * 47) % w;
        const sy = (i * 31) % h;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Crisp instructional text
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 6;
      ctx.font = 'bold 18px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✨ Scratch Here to Reveal Secret! ✨', w / 2, h / 2 - 14);

      ctx.font = '600 13px Outfit, sans-serif';
      ctx.fillStyle = '#fffdf0';
      ctx.fillText('Swipe with your finger or mouse', w / 2, h / 2 + 16);
      ctx.shadowBlur = 0;

      foilDrawn = true;
    };

    window.addEventListener('resize', () => {
      foilDrawn = false;
      renderScratchFoil();
    });

    function revealScratchSecret(playEffects = true) {
      if (state.scratchRevealed) return;
      state.scratchRevealed = true;

      DOM.scratchPercent.textContent = '100%';
      canvas.style.transition = 'opacity 0.6s ease';
      canvas.style.opacity = '0';
      setTimeout(() => {
        canvas.style.display = 'none';
      }, 600);

      if (DOM.btnScratchInstant) {
        DOM.btnScratchInstant.style.display = 'none';
      }

      if (playEffects) {
        playFanfare();
        triggerGrandConfettiShow();
      }
      showLoveToast('📜', 'PROMISE UNLOCKED!', 'A permanent promise recorded in the vault of his heart 💖');
      DOM.stage3UnlockBanner.classList.remove('hidden');
    }

    if (DOM.btnScratchInstant) {
      DOM.btnScratchInstant.addEventListener('click', () => {
        revealScratchSecret(true);
      });
    }

    let isScratching = false;

    function scratchAt(clientX, clientY) {
      if (state.scratchRevealed) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 32, 0, Math.PI * 2);
      ctx.fill();

      checkScratchProgress();
    }

    function checkScratchProgress() {
      if (state.scratchRevealed) return;

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imgData.data;
      let transparentPixels = 0;
      const totalSampled = pixels.length / 16;

      for (let i = 3; i < pixels.length; i += 16) {
        if (pixels[i] === 0) {
          transparentPixels++;
        }
      }

      const percent = Math.min(100, Math.round((transparentPixels / totalSampled) * 100));
      DOM.scratchPercent.textContent = `${percent}%`;

      if (percent > 40) {
        revealScratchSecret(true);
      }
    }

    // Pointer events for desktop & mobile touch
    canvas.addEventListener('mousedown', (e) => {
      isScratching = true;
      scratchAt(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => { isScratching = false; });

    canvas.addEventListener('mousemove', (e) => {
      if (!isScratching) return;
      scratchAt(e.clientX, e.clientY);
    });

    canvas.addEventListener('touchstart', (e) => {
      isScratching = true;
      if (e.touches && e.touches[0]) {
        scratchAt(e.touches[0].clientX, e.touches[0].clientY);
      }
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      if (!isScratching) return;
      if (e.touches && e.touches[0]) {
        scratchAt(e.touches[0].clientX, e.touches[0].clientY);
      }
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', () => { isScratching = false; });
  }

  // ==============================================================================
  // 📜 STAGE 4: HEARTFELT LOVE LETTER SCROLL
  // ==============================================================================
  function initStage4() {
    const letter = CFG.loveLetter || {};
    DOM.letterSalutationText.textContent = letter.salutation || 'To My Dearest Love,';
    DOM.letterClosingText.textContent = letter.closing || 'Forever & Always Yours,';
    DOM.letterSignatureText.textContent = `${letter.signature || 'With All My Heart'} ❤️`;

    DOM.letterParagraphsContainer.innerHTML = '';
    (letter.paragraphs || []).forEach((para) => {
      const p = document.createElement('p');
      p.textContent = para;
      DOM.letterParagraphsContainer.appendChild(p);
    });

    // Reaction tokens
    DOM.tokenButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const type = btn.dataset.reaction;
        let emoji = '💖';
        let toastTitle = 'Love Multiplied!';
        let toastDesc = 'He loves you infinitely more than words could say! 💖';

        if (type === 'kiss') {
          emoji = '💋';
          toastTitle = 'Kiss Received!';
          toastDesc = 'A million sweet kisses delivered straight to his heart! 💋';
        } else if (type === 'hug') {
          emoji = '🤗';
          toastTitle = 'Warm Hug Received!';
          toastDesc = 'He is holding you tight in his warm embrace! 🧸';
        } else if (type === 'blush') {
          emoji = '🥰';
          toastTitle = 'Blush Alert!';
          toastDesc = 'You are the most adorable cutie in the universe! 🌸';
        }

        playChime();
        registerLoveClick(e.clientX, e.clientY);
        showLoveToast(emoji, toastTitle, toastDesc, 3500);

        for (let i = 0; i < 6; i++) {
          setTimeout(() => {
            spawnFloatingHeart(
              e.clientX + (Math.random() * 80 - 40),
              e.clientY + (Math.random() * 60 - 30),
              emoji
            );
          }, i * 110);
        }

        btn.style.transform = 'scale(1.2)';
        setTimeout(() => { btn.style.transform = ''; }, 300);
      });
    });

    DOM.btnGotoStage5.addEventListener('click', (e) => {
      registerLoveClick(e.clientX, e.clientY);
      switchStage(5);
    });
  }

  // ==============================================================================
  // 🎂 STAGE 5: INTERACTIVE CAKE CUTTING CEREMONY
  // ==============================================================================
  const candleWishes = [
    "✨ Wish 1: That your sweet smile never fades!",
    "🌅 Wish 2: A lifetime of cozy adventures together!",
    "🎂 Wish 3: Every secret dream of yours comes true!"
  ];

  function initStage5() {
    state.candlesLit = DOM.candleItems.length;
    DOM.candlesRemainingCount.textContent = state.candlesLit;

    // Candle Tap Actions
    DOM.candleItems.forEach((candle) => {
      candle.addEventListener('click', (e) => {
        if (candle.classList.contains('blown')) return;
        blowOutCandle(candle, e);
      });
    });

    // Blow all button
    DOM.btnBlowAll.addEventListener('click', (e) => {
      DOM.candleItems.forEach((c) => {
        if (!c.classList.contains('blown')) {
          blowOutCandle(c, e);
        }
      });
    });

    // Knife Slice Trigger
    DOM.goldenKnife.addEventListener('click', triggerCakeSlice);
    DOM.btnTriggerCut.addEventListener('click', triggerCakeSlice);

    DOM.btnGotoStage6.addEventListener('click', (e) => {
      registerLoveClick(e.clientX, e.clientY);
      switchStage(6);
    });
  }

  function blowOutCandle(candle, e) {
    if (candle.classList.contains('blown')) return;
    candle.classList.add('blown');
    playCandleBlow();
    registerLoveClick(e ? e.clientX : undefined, e ? e.clientY : undefined);

    const candleIdx = (parseInt(candle.dataset.candle, 10) || 1) - 1;
    const wishMsg = candleWishes[candleIdx] || "✨ A magical birthday wish!";

    // Spawn wish bubble above candle
    const bubble = document.createElement('div');
    bubble.className = 'candle-wish-bubble';
    bubble.textContent = wishMsg;
    candle.appendChild(bubble);

    showLoveToast('🕯️', 'Birthday Wish Made!', wishMsg, 3500);

    state.candlesLit = Math.max(0, state.candlesLit - 1);
    DOM.candlesRemainingCount.textContent = state.candlesLit;

    if (state.candlesLit === 0) {
      DOM.candlesTracker.innerHTML = '🎉 <strong>All 3 candles blown out! Wishes sealed with love — now slice the cake! 🍰</strong>';
      DOM.goldenKnife.classList.remove('disabled');
      DOM.btnTriggerCut.classList.remove('disabled');
      DOM.btnBlowAll.style.display = 'none';

      playFanfare();
      triggerGrandConfettiShow();
    }
  }

  function triggerCakeSlice(e) {
    if (state.candlesLit > 0) {
      alert('Blow out the candles first to make a wish! 🕯️✨');
      return;
    }
    if (state.cakeSliced) return;
    state.cakeSliced = true;

    playSliceSound();
    registerLoveClick(e ? e.clientX : undefined, e ? e.clientY : undefined);

    // Knife slicing animation
    DOM.sliceLine.classList.add('active');
    setTimeout(() => {
      DOM.cakeSlicePiece.classList.add('sliced');
      DOM.goldenKnife.style.display = 'none';
      DOM.btnTriggerCut.style.display = 'none';

      // Confetti & reveal
      playFanfare();
      triggerGrandConfettiShow();
      DOM.cakeSuccessCard.classList.remove('hidden');
    }, 600);
  }

  // ==============================================================================
  // 🎥 STAGE 6: CINEMA MODE VIDEO & FINALE CELEBRATION
  // ==============================================================================
  function initStage6() {
    const videoConfig = CFG.video || {};
    DOM.videoEndQuote.textContent = videoConfig.endQuote || 'Happy Birthday to the girl who stole my heart! 💖';

    // Check if custom video URL is provided
    if (videoConfig.videoSrc && videoConfig.videoSrc.trim() !== '') {
      const src = videoConfig.videoSrc.trim();

      // YouTube embed check
      if (src.includes('youtube.com') || src.includes('youtu.be')) {
        let embedUrl = src;
        if (!src.includes('embed/')) {
          const videoId = src.includes('v=') ? src.split('v=')[1].split('&')[0] : src.split('/').pop();
          embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        }
        DOM.videoEmbedBox.innerHTML = `
          <iframe src="${embedUrl}" title="Birthday Wish Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        `;
      } else {
        // Local MP4 or direct video link
        DOM.videoEmbedBox.innerHTML = `
          <video src="${src}" controls autoplay playsinline></video>
        `;
      }
    } else {
      // Start built-in Memory Reel Slideshow
      startReelSlideshow();
    }

    // Blast Confetti Again Button
    DOM.btnBlastConfetti.addEventListener('click', (e) => {
      playFanfare();
      triggerGrandConfettiShow();
      registerLoveClick(e.clientX, e.clientY);
    });

    // Share on WhatsApp
    DOM.btnShareWhatsapp.addEventListener('click', () => {
      const gfName = CFG.recipientName || 'My Love';
      const text = encodeURIComponent(`Hey! I just went through the wonderful birthday surprise you made for me! I am so touched and I love you so much! 🥰💖🎂`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    });

    // Download Commemorative Keepsake Card
    DOM.btnDownloadCard.addEventListener('click', generateKeepsakeCard);

    // Restart Quest
    DOM.btnRestartQuest.addEventListener('click', () => {
      if (confirm('Replay this entire magical journey from the beginning?')) {
        location.reload();
      }
    });
  }

  // Memory Reel Controls
  function startReelSlideshow() {
    const slides = document.querySelectorAll('.reel-slide');
    if (!slides.length) return;

    let slideIndex = 0;
    let isPlaying = true;

    function showSlide(idx) {
      slides.forEach((s, i) => {
        s.classList.toggle('active', i === idx);
      });
      slideIndex = idx;
    }

    function nextSlide() {
      showSlide((slideIndex + 1) % slides.length);
    }

    function prevSlide() {
      showSlide((slideIndex - 1 + slides.length) % slides.length);
    }

    state.reelInterval = setInterval(nextSlide, 4500);

    const btnNext = document.getElementById('btn-reel-next');
    const btnPrev = document.getElementById('btn-reel-prev');
    const btnToggle = document.getElementById('btn-reel-toggle');

    if (btnNext) btnNext.addEventListener('click', () => { nextSlide(); playChime(); });
    if (btnPrev) btnPrev.addEventListener('click', () => { prevSlide(); playChime(); });
    if (btnToggle) {
      btnToggle.addEventListener('click', () => {
        isPlaying = !isPlaying;
        if (isPlaying) {
          state.reelInterval = setInterval(nextSlide, 4500);
          btnToggle.textContent = '⏸ Pause Slideshow';
        } else {
          clearInterval(state.reelInterval);
          btnToggle.textContent = '▶ Play Slideshow';
        }
      });
    }
  }

  // Generate Digital Keepsake Card as Canvas PNG
  function generateKeepsakeCard() {
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = 1000;
    cardCanvas.height = 700;
    const ctx = cardCanvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 1000, 700);
    grad.addColorStop(0, '#2a082c');
    grad.addColorStop(0.5, '#44143a');
    grad.addColorStop(1, '#150618');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1000, 700);

    // Golden frame border
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, 940, 640);
    ctx.strokeStyle = 'rgba(255, 105, 180, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(42, 42, 916, 616);

    // Text Header
    ctx.fillStyle = '#ff758c';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFFICIAL CERTIFICATE OF INFINITE LOVE', 500, 100);

    // Main Greeting
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Playfair Display", Georgia, serif';
    ctx.fillText(`Happy Birthday, ${CFG.recipientName}! 👑`, 500, 180);

    // Heartfelt quote
    ctx.fillStyle = '#ffd166';
    ctx.font = 'italic 26px "Great Vibes", cursive, Georgia';
    ctx.fillText('"You are my today and all of my tomorrows."', 500, 240);

    // Body text
    ctx.fillStyle = '#fce4ec';
    ctx.font = '20px Outfit, sans-serif';
    ctx.fillText(`Presented with all my love on this very special day.`, 500, 310);
    ctx.fillText(`May every laugh, every dream, and every wish of yours come true.`, 500, 345);
    ctx.fillText(`Total Love Clicks Unlocked: ${state.loveClicks} ✨`, 500, 410);

    // Signature
    ctx.fillStyle = '#ffb8c6';
    ctx.font = 'italic 28px "Great Vibes", cursive';
    ctx.fillText(`${CFG.senderName || 'Your Forever Love'} ❤️`, 500, 500);

    // Convert to image download
    const link = document.createElement('a');
    link.download = `Birthday_Keepsake_For_${(CFG.recipientName || 'Love').replace(/\s+/g, '_')}.png`;
    link.href = cardCanvas.toDataURL('image/png');
    link.click();
  }

  // ==============================================================================
  // 🌟 AMBIENT CANVAS PARTICLES (Petals, Stars & Bokeh)
  // ==============================================================================
  function initAmbientCanvas() {
    const canvas = DOM.ambientCanvas;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = Math.min(65, Math.floor(width / 22));

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 3 + 1,
        speedY: Math.random() * 0.7 + 0.3,
        speedX: Math.random() * 0.5 - 0.25,
        rotation: Math.random() * 360,
        rotSpeed: Math.random() * 1.5 - 0.75,
        type: Math.random() > 0.4 ? 'petal' : 'bokeh',
        color: Math.random() > 0.5 ? 'rgba(255, 182, 193, ' : 'rgba(255, 209, 102, ',
        alpha: Math.random() * 0.6 + 0.2
      });
    }

    function renderParticles() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += Math.sin(p.y * 0.01) * 0.5 + p.speedX;
        p.rotation += p.rotSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (p.type === 'petal') {
          // Draw subtle cherry blossom petal
          ctx.beginPath();
          ctx.ellipse(0, 0, p.radius * 2.2, p.radius, 0, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.alpha})`;
          ctx.fill();
        } else {
          // Draw glowing round bokeh
          ctx.beginPath();
          ctx.arc(0, 0, p.radius * 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.alpha * 0.7})`;
          ctx.fill();
        }

        ctx.restore();
      });

      requestAnimationFrame(renderParticles);
    }

    renderParticles();
  }

  // ==============================================================================
  // ⚙️ BOYFRIEND IN-APP CUSTOMIZER PANEL
  // ==============================================================================
  function initCustomizer() {
    DOM.btnOpenCustomizer.addEventListener('click', () => {
      document.getElementById('edit-gf-name').value = CFG.recipientName || '';
      document.getElementById('edit-sender-name').value = CFG.senderName || '';
      document.getElementById('edit-birthday-date').value = CFG.birthdayDate || '';
      document.getElementById('edit-video-url').value = (CFG.video && CFG.video.videoSrc) || '';
      document.getElementById('edit-bgm-url').value = CFG.bgmUrl || '';
      document.getElementById('edit-scratch-secret').value = (CFG.scratchCard && CFG.scratchCard.secretMessage) || '';
      document.getElementById('edit-love-letter').value = (CFG.loveLetter && CFG.loveLetter.paragraphs) ? CFG.loveLetter.paragraphs.join('\n\n') : '';

      DOM.customizerDialog.showModal();
    });

    DOM.customizerClose.addEventListener('click', () => {
      DOM.customizerDialog.close();
    });

    DOM.btnSaveCustomizer.addEventListener('click', () => {
      CFG.recipientName = document.getElementById('edit-gf-name').value || CFG.recipientName;
      CFG.senderName = document.getElementById('edit-sender-name').value || CFG.senderName;
      CFG.birthdayDate = document.getElementById('edit-birthday-date').value || CFG.birthdayDate;
      if (!CFG.video) CFG.video = {};
      CFG.video.videoSrc = document.getElementById('edit-video-url').value || '';
      CFG.bgmUrl = document.getElementById('edit-bgm-url').value || '';
      if (!CFG.scratchCard) CFG.scratchCard = {};
      CFG.scratchCard.secretMessage = document.getElementById('edit-scratch-secret').value || CFG.scratchCard.secretMessage;

      const paragraphsRaw = document.getElementById('edit-love-letter').value;
      if (paragraphsRaw) {
        if (!CFG.loveLetter) CFG.loveLetter = {};
        CFG.loveLetter.paragraphs = paragraphsRaw.split('\n\n').filter(p => p.trim().length > 0);
      }

      localStorage.setItem('romantic_bday_custom_config', JSON.stringify(CFG));
      alert('✨ Changes saved! Refreshing page to apply updates.');
      location.reload();
    });

    DOM.btnResetDefaults.addEventListener('click', () => {
      if (confirm('Reset all values to original defaults?')) {
        localStorage.removeItem('romantic_bday_custom_config');
        location.reload();
      }
    });
  }

  // ==============================================================================
  // 🐾 MASCOT, STICKERS, KISS STORM & EASTER EGGS
  // ==============================================================================
  function initMascotAndEasterEggs() {
    // 1. Kiss Storm Launcher Button
    if (DOM.btnKissStorm) {
      DOM.btnKissStorm.addEventListener('click', (e) => {
        triggerKissBombardment(e.clientX, e.clientY);
      });
    }

    // 2. Interactive Floating Mascot
    if (DOM.floatingMascot) {
      DOM.floatingMascot.addEventListener('click', (e) => {
        playKissSound();
        registerLoveClick(e.clientX, e.clientY);

        const cuteQuotes = [
          'Sending you 100 kisses! 💋',
          'You are the cutest human ever! 🧸',
          'Smile, it looks gorgeous on you! ✨',
          'You have stolen his entire heart! 💖',
          '100% girlfriend perfection! 👑'
        ];
        const randomQuote = cuteQuotes[Math.floor(Math.random() * cuteQuotes.length)];
        
        const badge = DOM.floatingMascot.querySelector('.mascot-badge');
        if (badge) {
          badge.textContent = randomQuote;
          setTimeout(() => { badge.textContent = 'Tap me! 🐾'; }, 3000);
        }

        for (let i = 0; i < 8; i++) {
          setTimeout(() => {
            spawnFloatingHeart(
              e.clientX + (Math.random() * 80 - 40),
              e.clientY + (Math.random() * 80 - 40),
              ['💖', '🌸', '✨', '💋', '🧸'][i % 5]
            );
          }, i * 80);
        }
      });
    }

    // 3. Clickable Interactive Floating Stickers
    if (DOM.floatingStickers) {
      DOM.floatingStickers.forEach((stk) => {
        stk.style.pointerEvents = 'auto';
        stk.style.cursor = 'pointer';
        stk.addEventListener('click', (e) => {
          e.stopPropagation();
          playKissSound();
          registerLoveClick(e.clientX, e.clientY);
          triggerKissBombardment(e.clientX, e.clientY);
        });
      });
    }

    // 4. Magical Fairy Dust Cursor Trail
    initCursorSparkleTrail();

    // 5. Admin Shortcut & Route check
    checkAdminRoute();

    // 6. Step dots click navigation
    DOM.stepDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const step = parseInt(dot.dataset.step, 10);
        switchStage(step);
      });
    });

    // 7. Audio toggle
    DOM.audioToggleBtn.addEventListener('click', toggleMusic);
  }

  // Magical Fairy Dust & Heart Cursor Trail
  function initCursorSparkleTrail() {
    let lastTime = 0;
    const colors = ['#ffd166', '#ff6584', '#ffb8c6', '#a855f7', '#ffffff'];

    window.addEventListener('pointermove', (e) => {
      const now = Date.now();
      if (now - lastTime < 36) return;
      lastTime = now;

      const p = document.createElement('div');
      p.className = 'cursor-particle';
      const size = Math.random() * 8 + 4;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${e.clientX - size / 2}px`;
      p.style.top = `${e.clientY - size / 2}px`;
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.setProperty('--tx', `${(Math.random() - 0.5) * 20}px`);
      p.style.setProperty('--ty', `${Math.random() * 18 + 6}px`);

      document.body.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }, { passive: true });
  }

  // Hidden Admin Route & Secret Trigger
  function checkAdminRoute() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true' || window.location.hash === '#admin') {
      window.location.href = 'admin.html';
      return;
    }

    // Secret triple click on her name in top navbar opens admin.html
    let nameClickCount = 0;
    let nameClickTimer = null;
    if (DOM.navGfName) {
      DOM.navGfName.style.cursor = 'pointer';
      DOM.navGfName.addEventListener('click', () => {
        nameClickCount++;
        clearTimeout(nameClickTimer);
        if (nameClickCount >= 3) {
          window.open('admin.html', '_blank');
          nameClickCount = 0;
        } else {
          nameClickTimer = setTimeout(() => { nameClickCount = 0; }, 700);
        }
      });
    }

    // Secret keyboard shortcut: Ctrl+Shift+A or Cmd+Shift+A
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        window.open('admin.html', '_blank');
      }
    });
  }

  // Asynchronous IndexedDB Storage Sync
  async function loadAsyncCustomMedia() {
    if (!window.BdayStorage) return;

    try {
      const dbSettings = await BdayStorage.getSettings();
      if (dbSettings) {
        Object.assign(CFG, dbSettings);
        if (DOM.navGfName) DOM.navGfName.textContent = CFG.recipientName || 'My Princess';
      }

      // Check uploaded photos
      const portraitData = await BdayStorage.getMedia('photo_portrait');
      const dateData = await BdayStorage.getMedia('photo_date');
      const sunsetData = await BdayStorage.getMedia('photo_sunset');
      const coupleData = await BdayStorage.getMedia('photo_couple');

      if (portraitData && CFG.gallery && CFG.gallery[0]) CFG.gallery[0].image = portraitData;
      if (dateData && CFG.gallery && CFG.gallery[1]) CFG.gallery[1].image = dateData;
      if (sunsetData && CFG.gallery && CFG.gallery[2]) CFG.gallery[2].image = sunsetData;
      if (coupleData && CFG.gallery && CFG.gallery[3]) CFG.gallery[3].image = coupleData;

      if (portraitData || dateData || sunsetData || coupleData) {
        initStage3();
      }

      // Check uploaded video
      const customVideo = await BdayStorage.getMedia('custom_wish_video');
      if (customVideo) {
        let vSrc = '';
        if (typeof customVideo === 'string') {
          vSrc = customVideo;
        } else if (customVideo instanceof Blob) {
          vSrc = URL.createObjectURL(customVideo);
        }
        if (!CFG.video) CFG.video = {};
        CFG.video.videoSrc = vSrc;
        initStage6();
      }
    } catch (err) {
      console.warn('Storage sync note:', err);
    }
  }

  // ==============================================================================
  // 🚀 BOOTSTRAP APP
  // ==============================================================================
  window.addEventListener('DOMContentLoaded', async () => {
    initStage1();
    initStage2();
    initStage3();
    initStage4();
    initStage5();
    initStage6();
    initAmbientCanvas();
    initCustomizer();
    initMascotAndEasterEggs();
    initWalletModal();

    // Pull any custom media from admin portal
    await loadAsyncCustomMedia();
  });

})();

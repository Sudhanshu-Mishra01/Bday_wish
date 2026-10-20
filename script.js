/**
 * ==============================================================================
 * 💛 CHETNA'S BIRTHDAY — interaction engine
 * Scenes: lock → hello → rule → playground → ride → court → dream → memories
 *         → stars → poem → cake → story → questions → letter → goodnight
 * All words come from config.js (window.SURPRISE_CONFIG).
 * Handy for testing: ?preview skips the countdown, ?preview&scene=ride jumps.
 * ==============================================================================
 */

(function () {
  'use strict';

  const C = window.SURPRISE_CONFIG;
  const $ = (id) => document.getElementById(id);
  const SCENES = ['hello', 'rule', 'playground', 'ride', 'court', 'dream', 'memories', 'stars', 'poem', 'cake', 'story', 'questions', 'letter', 'goodnight'];
  const params = new URLSearchParams(location.search);
  const isPreview = params.has('preview');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fill = (str) => String(str || '')
    .replaceAll('{nickname}', C.nickname)
    .replaceAll('{name}', C.herName)
    .replaceAll('{petName}', C.petName)
    .replaceAll('{age}', C.age);

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem('chetna_bday_' + key);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('chetna_bday_' + key, JSON.stringify(value)); } catch (e) { /* private mode */ }
    },
    clear() {
      try {
        // Keep the unsent activity queue, so a replay never loses what she did
        Object.keys(localStorage).filter((k) => k.startsWith('chetna_bday_') && k !== 'chetna_bday_logq').forEach((k) => localStorage.removeItem(k));
      } catch (e) { /* ignore */ }
    }
  };

  // ==============================================================================
  // 📬 ACTIVITY LOG — her answers, wishes, looks and journey go to /api/log,
  // and show up on the dashboard (dashboard.html). Events wait in a small queue
  // on her phone if the network drops, and are sent when it comes back.
  // Visits with ?preview are tagged so the dashboard can hide test runs.
  // ==============================================================================
  const Log = (() => {
    let device = store.get('device', null);
    if (!device) {
      device = Math.random().toString(36).slice(2, 10);
      store.set('device', device);
    }
    const queue = store.get('logq', []);
    let flushing = false;

    async function flush() {
      if (flushing || !queue.length) return;
      flushing = true;
      try {
        while (queue.length) {
          const res = await fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(queue[0]),
            keepalive: true
          });
          // 4xx = this event will never be accepted; drop it instead of retrying forever
          if (!res.ok && res.status >= 500) break;
          queue.shift();
          store.set('logq', queue);
        }
      } catch (e) { /* offline — retry later */ }
      flushing = false;
    }

    function send(type, data = {}) {
      queue.push({ type, data, at: new Date().toISOString(), device, preview: isPreview });
      while (queue.length > 200) queue.shift();
      store.set('logq', queue);
      flush();
    }

    window.addEventListener('online', flush);
    setInterval(flush, 20000);
    flush();
    return { send };
  })();

  const rand = (min, max) => Math.random() * (max - min) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ==============================================================================
  // 🎵 SOUND — everything is synthesised, no files needed
  // ==============================================================================
  const Sound = (() => {
    let ctx = null;
    let master = null;
    let muted = store.get('muted', false);
    let ambientTimer = null;
    let ambientOn = false;
    let engine = null;
    const musicEl = $('music');

    function ensure() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 1;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    function tone(freq, { type = 'sine', dur = 0.4, vol = 0.15, when = 0, attack = 0.006, slideTo = null } = {}) {
      if (!ensure()) return;
      const t = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }

    function noise({ dur = 0.2, vol = 0.2, when = 0, filter = 1200, type = 'lowpass' } = {}) {
      if (!ensure()) return;
      const t = ctx.currentTime + when;
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = filter;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t);
    }

    // Music-box timbre: fundamental + soft overtones, quick decay
    function box(freq, when = 0, vol = 0.12) {
      tone(freq, { type: 'sine', dur: 1.5, vol, when });
      tone(freq * 2, { type: 'sine', dur: 0.5, vol: vol * 0.3, when });
      tone(freq * 4, { type: 'sine', dur: 0.15, vol: vol * 0.12, when });
    }

    const N = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
    const HAPPY_BIRTHDAY = [
      ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
      ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
      ['G4', 0.75], ['G4', 0.25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
      ['F5', 0.75], ['F5', 0.25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 3]
    ];

    function happyBirthday() {
      if (!ensure()) return 0;
      const beat = 0.42;
      let t = 0.05;
      HAPPY_BIRTHDAY.forEach(([n, b]) => { box(N[n], t, 0.14); t += b * beat; });
      return t * 1000;
    }

    // Gentle lullaby: wandering pentatonic music-box notes
    const LULLABY = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 783.99, 659.25];
    function startAmbient() {
      if (ambientOn) return;
      ambientOn = true;
      if (C.musicUrl) {
        // Same song: carry on from where it paused instead of restarting
        if (musicEl.getAttribute('src') !== C.musicUrl) musicEl.src = C.musicUrl;
        musicEl.volume = 0.55;
        musicEl.play().catch(() => {});
        return;
      }
      if (!ensure()) return;
      let i = 0;
      ambientTimer = setInterval(() => {
        if (!ambientOn) return;
        const step = Math.random() < 0.6 ? 1 : -1;
        i = (i + step + LULLABY.length) % LULLABY.length;
        box(LULLABY[i] / 2, 0, 0.05);
        if (i % 3 === 0) box(LULLABY[(i + 2) % LULLABY.length] / 4, 0.02, 0.03);
      }, 820);
    }
    function stopAmbient() {
      ambientOn = false;
      clearInterval(ambientTimer);
      ambientTimer = null;
      if (!musicEl.paused) musicEl.pause();
    }

    // Bike engine: filtered sawtooth whose pitch follows speed
    function engineOn() {
      if (!ensure() || engine) return;
      const osc = ctx.createOscillator();
      const f = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 45;
      f.type = 'lowpass';
      f.frequency.value = 380;
      g.gain.value = 0.0001;
      osc.connect(f); f.connect(g); g.connect(master);
      osc.start();
      engine = { osc, g };
    }
    function engineSpeed(s) {
      if (!engine) return;
      const t = ctx.currentTime;
      engine.osc.frequency.setTargetAtTime(45 + s * 70, t, 0.1);
      engine.g.gain.setTargetAtTime(s > 0.02 ? 0.05 + s * 0.05 : 0.0001, t, 0.1);
    }
    function engineOff() {
      if (!engine) return;
      const e = engine;
      engine = null;
      e.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1);
      setTimeout(() => e.osc.stop(), 400);
    }

    function setMuted(m) {
      muted = m;
      store.set('muted', m);
      if (master) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.05);
      musicEl.muted = m;
    }

    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend(); else ctx.resume();
    });

    return {
      ensure,
      get muted() { return muted; },
      setMuted,
      happyBirthday,
      startAmbient,
      stopAmbient,
      engineOn,
      engineSpeed,
      engineOff,
      pop: () => { tone(420, { type: 'triangle', dur: 0.12, vol: 0.25, slideTo: 1100 }); noise({ dur: 0.06, vol: 0.12, filter: 3000, type: 'highpass' }); },
      chime: () => [1046.5, 1318.5, 1568].forEach((f, i) => box(f, i * 0.09, 0.08)),
      sparkle: () => [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, { dur: 0.3, vol: 0.05, when: i * 0.05 })),
      thud: () => { tone(120, { type: 'sine', dur: 0.25, vol: 0.5, slideTo: 50 }); noise({ dur: 0.12, vol: 0.25, filter: 900 }); },
      crash: () => { noise({ dur: 0.7, vol: 0.4, filter: 2500 }); tone(90, { dur: 0.5, vol: 0.4, slideTo: 30 }); },
      whoosh: () => noise({ dur: 0.6, vol: 0.18, filter: 900, type: 'bandpass' }),
      click: () => tone(1800, { type: 'square', dur: 0.03, vol: 0.04 }),
      fanfare: () => [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => box(f, i * 0.12, 0.12)),
      note: (f) => box(f, 0, 0.12),
      soft: (f) => box(f, 0, 0.05),
      // Dreamy chord that swells in slowly
      pad: (freqs, dur = 3) => freqs.forEach((f, i) => tone(f, { dur, vol: 0.035, attack: Math.min(1.2, dur / 3), when: i * 0.05 })),
      wilt: () => tone(392, { type: 'triangle', dur: 0.35, vol: 0.06, slideTo: 300 }),
      tink: () => { tone(2349.3, { dur: 0.18, vol: 0.05 }); tone(3136, { dur: 0.12, vol: 0.03, when: 0.03 }); },
      // Soft closing phrase for goodnight
      lullaby: () => [783.99, 659.25, 523.25, 587.33, 659.25, 523.25, 392].forEach((f, i) => box(f, i * 0.62, 0.1)),
      // Tender romantic "I Love You" music-box & warm pad melody
      loveTheme: () => {
        if (!ensure()) return;
        [261.63, 329.63, 392, 523.25].forEach((f, i) => tone(f, { type: 'sine', dur: 5.6, vol: 0.04, attack: 0.8, when: i * 0.05 }));
        const seq = [
          [392.00, 0.00, 0.12],
          [523.25, 0.42, 0.14],
          [659.25, 0.88, 0.15],
          [783.99, 1.45, 0.16],
          [880.00, 2.05, 0.16],
          [783.99, 2.65, 0.15],
          [659.25, 3.20, 0.13],
          [698.46, 3.65, 0.13],
          [659.25, 4.05, 0.13],
          [587.33, 4.50, 0.12],
          [523.25, 4.95, 0.16]
        ];
        seq.forEach(([freq, when, vol]) => {
          box(freq, when, vol);
          box(freq / 2, when + 0.015, vol * 0.45);
          tone(freq * 1.5, { type: 'sine', dur: 0.4, vol: vol * 0.15, when: when + 0.01 });
        });
      }
    };
  })();

  // ==============================================================================
  // ✨ EFFECTS
  // ==============================================================================
  const COLORS = ['#ffd27a', '#ff8fb1', '#7fd6c2', '#b9a6ff', '#ffffff'];

  // The confetti library is decoration only: if it ever throws, the scene must still move on
  function safeConfetti(opts) {
    try {
      const p = confetti(opts);
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) { /* ignore */ }
  }

  function confettiBurst(opts = {}) {
    if (typeof confetti !== 'function' || reducedMotion) return;
    safeConfetti(Object.assign({ particleCount: 90, spread: 90, origin: { y: 0.6 }, colors: COLORS, disableForReducedMotion: true }, opts));
  }

  function confettiShow(ms = 2600) {
    if (typeof confetti !== 'function' || reducedMotion) return;
    const end = Date.now() + ms;
    const timer = setInterval(() => {
      safeConfetti({ particleCount: 7, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors: COLORS });
      safeConfetti({ particleCount: 7, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors: COLORS });
      if (Date.now() >= end) clearInterval(timer);
    }, 120);
  }

  function hearts(x, y, emojis = ['💛', '💖', '✨'], n = 6) {
    for (let i = 0; i < n; i++) {
      const h = document.createElement('span');
      h.className = 'float-heart';
      h.textContent = pick(emojis);
      h.style.left = `${x + rand(-30, 30)}px`;
      h.style.top = `${y + rand(-20, 20)}px`;
      h.style.setProperty('--dx', `${rand(-50, 50)}px`);
      h.style.animationDelay = `${i * 60}ms`;
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 1800 + i * 60);
    }
  }

  function heartsFrom(el, emojis, n) {
    const r = el.getBoundingClientRect();
    hearts(r.left + r.width / 2, r.top + r.height / 2, emojis, n);
  }

  function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  // Keep an image for herself. Phones: the share sheet has "Save Image" (straight
  // to the gallery). Elsewhere: a normal download.
  async function saveImage(blob, filename, doneText) {
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    downloadBlob(blob, filename);
    if (doneText) toast(doneText);
  }

  function toast(text, ms = 3200) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    $('toast-layer').appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, ms);
  }

  // ==============================================================================
  // 🌌 NIGHT SKY — twinkling stars and the odd shooting star
  // ==============================================================================
  function initSky() {
    const canvas = $('sky');
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w, h, stars = [], shooting = null;

    function resize() {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(220, Math.floor((w * h) / 4500));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.3 + 0.3, phase: Math.random() * Math.PI * 2, speed: rand(0.6, 2)
      }));
    }
    resize();
    window.addEventListener('resize', resize);

    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const a = reducedMotion ? 0.7 : 0.35 + 0.65 * Math.abs(Math.sin(t / 1000 * s.speed + s.phase));
        ctx.globalAlpha = a;
        ctx.fillStyle = '#fff6e0';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      if (!reducedMotion) {
        if (!shooting && Math.random() < 0.002) {
          shooting = { x: rand(w * 0.2, w), y: rand(0, h * 0.4), life: 0 };
        }
        if (shooting) {
          shooting.life += 1;
          const len = 90;
          const x = shooting.x - shooting.life * 9;
          const y = shooting.y + shooting.life * 4;
          const grad = ctx.createLinearGradient(x, y, x + len, y - len * 0.45);
          grad.addColorStop(0, 'rgba(255,255,255,0.9)');
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.globalAlpha = 1 - shooting.life / 45;
          ctx.strokeStyle = grad; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y - len * 0.45); ctx.stroke();
          if (shooting.life > 45) shooting = null;
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ==============================================================================
  // 💡 FAIRY LIGHTS
  // ==============================================================================
  const Lights = (() => {
    const wrap = $('fairy-lights');
    let bulbs = [];
    let on = false;

    function build() {
      const w = window.innerWidth;
      const swoops = w < 600 ? 2 : 3;
      const perSwoop = Math.max(6, Math.round(w / swoops / 34));
      const sag = 34;
      const top = 6;
      wrap.innerHTML = '';
      let path = '';
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', `0 0 ${w} 70`);
      svg.setAttribute('preserveAspectRatio', 'none');
      bulbs = [];
      const seg = w / swoops;
      for (let s = 0; s < swoops; s++) {
        const x0 = s * seg;
        path += `${s === 0 ? 'M' : 'L'}${x0} ${top} Q${x0 + seg / 2} ${top + sag * 2} ${x0 + seg} ${top} `;
        for (let i = 1; i < perSwoop; i++) {
          const t = i / perSwoop;
          const x = x0 + t * seg;
          const y = top + sag * 4 * t * (1 - t);
          const b = document.createElement('span');
          b.className = 'bulb' + (on ? ' lit' : '');
          b.style.left = `${x}px`;
          b.style.top = `${y + 1}px`;
          b.style.setProperty('--c', COLORS[(bulbs.length) % 4]);
          b.style.setProperty('--d', `${rand(0, 2.6).toFixed(2)}s`);
          bulbs.push(b);
        }
      }
      const p = document.createElementNS(svgNS, 'path');
      p.setAttribute('d', path);
      p.setAttribute('class', 'wire');
      svg.appendChild(p);
      wrap.appendChild(svg);
      bulbs.forEach((b) => wrap.appendChild(b));
    }

    async function turnOn(instant = false) {
      on = true;
      for (const b of bulbs) {
        b.classList.add('lit');
        if (!instant) { Sound.click(); await wait(55); }
      }
    }
    async function turnOff() {
      on = false;
      for (const b of [...bulbs].reverse()) {
        b.classList.remove('lit');
        await wait(70);
      }
    }

    build();
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
    return { turnOn, turnOff, get on() { return on; } };
  })();

  // ==============================================================================
  // 🗺️ SCENE MANAGER
  // ==============================================================================
  const inited = new Set();
  const enterFns = {};

  function show(name) {
    document.querySelectorAll('.scene').forEach((s) => s.classList.toggle('active', s.dataset.scene === name));
    window.scrollTo({ top: 0, behavior: 'instant' });
    const idx = SCENES.indexOf(name);
    $('progress').classList.toggle('show', idx > 0);
    $('progress-fill').style.width = `${Math.max(0, idx) / (SCENES.length - 1) * 100}%`;
    if (idx > 0) store.set('at', name);
    // "lock" = she peeked before midnight; every other scene = her journey so far
    Log.send(name === 'lock' ? 'peek' : 'scene', { name });
    if (!inited.has(name) && enterFns[name]) {
      inited.add(name);
      enterFns[name]();
    }
  }

  function revealSoundButton() {
    const btn = $('sound-btn');
    btn.hidden = false;
    btn.classList.toggle('muted', Sound.muted);
  }

  $('sound-btn').addEventListener('click', () => {
    Sound.ensure();
    Sound.setMuted(!Sound.muted);
    $('sound-btn').classList.toggle('muted', Sound.muted);
  });

  // ==============================================================================
  // 0. LOCK — countdown until midnight IST
  // ==============================================================================
  const unlockAt = Date.parse(C.unlockAt);
  const isLocked = () => !isPreview && !isNaN(unlockAt) && Date.now() < unlockAt;

  enterFns.lock = () => {
    $('lock-title').textContent = C.lock.title;
    $('lock-sub').textContent = fill(C.lock.subtitle);
    const teases = C.lock.teases || [];
    const teaseEl = $('lock-tease');
    let ti = 0;
    const nextTease = () => {
      teaseEl.style.opacity = 0;
      setTimeout(() => { teaseEl.textContent = teases[ti++ % teases.length]; teaseEl.style.opacity = 1; }, 400);
    };
    nextTease();
    const teaseTimer = setInterval(nextTease, 6000);

    $('lock-gift').addEventListener('click', (e) => {
      const g = $('lock-gift');
      g.classList.remove('shake'); void g.offsetWidth; g.classList.add('shake');
      Sound.thud();
      hearts(e.clientX, e.clientY, ['🙈', '😏', '🎁'], 3);
      teaseEl.textContent = pick(teases);
    });

    const cells = {};
    document.querySelectorAll('[data-cd]').forEach((el) => { cells[el.dataset.cd] = el; });
    const tick = () => {
      const left = Math.max(0, unlockAt - Date.now());
      const s = Math.floor(left / 1000);
      cells.d.textContent = Math.floor(s / 86400);
      cells.h.textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, '0');
      cells.m.textContent = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      cells.s.textContent = String(s % 60).padStart(2, '0');
      if (left <= 0) {
        clearInterval(timer);
        clearInterval(teaseTimer);
        show('hello');
      }
    };
    const timer = setInterval(tick, 1000);
    tick();
  };

  // ==============================================================================
  // 1. HELLO — "Shhh… koi nahi dekh raha"
  // ==============================================================================
  enterFns.hello = async () => {
    const H = C.hello;
    const whispers = $('whispers');
    const lightsBtn = $('btn-lights');
    lightsBtn.textContent = H.lightButton;
    $('hello-name').textContent = C.herName;
    $('hello-sub').textContent = fill(H.subline);
    $('btn-hello-next').textContent = H.nextButton;

    document.body.classList.add('dark-room');
    for (const line of H.whispers) {
      const p = document.createElement('p');
      p.className = 'whisper';
      p.textContent = line;
      whispers.appendChild(p);
      await wait(reducedMotion ? 200 : 1500);
    }
    lightsBtn.classList.remove('hidden');
    const soundHint = $('sound-hint');
    if (H.soundHint) {
      soundHint.textContent = H.soundHint;
      soundHint.classList.remove('hidden');
    }

    lightsBtn.addEventListener('click', async () => {
      Sound.ensure();
      lightsBtn.disabled = true;
      soundHint.classList.add('hidden');
      Log.send('lights_on');
      await Lights.turnOn();
      document.body.classList.remove('dark-room');
      lightsBtn.classList.add('hidden');
      whispers.classList.add('hidden');
      $('birthday-reveal').classList.remove('hidden');
      revealSoundButton();
      Sound.chime();
      setTimeout(() => {
        confettiShow(3000);
        const ms = Sound.happyBirthday();
        setTimeout(() => Sound.startAmbient(), ms + 400);
      }, 500);

      const at = store.get('at', null);
      if (at && at !== 'rule' && SCENES.includes(at)) {
        const resume = $('btn-resume');
        resume.classList.remove('hidden');
        resume.addEventListener('click', () => show(at), { once: true });
      }
    }, { once: true });

    $('btn-hello-next').addEventListener('click', () => { Sound.chime(); show('rule'); });
  };

  // ==============================================================================
  // 2. RULE — break the "Log kya kahenge?" board
  // ==============================================================================
  enterFns.rule = () => {
    const R = C.rule;
    $('rule-heading').textContent = R.heading;
    $('sign-text').textContent = R.board;
    $('rule-instruction').textContent = R.instruction;
    $('rule-broken-title').textContent = R.brokenTitle;
    $('rule-broken-body').textContent = R.brokenBody;
    $('btn-promise').textContent = R.promiseButton;

    const board = $('signboard');
    const lines = R.hitLines || [];
    const needed = Math.max(lines.length, 3);
    let hits = 0;

    function shards(x, y, n) {
      for (let i = 0; i < n; i++) {
        const s = document.createElement('span');
        s.className = 'shard';
        s.style.left = `${x}px`;
        s.style.top = `${y}px`;
        s.style.setProperty('--dx', `${rand(-160, 160)}px`);
        s.style.setProperty('--dy', `${rand(-40, 260)}px`);
        s.style.setProperty('--r', `${rand(-300, 300)}deg`);
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 1200);
      }
    }

    board.addEventListener('click', (e) => {
      if (hits >= needed) return;
      hits++;
      board.dataset.hits = Math.min(hits, 4);
      board.classList.remove('hit'); void board.offsetWidth; board.classList.add('hit');
      if (navigator.vibrate) navigator.vibrate(30);
      const x = e.clientX || board.getBoundingClientRect().left + 160;
      const y = e.clientY || board.getBoundingClientRect().top + 70;
      $('hit-line').textContent = lines[hits - 1] || '💥';

      if (hits < needed) {
        Sound.thud();
        shards(x, y, 4);
        hearts(x, y, ['✨', '🕊️', '👑', '💫', '💛'], 3);
        return;
      }
      Sound.crash();
      if (navigator.vibrate) navigator.vibrate([40, 30, 80]);
      board.classList.add('broken');
      shards(x, y, 24);
      hearts(x, y, ['👑', '🕊️', '✨', '💛', '🌸'], 16);
      confettiBurst({ origin: { x: x / window.innerWidth, y: y / window.innerHeight }, particleCount: 90, spread: 90 });
      $('rule-instruction').classList.add('hidden');
      setTimeout(() => {
        board.classList.add('hidden');
        $('hit-line').classList.add('hidden');
        $('rule-broken').classList.remove('hidden');
        Sound.fanfare();
      }, 900);
    });

    $('btn-promise').addEventListener('click', (e) => {
      hearts(e.clientX, e.clientY, ['🤙', '💛', '✨'], 8);
      Sound.chime();
      setTimeout(() => show('playground'), 500);
    });
  };

  // ==============================================================================
  // 3. PLAYGROUND — balloons, tareef machine, wish lantern, wardrobe
  // ==============================================================================
  enterFns.playground = () => {
    const P = C.playground;
    // Dress photos start downloading quietly while she plays the other toys
    setTimeout(() => window.Wardrobe?.preload(), 1200);
    $('pg-title').textContent = P.title;
    $('pg-sub').textContent = P.subtitle;
    $('tareef-intro').textContent = P.tareefIntro;
    $('lantern-intro').textContent = P.lanternIntro;
    $('wardrobe-intro').textContent = P.wardrobeIntro;

    const TOYS = ['balloons', 'tareef', 'lantern', 'wardrobe', 'hearts'];
    const done = new Set(store.get('toys', []).filter((t) => TOYS.includes(t)));
    let openSheet = null;
    let onWardrobeOpen = null;

    function refresh() {
      document.querySelectorAll('.toy').forEach((t) => t.classList.toggle('done', done.has(t.dataset.toy)));
      $('pg-progress').textContent = done.size >= TOYS.length
        ? 'Saare khilone khel liye! 🎉'
        : `${done.size} / ${TOYS.length} khilone khele`;
      $('btn-pg-next').classList.toggle('hidden', done.size < TOYS.length);
    }

    function complete(toy, message) {
      if (done.has(toy)) return;
      done.add(toy);
      store.set('toys', [...done]);
      Log.send('toy_done', { toy });
      refresh();
      Sound.sparkle();
      if (message) toast(message);
      if (done.size === TOYS.length) {
        setTimeout(() => { confettiShow(1800); Sound.fanfare(); }, 600);
      }
    }

    function open(toy) {
      const sheet = $('toy-' + toy);
      openSheet = sheet;
      sheet.classList.add('open');
      Sound.chime();
      if (toy === 'balloons') startBalloons();
      if (toy === 'wardrobe') {
        window.Wardrobe.preload();
        if (typeof onWardrobeOpen === 'function') onWardrobeOpen();
      }
      if (toy === 'hearts') startHearts();
    }
    function close() {
      if (!openSheet) return;
      if (openSheet.id === 'toy-hearts') stopHearts();
      openSheet.classList.remove('open');
      openSheet = null;
    }

    document.querySelectorAll('.toy').forEach((t) => t.addEventListener('click', () => open(t.dataset.toy)));
    document.querySelectorAll('[data-scene="playground"] .sheet').forEach((s) => {
      s.addEventListener('click', (e) => { if (e.target === s) close(); });
      s.querySelector('.sheet-close').addEventListener('click', close);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    // --- Balloons -----------------------------------------------------------
    const field = $('balloon-field');
    const msgs = P.balloons || [];
    let popped = 0;
    function startBalloons() {
      if (field.childElementCount || popped >= msgs.length) return;
      const n = msgs.length;
      for (let i = 0; i < n; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'balloon';
        b.setAttribute('aria-label', 'Balloon');
        b.style.left = `${4 + (i * (84 / n)) + rand(-2, 2)}%`;
        b.style.setProperty('--c', COLORS[i % 4]);
        const t = rand(7, 10.5);
        b.style.setProperty('--t', `${t}s`);
        b.style.setProperty('--delay', `${-rand(0.35, 0.85) * t}s`);
        b.style.setProperty('--top', `${rand(10, 60)}%`);
        b.addEventListener('pointerdown', (e) => {
          if (b.classList.contains('popped')) return;
          b.classList.add('popped');
          Sound.pop();
          hearts(e.clientX, e.clientY, ['✨', '💥', '💛'], 4);
          $('balloon-msg').textContent = msgs[popped] || '💛';
          popped++;
          setTimeout(() => b.remove(), 300);
          if (popped >= n) complete('balloons', 'Saare balloon phod diye! Bachpan: 1, Duniya: 0 🎈');
        });
        field.appendChild(b);
      }
    }

    // --- Tareef machine -----------------------------------------------------
    let deck = [];
    let tareefCount = 0;
    $('btn-tareef').addEventListener('click', () => {
      if (!deck.length) deck = [...(P.compliments || [])].sort(() => Math.random() - 0.5);
      const slip = $('tareef-slip');
      slip.textContent = deck.pop();
      slip.classList.remove('print'); void slip.offsetWidth; slip.classList.add('print');
      tareefCount++;
      $('tareef-count').textContent = tareefCount;
      Sound.click(); setTimeout(Sound.chime, 120);
      if (tareefCount === 3) complete('tareef', 'Aur chahiye? Machine kabhi khatam nahi hoti 😌');
    });

    // --- Wish lantern: write a wish, let it fly, it becomes a star -----------
    const sky = $('lantern-sky');
    const lanternInput = $('lantern-input');
    const LANTERNS_NEEDED = 3;
    const wishes = [];
    let replyIdx = 0;
    let flying = false;
    lanternInput.placeholder = P.lanternPlaceholder || '';
    $('btn-lantern').textContent = P.lanternButton || 'Udaao 🏮';

    const lanternCount = () => {
      $('lantern-count').textContent = wishes.length >= LANTERNS_NEEDED
        ? `${wishes.length} wishes aasmaan me ✨`
        : `${wishes.length} / ${LANTERNS_NEEDED} lanterns`;
    };

    function renderSuggestions() {
      const box = $('lantern-suggest');
      box.innerHTML = '';
      (P.lanternSuggestions || []).filter((s) => !wishes.includes(s)).slice(0, 3).forEach((s) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'wd-chip';
        b.textContent = s;
        b.addEventListener('click', () => { lanternInput.value = s; Sound.click(); });
        box.appendChild(b);
      });
    }

    // Faraway lanterns drifting up for depth
    for (let i = 0; i < 6; i++) {
      const far = document.createElement('span');
      far.className = 'lantern-far';
      far.style.left = `${rand(5, 92)}%`;
      far.style.setProperty('--s', rand(0.35, 0.7).toFixed(2));
      const dur = rand(16, 26);
      far.style.animationDuration = `${dur}s`;
      far.style.animationDelay = `${-rand(0, dur)}s`;
      sky.appendChild(far);
    }

    function releaseLantern(wish) {
      const x = rand(28, 72);
      const sway = rand(-40, 40);
      const lantern = document.createElement('div');
      lantern.className = 'lantern';
      lantern.style.left = `${x}%`;
      lantern.style.setProperty('--sway', `${sway}px`);
      lantern.innerHTML = '<span class="lantern-glow"></span><span class="lantern-body"></span><span class="lantern-flame"></span><span class="lantern-tag"></span>';
      lantern.querySelector('.lantern-tag').textContent = wish;
      sky.appendChild(lantern);
      Sound.whoosh();

      const FLIGHT = reducedMotion ? 300 : 4600;
      setTimeout(() => {
        lantern.remove();
        const star = document.createElement('span');
        star.className = 'wish-star';
        star.style.left = `calc(${x}% + ${sway}px)`;
        star.style.top = `${rand(8, 20)}%`;
        star.title = wish;
        sky.appendChild(star);
        Sound.sparkle();
        const replies = P.lanternReplies || [];
        $('lantern-reply').textContent = replies[replyIdx++ % Math.max(1, replies.length)] || '✨';
        flying = false;
        lanternCount();
        renderSuggestions();
        if (wishes.length === LANTERNS_NEEDED) complete('lantern', P.lanternDone);
      }, FLIGHT);
    }

    $('lantern-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (flying) return;
      const wish = lanternInput.value.trim();
      if (!wish) {
        toast(P.lanternEmpty || 'Pehle ek wish likho ✍️');
        lanternInput.focus();
        return;
      }
      flying = true;
      lanternInput.value = '';
      lanternInput.blur();
      wishes.push(wish);
      Log.send('lantern', { wish });
      $('lantern-reply').textContent = '';
      releaseLantern(wish);
    });

    lanternCount();
    renderSuggestions();

    // --- Dil Pakdo: tap the drifting hearts, stars and gifts (no timer, no score) ---
    const HC = C.catchHearts || {};
    const heartsField = $('hearts-field');
    const voice = $('voice-note');
    $('hearts-title').textContent = HC.title || 'Dil Pakdo 💕';
    $('hearts-intro').textContent = HC.intro || '';
    const KINDS = [
      { emoji: '💗', key: 'compliments', label: 'Ek tareef', weight: 4 },
      { emoji: '⭐', key: 'memories', label: 'Ek yaad', weight: 2 },
      { emoji: '🎁', key: 'confessions', label: 'Ek confession', weight: 2 },
      { emoji: '💋', key: 'kisses', label: 'Kiss token', weight: 2 }
    ];
    const GOLDEN_AFTER = 5; // the golden heart shows up after this many catches
    const decks = {};
    let heartTimer = null;
    let caught = 0;
    let goldenOut = false;
    let goldenFound = false;

    const drawLine = (key) => {
      if (!decks[key] || !decks[key].length) decks[key] = [...(HC[key] || [])].sort(() => Math.random() - 0.5);
      return decks[key].pop() || '💛';
    };
    const pickKind = () => {
      let r = Math.random() * KINDS.reduce((sum, k) => sum + k.weight, 0);
      for (const k of KINDS) { if ((r -= k.weight) < 0) return k; }
      return KINDS[0];
    };
    const updateCatchCount = () => { $('catch-count').textContent = caught ? `${caught} pakde 💕` : ''; };

    function spawnFloaty(golden = false) {
      const kind = golden ? null : pickKind();
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'floaty' + (golden ? ' golden' : '');
      b.textContent = golden ? '💛' : kind.emoji;
      b.setAttribute('aria-label', golden ? 'Sunehra dil' : kind.label);
      b.style.left = `${rand(6, 80)}%`;
      b.style.setProperty('--dur', `${golden ? 12 : rand(7, 10).toFixed(1)}s`);
      b.style.setProperty('--drift', `${rand(-40, 40).toFixed(0)}px`);
      b.style.setProperty('--size', `${golden ? 3.1 : rand(1.9, 2.6).toFixed(2)}rem`);
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); catchFloaty(b, kind, golden, e); }, { once: true });
      b.addEventListener('animationend', (e) => {
        if (e.animationName !== 'floatyRise') return;
        b.remove();
        if (golden && !goldenFound) goldenOut = false; // missed it — it'll come back
      });
      heartsField.appendChild(b);
    }

    function catchFloaty(b, kind, golden, e) {
      b.classList.add('caught');
      setTimeout(() => b.remove(), 400);
      hearts(e.clientX, e.clientY, golden ? ['💛', '✨', '🌟'] : ['✨', kind.emoji], golden ? 10 : 4);
      caught++;
      updateCatchCount();
      if (golden) {
        goldenFound = true;
        Sound.fanfare();
        confettiBurst({ particleCount: 80, colors: ['#ffd27a', '#fff3cf', '#ff8fb1'] });
        showGoldenNote();
        Log.send('golden_heart', { caught });
        complete('hearts', HC.doneToast);
        return;
      }
      Sound.pop();
      $('catch-icon').textContent = kind.emoji;
      $('catch-kind').textContent = kind.label;
      $('catch-text').textContent = drawLine(kind.key);
      const card = $('catch-reward');
      card.classList.remove('hidden');
      card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
      if (caught >= GOLDEN_AFTER && !goldenOut && !goldenFound) {
        goldenOut = true;
        setTimeout(() => { if (heartTimer) spawnFloaty(true); }, 900);
      }
    }

    function showGoldenNote() {
      const note = $('golden-note');
      $('golden-title').textContent = HC.goldenTitle || '💛';
      note.classList.remove('hidden');
      if (HC.voiceUrl) {
        $('golden-text').textContent = HC.goldenText || '';
        voice.src = HC.voiceUrl;
        $('btn-voice').classList.remove('hidden');
      } else {
        $('golden-text').textContent = HC.goldenFallback || HC.goldenText || '';
      }
      note.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    $('btn-voice').addEventListener('click', () => {
      if (voice.paused) {
        Sound.stopAmbient();
        voice.play().then(() => { $('btn-voice').textContent = '⏸ Ruko'; }).catch(() => toast('Awaaz nahi chal paayi 😅 Phir se try karo'));
        Log.send('voice_played');
      } else {
        voice.pause();
      }
    });
    voice.addEventListener('pause', () => { $('btn-voice').textContent = '▶ Phir se suno 🎧'; Sound.startAmbient(); });
    voice.addEventListener('ended', () => { $('btn-voice').textContent = '▶ Phir se suno 🎧'; Sound.startAmbient(); });

    function startHearts() {
      if (heartTimer) return;
      [0, 500, 1100].forEach((d) => setTimeout(() => spawnFloaty(), d));
      heartTimer = setInterval(() => { if (heartsField.childElementCount < 7) spawnFloaty(); }, 950);
      if (goldenFound) showGoldenNote();
    }
    function stopHearts() {
      clearInterval(heartTimer);
      heartTimer = null;
      heartsField.innerHTML = '';
      if (!goldenFound) goldenOut = false;
      if (!voice.paused) voice.pause();
    }

    // --- Wardrobe (drawing lives in wardrobe.js) ----------------------------
    const W = window.Wardrobe;
    const O = W.OPTIONS;
    const look = W.defaultState();
    // wardrobe.js decides which controls actually change the picture
    const TABS = [
      ['dresses', 'Dresses 👗'], ['tops', 'Tops 👚'], ['bottoms', 'Bottoms 👖'], ['colors', 'Rang 🎨'],
      ['pattern', 'Design'], ['hair', 'Baal 💇‍♀️'], ['shoes', 'Joote 👠'], ['extras', 'Extras 💍'], ['scene', 'Jagah 📍']
    ].filter(([tabId]) => !W.CONTROLS || W.CONTROLS.includes(tabId));
    let activeTab = 'dresses';
    let lookUrl = null;

    const drawDoll = () => {
      const dollEl = $('doll');
      dollEl.innerHTML = W.render(look);
      dollEl.classList.remove('swapping');
      void dollEl.offsetWidth;
      dollEl.classList.add('swapping');
      $('wardrobe-stamp').classList.add('hidden');
      $('wd-result').classList.add('hidden');
    };

    function chip(label, on, onClick) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'wd-chip' + (on ? ' on' : '');
      b.textContent = label;
      b.addEventListener('click', () => { onClick(); Sound.click(); drawDoll(); renderOptions(); });
      return b;
    }
    function swatch(color, on, onClick) {
      const b = chip('', on, onClick);
      b.className = 'wd-swatch' + (on ? ' on' : '');
      b.style.setProperty('--c', color);
      b.setAttribute('aria-label', color);
      return b;
    }
    function row(label, nodes) {
      const wrap = document.createElement('div');
      wrap.className = 'wd-row';
      if (label) {
        const l = document.createElement('span');
        l.className = 'wd-row-label';
        l.textContent = label;
        wrap.appendChild(l);
      }
      nodes.forEach((n) => wrap.appendChild(n));
      return wrap;
    }

    function renderTabs() {
      const tabs = $('wd-tabs');
      tabs.innerHTML = '';
      TABS.forEach(([id, label]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.className = 'wd-tab' + (id === activeTab ? ' on' : '');
        b.textContent = label;
        b.addEventListener('click', () => { activeTab = id; Sound.click(); renderTabs(); renderOptions(); });
        tabs.appendChild(b);
      });
    }

    function renderOptions() {
      const box = $('wd-options');
      box.innerHTML = '';
      const add = (n) => box.appendChild(n);
      switch (activeTab) {
        case 'dresses':
          add(row('', O.dresses.map((d) => chip(d.label, look.dress === d.id, () => {
            look.dress = d.id;
            showCompliment(d.id);
          }))));
          break;
        case 'tops':
          // Only tops that have a real image. Picking one keeps the bottom if that
          // pairing exists; otherwise it moves to a bottom that does.
          add(row('', O.tops.filter((t) => W.hasTop(t.id)).map((t) => chip(t.label, !look.dress && look.top === t.id, () => {
            look.dress = null;
            look.top = t.id;
            W.normalizeSeparates(look);
          }))));
          break;
        case 'bottoms': {
          // Bottoms that go with the current top — choosing one never changes the top
          W.normalizeSeparates(look);
          const topLabel = (O.tops.find((t) => t.id === look.top) || {}).label || '';
          add(row(`${topLabel} ke saath`, O.bottoms.filter((b) => W.findLook(look.top, b.id)).map((b) => chip(b.label, !look.dress && look.bottom === b.id, () => {
            look.dress = null;
            look.bottom = b.id;
          }))));
          break;
        }
        case 'colors':
          const resetRow = document.createElement('div');
          resetRow.className = 'wd-row';
          resetRow.appendChild(chip('Asli Rang 🌸 (Original)', !look.main || look.main === 'original', () => {
            look.main = null;
          }));
          add(resetRow);
          add(row('Pehla rang', O.colors.map((c) => swatch(c, look.main === c, () => { look.main = c; }))));
          add(row('Doosra rang', O.colors.map((c) => swatch(c, look.second === c, () => { look.second = c; }))));
          break;
        case 'pattern':
          add(row('', O.patterns.map((p) => chip(p.label, look.pattern === p.id, () => { look.pattern = p.id; }))));
          break;
        case 'hair':
          add(row('', O.hair.map((h) => chip(h.label, look.hair === h.id, () => {
            look.hair = h.id;
            toast(h.id === 'open' ? 'Khule baal me Chetna sabse pyaari lagti hai! 💁‍♀️✨' : 'Ye hairstyle bhi bohot cute hai! 🌸');
          }))));
          add(row('Rang', O.hairColors.map((c) => swatch(c, look.hairColor === c, () => { look.hairColor = c; }))));
          break;
        case 'shoes':
          add(row('', O.shoes.map((s) => chip(s.label, look.shoes === s.id, () => {
            look.shoes = s.id;
            toast(`${s.label} outfit ke saath match ho gaye! ✨`);
          }))));
          break;
        case 'extras':
          add(row('', O.extras.map((x) => chip(x.label, look.extras.has(x.id), () => {
            if (look.extras.has(x.id)) look.extras.delete(x.id); else look.extras.add(x.id);
          }))));
          break;
        case 'scene':
          add(row('', O.scenes.map((s) => chip(s.label, look.scene === s.id, () => { look.scene = s.id; }))));
          break;
      }
    }

    // Wardrobe compliments per curated dress
    const DRESS_COMPLIMENTS = P.wardrobeCompliments || {
      anarkali: "Uff! Anarkali me toh poori Shehzadi lag rahi ho... Dil tham ke baithna padega mujhe! 🌸👑",
      saree: "Saree me tumhari saadgi aur husn ka koi muqabla nahi... Meri nazar utaarne ka man kar raha hai! 🥻✨",
      lehenga: "Lavender lehenga me bilkul dulhan wali feeling aa rahi hai... Sach me kisi din meri dulhan banogi! 💜💍",
      gown: "Royal Midnight Gown me red-carpet queen lag rahi ho! Aise dekhogi toh main behosh ho jaunga! 🖤👑",
      sundress: "Daisy sundress me kitni fresh, cute aur masoom lag rahi ho... Just like a morning sunflower! 🌼💛",
      casual: "Ye swag! Smart, stylish aur meri sabse cute Chetna — simple me bhi sabse killer! 👟🕶️",
      nightsuit: "Awww! Nightsuit me 5 saal ki cute Billu lag rahi ho, bas hug karne ka man kar raha hai! 🧸💤"
    };

    const showCompliment = (dressId) => {
      const bubble = $('wd-compliment-bubble');
      const textEl = $('wd-bubble-text');
      if (!bubble || !textEl) return;
      const msg = DRESS_COMPLIMENTS[dressId] || 'Kitni pyaari lag rahi ho meri jaan! 😍';
      textEl.textContent = msg;
      bubble.classList.remove('hidden');
      bubble.style.animation = 'none';
      void bubble.offsetWidth;
      bubble.style.animation = '';
    };

    /* 360° view switched off: it only flipped the flat photo, which looked odd.
    const twirlModel = () => {
      const dollEl = $('doll');
      if (!dollEl) return;
      dollEl.style.transform = '';
      dollEl.classList.remove('twirling');
      void dollEl.offsetWidth;
      dollEl.classList.add('twirling');
      Sound.sparkle();
      hearts(window.innerWidth / 2, window.innerHeight / 2, ['✨', '💫', '💃', '💖'], 7);
      setTimeout(() => {
        dollEl.classList.remove('twirling');
      }, 1400);
    };

    $('btn-wd-twirl')?.addEventListener('click', () => {
      twirlModel();
      if (look.dress) showCompliment(look.dress);
    });

    // Interactive 360° swipe/drag on the stage
    const stageEl = $('doll-stage');
    let isDragging = false;
    let startX = 0;
    let currentRotation = 0;
    let baseRotation = 0;

    if (stageEl) {
      stageEl.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button') || e.target.closest('#wd-compliment-bubble')) return;
        isDragging = true;
        startX = e.clientX;
        baseRotation = currentRotation;
        stageEl.classList.add('dragging');
        const dollEl = $('doll');
        if (dollEl) {
          dollEl.classList.remove('twirling');
          dollEl.style.transition = 'none';
        }
        try { stageEl.setPointerCapture(e.pointerId); } catch (_) {}
      });

      stageEl.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        currentRotation = (baseRotation + deltaX * 0.75) % 360;
        const dollEl = $('doll');
        if (dollEl) {
          dollEl.style.transform = `perspective(1200px) rotateY(${currentRotation}deg)`;
        }
      });

      const endDrag = (e) => {
        if (!isDragging) return;
        isDragging = false;
        stageEl.classList.remove('dragging');
        const dollEl = $('doll');
        if (dollEl) {
          dollEl.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
          setTimeout(() => {
            if (!isDragging && dollEl) {
              dollEl.style.transform = 'perspective(1200px) rotateY(0deg)';
              currentRotation = 0;
              setTimeout(() => {
                if (!isDragging && dollEl) {
                  dollEl.style.transition = '';
                  dollEl.style.transform = '';
                }
              }, 650);
            }
          }, 800);
        }
        try { stageEl.releasePointerCapture(e.pointerId); } catch (_) {}
      };

      stageEl.addEventListener('pointerup', endDrag);
      stageEl.addEventListener('pointercancel', endDrag);
    }
    */

    $('btn-wd-random').addEventListener('click', () => {
      const pickedDress = W.randomize(look);
      Sound.sparkle();
      drawDoll();
      renderOptions();
      // twirlModel(); — 360° view is switched off
      showCompliment(pickedDress || look.dress);
    });

    $('btn-wardrobe-done').addEventListener('click', async (e) => {
      const stamp = $('wardrobe-stamp');
      stamp.textContent = P.wardrobeStamp;
      stamp.classList.remove('hidden');
      stamp.style.animation = 'none'; void stamp.offsetWidth; stamp.style.animation = '';
      Sound.thud();
      hearts(e.clientX, e.clientY, ['😍', '✨', '👗'], 6);
      complete('wardrobe', 'Wow. Bas wow. 😍');
      // The dashboard redraws the doll from this, so no image upload is needed
      Log.send('look', { look: { ...look, extras: [...look.extras] } });
      try {
        const blob = await W.toPng($('doll'), P.wardrobeCaption || 'Billu ka look 💛', `${C.herName} · 21 Oct`, W.get3DOutfit(look));
        if (lookUrl) URL.revokeObjectURL(lookUrl);
        lookUrl = URL.createObjectURL(blob);
        $('wd-photo').src = lookUrl;
        $('btn-wd-save').onclick = () => saveImage(blob, 'billu-ka-look.png', 'Look save ho gaya 📸');
        const dressCompliment = DRESS_COMPLIMENTS[look.dress];
        $('wd-result-text').textContent = dressCompliment ? `${dressCompliment} 📸` : (P.wardrobeResult || '');
        $('wd-result').classList.remove('hidden');
        $('wd-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (err) {
        toast('Photo ban nahi paayi 😅 Screenshot le lo!');
      }
    });

    // ---- AI try-on: "see how you'd look in it" → the AI scans her… and crashes from
    // too much cuteness. The dress then goes on Mishra ji's list (logged to the dashboard).
    const AI = P.aiTry || {};
    $('btn-wd-ai').textContent = AI.button || '✨ Dekhna hai is dress me tum kaisi lagogi?';
    $('ai-brand').innerHTML = '';
    $('ai-brand').append(`🪄 ${AI.brand || 'Billu-AI Studio'} `, Object.assign(document.createElement('span'), { textContent: 'v2.4' }));
    let aiBusy = false;

    async function aiTryOn() {
      if (aiBusy) return;
      aiBusy = true;
      const dressLabel = (W.OPTIONS.dresses.find((d) => d.id === look.dress) || {}).label || 'dress';
      const overlay = $('ai-try');
      const card = $('ai-card');
      const stages = ['ai-run', 'ai-crash', 'ai-msg', 'ai-order'];
      const showStage = (id) => stages.forEach((s) => $(s).classList.toggle('hidden', s !== id));
      const bar = $('ai-bar');
      const pct = $('ai-pct');
      const logEl = $('ai-log');
      const line = (t) => { logEl.textContent += `${t}\n`; logEl.scrollTop = logEl.scrollHeight; };
      const setPct = (n) => { bar.style.width = `${Math.min(100, n)}%`; pct.textContent = `${Math.round(n)}%`; };

      $('ai-img').src = W.get3DOutfit(look);
      logEl.textContent = '';
      card.className = 'ai-card';
      setPct(0);
      showStage('ai-run');
      overlay.classList.remove('hidden');
      Sound.ensure();
      Log.send('ai_try', { dress: dressLabel });

      // 1. Scanning, step by step (~6s)
      const steps = AI.steps || [];
      const targets = [18, 36, 54, 72, 93];
      for (let i = 0; i < steps.length; i++) {
        $('ai-step').textContent = steps[i];
        line(`> ${steps[i]}`);
        Sound.note([523.25, 587.33, 659.25, 783.99, 880][i % 5]);
        const from = i ? targets[i - 1] : 0;
        for (let k = 1; k <= 8; k++) { setPct(from + ((targets[i] || 95) - from) * (k / 8)); await wait(150); }
        if (i === steps.length - 2) card.classList.add('warn');
      }
      // 2. It starts to break: stuck at 99%, errors pour in (~2.5s)
      card.classList.add('glitch');
      Sound.crash();
      setPct(99);
      for (const e of AI.errors || []) {
        line(`!! ${e}`);
        Sound.click();
        pct.textContent = ['99%', '9̷9̶%', '???', '99%', 'ERR'][Math.floor(Math.random() * 5)];
        await wait(380);
      }
      // 3. Crash (~1.8s)
      card.classList.add('dead');
      $('ai-crash-title').textContent = AI.crash || 'SERVER CRASH 💥';
      showStage('ai-crash');
      Sound.crash();
      await wait(1900);
      // 4. The real message
      card.className = 'ai-card calm';
      $('ai-msg-title').textContent = fill(AI.msgTitle);
      $('ai-msg-text').textContent = fill(AI.msgText);
      $('btn-ai-next').textContent = AI.msgButton || 'Ab kya? 🥺';
      showStage('ai-msg');
      Sound.chime();
      $('btn-ai-next').onclick = () => {
        $('ai-order-title').textContent = fill(AI.orderTitle);
        $('ai-order-text').textContent = fill(String(AI.orderText || '').replace('{dress}', dressLabel));
        const track = $('ai-track');
        track.innerHTML = '';
        (AI.track || []).forEach((t, i) => {
          const li = document.createElement('li');
          li.textContent = t;
          li.style.animationDelay = `${0.25 + i * 0.45}s`;
          track.appendChild(li);
        });
        $('btn-ai-done').textContent = AI.doneButton || 'Theek hai 🥰';
        showStage('ai-order');
        Sound.fanfare();
        hearts(window.innerWidth / 2, window.innerHeight * 0.4, ['📦', '💛', '🎁', '✨'], 8);
        // This is the "list" Mishra ji gets: it shows up on the dashboard
        Log.send('dress_wish', { dress: dressLabel, look: { ...look, extras: [...look.extras] } });
      };
      $('btn-ai-done').onclick = () => {
        overlay.classList.add('hidden');
        aiBusy = false;
      };
    }
    $('btn-wd-ai').addEventListener('click', aiTryOn);

    renderTabs();
    renderOptions();
    drawDoll();
    showCompliment(look.dress);
    onWardrobeOpen = () => {
      showCompliment(look.dress);
    };

    $('btn-pg-next').addEventListener('click', () => { Sound.chime(); show('ride'); });
    refresh();
  };

  // ==============================================================================
  // 4. RIDE — hold to ride to the mountains; story milestones on the way
  // ==============================================================================
  // Procedural scenery for the ride. Each layer is one seamless tile (periodic
  // noise, so the right edge meets the left) repeated for the parallax scroll.
  function periodicNoise(w, terms, seed, ridged = false) {
    let s = seed;
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const t = terms.map(([k, a]) => ({ k, a, ph: rnd() * Math.PI * 2 }));
    // ridged: 1-|sin| gives sharp crests like real mountain ridges (still seamless)
    return ridged
      ? (x) => t.reduce((sum, { k, a, ph }) => sum + a * (1 - Math.abs(Math.sin((Math.PI * k * x) / w + ph))), 0)
      : (x) => t.reduce((sum, { k, a, ph }) => sum + a * Math.sin((2 * Math.PI * k * x) / w + ph), 0);
  }
  const svgUrl = (svg) => `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
  const n1 = (v) => v.toFixed(1);
  function pineTree(x, y, h) {
    const w = h * 0.34;
    return `M${n1(x)} ${n1(y - h)} L${n1(x + w * 0.5)} ${n1(y - h * 0.62)} L${n1(x + w * 0.3)} ${n1(y - h * 0.62)} L${n1(x + w * 0.8)} ${n1(y - h * 0.28)} L${n1(x + w * 0.42)} ${n1(y - h * 0.28)} L${n1(x + w)} ${n1(y)} L${n1(x - w)} ${n1(y)} L${n1(x - w * 0.42)} ${n1(y - h * 0.28)} L${n1(x - w * 0.8)} ${n1(y - h * 0.28)} L${n1(x - w * 0.3)} ${n1(y - h * 0.62)} L${n1(x - w * 0.5)} ${n1(y - h * 0.62)} Z `;
  }

  function paintRideLayers(far, mid, trees) {
    const W = 1600;

    // Far: 3D faceted snowy Himalayan range — sunlit rose-gold snow faces, cool deep shadow slopes, valley haze
    {
      const H = 420;
      // Background high misty peaks
      const fb = periodicNoise(W, [[3, 85], [5, 52], [9, 28], [16, 14], [27, 6]], 23, true);
      const back = [];
      for (let x = 0; x <= W; x += 8) back.push([x, 230 - fb(x)]);
      const topB = Math.min(...back.map((q) => q[1]));
      const ridgeB = `M0 ${H} ` + back.map(([x, y]) => `L${x} ${n1(y)}`).join(' ') + ` L${W} ${H} Z`;

      // Foreground sharp craggy snow peaks
      const f = periodicNoise(W, [[4, 75], [7, 50], [12, 30], [19, 16], [31, 8], [52, 3]], 7, true);
      const pts = [];
      for (let x = 0; x <= W; x += 6) pts.push([x, 280 - f(x)]);
      const top = Math.min(...pts.map((q) => q[1]));
      const ridge = `M0 ${H} ` + pts.map(([x, y]) => `L${x} ${n1(y)}`).join(' ') + ` L${W} ${H} Z`;

      // Faceted light on each peak: the slope from the peak down to the next valley
      // is sunlit, the slope on the other side is in shadow. Faces follow the real
      // ridge line and are clipped to the mountain, so nothing floats in the sky.
      const isPeak = (i) => pts[i][1] < pts[i - 1][1] && pts[i][1] <= pts[i + 1][1];
      const isValley = (i) => pts[i][1] > pts[i - 1][1] && pts[i][1] >= pts[i + 1][1];
      let facets = '';
      for (let i = 2; i < pts.length - 2; i++) {
        if (!isPeak(i) || pts[i][1] > 230) continue;
        const [px, py] = pts[i];
        let j = i + 1; while (j < pts.length - 1 && !isValley(j)) j++;
        let k = i - 1; while (k > 0 && !isValley(k)) k--;
        const depth = Math.min(H, py + 60 + (Math.max(pts[j][1], pts[k][1]) - py) * 0.9);
        const right = pts.slice(i, j + 1).map(([x, y]) => `${x},${n1(y)}`).join(' ');
        const left = pts.slice(k, i + 1).map(([x, y]) => `${x},${n1(y)}`).join(' ');
        facets += `<polygon points="${right} ${n1(px + (pts[j][0] - px) * 0.3)},${n1(depth)}" fill="url(#sunFacet)" opacity=".55"/>`;
        facets += `<polygon points="${left} ${n1(px - (px - pts[k][0]) * 0.2)},${n1(depth)}" fill="url(#shadowFacet)" opacity=".5"/>`;
      }
      facets = `<clipPath id="rc"><path d="${ridge}"/></clipPath><g clip-path="url(#rc)">${facets}</g>`;

      far._aspect = W / H;
      far.style.backgroundImage = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="b" gradientUnits="userSpaceOnUse" x1="0" y1="${n1(topB)}" x2="0" y2="${H}">
            <stop offset="0" stop-color="#fff5f0"/><stop offset=".14" stop-color="#e8d8ee"/><stop offset=".45" stop-color="#9a8db8"/><stop offset="1" stop-color="#5a4e76"/></linearGradient>
          <linearGradient id="s" gradientUnits="userSpaceOnUse" x1="0" y1="${n1(top)}" x2="0" y2="${H}">
            <stop offset="0" stop-color="#ffffff"/><stop offset=".12" stop-color="#f2e2ed"/><stop offset=".4" stop-color="#7a709c"/><stop offset="1" stop-color="#3b3254"/></linearGradient>
          <linearGradient id="sunFacet" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#fff8f2"/><stop offset=".5" stop-color="#f8be9e"/><stop offset="1" stop-color="#b86858" stop-opacity=".4"/></linearGradient>
          <linearGradient id="shadowFacet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#322a48"/><stop offset=".6" stop-color="#1f1832"/><stop offset="1" stop-color="#120e20" stop-opacity=".7"/></linearGradient>
          <linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8dcfa" stop-opacity="0"/><stop offset="1" stop-color="#e8dcfa" stop-opacity=".75"/></linearGradient>
          <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffdcb8" stop-opacity="0"/><stop offset=".5" stop-color="#ffdcb8" stop-opacity=".3"/><stop offset="1" stop-color="#ffdcb8" stop-opacity="0"/></linearGradient>
        </defs>
        <path d="${ridgeB}" fill="url(#b)" opacity=".88"/>
        <rect y="${n1(topB + 70)}" width="${W}" height="${H}" fill="url(#h)" opacity=".3"/>
        <path d="${ridge}" fill="url(#s)"/>
        ${facets}
        <!-- 3D Volumetric Mountain Basin Fog -->
        <rect y="${H - 150}" width="${W}" height="150" fill="url(#h)"/>
        <rect y="${H - 90}" width="${W}" height="60" fill="url(#mist)"/>
      </svg>`);
    }

    // Mid: 3D forested mountain ridge with pine silhouettes & rolling valley mist
    {
      const H = 320;
      const f = periodicNoise(W, [[3, 26], [5, 16], [9, 10], [17, 5]], 19);
      const ridgeY = (x) => 135 - f(x);
      let ridge = `M0 ${H}`;
      for (let x = 0; x <= W; x += 10) ridge += ` L${x} ${n1(ridgeY(x))}`;
      ridge += ` L${W} ${H} Z`;

      let pines = '';
      let s = 3;
      const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
      for (let x = 4; x < W - 4; x += 6 + rnd() * 6) {
        pines += pineTree(x, ridgeY(x) + 5, 14 + rnd() * 20);
      }

      mid._aspect = W / H;
      mid.style.backgroundImage = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#3d4f72"/><stop offset=".45" stop-color="#24334e"/><stop offset="1" stop-color="#141c2c"/>
          </linearGradient>
          <linearGradient id="pineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#2f3f5c"/><stop offset="1" stop-color="#182336"/>
          </linearGradient>
        </defs>
        <path d="${ridge}" fill="url(#g)"/>
        <path d="${pines}" fill="url(#pineGrad)"/>
      </svg>`);
    }

    // Near: dense roadside conifers with 3D branch tiers and subtle morning rim light
    {
      const H = 260;
      let pines = '';
      let rims = '';
      let s = 41;
      const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
      for (let x = 10; x < W - 10; x += 15 + rnd() * 28) {
        if (rnd() < 0.16) continue; // gaps so mountains remain visible
        const h = 75 + rnd() * 150;
        pines += pineTree(x, H, h);
        // Subtle morning rim light catching the right edge of roadside pines
        const w = h * 0.34;
        rims += `M${n1(x)} ${n1(H - h)} L${n1(x + w * 0.5)} ${n1(H - h * 0.62)} L${n1(x + w * 0.8)} ${n1(H - h * 0.28)} L${n1(x + w)} ${n1(H)} `;
      }
      trees._aspect = W / H;
      trees.style.backgroundImage = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <path d="${pines}" fill="#0b101a"/>
        <path d="${rims}" stroke="#f6c29e" stroke-width="1" opacity=".18" fill="none"/>
        <rect y="${H - 10}" width="${W}" height="10" fill="#0b101a"/>
      </svg>`);
    }
  }

  enterFns.ride = () => {
    const R = C.ride;
    $('ride-title').textContent = R.title;
    $('ride-sub').textContent = R.subtitle;
    const holdBtn = $('btn-ride');
    holdBtn.textContent = R.holdLabel;

    const world = $('ride-world');
    const far = world.querySelector('.layer-far');
    const mid = world.querySelector('.layer-mid');
    const trees = world.querySelector('.layer-trees');
    const dash = $('road-dash');
    const sign = $('milestone-sign');
    const meter = $('ride-meter-fill');

    paintRideLayers(far, mid, trees);
    // Keep each tile at its natural proportions on any screen (no squashed peaks):
    // tile width follows the layer's height, and the layer is wide enough to scroll a full tile.
    const sizeLayers = () => {
      for (const el of [far, mid, trees]) {
        el._tileW = Math.round(el.offsetHeight * el._aspect);
        el.style.backgroundSize = `${el._tileW}px 100%`;
        el.style.width = `${window.innerWidth + el._tileW + 4}px`;
      }
    };
    sizeLayers();
    window.addEventListener('resize', sizeLayers);
    // 3D Couple Bike with Real-time Wind-Animated Hair & Dupatta Physics
    let bikeImg = null;
    const bikeCanvas = $('bike-canvas');
    const bikeCtx = bikeCanvas ? bikeCanvas.getContext('2d') : null;

    if (R.bikeImage) {
      bikeImg = new Image();
      bikeImg.src = R.bikeImage;
      bikeImg.onload = () => {
        if (bikeCanvas && bikeCtx) {
          bikeCanvas.classList.remove('hidden');
          $('bike-beam').classList.remove('hidden');
          $('bike').classList.add('hidden');
          $('bike-art').classList.add('hidden');
        } else {
          const art = $('bike-art');
          art.src = R.bikeImage;
          art.classList.remove('hidden');
          $('bike').classList.add('hidden');
        }
      };
    }

    const stones = R.milestones || [];
    const marks = stones.map((_, i) => i === stones.length - 1 ? 1 : 0.1 + (i * 0.8) / Math.max(1, stones.length - 1));
    let p = 0;
    let speed = 0;
    let holding = false;
    let nextStone = 0;
    let pauseUntil = 0;
    let finished = false;
    let last = performance.now();
    const MAX = 0.05; // progress per second at full throttle (~20s ride)

    function setHold(v) {
      if (finished) return;
      holding = v;
      holdBtn.classList.toggle('holding', v);
      if (v) { Sound.ensure(); Sound.engineOn(); }
    }
    holdBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); holdBtn.setPointerCapture?.(e.pointerId); setHold(true); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => holdBtn.addEventListener(ev, () => setHold(false)));
    holdBtn.addEventListener('contextmenu', (e) => e.preventDefault());
    holdBtn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); setHold(true); } });
    holdBtn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') setHold(false); });

    function showStone(i) {
      const s = stones[i];
      $('story-sign').textContent = s.sign;
      $('story-text').textContent = s.text;
      const card = $('story-card');
      card.classList.remove('hidden');
      card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
      Sound.chime();
    }

    function finish() {
      finished = true;
      holding = false;
      Sound.engineOff();
      holdBtn.classList.add('hidden');
      $('btn-ride-next').classList.remove('hidden');
      confettiShow(2200);
      setTimeout(Sound.fanfare, 300);
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!document.querySelector('.scene-ride.active')) { Sound.engineOff(); return; }

      const paused = now < pauseUntil;
      const target = holding && !paused && !finished ? MAX : 0;
      speed += (target - speed) * Math.min(1, dt * (target > speed ? 2.2 : 4));
      if (speed < 0.0004) speed = 0;
      p = Math.min(1, p + speed * dt);

      if (nextStone < marks.length && p >= marks[nextStone]) {
        p = marks[nextStone];
        speed = 0;
        showStone(nextStone);
        nextStone++;
        if (nextStone >= marks.length) finish();
        else pauseUntil = now + 1400;
      }

      const W = window.innerWidth;
      for (const [el, k] of [[far, 1.2], [mid, 3], [trees, 7]]) {
        el.style.transform = `translateX(${-(p * W * k) % (el._tileW || W)}px)`;
      }
      dash.style.transform = `translateX(${-(p * W * 14) % 96}px)`;
      world.style.setProperty('--p', p.toFixed(3));
      world.classList.toggle('moving', speed > 0.004);
      meter.style.width = `${p * 100}%`;
      Sound.engineSpeed(speed / MAX);

      // Roadside sign for the upcoming (or just reached) milestone
      const si = marks.findIndex((m) => m - p > -0.08);
      const ahead = si >= 0 ? marks[si] - p : -1;
      if (si >= 0 && ahead < 0.25) {
        sign.textContent = stones[si].sign;
        sign.style.left = `${W * 0.62 + ahead * W * 5}px`;
        sign.style.display = 'block';
      } else {
        sign.style.display = 'none';
      }

      // Dynamic 60fps Hair & Dupatta Wind Simulation on 3D Couple Bike Canvas
      if (bikeImg && bikeImg.complete && bikeCtx) {
        // The artwork is lit like daytime — dim and cool it at night, warm it up at sunrise
        const lit = p.toFixed(2);
        if (bikeCanvas._lit !== lit) {
          bikeCanvas._lit = lit;
          bikeCanvas.style.filter = `drop-shadow(0 14px 24px rgba(0,0,0,.75)) brightness(${(0.6 + p * 0.4).toFixed(3)}) saturate(${(0.72 + p * 0.28).toFixed(3)})`;
        }
        const t = now * 0.001;
        const speedRatio = speed / MAX;
        const bump = speedRatio > 0.08 ? Math.sin(t * 22) * 2.2 : Math.sin(t * 3.5) * 0.7;

        bikeCtx.clearRect(0, 0, 1376, 768);

        // 1. Static left & right zones
        bikeCtx.drawImage(bikeImg, 0, 0, 210, 768, 0, bump, 210, 768);
        bikeCtx.drawImage(bikeImg, 620, 0, 1376 - 620, 768, 620, bump, 1376 - 620, 768);

        // 2. Static chassis, seat, muffler & wheels (y: 460 to 768)
        bikeCtx.drawImage(bikeImg, 210, 460, 410, 308, 210, 460 + bump, 410, 308);

        // 3. Static torso & hugging arm (x: 520 to 620, y: 260 to 460)
        bikeCtx.drawImage(bikeImg, 520, 260, 100, 200, 520, 260 + bump, 100, 200);

        // 4. Dynamic aerodynamic hair & dupatta slices
        const colStep = 2;
        const hairRootX = 620;
        const hairLeftX = 350;
        const dupRootX = 520;
        const dupLeftX = 210;

        const windSpeed = 6 + speedRatio * 18;
        const hairAmp = 3.5 + speedRatio * 17;
        const dupAmp = 4.5 + speedRatio * 22;

        for (let x = 210; x < 620; x += colStep) {
          // Hair wave (y: 0 to 260)
          let hairDy = 0;
          if (x >= hairLeftX && x <= hairRootX) {
            const hp = (hairRootX - x) / (hairRootX - hairLeftX);
            const weight = Math.pow(hp, 1.3);
            const w1 = Math.sin(t * windSpeed + hp * 4.8) * hairAmp;
            const w2 = Math.cos(t * (windSpeed * 1.3) + hp * 7.5) * (hairAmp * 0.35);
            const lift = -speedRatio * 11 * weight;
            hairDy = (w1 + w2) * weight + lift;
          }
          bikeCtx.drawImage(bikeImg, x, 0, colStep, 260, x, bump + hairDy, colStep, 260);

          // Dupatta wave (y: 260 to 460, only where x < 520)
          if (x < 520) {
            let dupDy = 0;
            if (x >= dupLeftX && x <= dupRootX) {
              const dp = (dupRootX - x) / (dupRootX - dupLeftX);
              const weight = Math.pow(dp, 1.25);
              const d1 = Math.sin(t * (windSpeed * 0.85) + dp * 4.0 + 1.2) * dupAmp;
              const d2 = Math.sin(t * (windSpeed * 1.5) + dp * 6.8) * (dupAmp * 0.3);
              const lift = -speedRatio * 13 * weight;
              dupDy = (d1 + d2) * weight + lift;
            }
            bikeCtx.drawImage(bikeImg, x, 260, colStep, 200, x, 260 + bump + dupDy, colStep, 200);
          }
        }

        // 5. Delicate flying wind strands / wisps drifting behind her hair
        if (speedRatio > 0.04) {
          bikeCtx.save();
          bikeCtx.strokeStyle = 'rgba(28, 18, 36, 0.45)';
          bikeCtx.lineWidth = 1.8;
          bikeCtx.lineCap = 'round';
          for (let w = 0; w < 4; w++) {
            const prog = ((t * (2.2 + speedRatio * 4.5) + w * 0.28) % 1);
            const sx = 390 - prog * 150;
            const sy = 125 + Math.sin(t * 8 + w * 2) * 45 + bump;
            bikeCtx.beginPath();
            bikeCtx.moveTo(sx, sy);
            bikeCtx.quadraticCurveTo(sx - 25, sy + Math.sin(t * 12 + w) * 14, sx - 55, sy - 10);
            bikeCtx.stroke();
          }
          bikeCtx.restore();
        }
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    $('btn-ride-next').addEventListener('click', () => { Sound.chime(); show('court'); });
  };

  // ==============================================================================
  // 5. COURT — Mishrayin vs "Tumhe meri kadar nahi"
  // ==============================================================================
  enterFns.court = () => {
    const K = C.court;
    $('court-title').textContent = K.title;
    $('court-case-title').textContent = K.caseTitle;
    $('court-case-text').textContent = K.caseText;
    $('court-question').textContent = K.question;
    $('btn-gavel').textContent = K.gavelButton;
    $('verdict-title').textContent = K.verdictTitle;
    $('verdict-text').textContent = K.verdictText;

    const answers = $('court-answers');
    (K.answers || []).forEach((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = a.label;
      b.addEventListener('click', () => {
        if (answers.dataset.done) return;
        answers.dataset.done = '1';
        b.classList.add('chosen');
        Log.send('answer', { q: K.question, a: a.label, typed: false, nahiTries: 0 });
        Sound.chime();
        heartsFrom(b, ['😌', '💛', '✨'], 5);
        const reply = $('court-reply');
        reply.textContent = a.reply;
        reply.classList.remove('hidden');
        setTimeout(() => { $('exhibits').classList.remove('hidden'); $('exhibits').scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 1300);
      });
      answers.appendChild(b);
    });

    const ex = $('exhibits');
    const exhibits = K.exhibits || [];
    let opened = 0;
    exhibits.forEach((e, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'exhibit';
      b.style.setProperty('--tilt', `${i % 2 ? 1.2 : -1.2}deg`);
      b.style.setProperty('--delay', `${i * 120}ms`);
      b.innerHTML = '<span class="ex-icon"></span><span class="ex-tag"></span><p class="ex-title"></p><p class="ex-text"></p><span class="ex-tap">tap karke saboot dekho 👆</span>';
      b.querySelector('.ex-icon').textContent = e.icon;
      b.querySelector('.ex-tag').textContent = e.tag;
      b.querySelector('.ex-title').textContent = e.title;
      b.querySelector('.ex-text').textContent = e.text;
      b.addEventListener('click', () => {
        if (b.classList.contains('open')) return;
        b.classList.add('open');
        Sound.sparkle();
        opened++;
        if (opened === exhibits.length) {
          const g = $('btn-gavel');
          g.classList.remove('hidden');
          setTimeout(() => g.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
        }
      });
      ex.appendChild(b);
    });

    $('btn-gavel').addEventListener('click', () => {
      $('btn-gavel').classList.add('hidden');
      Sound.thud(); setTimeout(Sound.thud, 260); setTimeout(Sound.thud, 520);
      if (navigator.vibrate) navigator.vibrate([60, 200, 60, 200, 60]);
      setTimeout(() => {
        const v = $('verdict');
        v.classList.remove('hidden');
        v.scrollIntoView({ behavior: 'smooth', block: 'center' });
        confettiShow(1800);
        Sound.fanfare();
      }, 700);
    });

    $('btn-court-next').addEventListener('click', () => { Sound.chime(); show('dream'); });
  };

  // ==============================================================================
  // 5b. DREAM — "Chalo, sapne me milte hain": she closes her eyes and floats up in a
  // balloon through three sky-islands (fireflies, a singing lake, a mirror palace).
  // Each island gives her a light; the three lights make the moon bloom.
  // ==============================================================================
  const DREAM_STEPS = ['fireflies', 'lake', 'mirrors', 'starlight', 'moon'];
  // Mirror puzzles: f = "/" mirror, b = "\" mirror, P = crystal pillar (stops the beam),
  // G = moon-pearl (the beam must pass through it), R = sleeping rose.
  // Moonlight falls in from the top at column `src`. Each puzzle has exactly one solution.
  const MIRROR_LEVELS = [
    { src: 2, rows: ['...bf', '.....', '....R', '.....', '.....', '..fb.'] },
    { src: 2, rows: ['RP.P.', '.bf..', '.fG.b', 'f..f.', '.....', '...bb'] }
  ];

  function insidePoly(poly, x, y) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function polyArea(poly) {
    let a = 0;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]);
    return Math.abs(a / 2);
  }
  function glowSprite(core, halo) {
    const s = document.createElement('canvas');
    s.width = s.height = 48;
    const g = s.getContext('2d');
    const grad = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    grad.addColorStop(0, `rgba(${core},1)`);
    grad.addColorStop(0.16, `rgba(${core},0.95)`);
    grad.addColorStop(0.4, `rgba(${halo},0.42)`);
    grad.addColorStop(1, `rgba(${halo},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 48, 48);
    return s;
  }

  // ---- Dream art (all in a 360×480 world) ----
  const dreamDefs = () => `<defs>
    <linearGradient id="dRock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b4386"/><stop offset=".45" stop-color="#2f2152"/><stop offset="1" stop-color="#150e2b"/></linearGradient>
    <radialGradient id="dUnder" cx=".5" cy=".3" r=".6"><stop offset="0" stop-color="#ffc9e6" stop-opacity=".34"/><stop offset="1" stop-color="#ffc9e6" stop-opacity="0"/></radialGradient>
    <linearGradient id="dFalls" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6f7ff" stop-opacity=".95"/><stop offset="1" stop-color="#e6f7ff" stop-opacity="0"/></linearGradient>
    <radialGradient id="dSoft"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".55" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <radialGradient id="dSoftPink"><stop offset="0" stop-color="#ffe6f1" stop-opacity=".95"/><stop offset=".55" stop-color="#ffd3e6" stop-opacity=".5"/><stop offset="1" stop-color="#ffd3e6" stop-opacity="0"/></radialGradient>
    <radialGradient id="dGrass" cx=".5" cy=".3" r=".75"><stop offset="0" stop-color="#55977f"/><stop offset="1" stop-color="#1e4442"/></radialGradient>
    <radialGradient id="dGlowGold"><stop offset="0" stop-color="#fff3c4" stop-opacity=".95"/><stop offset=".45" stop-color="#ffd27a" stop-opacity=".45"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
    <radialGradient id="dGlowCyan"><stop offset="0" stop-color="#c8fbff" stop-opacity=".9"/><stop offset="1" stop-color="#7fe0ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="dGlowPink"><stop offset="0" stop-color="#ffe0ee" stop-opacity=".9"/><stop offset="1" stop-color="#ff8fb1" stop-opacity="0"/></radialGradient>
  </defs>`;

  function dreamCloud(x, y, s, fill = 'url(#dSoft)', op = 0.7) {
    const puffs = [[-1.3, 0.2, 0.62], [-0.6, -0.25, 0.85], [0.25, -0.4, 1], [1.05, -0.1, 0.78], [1.6, 0.25, 0.55], [0.1, 0.3, 0.9], [-0.9, 0.35, 0.7], [0.9, 0.38, 0.7]];
    return `<g opacity="${op}">${puffs.map(([dx, dy, r]) => `<circle cx="${(x + dx * s).toFixed(1)}" cy="${(y + dy * s).toFixed(1)}" r="${(r * s).toFixed(1)}" fill="${fill}"/>`).join('')}</g>`;
  }

  // A floating island whose flat top face is an ellipse at height y
  function dreamIsland(y, ry = 30, top = 'url(#dGrass)') {
    return `
      <ellipse cx="180" cy="${y + 50}" rx="200" ry="${ry + 90}" fill="url(#dUnder)"/>
      <g class="bob slow"><path d="M28 ${y + 66} l11 -7 l10 5 l-4 10 l-12 1 z" fill="#3b2b62"/><path d="M330 ${y + 82} l9 -6 l8 4 l-3 8 l-10 1 z" fill="#3b2b62"/></g>
      <path d="M14 ${y} C 22 ${y + 40} 70 ${y + 58} 108 ${y + 74} C 138 ${y + 88} 156 ${y + 112} 180 ${y + 118} C 204 ${y + 112} 224 ${y + 90} 254 ${y + 76} C 296 ${y + 58} 338 ${y + 40} 346 ${y} Z" fill="url(#dRock)"/>
      <path d="M44 ${y + 30} C 92 ${y + 48} 128 ${y + 56} 150 ${y + 74} M206 ${y + 70} C 238 ${y + 54} 286 ${y + 42} 320 ${y + 26} M124 ${y + 78} C 152 ${y + 92} 168 ${y + 100} 178 ${y + 112}" fill="none" stroke="#8a72c4" stroke-opacity=".3" stroke-width="1.4"/>
      <path d="M94 ${y + 66} c -5 16 5 26 0 46 M142 ${y + 90} c 4 14 -4 24 2 38 M226 ${y + 86} c -3 16 5 24 1 40 M272 ${y + 66} c 4 13 -2 22 3 34" stroke="#3a2a5c" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/>
      <path d="M318 ${y + 24} C 322 ${y + 70} 324 ${y + 130} 326 ${y + 240}" stroke="url(#dFalls)" stroke-width="6" fill="none" stroke-linecap="round" opacity=".35"/>
      <path class="falls" d="M318 ${y + 24} C 322 ${y + 70} 324 ${y + 130} 326 ${y + 240}" stroke="url(#dFalls)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <ellipse cx="180" cy="${y}" rx="166" ry="${ry}" fill="${top}"/>
      <ellipse cx="180" cy="${y}" rx="166" ry="${ry}" fill="none" stroke="#ffffff" stroke-opacity=".16" stroke-width="1.5"/>`;
  }

  function dreamWillow(x, y, s, flip = 1) {
    const strands = [-46, -34, -22, -10, 4, 18, 32, 44].map((sx, i) => {
      const top = -150 + Math.abs(sx) * 0.55;
      const len = 70 + (i % 3) * 18;
      return `<path d="M${sx} ${top} C ${sx - 4} ${top + len * 0.4} ${sx + 3} ${top + len * 0.7} ${sx - 2} ${top + len}" />`;
    }).join('');
    return `<g transform="translate(${x} ${y}) scale(${s * flip} ${s})">
      <path d="M-5 0 C -4 -34 -10 -66 -2 -112 L 5 -112 C 8 -66 4 -34 6 0 Z" fill="#1b2c33"/>
      <path d="M0 -104 C -56 -112 -76 -152 -38 -170 C -16 -190 30 -190 48 -168 C 84 -150 62 -110 0 -104 Z" fill="#1f3f43"/>
      <g fill="none" stroke="#2d6660" stroke-width="2.4" stroke-linecap="round" opacity=".95">${strands}</g>
    </g>`;
  }

  function dreamShroom(x, y, s, c) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <circle cy="-8" r="14" fill="url(#${c === 'pink' ? 'dGlowPink' : 'dGlowCyan'})" class="pulse"/>
      <rect x="-1.6" y="-8" width="3.2" height="8" rx="1.4" fill="#e9f6ff"/>
      <path d="M-8 -7 Q0 -19 8 -7 Z" fill="${c === 'pink' ? '#ff9fc4' : '#7fe0ff'}"/>
    </g>`;
  }

  function fireflyArt() {
    const y = 350;
    const grass = Array.from({ length: 34 }, (_, i) => {
      const a = (i / 33) * Math.PI;
      const gx = 180 - Math.cos(a) * 160;
      const gy = y + Math.sin(a) * 26;
      const h = 8 + (i % 4) * 3;
      return `<path d="M${gx.toFixed(1)} ${gy.toFixed(1)} q -2 ${-h * 0.6} -4 ${-h} M${gx.toFixed(1)} ${gy.toFixed(1)} q 2 ${-h * 0.6} 5 ${-h * 0.9}"/>`;
    }).join('');
    return dreamDefs() + `
      ${dreamIsland(y, 30)}
      ${dreamWillow(70, y - 6, 0.95)}
      ${dreamWillow(296, y - 2, 0.82, -1)}
      ${dreamShroom(110, y + 8, 1)}${dreamShroom(124, y + 14, 0.7, 'pink')}${dreamShroom(244, y + 12, 0.9, 'pink')}${dreamShroom(258, y + 6, 0.65)}
      <g class="stump">
        <path d="M156 ${y + 4} L161 ${y - 26} L199 ${y - 26} L204 ${y + 4} Q180 ${y + 10} 156 ${y + 4} Z" fill="#3e2a44"/>
        <ellipse cx="180" cy="${y - 26}" rx="19" ry="5" fill="#6a4a6e"/>
        <ellipse cx="180" cy="${y - 26}" rx="11" ry="2.6" fill="none" stroke="#3e2a44" stroke-width="1"/>
      </g>
      <g class="jar">
        <ellipse id="jar-glow" cx="180" cy="292" rx="44" ry="46" fill="url(#dGlowGold)" opacity="0"/>
        <path d="M163 270 C 159 274 157 282 157 290 L157 312 C 157 318 161 322 167 322 L193 322 C 199 322 203 318 203 312 L203 290 C 203 282 201 274 197 270 Z" fill="rgba(210,235,255,.1)" stroke="rgba(225,242,255,.65)" stroke-width="1.6"/>
        <rect x="165" y="260" width="30" height="11" rx="3.5" fill="rgba(210,235,255,.12)" stroke="rgba(225,242,255,.65)" stroke-width="1.4"/>
        <path d="M162 290 C 162 280 165 275 168 273" stroke="#fff" stroke-opacity=".55" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path d="M164 266 C 172 270 188 270 196 266" stroke="#ff8fb1" stroke-width="2" fill="none"/>
        <path d="M196 266 l7 6 M196 266 l9 1" stroke="#ff8fb1" stroke-width="1.6" stroke-linecap="round"/>
        <g class="cork"><rect x="168" y="246" width="24" height="11" rx="3" fill="#c49463" transform="rotate(16 186 252)"/></g>
      </g>
      <g fill="none" stroke="#4f8f7c" stroke-width="1.4" stroke-linecap="round" opacity=".9">${grass}</g>`;
  }

  function lotusArt(i, x, y, color) {
    const back = [-62, -36, -12, 12, 36, 62].map((a) => `<path class="petal" d="M0 0 C -7 -6 -8 -19 0 -29 C 8 -19 7 -6 0 0 Z" transform="rotate(${a})" opacity=".78"/>`).join('');
    const front = [-44, -16, 16, 44].map((a) => `<path class="petal" d="M0 0 C -6 -5 -7 -15 0 -22 C 7 -15 6 -5 0 0 Z" transform="rotate(${a})"/>`).join('');
    return `<g class="lotus" data-i="${i}" transform="translate(${x} ${y})" style="--lc:${color}" role="button" tabindex="0" aria-label="Kamal ${i + 1}">
      <ellipse class="lotus-hit" cy="-8" rx="32" ry="30" fill="transparent"/>
      <path d="M-30 2 A30 9 0 1 0 -1 -7 L1 2 Z" fill="#2c6a55"/>
      <path d="M-24 1 A24 6 0 0 0 20 1" fill="none" stroke="#4f9a7d" stroke-width="1" opacity=".7"/>
      <ellipse class="lotus-glow" cy="-12" rx="34" ry="26" fill="var(--lc)" opacity="0"/>
      <g class="petals">${back}${front}<circle cy="-6" r="4" fill="#ffe9a8"/></g>
    </g>`;
  }

  function lakeArt(pos, colors) {
    const y = 322;
    const reeds = [[312, 300], [320, 306], [328, 298], [304, 308]].map(([rx, ry], i) => `<path d="M${rx} ${ry} q ${i % 2 ? 3 : -3} -30 ${i % 2 ? 1 : -2} -54" stroke="#2f5e4f" stroke-width="2" fill="none"/><ellipse cx="${rx + (i % 2 ? 1 : -2)}" cy="${ry - 50}" rx="2.6" ry="7" fill="#7a4a3a"/>`).join('');
    const shimmer = [0, 1, 2, 3, 4, 5].map((k) => `<path class="shimmer" style="animation-delay:${k * 0.35}s" d="M${172 - (k % 3) * 4} ${y - 20 + k * 9} h ${16 + (k % 2) * 6}" stroke="#fff6dc" stroke-width="1.6" stroke-linecap="round"/>`).join('');
    return dreamDefs() + `
      <defs>
        <radialGradient id="dWater" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#4a5aa8"/><stop offset=".7" stop-color="#26306a"/><stop offset="1" stop-color="#1a1f4a"/></radialGradient>
        <linearGradient id="dRefl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6dc" stop-opacity=".75"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></linearGradient>
      </defs>
      ${dreamIsland(y, 64)}
      <ellipse cx="180" cy="${y + 2}" rx="150" ry="48" fill="url(#dWater)"/>
      <ellipse cx="180" cy="${y + 2}" rx="150" ry="48" fill="none" stroke="#9fb4ff" stroke-opacity=".25" stroke-width="1.2"/>
      <ellipse cx="180" cy="${y - 4}" rx="16" ry="40" fill="url(#dRefl)" opacity=".55"/>
      <g opacity=".85">${shimmer}</g>
      ${dreamWillow(42, y - 26, 0.78)}
      <g>${reeds}</g>
      <g class="paper-boat">
        <path d="M-14 0 L14 0 L9 7 L-9 7 Z" fill="#fff4e6"/><path d="M-6 0 L0 -12 L6 0 Z" fill="#ffe1ec"/>
        <circle cy="-15" r="5" fill="url(#dGlowGold)"/><rect x="-1" y="-15" width="2" height="4" fill="#fff"/>
      </g>
      ${pos.map(([x, py], i) => lotusArt(i, x, py, colors[i])).join('')}`;
  }

  function palaceArt() {
    const stars = Array.from({ length: 7 }, (_, i) => `<g class="twinkle" style="animation-delay:${(i * 0.45).toFixed(2)}s" transform="translate(${28 + i * 50} ${30 + (i % 3) * 18})"><path d="M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z" fill="#fff6dc"/></g>`).join('');
    return dreamDefs() + `
      <defs>
        <linearGradient id="dArch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9b2ff" stop-opacity=".16"/><stop offset="1" stop-color="#c9b2ff" stop-opacity=".02"/></linearGradient>
        <linearGradient id="dMirror" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#d9d2ff"/><stop offset="1" stop-color="#8a7ad6"/></linearGradient>
        <linearGradient id="dPillar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4b3a86"/><stop offset=".5" stop-color="#7e6ac8"/><stop offset="1" stop-color="#3b2d6e"/></linearGradient>
        <linearGradient id="dGem" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4fbff"/><stop offset="1" stop-color="#8fd6ff"/></linearGradient>
      </defs>
      ${dreamIsland(452, 24)}
      <path d="M22 446 L22 132 Q22 34 180 20 Q338 34 338 132 L338 446" fill="url(#dArch)" stroke="#d9c8ff" stroke-opacity=".28" stroke-width="2"/>
      <path d="M34 446 L34 138 Q34 52 180 36 Q326 52 326 138 L326 446" fill="none" stroke="#d9c8ff" stroke-opacity=".12" stroke-width="1.2"/>
      <path d="M14 446 L14 120 L22 96 L30 120 L30 446 Z M330 446 L330 120 L338 96 L346 120 L346 446 Z" fill="#3b2d6e" opacity=".75"/>
      ${stars}`;
  }

  function starlightArt() {
    const y = 370;
    const stars = Array.from({ length: 12 }, (_, i) => `<circle class="twinkle" style="animation-delay:${(i * 0.35).toFixed(2)}s" cx="${(24 + ((i * 73) % 312)).toFixed(0)}" cy="${(24 + ((i * 47) % 110)).toFixed(0)}" r="${0.8 + (i % 3) * 0.6}" fill="#fff6dc"/>`).join('');
    return dreamDefs() + `
      <defs>
        <radialGradient id="dStardust" cx=".5" cy=".5" r=".5">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="35%" stop-color="#ffe3a8" stop-opacity=".9"/>
          <stop offset="70%" stop-color="#ff9ec6" stop-opacity=".35"/>
          <stop offset="100%" stop-color="#ff9ec6" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="dBridge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ffd27a" stop-opacity=".25"/>
          <stop offset="50%" stop-color="#ff9ec6" stop-opacity=".8"/>
          <stop offset="100%" stop-color="#ffd27a" stop-opacity=".25"/>
        </linearGradient>
      </defs>
      ${dreamIsland(y, 44)}
      ${dreamCloud(64, y - 24, 44, 'url(#dSoftPink)', 0.8)}
      ${dreamCloud(296, y - 18, 48, 'url(#dSoftPink)', 0.8)}
      ${dreamCloud(180, y + 8, 58, 'url(#dSoft)', 0.9)}
      ${dreamWillow(42, y - 30, 0.75)}
      ${stars}
      <g id="starlight-world">
        <path id="starlight-bridge" d="M 64 240 Q 180 90 296 240" fill="none" stroke="url(#dBridge)" stroke-width="2.5" stroke-dasharray="5 5" opacity=".4"/>
        <g id="starlight-lines" stroke="#ffd27a" stroke-width="2.2" stroke-linecap="round" filter="drop-shadow(0 0 6px #ffd27a)"></g>
        <g id="starlight-stars"></g>
      </g>`;
  }

  function dockArt() {
    return dreamDefs() + `
      ${dreamCloud(70, 430, 46, 'url(#dSoftPink)', 0.85)}
      ${dreamCloud(290, 440, 50, 'url(#dSoftPink)', 0.85)}
      ${dreamCloud(180, 392, 62, 'url(#dSoft)', 0.92)}
      ${dreamCloud(120, 462, 54, 'url(#dSoft)', 0.8)}
      ${dreamCloud(250, 470, 56, 'url(#dSoft)', 0.8)}
      <g class="dock-post">
        <rect x="262" y="320" width="7" height="58" rx="2" fill="#7a5a6a"/>
        <circle cx="265.5" cy="314" r="20" fill="url(#dGlowGold)" class="pulse"/>
        <rect x="259" y="306" width="13" height="15" rx="3" fill="#ffe7a8" stroke="#a57a4a" stroke-width="1.5"/>
        <g transform="rotate(-6 236 352)"><rect x="210" y="342" width="56" height="20" rx="4" fill="#f6e3c8" stroke="#a57a4a" stroke-width="1.2"/>
        <text x="238" y="356" text-anchor="middle" class="dock-sign">sapno ki taraf ↑</text></g>
      </g>
      <path class="tether" d="M266 336 C 236 330 214 318 194 300" stroke="#ff8fb1" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }

  // The swinging couple on a crescent; local origin = middle of the seat
  function crescentCouple() {
    const ink = '#1c1233';
    return `<g class="swing">
      <g class="strands" stroke="#ffe9b8" stroke-width="1.2" opacity=".7"><path d="M102 -20 L102 338"/><path d="M258 -20 L258 338"/></g>
      <g class="strand-stars">${[40, 110, 180, 250, 310].map((sy, i) => `<circle cx="${i % 2 ? 258 : 102}" cy="${sy}" r="2.2" fill="#fff6dc"/><circle cx="${i % 2 ? 102 : 258}" cy="${sy + 30}" r="1.6" fill="#fff6dc"/>`).join('')}</g>
      <g transform="translate(180 352)">
        <path d="M-78 -14 C -60 34 60 34 78 -14 C 50 14 -50 14 -78 -14 Z" fill="url(#dCrescent)"/>
        <path d="M-78 -14 C -50 14 50 14 78 -14" stroke="#fff6d8" stroke-opacity=".8" stroke-width="1.2" fill="none"/>
        <path d="M8 -31 C 0 -34 -12 -34 -22 -30" stroke="${ink}" stroke-width="4.5" stroke-linecap="round" fill="none"/>
        <path d="M5 8 C 3 -10 4 -24 8 -33 C 12 -37 23 -37 27 -33 C 30 -24 31 -10 29 8 Z" fill="${ink}"/>
        <rect x="14" y="-41" width="6" height="7" fill="${ink}"/>
        <circle cx="17" cy="-47" r="7.8" fill="${ink}"/>
        <path d="M9 -48 C 9 -57 23 -59 26 -49 C 22 -53 15 -54 9 -48 Z" fill="${ink}"/>
        <path d="M27 -30 C 32 -22 33 -12 31 -2" stroke="${ink}" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M8 -33 C 12 -37 23 -37 27 -33 M24 -53 C 26 -50 26 -45 24 -42" stroke="#ffe3b0" stroke-opacity=".5" stroke-width="1" fill="none"/>
        <g class="her-lean">
          <path d="M-22 -50 C -28 -40 -31 -24 -34 -6 C -28 -9 -25 -14 -23 -22 C -21 -32 -18 -42 -14 -51 Z" fill="${ink}"/>
          <path d="M-27 6 C -28 -14 -27 -26 -24 -32 C -20 -35 -12 -35 -9 -32 C -7 -24 -7 -12 -6 6 Z" fill="${ink}"/>
          <rect x="-18" y="-38" width="5" height="6" fill="${ink}"/>
          <circle cx="-15" cy="-43" r="7.2" fill="${ink}"/>
          <path d="M-22.5 -45 C -22 -53 -12 -55 -8 -47 C -12 -50 -17 -50 -22.5 -45 Z" fill="${ink}"/>
          <circle cx="-21" cy="-50" r="3.4" fill="${ink}"/>
          <path d="M-24 -32 C -20 -35 -12 -35 -9 -32 M-21 -49 C -18 -53 -12 -52 -10 -48" stroke="#ffe3b0" stroke-opacity=".5" stroke-width="1" fill="none"/>
        </g>
        <path d="M-29 4 C -34 16 -38 28 -41 40 C -34 43 -28 40 -23 43 C -17 40 -10 44 -3 41 C -4 28 -5 16 -6 4 Z" fill="${ink}"/>
        <path d="M-28 42 l-2 6 l7 -1 Z M-14 43 l0 6 l6 -1.5 Z" fill="${ink}"/>
        <path d="M8 6 C 7 18 6 30 5 44 L 12 44 L 15 22 L 17 8 Z M18 8 L 20 24 L 19 46 L 26 46 L 27 24 L 28 6 Z" fill="${ink}"/>
        <path d="M3 43 h10 v4 h-11 Z M18 45 h10 v4 h-11 Z" fill="${ink}"/>
        <g class="couple-heart"><path d="M0 -70 C -6 -78 -16 -72 -10 -64 L0 -56 L10 -64 C 16 -72 6 -78 0 -70 Z" fill="#ff8fb1"/></g>
      </g>
    </g>`;
  }

  function moonArt() {
    const petals = (n, inner, outer, w, rot) => Array.from({ length: n }, (_, k) => `<path d="M0 ${-inner} C ${w} ${-(inner + outer) / 2} ${w * 0.9} ${-outer + 10} 0 ${-outer} C ${-w * 0.9} ${-outer + 10} ${-w} ${-(inner + outer) / 2} 0 ${-inner} Z" transform="rotate(${(k * 360) / n + rot})"/>`).join('');
    const sparks = Array.from({ length: 14 }, (_, i) => `<circle class="twinkle" style="animation-delay:${(i * 0.3).toFixed(1)}s" cx="${(20 + ((i * 97) % 320)).toFixed(0)}" cy="${(24 + ((i * 53) % 120)).toFixed(0)}" r="${1 + (i % 3) * 0.5}" fill="#fff6dc"/>`).join('');
    return dreamDefs() + `
      <defs>
        <radialGradient id="dMoon" cx=".4" cy=".38" r=".7"><stop offset="0" stop-color="#fffef6"/><stop offset=".6" stop-color="#ffefc9"/><stop offset="1" stop-color="#f2d39a"/></radialGradient>
        <radialGradient id="dHalo"><stop offset=".45" stop-color="#fff1d2" stop-opacity=".6"/><stop offset="1" stop-color="#ffd6ec" stop-opacity="0"/></radialGradient>
        <linearGradient id="dPetalA" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff3e0" stop-opacity=".95"/><stop offset="1" stop-color="#ffb8d2" stop-opacity=".55"/></linearGradient>
        <linearGradient id="dPetalB" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#ffd9a8" stop-opacity=".7"/></linearGradient>
        <linearGradient id="dCrescent" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2c4"/><stop offset="1" stop-color="#f2b35a"/></linearGradient>
      </defs>
      ${sparks}
      <circle id="moon-halo" cx="180" cy="196" r="178" fill="url(#dHalo)" opacity=".35"/>
      <g id="moon-petals" transform="translate(180 196) scale(.3)">
        <g fill="url(#dPetalA)" opacity=".85">${petals(12, 60, 176, 34, 0)}</g>
        <g fill="url(#dPetalB)">${petals(12, 56, 132, 26, 15)}</g>
      </g>
      <circle cx="180" cy="196" r="96" fill="url(#dMoon)"/>
      <g fill="#e9cf98" opacity=".35"><circle cx="150" cy="170" r="14"/><circle cx="206" cy="222" r="10"/><circle cx="214" cy="160" r="7"/><circle cx="160" cy="232" r="6"/></g>
      <circle id="moon-ring" cx="180" cy="196" r="104" fill="none" stroke="#ffd27a" stroke-width="3" stroke-linecap="round" transform="rotate(-90 180 196)" stroke-dasharray="653.5" stroke-dashoffset="653.5"/>
      <g class="shooting"><path d="M300 40 l-60 26" /><path d="M330 110 l-50 22"/><path d="M90 30 l-46 20"/></g>
      ${crescentCouple()}
      ${dreamCloud(60, 452, 44, 'url(#dSoftPink)', 0.85)}
      ${dreamCloud(300, 446, 48, 'url(#dSoftPink)', 0.85)}
      ${dreamCloud(180, 478, 58, 'url(#dSoft)', 0.9)}`;
  }

  function balloonArt() {
    const env = 'M60 4 C 98 4 118 34 116 64 C 114 92 92 112 74 128 Q 60 134 46 128 C 28 112 6 92 4 64 C 2 34 22 4 60 4 Z';
    const bulbs = Array.from({ length: 9 }, (_, k) => {
      const t = (k + 0.5) / 9;
      const x = (1 - t) * (1 - t) * 4 + 2 * (1 - t) * t * 60 + t * t * 116;
      const y = (1 - t) * (1 - t) * 72 + 2 * (1 - t) * t * 92 + t * t * 72;
      return `<circle class="bulb-dot" style="animation-delay:${(k * 0.27).toFixed(2)}s" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2"/>`;
    }).join('');
    return `<svg viewBox="0 0 120 170" aria-hidden="true">
      <defs>
        <linearGradient id="bEnv" x1="0" x2="1"><stop offset="0" stop-color="#c93a6c"/><stop offset=".5" stop-color="#ff8fb1"/><stop offset="1" stop-color="#b8325f"/></linearGradient>
        <linearGradient id="bGore" x1="0" x2="1"><stop offset="0" stop-color="#ffd9c0"/><stop offset=".5" stop-color="#fff6ea"/><stop offset="1" stop-color="#f0c4a6"/></linearGradient>
        <radialGradient id="bShine" cx=".32" cy=".26" r=".55"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        <radialGradient id="bFlame"><stop offset="0" stop-color="#fff6c2"/><stop offset=".5" stop-color="#ffb347" stop-opacity=".85"/><stop offset="1" stop-color="#ff7a3a" stop-opacity="0"/></radialGradient>
        <radialGradient id="bHalo"><stop offset=".5" stop-color="#ffc2d8" stop-opacity=".35"/><stop offset="1" stop-color="#ffc2d8" stop-opacity="0"/></radialGradient>
        <clipPath id="bClip"><path d="${env}"/></clipPath>
      </defs>
      <ellipse cx="60" cy="66" rx="66" ry="72" fill="url(#bHalo)"/>
      <path d="${env}" fill="url(#bEnv)"/>
      <g clip-path="url(#bClip)">
        <path d="M60 4 C 76 30 78 96 66 132 L 54 132 C 42 96 44 30 60 4 Z" fill="url(#bGore)"/>
        <path d="M60 4 C 104 18 114 84 90 124 L 84 128 C 100 86 94 28 60 4 Z" fill="url(#bGore)" opacity=".85"/>
        <path d="M60 4 C 16 18 6 84 30 124 L 36 128 C 20 86 26 28 60 4 Z" fill="url(#bGore)" opacity=".85"/>
        <path d="M0 72 Q60 92 120 72" stroke="#ffd27a" stroke-width="5" fill="none"/>
        <path d="M30 116 Q60 126 90 116" stroke="#ffd27a" stroke-width="3" fill="none" opacity=".8"/>
      </g>
      <path d="${env}" fill="url(#bShine)"/>
      <g class="bulbs">${bulbs}</g>
      <path d="M47 129 L49 147 M73 129 L71 147 M55 131 L55.5 147 M65 131 L64.5 147" stroke="#a5805a" stroke-width="1"/>
      <ellipse class="flame" cx="60" cy="136" rx="6" ry="7" fill="url(#bFlame)"/>
      <circle cx="54.5" cy="143" r="3.6" fill="#2a1b33"/><circle cx="52" cy="140.5" r="2" fill="#2a1b33"/>
      <circle cx="65.5" cy="142.4" r="3.9" fill="#2a1b33"/>
      <rect x="45" y="145.5" width="30" height="4" rx="2" fill="#7a5230"/>
      <path d="M47 149 L73 149 L70.5 164 Q60 167 49.5 164 Z" fill="#a8743f"/>
      <path d="M48.5 154 H71.5 M49.2 159 H70.8 M54 149 V165 M60 149 V166 M66 149 V165" stroke="#7a5230" stroke-width=".8" opacity=".7"/>
    </svg>`;
  }

  enterFns.dream = () => {
    const D = C.dream || {};
    const NS = 'http://www.w3.org/2000/svg';
    const scene = document.querySelector('[data-scene="dream"]');
    const stage = $('dream-stage');
    const world = $('dream-world');
    const svg = $('dream-svg');
    const cvs = $('dream-canvas');
    const ctx = cvs.getContext('2d');
    const note = $('dream-note');
    const go = $('btn-dream-go');
    const aux = $('btn-dream-aux');
    const balloon = $('dream-balloon');
    const orbs = [...document.querySelectorAll('#dream-orbs .orb')];
    const part = (k) => D[k] || {};
    const ORB_COLORS = ['#ffd27a', '#c9b2ff', '#a8e8ff', '#ff9ec6'];
    $('dream-final').classList.add('hidden');
    svg.setAttribute('class', '');
    scene.classList.remove('dreaming', 'holding');
    let level = 0;
    let stop = null; // ends the current island's loops and listeners
    let lidsEl = null;

    $('dream-title').textContent = D.title || '';
    $('dream-sub').textContent = D.subtitle || '';
    orbs.forEach((o, i) => {
      o.classList.remove('lit', 'given');
      o.querySelector('b').textContent = part(DREAM_STEPS[i]).orb || '';
    });
    balloon.innerHTML = balloonArt();

    // ---------- helpers ----------
    function say(text) {
      note.classList.remove('in');
      void note.offsetWidth;
      note.textContent = fill(text);
      note.classList.add('in');
    }
    function offer(btn, label, fn) {
      btn.textContent = label;
      btn.onclick = fn;
      btn.classList.remove('hidden');
    }
    const hide = (...els) => els.forEach((el) => { el.classList.add('hidden'); el.onclick = null; });
    const setPhase = (p) => { scene.dataset.phase = p; };
    function setSky(n) {
      scene.dataset.lv = n;
      scene.querySelectorAll('.dsky').forEach((l) => l.classList.toggle('on', Number(l.dataset.l) === n));
    }

    // The world is a 3:4 box sized to the space between the header and the footer
    function fit() {
      const r = stage.getBoundingClientRect();
      const w = Math.max(220, Math.min(r.width, r.height * 0.75, 460));
      const h = w / 0.75;
      world.style.width = `${w}px`;
      world.style.height = `${h}px`;
      stage.style.setProperty('--ww', `${w}px`);
      stage.style.setProperty('--wh', `${h}px`);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cvs.width = Math.round(w * dpr);
      cvs.height = Math.round(h * dpr);
      ctx.setTransform((w / 360) * dpr, 0, 0, (w / 360) * dpr, 0, 0);
    }
    fit();
    setTimeout(fit, 400);
    window.addEventListener('resize', fit);

    function toWorld(e) {
      const r = world.getBoundingClientRect();
      return [((e.clientX - r.left) * 360) / r.width, ((e.clientY - r.top) * 480) / r.height];
    }
    function toScreen(x, y) {
      const r = world.getBoundingClientRect();
      return [r.left + (x * r.width) / 360, r.top + (y * r.height) / 480];
    }
    function whisper(text, x, y, cls = '', color = '') {
      const w = document.createElement('span');
      w.className = `dream-whisper ${cls}`;
      w.textContent = text;
      w.style.left = `${x / 3.6}%`;
      w.style.top = `${y / 4.8}%`;
      if (color) w.style.color = color;
      $('dream-words').appendChild(w);
      setTimeout(() => w.remove(), 2700);
    }

    // A glowing light travels between the world and her row of lights
    function flyLight(i, from, to, ms = 1100) {
      return new Promise((resolve) => {
        const o = document.createElement('span');
        o.className = 'orb-fly';
        o.style.setProperty('--oc', ORB_COLORS[i]);
        o.style.left = `${from[0]}px`;
        o.style.top = `${from[1]}px`;
        o.style.transitionDuration = `${ms}ms`;
        document.body.appendChild(o);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          o.style.transform = `translate(${to[0] - from[0]}px, ${to[1] - from[1]}px) scale(.55)`;
        }));
        setTimeout(() => { o.remove(); resolve(); }, ms + 60);
      });
    }
    function slotCenter(i) {
      const r = orbs[i].querySelector('i').getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2];
    }
    async function earnLight(i, x, y) {
      Sound.sparkle();
      await flyLight(i, toScreen(x, y), slotCenter(i));
      orbs[i].classList.add('lit');
      Sound.chime();
    }

    function lids(closed) {
      if (!lidsEl) {
        lidsEl = document.createElement('div');
        lidsEl.className = 'dream-lids';
        lidsEl.setAttribute('aria-hidden', 'true');
        lidsEl.innerHTML = '<i class="lid lid-top"></i><i class="lid lid-bottom"></i>';
        document.body.appendChild(lidsEl);
        void lidsEl.offsetWidth;
      }
      lidsEl.classList.toggle('closed', closed);
      return wait(closed ? 1150 : 1250);
    }

    // Soft clouds drifting past; they slide down while the balloon climbs
    function cloudTile(rgb, a, count, rmin, rmax, w, h) {
      let puffs = '';
      for (let k = 0; k < count; k++) {
        const s = rand(rmin, rmax);
        const cx = rand(s * 2.4, w - s * 2.4);
        const cy = rand(s * 1.6, h - s * 1.6);
        const n = 6 + Math.floor(rand(0, 4));
        for (let j = 0; j < n; j++) {
          puffs += `<circle cx="${(cx + rand(-1.5, 1.5) * s).toFixed(0)}" cy="${(cy + rand(-0.3, 0.35) * s).toFixed(0)}" r="${(s * rand(0.55, 1)).toFixed(0)}" fill="url(#c)"/>`;
        }
      }
      const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><radialGradient id="c"><stop offset="0" stop-color="rgb(${rgb})" stop-opacity="${a}"/><stop offset=".6" stop-color="rgb(${rgb})" stop-opacity="${(a * 0.45).toFixed(2)}"/><stop offset="1" stop-color="rgb(${rgb})" stop-opacity="0"/></radialGradient></defs>${puffs}</svg>`;
      return `url("data:image/svg+xml,${encodeURIComponent(tile)}")`;
    }
    const cloudBack = $('cloud-back');
    const cloudFront = $('cloud-front');
    cloudBack.style.backgroundImage = cloudTile('214,196,255', 0.3, 5, 26, 44, 420, 700);
    cloudFront.style.backgroundImage = cloudTile('255,232,243', 0.34, 3, 40, 62, 560, 930);
    let cloudStep = 0;
    function cloudsUp() {
      cloudStep++;
      cloudBack.style.backgroundPosition = `0 ${cloudStep * 700}px`;
      cloudFront.style.backgroundPosition = `0 ${cloudStep * 1860}px`;
    }

    const motes = $('dream-motes');
    if (!motes.childElementCount) {
      for (let i = 0; i < 18; i++) {
        const m = document.createElement('i');
        m.className = 'dream-mote';
        m.style.left = `${rand(2, 98).toFixed(1)}%`;
        m.style.setProperty('--s', `${rand(3, 7).toFixed(1)}px`);
        m.style.setProperty('--d', `${rand(11, 20).toFixed(1)}s`);
        m.style.setProperty('--dl', `${rand(-20, 0).toFixed(1)}s`);
        m.style.setProperty('--dx', `${rand(-60, 60).toFixed(0)}px`);
        motes.appendChild(m);
      }
    }

    // ---------- the journey ----------
    async function finishIsland(i, x, y) {
      level = i + 1;
      store.set('dream_lv', level);
      Log.send('dream_step', { step: DREAM_STEPS[i] });
      await earnLight(i, x, y);
      say(part(DREAM_STEPS[i]).done);
      offer(go, D.upButton || 'Aur upar chalein 🎈', () => { hide(go); rise(i + 1); });
    }

    async function rise(next) {
      if (stop) { stop(); stop = null; }
      hide(go, aux);
      cvs.style.pointerEvents = 'none';
      setPhase('travel');
      world.classList.add('sink');
      Sound.whoosh();
      Sound.pad([261.63, 329.63, 392, 523.25], 3.4);
      cloudsUp();
      setSky(next + 1);
      const name = part(DREAM_STEPS[next]).name || '';
      const place = $('dream-place');
      place.textContent = name;
      place.classList.add('show');
      say((D.travel || [])[next] || '');
      await wait(2900);
      place.classList.remove('show');
      ctx.clearRect(0, 0, 360, 480);
      world.classList.add('enter');
      world.classList.remove('sink');
      void world.offsetWidth;
      $('dream-sub').textContent = name;
      ISLANDS[next]();
      world.classList.remove('enter');
      setPhase(next === 4 ? 'moon' : 'play');
    }

    function intro() {
      setSky(0);
      setPhase('dock');
      svg.innerHTML = dockArt();
      world.classList.add('asleep');
      say(D.intro);
      offer(go, D.closeEyes || 'Aankhen band karo 😌', async () => {
        hide(go);
        Sound.ensure();
        Log.send('dream_step', { step: 'eyes_closed' });
        await lids(true);
        world.classList.remove('asleep');
        scene.classList.add('dreaming');
        Sound.pad([196, 246.94, 293.66, 392], 4.5);
        await wait(700);
        await lids(false);
        say(D.board);
        const board = () => {
          balloon.onclick = null;
          balloon.onkeydown = null;
          balloon.classList.remove('beckon');
          ['tabindex', 'role', 'aria-label'].forEach((a) => balloon.removeAttribute(a));
          hide(go);
          rise(0);
        };
        balloon.classList.add('beckon');
        balloon.setAttribute('tabindex', '0');
        balloon.setAttribute('role', 'button');
        balloon.setAttribute('aria-label', D.boardButton || 'Gubbara');
        balloon.onclick = board;
        balloon.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); board(); } };
        offer(go, D.boardButton || 'Gubbare me baitho 🎈', board);
      });
    }

    // ---------- Island 1: Jugnuon ka Bagh — lasso fireflies into a jar ----------
    function fireflies() {
      const F = part('fireflies');
      const goal = F.goal || 12;
      const whispers = F.whispers || [];
      svg.innerHTML = fireflyArt();
      say(F.howTo);
      const jarGlow = svg.querySelector('#jar-glow');
      const sprite = glowSprite('255,251,205', '214,255,140');
      const groups = Array.from({ length: 4 }, (_, k) => ({ sx: rand(0.09, 0.16), sy: rand(0.07, 0.13), p: k * 1.6 + rand(0, 0.8) }));
      const fly = (g) => ({
        g, rx: rand(14, 40), ry: rand(10, 28), wx: rand(0.5, 1.2), wy: rand(0.6, 1.3), px: rand(0, 6.3), py: rand(0, 6.3),
        blink: rand(0, 6.3), x: 180, y: 200, pushX: 0, pushY: 0, state: 'free'
      });
      const flies = Array.from({ length: 18 }, (_, i) => fly(groups[i % 4]));
      let caught = 0;
      let trail = null;
      let trailLen = 0;
      let flash = null;
      let done = false;
      let wi = 0;
      let raf = 0;
      const t0 = performance.now();
      const centerOf = (g, t) => [180 + 112 * Math.sin(t * g.sx + g.p), 186 + 84 * Math.sin(t * g.sy * 1.3 + g.p * 1.7)];
      const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

      function draw(now) {
        const t = (now - t0) / 1000;
        ctx.clearRect(0, 0, 360, 480);
        for (const f of flies) {
          if (f.state === 'free') {
            const [cx, cy] = centerOf(f.g, t);
            const x = cx + f.rx * Math.sin(t * f.wx + f.px);
            const y = cy + f.ry * Math.sin(t * f.wy + f.py);
            if (trail && trail.length) {
              // a little shy of her finger
              const [hx, hy] = trail[trail.length - 1];
              const dx = x + f.pushX - hx;
              const dy = y + f.pushY - hy;
              const d = Math.hypot(dx, dy);
              if (d < 34) { f.pushX += (dx / (d + 1)) * 1.4; f.pushY += (dy / (d + 1)) * 1.4; }
            }
            f.pushX *= 0.985;
            f.pushY *= 0.985;
            f.x = Math.max(14, Math.min(346, x + f.pushX));
            f.y = Math.max(64, Math.min(318, y + f.pushY));
          } else if (f.state === 'flying') {
            const k = ease(Math.max(0, Math.min(1, (now - f.t) / 850)));
            const mx = (f.x0 + 180) / 2;
            const my = Math.min(f.y0, 236) - 46;
            f.x = (1 - k) * (1 - k) * f.x0 + 2 * (1 - k) * k * mx + k * k * 180;
            f.y = (1 - k) * (1 - k) * f.y0 + 2 * (1 - k) * k * my + k * k * 266;
            if (now - f.t >= 850) {
              f.state = 'jar';
              f.jx = rand(-14, 14);
              f.jy = rand(-12, 22);
              caught++;
              jarGlow.setAttribute('opacity', Math.min(1, caught / goal).toFixed(2));
              note.textContent = String(F.count || '{n} / {goal}').replace('{n}', Math.min(caught, goal)).replace('{goal}', goal);
              if (caught >= goal && !done) finale();
            }
          } else if (f.state === 'jar') {
            f.x = 180 + f.jx + 2 * Math.sin(t * 2.1 + f.blink);
            f.y = 292 + f.jy + 2 * Math.cos(t * 1.7 + f.blink);
          } else if (f.state === 'heart') {
            const k = ease(Math.max(0, Math.min(1, (now - f.t) / 1400)));
            f.x = f.x0 + (f.hx - f.x0) * k + (k >= 1 ? 1.5 * Math.sin(t * 3 + f.blink) : 0);
            f.y = f.y0 + (f.hy - f.y0) * k + (k >= 1 ? 1.5 * Math.cos(t * 2.6 + f.blink) : 0);
          } else if (f.state === 'gather') {
            const k = ease(Math.max(0, Math.min(1, (now - f.t) / 800)));
            f.x = f.x0 + (180 - f.x0) * k;
            f.y = f.y0 + (176 - f.y0) * k;
          }
          const inJar = f.state === 'jar';
          const size = inJar ? 16 : f.state === 'heart' ? 26 : 24;
          ctx.globalAlpha = f.state === 'heart' || f.state === 'gather' ? 0.95 : 0.5 + 0.5 * Math.abs(Math.sin(t * 1.8 + f.blink));
          ctx.drawImage(sprite, f.x - size / 2, f.y - size / 2, size, size);
        }
        ctx.globalAlpha = 1;
        if (flash) {
          const a = 1 - (now - flash.t) / 600;
          if (a <= 0) flash = null;
          else {
            ctx.beginPath();
            flash.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.closePath();
            ctx.fillStyle = `rgba(255, 220, 150, ${0.16 * a})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 236, 190, ${0.8 * a})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
        if (trail && trail.length > 1) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          trail.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.strokeStyle = 'rgba(255, 214, 140, 0.25)';
          ctx.lineWidth = 10;
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255, 244, 210, 0.95)';
          ctx.lineWidth = 2.4;
          ctx.stroke();
        }
        raf = requestAnimationFrame(draw);
      }
      raf = requestAnimationFrame(draw);

      function capture(poly) {
        flash = { pts: poly, t: performance.now() };
        if (polyArea(poly) > 26000) {
          // too greedy: they get shy and scatter
          flies.forEach((f) => { if (f.state === 'free' && insidePoly(poly, f.x, f.y)) { f.pushX += rand(-70, 70); f.pushY += rand(-60, 60); } });
          say(F.tooBig);
          Sound.whoosh();
          return;
        }
        const got = flies.filter((f) => f.state === 'free' && insidePoly(poly, f.x, f.y));
        if (!got.length) { say(F.empty); Sound.wilt(); return; }
        const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
        const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
        if (whispers.length) whisper(whispers[wi++ % whispers.length], cx, cy);
        const now = performance.now();
        got.forEach((f, k) => {
          f.state = 'flying';
          f.x0 = f.x;
          f.y0 = f.y;
          f.t = now + k * 90;
          setTimeout(() => Sound.note([1046.5, 1174.66, 1318.5, 1568, 1760][(caught + k) % 5]), k * 90);
        });
      }

      const down = (e) => {
        if (done) return;
        e.preventDefault();
        try { cvs.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        trail = [toWorld(e)];
        trailLen = 0;
      };
      const move = (e) => {
        if (!trail) return;
        const p = toWorld(e);
        const q = trail[trail.length - 1];
        const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
        if (d < 3) return;
        trail.push(p);
        trailLen += d;
        if (trailLen > 140 && Math.hypot(p[0] - trail[0][0], p[1] - trail[0][1]) < 24) {
          const poly = trail;
          trail = null;
          capture(poly);
        }
      };
      const up = () => {
        if (!trail) return;
        const poly = trail;
        trail = null;
        const end = poly[poly.length - 1];
        if (trailLen > 110 && Math.hypot(end[0] - poly[0][0], end[1] - poly[0][1]) < 70) {
          capture(poly);
        } else if (trailLen <= 35) {
          // Direct tap on/near a firefly
          const [tx, ty] = poly[0];
          const nearby = flies.filter((f) => f.state === 'free' && Math.hypot(f.x - tx, f.y - ty) < 42);
          if (nearby.length) {
            capture(Array.from({ length: 12 }, (_, k) => [tx + 44 * Math.cos((k / 12) * Math.PI * 2), ty + 44 * Math.sin((k / 12) * Math.PI * 2)]));
          }
        } else if (trailLen > 35) {
          say(F.miss);
        }
      };
      // Keyboard: Enter catches the cluster nearest the middle
      const key = (e) => {
        if (done || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault();
        const free = flies.filter((f) => f.state === 'free');
        if (!free.length) return;
        const a = free.reduce((b, f) => (Math.hypot(f.x - 180, f.y - 190) < Math.hypot(b.x - 180, b.y - 190) ? f : b));
        capture(Array.from({ length: 16 }, (_, k) => [a.x + 36 * Math.cos((k / 16) * Math.PI * 2), a.y + 36 * Math.sin((k / 16) * Math.PI * 2)]));
      };
      cvs.style.pointerEvents = 'auto';
      cvs.addEventListener('pointerdown', down);
      cvs.addEventListener('pointermove', move);
      cvs.addEventListener('pointerup', up);
      cvs.addEventListener('pointercancel', up);
      cvs.addEventListener('keydown', key);
      cvs.tabIndex = 0;

      async function finale() {
        done = true;
        trail = null;
        cvs.style.pointerEvents = 'none';
        svg.querySelector('.jar').classList.add('open');
        Sound.fanfare();
        // everyone leaves the jar, more join, and they draw a heart in the air
        const now = performance.now();
        for (let k = 0; k < 18; k++) {
          const f = fly(groups[k % 4]);
          f.state = 'jar';
          f.jx = rand(-12, 12);
          f.jy = rand(-10, 20);
          f.x = 180 + f.jx;
          f.y = 292 + f.jy;
          flies.push(f);
        }
        flies.forEach((f, i) => {
          const a = (i / flies.length) * Math.PI * 2;
          f.hx = 180 + 6 * 16 * Math.sin(a) ** 3;
          f.hy = 170 - 6 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
          f.x0 = f.x;
          f.y0 = f.y;
          f.t = now + (f.state === 'jar' ? 300 + i * 18 : 0);
          f.state = 'heart';
        });
        Sound.sparkle();
        setTimeout(Sound.chime, 300);
        heartsFrom(stage, ['💛', '✨', '💖', '💫'], 8);
        say(F.heart || '💛');
        await wait(5500);
        const t = performance.now();
        flies.forEach((f) => { f.x0 = f.x; f.y0 = f.y; f.t = t; f.state = 'gather'; });
        await wait(850);
        flies.length = 0;
        jarGlow.setAttribute('opacity', '0.35');
        finishIsland(0, 180, 176);
      }

      stop = () => {
        cancelAnimationFrame(raf);
        cvs.removeEventListener('pointerdown', down);
        cvs.removeEventListener('pointermove', move);
        cvs.removeEventListener('pointerup', up);
        cvs.removeEventListener('pointercancel', up);
        cvs.removeEventListener('keydown', key);
        cvs.removeAttribute('tabindex');
        cvs.style.pointerEvents = 'none';
        ctx.clearRect(0, 0, 360, 480);
      };
    }

    // ---------- Island 2: Sur ki Jheel — the lake hums a tune, she plays it back ----------
    function lake() {
      const L = part('lake');
      const NOTES = [523.25, 587.33, 659.25, 783.99, 880];
      const COLORS = ['#ff9fc4', '#ffb88f', '#ffe08a', '#9fe8d0', '#c6adff'];
      const POS = [[64, 318], [122, 344], [180, 306], [238, 344], [296, 318]];
      const MEL = [2, 3, 4, 3, 2, 1, 0];
      const ROUNDS = [3, 5, 7];
      svg.innerHTML = lakeArt(POS, COLORS);
      const lotuses = [...svg.querySelectorAll('.lotus')];
      Sound.stopAmbient();
      say(L.howTo);
      let round = 0;
      let pos = 0;
      let busy = true;
      let misses = 0;
      let alive = true;

      function light(i, ms = 430) {
        const l = lotuses[i];
        l.classList.add('lit');
        Sound.note(NOTES[i]);
        const rip = document.createElementNS(NS, 'ellipse');
        rip.setAttribute('class', 'ripple');
        rip.setAttribute('rx', '24');
        rip.setAttribute('ry', '7');
        rip.setAttribute('cy', '2');
        l.insertBefore(rip, l.children[1]);
        setTimeout(() => rip.remove(), 1300);
        whisper(pick(['♪', '♫', '♩']), POS[i][0], POS[i][1] - 40, 'note', COLORS[i]);
        setTimeout(() => l.classList.remove('lit'), ms);
      }
      function hintNext() {
        lotuses.forEach((l) => l.classList.remove('hint'));
        if (misses >= 2 && !busy) lotuses[MEL[pos]].classList.add('hint');
      }
      async function play() {
        if (!alive) return;
        busy = true;
        pos = 0;
        hintNext();
        hide(aux);
        say(L.listen);
        await wait(1000);
        for (let k = 0; k < ROUNDS[round]; k++) {
          if (!alive) return;
          light(MEL[k]);
          await wait(660);
        }
        if (!alive) return;
        busy = false;
        say(String(L.yourTurn || '').replace('{n}', round + 1));
        offer(aux, L.replay || '🎧', () => { if (!busy) play(); });
        hintNext();
      }
      async function tap(i) {
        if (busy || !alive) return;
        light(i);
        if (i === MEL[pos]) {
          pos++;
          hintNext();
          if (pos < ROUNDS[round]) return;
          busy = true;
          hide(aux);
          lotuses.forEach((l) => l.classList.remove('hint'));
          round++;
          misses = 0;
          if (round === ROUNDS.length) { bloom(); return; }
          await wait(450);
          say(L.nice);
          Sound.sparkle();
          await wait(1300);
          play();
        } else {
          busy = true;
          misses++;
          hide(aux);
          lotuses[i].classList.add('wilt');
          Sound.wilt();
          setTimeout(() => lotuses[i].classList.remove('wilt'), 700);
          await wait(450);
          say(L.retry);
          await wait(1400);
          play();
        }
      }
      lotuses.forEach((l, i) => {
        l.addEventListener('click', () => tap(i));
        l.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(i); } });
      });
      async function bloom() {
        await wait(500);
        lotuses.forEach((l, k) => setTimeout(() => l.classList.add('bloom'), k * 130));
        say(L.bloom || '🎶');
        Sound.loveTheme();
        heartsFrom(stage, ['🎶', '💛', '🪷', '✨', '💖'], 12);
        for (let k = 0; k < 6; k++) {
          if (!alive) return;
          light(k % 4, 600);
          await wait(850);
        }
        await wait(400);
        Sound.startAmbient();
        if (alive) finishIsland(1, 180, 290);
      }
      stop = () => { alive = false; };
      setTimeout(play, 1800);
    }

    // ---------- Island 3: Aainon ka Mahal — turn mirrors to guide moonlight to a rose ----------
    function mirrors() {
      const M = part('mirrors');
      const CELL = 56;
      const X0 = 40;
      const Y0 = 96;
      svg.innerHTML = palaceArt();
      const board = document.createElementNS(NS, 'g');
      board.setAttribute('class', 'mirror-board');
      svg.appendChild(board);
      say(M.howTo);
      let lv = null;
      let cells = [];
      let solved = false;
      let taps = 0;
      let hintTimer = 0;
      let warnedGem = false;
      let alive = true;
      const at = (c, r) => cells.find((k) => k.c === c && k.r === r);
      const xy = (c, r) => [X0 + c * CELL + CELL / 2, Y0 + r * CELL + CELL / 2];

      function trace(typeAt) {
        let c = lv.src;
        let r = -1;
        let dx = 0;
        let dy = 1;
        const pts = [[X0 + c * CELL + CELL / 2, Y0 - 40]];
        const seen = new Set();
        let gem = false;
        let end = 'out';
        for (;;) {
          c += dx;
          r += dy;
          if (c < 0 || c > 4 || r < 0 || r > 5) {
            const [ex, ey] = xy(c, r);
            pts.push([ex - dx * (CELL / 2 - 10), ey - dy * (CELL / 2 - 10)]);
            break;
          }
          const k = `${c},${r},${dx},${dy}`;
          if (seen.has(k)) { end = 'loop'; break; }
          seen.add(k);
          const [cx, cy] = xy(c, r);
          const t = typeAt(c, r);
          if (t === 'P') { pts.push([cx - dx * 18, cy - dy * 18]); end = 'block'; break; }
          if (t === 'R') { pts.push([cx, cy - 6]); end = 'rose'; break; }
          if (t === 'G') gem = true;
          if (t === 'f') { pts.push([cx, cy]); [dx, dy] = [-dy, -dx]; }
          if (t === 'b') { pts.push([cx, cy]); [dx, dy] = [dy, dx]; }
        }
        return { pts, end, gem };
      }
      const needGem = () => cells.some((k) => k.t === 'G');
      const isSolved = (res) => res.end === 'rose' && (res.gem || !needGem());

      function load(n) {
        lv = MIRROR_LEVELS[n];
        lv.n = n;
        solved = false;
        taps = 0;
        warnedGem = false;
        cells = [];
        lv.rows.forEach((row, r) => [...row].forEach((t, c) => { if (t !== '.') cells.push({ c, r, t, angle: t === 'f' ? -45 : 45 }); }));
        let tiles = '';
        for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) tiles += `<rect class="tile" x="${X0 + c * CELL + 3}" y="${Y0 + r * CELL + 3}" width="${CELL - 6}" height="${CELL - 6}" rx="10"/>`;
        const sx = X0 + lv.src * CELL + CELL / 2;
        const pieces = cells.map((k, i) => {
          const [x, y] = xy(k.c, k.r);
          if (k.t === 'f' || k.t === 'b') {
            return `<g class="mirror" data-k="${i}" transform="translate(${x} ${y})" role="button" tabindex="0" aria-label="Aaina">
              <rect class="m-hit" x="-27" y="-27" width="54" height="54" rx="10" fill="transparent"/>
              <g class="m-rot" style="transform: rotate(${k.angle}deg)"><rect x="-23" y="-4" width="46" height="8" rx="4" fill="url(#dMirror)"/><rect x="-19" y="-2.4" width="38" height="1.5" rx=".75" fill="#fff" opacity=".85"/></g>
            </g>`;
          }
          if (k.t === 'P') return `<g class="pillar" transform="translate(${x} ${y})"><path d="M-12 -24 L12 -24 L17 -16 L17 20 L12 26 L-12 26 L-17 20 L-17 -16 Z" fill="url(#dPillar)"/><path d="M-3 -22 L-3 24" stroke="#fff" stroke-opacity=".28"/></g>`;
          if (k.t === 'G') return `<g class="gem" transform="translate(${x} ${y})"><circle class="gem-glow" r="24" fill="url(#dGlowCyan)"/><path d="M0 -15 L12 -3 L0 15 L-12 -3 Z" fill="url(#dGem)"/><path d="M-12 -3 L12 -3 M0 -15 L-4 -3 L0 15 M0 -15 L4 -3 L0 15" stroke="#fff" stroke-opacity=".6" stroke-width=".8" fill="none"/></g>`;
          return `<g class="rose" transform="translate(${x} ${y})"><g class="rose-in">
            <circle class="rose-glow" r="27" fill="url(#dGlowPink)"/>
            <path d="M0 20 C 1 12 -1 6 0 -2" stroke="#4f9a6a" stroke-width="2.4" fill="none"/>
            <path d="M0 10 C 6 6 11 7 13 3 C 8 2 3 4 0 10 Z" fill="#4f9a6a"/>
            <g class="open">${[0, 72, 144, 216, 288].map((a) => `<path d="M0 0 C -8 -4 -9 -14 0 -18 C 9 -14 8 -4 0 0 Z" transform="translate(0 -8) rotate(${a})" fill="#ff8fb1"/>`).join('')}</g>
            <path class="bud" d="M0 -1 C -8 -3 -8 -14 0 -19 C 8 -14 8 -3 0 -1 Z" fill="#e8507f"/>
          </g></g>`;
        }).join('');
        board.innerHTML = `<g class="tiles">${tiles}</g>
          <g class="moon-window" transform="translate(${sx} ${Y0 - 52})"><circle r="22" fill="url(#dGlowGold)"/><circle r="13" fill="#fff6dc"/><circle cx="5" cy="-3" r="11" fill="#3b2d6e"/></g>
          <g class="beam"><path class="beam-glow"/><path class="beam-mid"/><path class="beam-core"/><path class="beam-flow"/></g>
          <g class="pieces">${pieces}</g>`;
        update(false);
        clearTimeout(hintTimer);
        hintTimer = setTimeout(offerHint, 30000);
      }

      function update(react = true) {
        const res = trace((c, r) => at(c, r)?.t);
        const d = res.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
        board.querySelectorAll('.beam path').forEach((p) => p.setAttribute('d', d));
        board.querySelector('.gem')?.classList.toggle('lit', res.gem);
        if (res.gem && react) Sound.sparkle();
        if (!react) return;
        if (isSolved(res)) { win(); return; }
        if (res.end === 'rose' && !warnedGem) {
          warnedGem = true;
          const rose = board.querySelector('.rose');
          rose.classList.remove('shiver');
          void rose.getBBox();
          rose.classList.add('shiver');
          say(M.needGem);
        }
      }

      function turn(el) {
        if (solved) return;
        const k = cells[Number(el.dataset.k)];
        k.angle += 90;
        k.t = k.t === 'f' ? 'b' : 'f';
        el.querySelector('.m-rot').style.transform = `rotate(${k.angle}deg)`;
        el.classList.remove('hinted');
        Sound.tink();
        taps++;
        if (taps === 14) offerHint();
        update();
      }
      board.addEventListener('click', (e) => {
        const m = e.target.closest('.mirror');
        if (m) turn(m);
      });
      board.addEventListener('keydown', (e) => {
        const m = e.target.closest('.mirror');
        if (m && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); turn(m); }
      });

      function offerHint() {
        if (solved || !alive) return;
        offer(aux, M.hint || '🔮', () => {
          // nearest solution to how the mirrors are right now
          const ms = cells.filter((k) => k.t === 'f' || k.t === 'b');
          let best = null;
          for (let mask = 0; mask < 1 << ms.length; mask++) {
            const types = new Map(ms.map((k, i) => [k, mask & (1 << i) ? 'b' : 'f']));
            const res = trace((c, r) => { const k = at(c, r); return k && types.has(k) ? types.get(k) : k?.t; });
            if (!isSolved(res)) continue;
            const diff = ms.filter((k) => types.get(k) !== k.t);
            if (!best || diff.length < best.length) best = diff;
          }
          board.querySelectorAll('.mirror.hinted').forEach((m) => m.classList.remove('hinted'));
          if (best && best.length) board.querySelector(`.mirror[data-k="${cells.indexOf(best[0])}"]`).classList.add('hinted');
          Sound.chime();
        });
      }

      async function win() {
        solved = true;
        clearTimeout(hintTimer);
        hide(aux);
        board.querySelectorAll('.mirror.hinted').forEach((m) => m.classList.remove('hinted'));
        const rose = cells.find((k) => k.t === 'R');
        board.querySelector('.rose').classList.add('lit');
        Sound.chime();
        setTimeout(Sound.sparkle, 200);
        const [rx, ry] = xy(rose.c, rose.r);
        whisper('🌹', rx, ry - 34);
        if (lv.n === 0) {
          say(M.nice);
          whisper('✨ Noor', rx - 24, ry - 34);
          whisper('💖 Chamak', rx + 24, ry - 34);
          await wait(2800);
          if (!alive) return;
          board.classList.add('swap');
          await wait(500);
          load(1);
          say(M.level2);
          board.classList.remove('swap');
        } else {
          whisper('👑 Sabse Chamakti Hui', rx, ry - 34);
          heartsFrom(stage, ['🔮', '✨', '💎', '🌹', '💛'], 10);
          await wait(1800);
          if (alive) finishIsland(2, rx, ry);
        }
      }

      stop = () => { alive = false; clearTimeout(hintTimer); };
      load(0);
    }

    // ---------- Island 4: Taaron ka Jharna — tap 5 stars of wishes & memories ----------
    function starlight() {
      const St = part('starlight');
      svg.innerHTML = starlightArt();
      say(St.howTo);
      const STARS = [[64, 240], [112, 175], [180, 130], [248, 175], [296, 240]];
      const NOTES = [523.25, 587.33, 659.25, 783.99, 880];
      const starGroup = svg.querySelector('#starlight-stars');
      const linesGroup = svg.querySelector('#starlight-lines');
      const bridge = svg.querySelector('#starlight-bridge');
      let litCount = 0;
      let litStars = new Set();
      let lastLit = null;
      let alive = true;

      STARS.forEach(([x, y], i) => {
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'star-point');
        g.setAttribute('transform', `translate(${x} ${y})`);
        g.setAttribute('role', 'button');
        g.setAttribute('tabindex', '0');
        g.setAttribute('aria-label', `Taara ${i + 1}`);
        g.innerHTML = `
          <circle r="26" fill="url(#dStardust)" opacity=".3"/>
          <path d="M0 -15 L4 -4 L15 0 L4 4 L0 15 L-4 4 L-15 0 L-4 -4 Z" fill="#fff6dc"/>
          <circle r="3.2" fill="#ffffff"/>
        `;
        const tap = () => {
          if (!alive || litStars.has(i)) return;
          litStars.add(i);
          g.classList.add('lit');
          Sound.note(NOTES[litCount]);
          const whisperText = (St.whispers || [])[i] || '✨';
          whisper(whisperText, x, y - 26);
          if (lastLit !== null) {
            const line = document.createElementNS(NS, 'line');
            line.setAttribute('x1', STARS[lastLit][0]);
            line.setAttribute('y1', STARS[lastLit][1]);
            line.setAttribute('x2', x);
            line.setAttribute('y2', y);
            linesGroup.appendChild(line);
          }
          lastLit = i;
          litCount++;
          if (litCount < STARS.length) {
            say(`${litCount} / 5 taare roshan ✨`);
          } else {
            alive = false;
            if (bridge) {
              bridge.style.opacity = '0.9';
              bridge.style.strokeDasharray = 'none';
            }
            Sound.sparkle();
            setTimeout(Sound.fanfare, 300);
            confettiBurst({ particleCount: 45, origin: { x: 0.5, y: 0.4 } });
            say(St.sparkle || '✨');
            setTimeout(() => {
              finishIsland(3, 180, 130);
            }, 1400);
          }
        };
        g.addEventListener('click', tap);
        g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(); } });
        starGroup.appendChild(g);
      });

      stop = () => { alive = false; };
    }

    // ---------- The moon: hold, give it the four lights, it blooms ----------
    function moon(already = false) {
      const Mo = part('moon');
      svg.innerHTML = moonArt();
      const petals = svg.querySelector('#moon-petals');
      const halo = svg.querySelector('#moon-halo');
      const ring = svg.querySelector('#moon-ring');
      const RING = 2 * Math.PI * 104;
      const GIVE_AT = [0.12, 0.36, 0.60, 0.84];
      const PENTA = [392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5];
      let p = 0;
      let given = 0;
      let holding = false;
      let finished = false;
      let raf = 0;
      let last = performance.now();
      let lastNote = 0;

      function paint() {
        petals.setAttribute('transform', `translate(180 196) rotate(${(p * 36).toFixed(1)}) scale(${(0.3 + 0.7 * p).toFixed(3)})`);
        halo.setAttribute('opacity', (0.35 + 0.6 * p).toFixed(2));
        ring.setAttribute('stroke-dashoffset', (RING * (1 - p)).toFixed(1));
      }
      function giveLight(i) {
        orbs[i].classList.add('given');
        Sound.sparkle();
        flyLight(i, slotCenter(i), toScreen(180, 196), 900).then(() => {
          svg.classList.add(`gift-${i}`);
          Sound.chime();
        });
      }
      function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        p = holding ? Math.min(1, p + dt / 4.2) : Math.max(0, p - dt * 0.16);
        // a light once given stays given
        p = Math.max(p, given ? GIVE_AT[given - 1] : 0);
        while (given < 4 && p >= GIVE_AT[given]) giveLight(given++);
        if (holding && now - lastNote > 360) {
          lastNote = now;
          Sound.note(PENTA[Math.min(PENTA.length - 1, Math.floor(p * PENTA.length))]);
        }
        paint();
        if (p >= 1) { complete(); return; }
        raf = requestAnimationFrame(frame);
      }
      const press = (e) => {
        if (finished) return;
        if (e.cancelable) e.preventDefault();
        if (!holding) { holding = true; scene.classList.add('holding'); say(Mo.holding); }
      };
      const release = () => {
        if (!holding) return;
        holding = false;
        scene.classList.remove('holding');
        if (!finished) say(Mo.howTo);
      };
      const keyDown = (e) => { if (e.key === ' ' || e.key === 'Enter') press(e); };
      const keyUp = (e) => { if (e.key === ' ' || e.key === 'Enter') release(); };
      const noMenu = (e) => e.preventDefault();

      function unbind() {
        [go, svg].forEach((el) => {
          el.removeEventListener('pointerdown', press);
          el.removeEventListener('pointerup', release);
          el.removeEventListener('pointerleave', release);
          el.removeEventListener('pointercancel', release);
          el.removeEventListener('contextmenu', noMenu);
        });
        go.removeEventListener('keydown', keyDown);
        go.removeEventListener('keyup', keyUp);
      }

      async function complete() {
        finished = true;
        holding = false;
        scene.classList.remove('holding');
        unbind();
        hide(go);
        svg.classList.add('bloomed');
        Sound.fanfare();
        confettiBurst({ particleCount: 70, spread: 100, origin: { y: 0.35 }, colors: ['#ffd27a', '#ffffff', '#ffc2d6', '#c9b2ff'] });
        store.set('dream_done', true);
        Log.send('dream_done');
        say(Mo.bloomed || '🌕');
        await wait(2600);
        showFinal();
      }

      function showFinal() {
        $('dream-final-title').textContent = fill(Mo.finalTitle);
        $('dream-final-text').textContent = fill(Mo.finalText);
        $('dream-sign').textContent = `— ${C.fromName}`;
        $('btn-dream-next').textContent = Mo.wakeButton || 'Aankhen kholo 🌅';
        $('dream-final').classList.remove('hidden');
        $('btn-dream-next').onclick = async () => {
          $('btn-dream-next').onclick = null;
          Sound.chime();
          await lids(true);
          $('dream-final').classList.add('hidden');
          show('memories');
          await wait(250);
          await lids(false);
          lidsEl.remove();
          lidsEl = null;
        };
      }

      if (already) {
        p = 1;
        paint();
        orbs.forEach((o) => o.classList.add('lit', 'given'));
        svg.classList.add('bloomed', 'gift-0', 'gift-1', 'gift-2', 'gift-3');
        say(Mo.bloomed || '🌕');
        showFinal();
        return;
      }
      say(Mo.howTo);
      go.textContent = Mo.hold || 'Dabake rakho 💛';
      go.onclick = null;
      go.classList.remove('hidden');
      [go, svg].forEach((el) => {
        el.addEventListener('pointerdown', press);
        el.addEventListener('pointerup', release);
        el.addEventListener('pointerleave', release);
        el.addEventListener('pointercancel', release);
        el.addEventListener('contextmenu', noMenu);
      });
      go.addEventListener('keydown', keyDown);
      go.addEventListener('keyup', keyUp);
      paint();
      raf = requestAnimationFrame(frame);
      stop = () => { cancelAnimationFrame(raf); unbind(); };
    }

    const ISLANDS = [fireflies, lake, mirrors, starlight, moon];

    // Always start at intro unless explicitly requested via ?island=
    const islandParam = params.get('island');
    let startIsland = -1;
    if (islandParam !== null) {
      startIsland = isNaN(Number(islandParam)) ? DREAM_STEPS.indexOf(islandParam) : Number(islandParam);
    }
    if (startIsland >= 0 && startIsland < ISLANDS.length) {
      level = startIsland;
      orbs.forEach((o, i) => o.classList.toggle('lit', i < level));
      scene.classList.add('dreaming');
      setSky(level + 1);
      setPhase(level === 4 ? 'moon' : 'play');
      $('dream-sub').textContent = part(DREAM_STEPS[level]).name || '';
      ISLANDS[level]();
    } else {
      level = 0;
      orbs.forEach((o) => o.classList.remove('lit', 'given'));
      intro();
    }
  };

  // ==============================================================================
  // 8a. STORY — build your own love story; her choices become a tiny storybook
  // ==============================================================================
  // Small illustrated scenes (300×180), painted like the rest of the site
  function coupleStanding(x, y, s = 1, fill = '#2a1b33') {
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}">
      <circle cx="-9" cy="-55" r="6.4"/>
      <path d="M-16 -47 C-18 -38 -17 -30 -16 -24 L-15 -1 L-10.5 -1 L-9 -20 L-7.5 -1 L-3 -1 L-2 -24 C-1 -30 0 -38 -2 -47 C-5 -49 -13 -49 -16 -47 Z"/>
      <circle cx="10" cy="-50" r="5.9"/>
      <path d="M4 -52 C1 -46 1 -38 3 -32 L6 -35 C5 -41 6 -47 9 -51 Z"/>
      <path d="M4 -43 C2 -34 3 -28 4 -24 L0 -2 L20 -2 L16 -24 C17 -28 18 -34 16 -43 C13 -45 7 -45 4 -43 Z"/>
      <path d="M-2 -40 C2 -34 4 -30 5 -27" fill="none" stroke="${fill}" stroke-width="3" stroke-linecap="round"/>
    </g>`;
  }
  const STORY_ART = {
    cafe: () => `
      <defs><linearGradient id="sa-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a4236"/><stop offset="1" stop-color="#3a2420"/></linearGradient>
      <linearGradient id="sa-rain" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d9cc2"/><stop offset="1" stop-color="#46638c"/></linearGradient>
      <clipPath id="sa-win"><rect x="62" y="22" width="176" height="96" rx="6"/></clipPath></defs>
      <rect width="300" height="180" fill="url(#sa-wall)"/>
      <rect x="62" y="22" width="176" height="96" rx="6" fill="url(#sa-rain)"/>
      <g clip-path="url(#sa-win)" stroke="#dbe8ff" stroke-width="1" opacity=".55">${Array.from({ length: 26 }, (_, i) => `<path d="M${66 + i * 7} ${18 + (i * 13) % 40} l-5 14"/>`).join('')}</g>
      <path d="M150 22 V118 M62 70 H238" stroke="#2a1812" stroke-width="5"/>
      <rect x="62" y="22" width="176" height="96" rx="6" fill="none" stroke="#2a1812" stroke-width="5"/>
      <path d="M40 14 Q150 36 260 14" stroke="#4a3028" fill="none"/>
      ${[50, 80, 110, 140, 170, 200, 230, 255].map((x, i) => `<circle cx="${x}" cy="${16 + Math.sin(i) * 3 + 6}" r="2.6" fill="#ffd27a"/><circle cx="${x}" cy="${16 + Math.sin(i) * 3 + 6}" r="7" fill="#ffd27a" opacity=".2"/>`).join('')}
      <circle cx="150" cy="120" r="70" fill="#ffcf8a" opacity=".12"/>
      <g fill="#24151a"><circle cx="104" cy="104" r="9"/><path d="M88 140 C88 120 96 114 104 114 C112 114 120 120 120 140 Z"/>
      <circle cx="196" cy="102" r="8.5"/><path d="M188 98 C184 110 184 122 186 130 L192 126 C190 116 191 106 196 100 Z"/><path d="M180 140 C180 120 188 113 196 113 C204 113 212 120 212 140 Z"/></g>
      <rect x="40" y="136" width="220" height="8" rx="2" fill="#8a5a3c"/><rect x="40" y="144" width="220" height="36" fill="#2a1812"/>
      <path d="M134 126 L146 126 L144 136 L136 136 Z M156 126 L168 126 L166 136 L158 136 Z" fill="#fff4e6"/>
      <path d="M140 122 c-3 -4 3 -6 0 -10 M162 122 c-3 -4 3 -6 0 -10" fill="none" stroke="#fff" stroke-width="1" opacity=".6"/>`,
    sunset: () => `
      <defs><linearGradient id="sa-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7a07c"/><stop offset=".55" stop-color="#f8b98c"/><stop offset="1" stop-color="#fbd7a3"/></linearGradient></defs>
      <rect width="300" height="180" fill="url(#sa-sky)"/>
      <circle cx="150" cy="118" r="30" fill="#fff0c4"/><circle cx="150" cy="118" r="60" fill="#fff0c4" opacity=".25"/>
      <rect y="118" width="300" height="30" fill="#e9876a"/>
      ${[122, 128, 134, 140].map((y, i) => `<rect x="${136 - i * 6}" y="${y}" width="${28 + i * 12}" height="1.6" fill="#fff4cf" opacity="${0.7 - i * 0.12}"/>`).join('')}
      <rect y="148" width="300" height="32" fill="#c8826a"/>
      <path d="M60 50 l5 -4 l5 4 M80 40 l4 -3 l4 3 M220 56 l5 -4 l5 4" fill="none" stroke="#5a3040" stroke-width="1.2"/>
      ${coupleStanding(150, 162, 1, '#3a1f2c')}`,
    mountains: () => `
      <defs><linearGradient id="sa-dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fb8ec"/><stop offset="1" stop-color="#fde2c4"/></linearGradient></defs>
      <rect width="300" height="180" fill="url(#sa-dawn)"/>
      <circle cx="232" cy="52" r="16" fill="#fff4d6"/>
      <path d="M0 120 L50 54 L84 96 L130 34 L182 98 L222 60 L300 120 Z" fill="#7d74b0"/>
      <path d="M130 34 L116 56 L128 52 L136 62 L146 52 Z M50 54 L40 70 L50 66 L58 74 Z M222 60 L212 74 L222 70 L230 78 Z" fill="#fbf8ff"/>
      <path d="M0 132 C60 112 120 126 180 114 C230 104 270 118 300 112 L300 180 L0 180 Z" fill="#5f8a5a"/>
      <path d="M150 180 C160 160 136 146 160 128 C176 116 168 110 186 100" fill="none" stroke="#c8b49a" stroke-width="7"/>
      <g fill="#24302a" stroke="#24302a"><circle cx="70" cy="150" r="7.5" fill="none" stroke-width="2.8"/><circle cx="100" cy="150" r="7.5" fill="none" stroke-width="2.8"/>
        <path d="M70 150 L82 142 L94 142 L100 150" fill="none" stroke-width="2.4"/><path d="M80 141 C82 134 92 133 96 137 L94 143 L82 144 Z" stroke-width="1"/>
        <path d="M72 140 L84 139" stroke-width="3"/><path d="M95 136 L99 129 L104 128" fill="none" stroke-width="2"/><circle cx="101" cy="134" r="2.2" stroke="none" fill="#fff3c4"/>
        <path d="M80 148 L92 148 L90 152 L82 152 Z" stroke-width="1"/></g>
      ${coupleStanding(128, 160, 0.95, '#24302a')}`,
    sea: () => `
      <defs><linearGradient id="sa-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0f0"/><stop offset="1" stop-color="#e2f6ff"/></linearGradient></defs>
      <rect width="300" height="180" fill="url(#sa-day)"/>
      <circle cx="60" cy="40" r="16" fill="#fff4c4"/>
      <rect y="94" width="300" height="42" fill="#3fa7c0"/>
      <path d="M0 108 q15 -5 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="#fff" stroke-width="1.4" opacity=".6"/>
      <path d="M0 132 C60 124 120 138 180 130 C230 124 270 132 300 128 L300 180 L0 180 Z" fill="#f1d7a6"/>
      <path d="M0 130 C60 122 120 136 180 128 C230 122 270 130 300 126" fill="none" stroke="#fff" stroke-width="2.4" opacity=".8"/>
      ${[[70, 166], [82, 160], [94, 166], [106, 160]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="1.2" fill="#d4b685"/>`).join('')}
      <path d="M300 0 C270 10 252 30 246 60 C262 40 280 30 300 28 Z M300 18 C266 14 240 26 226 48 C250 36 276 34 300 40 Z" fill="#2f5a3a" opacity=".85"/>
      ${coupleStanding(170, 160, 1, '#2a3a48')}`,
    movie: () => `
      <defs><radialGradient id="sa-tv" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#bfe0ff"/><stop offset="1" stop-color="#5a86c8"/></radialGradient></defs>
      <rect width="300" height="180" fill="#171428"/>
      <rect x="196" y="40" width="88" height="56" rx="4" fill="url(#sa-tv)"/><rect x="196" y="40" width="88" height="56" rx="4" fill="none" stroke="#0c0a16" stroke-width="3"/>
      <path d="M196 96 L80 180 L300 180 L284 96 Z" fill="#9fc6ff" opacity=".08"/>
      <path d="M20 150 C20 120 40 112 70 112 L150 112 C176 112 186 124 186 150 L186 166 L20 166 Z" fill="#3a2c4a"/>
      <g fill="#120d1c"><circle cx="86" cy="104" r="9"/><circle cx="104" cy="108" r="8"/><path d="M96 100 C92 108 92 116 94 122 L100 120 C98 114 99 106 104 102 Z"/></g>
      <path d="M40 132 C70 120 130 120 170 132 L172 160 L38 160 Z" fill="#c8607a"/>
      <path d="M48 140 C80 132 130 132 164 142" fill="none" stroke="#e48aa0" stroke-width="2" opacity=".6"/>
      <path d="M140 118 L160 118 L157 132 L143 132 Z" fill="#e8e0f0"/>${[143, 148, 153, 157].map((x, i) => `<circle cx="${x}" cy="${116 - (i % 2) * 2}" r="2.4" fill="#ffe38a"/>`).join('')}`,
    nothing: () => `
      <defs><linearGradient id="sa-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e1230"/><stop offset="1" stop-color="#2a2f5e"/></linearGradient></defs>
      <rect width="300" height="180" fill="url(#sa-night)"/>
      ${Array.from({ length: 34 }, (_, i) => `<circle cx="${(i * 53) % 300}" cy="${(i * 37) % 110}" r="${i % 5 ? 0.8 : 1.4}" fill="#fff" opacity=".8"/>`).join('')}
      <circle cx="240" cy="40" r="14" fill="#fff7dc"/><circle cx="246" cy="36" r="13" fill="#141a40"/>
      <path d="M0 140 C80 118 200 120 300 136 L300 180 L0 180 Z" fill="#1d3a32"/>
      <g fill="#0c1a16"><circle cx="138" cy="136" r="6.5"/><path d="M142 134 C160 132 180 133 196 136 L196 142 C180 141 160 141 142 140 Z"/>
      <circle cx="126" cy="138" r="6"/><path d="M122 132 C116 130 108 132 104 136 L108 138 C112 136 116 135 122 136 Z"/><path d="M120 136 C104 136 86 138 72 142 L72 147 C88 144 104 142 120 142 Z"/></g>
      ${[[60, 120], [90, 110], [220, 112], [250, 126], [180, 104]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#f6e27a"/><circle cx="${x}" cy="${y}" r="5" fill="#f6e27a" opacity=".2"/>`).join('')}`,
    balcony: () => `
      <defs><linearGradient id="sa-balc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#91b5e0"/><stop offset=".5" stop-color="#fec5bb"/><stop offset="1" stop-color="#fae1dd"/></linearGradient></defs>
      <rect width="300" height="180" fill="url(#sa-balc)"/>
      <circle cx="150" cy="75" r="22" fill="#fff5d6" opacity=".95"/>
      <path d="M0 115 L60 70 L110 100 L170 60 L240 105 L300 75 L300 135 L0 135 Z" fill="#7582a8" opacity=".7"/>
      <path d="M0 128 L80 98 L150 120 L220 95 L300 118 L300 150 L0 150 Z" fill="#4d5d85" opacity=".85"/>
      <rect y="142" width="300" height="38" fill="#362820"/>
      <path d="M0 126 H300 M0 134 H300" stroke="#7a5540" stroke-width="2.5"/>
      ${Array.from({ length: 25 }, (_, i) => `<line x1="${i * 12 + 6}" y1="126" x2="${i * 12 + 6}" y2="142" stroke="#7a5540" stroke-width="1.8"/>`).join('')}
      <ellipse cx="40" cy="126" rx="9" ry="5" fill="#4a7c59"/><circle cx="40" cy="122" r="7" fill="#2d5a3c"/>
      <ellipse cx="260" cy="126" rx="10" ry="5" fill="#4a7c59"/><circle cx="260" cy="122" r="8" fill="#2d5a3c"/>
      <rect x="135" y="128" width="30" height="14" rx="2" fill="#8a5a3c"/>
      <path d="M142 124 h6 l-1 4 h-4 z M152 124 h6 l-1 4 h-4 z" fill="#fff4e6"/>
      <path d="M145 120 c-1 -3 2 -4 0 -6 M155 120 c-1 -3 2 -4 0 -6" fill="none" stroke="#fff" stroke-width="0.8" opacity=".7"/>
      ${coupleStanding(150, 154, 0.78, '#241a22')}`,
    cozyroom: () => `
      <defs><radialGradient id="sa-room" cx=".5" cy=".6" r=".6"><stop offset="0" stop-color="#442a4f"/><stop offset="1" stop-color="#191024"/></radialGradient></defs>
      <rect width="300" height="180" fill="url(#sa-room)"/>
      <rect x="90" y="20" width="120" height="75" rx="37" fill="#0f172a"/>
      ${Array.from({ length: 14 }, (_, i) => `<circle cx="${98 + (i * 27) % 104}" cy="${26 + (i * 19) % 60}" r="${i % 3 ? 0.7 : 1.2}" fill="#fff" opacity=".8"/>`).join('')}
      <circle cx="175" cy="45" r="9" fill="#fde68a"/>
      <rect x="90" y="20" width="120" height="75" rx="37" fill="none" stroke="#50355f" stroke-width="3"/>
      <line x1="150" y1="20" x2="150" y2="95" stroke="#50355f" stroke-width="2"/>
      <path d="M10 15 Q150 40 290 15" fill="none" stroke="#6b4c6e" stroke-width="1.2"/>
      ${[25, 60, 95, 130, 170, 205, 240, 275].map((x, i) => `<circle cx="${x}" cy="${18 + Math.sin(i) * 3 + 3}" r="3" fill="#fef08a"/><circle cx="${x}" cy="${18 + Math.sin(i) * 3 + 3}" r="8" fill="#fef08a" opacity=".25"/>`).join('')}
      <ellipse cx="150" cy="155" rx="100" ry="22" fill="#7a3e65"/>
      <ellipse cx="105" cy="150" rx="16" ry="11" fill="#f472b6" transform="rotate(-12 105 150)"/>
      <ellipse cx="195" cy="150" rx="16" ry="11" fill="#fb923c" transform="rotate(12 195 150)"/>
      <rect x="138" y="152" width="24" height="6" rx="2" fill="#fde68a" transform="rotate(4 138 152)"/>
      <g fill="#1a0f20"><circle cx="138" cy="126" r="8"/><circle cx="162" cy="128" r="7.5"/><path d="M124 158 C124 138 136 134 148 134 C160 134 176 138 176 158 Z"/><path d="M152 122 C148 132 148 142 150 150 L156 148 C154 140 155 130 162 124 Z"/></g>
      <path d="M120 148 C140 140 160 140 180 148 L178 165 L122 165 Z" fill="#e11d48" opacity=".7"/>`,
    maggi: () => `
      <defs><linearGradient id="sa-kit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#312e3b"/><stop offset="1" stop-color="#181520"/></linearGradient></defs>
      <rect width="300" height="180" fill="url(#sa-kit)"/>
      <circle cx="150" cy="38" r="14" fill="#fafafa" stroke="#d4d4d8" stroke-width="2"/>
      <line x1="150" y1="38" x2="150" y2="30" stroke="#18181b" stroke-width="2"/>
      <line x1="150" y1="38" x2="157" y2="38" stroke="#ef4444" stroke-width="1.5"/>
      <rect x="40" y="65" width="220" height="8" rx="2" fill="#78350f"/>
      ${[55, 75, 95, 205, 225, 245].map((x, i) => `<rect x="${x}" y="50" width="12" height="15" rx="2" fill="${['#fbbf24', '#f87171', '#34d399', '#60a5fa', '#f472b6', '#a78bfa'][i]}"/>`).join('')}
      <rect y="125" width="300" height="55" fill="#3f3f46"/><rect y="120" width="300" height="6" fill="#71717a"/>
      <rect x="120" y="112" width="60" height="10" rx="3" fill="#18181b"/>
      <ellipse cx="150" cy="112" rx="22" ry="8" fill="#fbbf24"/>
      <path d="M135 110 Q145 106 155 110 T165 110" fill="none" stroke="#f59e0b" stroke-width="2.5"/>
      ${[142, 150, 158].map((x) => `<circle cx="${x}" cy="111" r="1.5" fill="#15803d"/>`).join('')}
      <path d="M142 102 C139 94 145 88 142 80 M150 100 C147 92 153 86 150 78 M158 102 C155 94 161 88 158 80" fill="none" stroke="#fff" stroke-width="1.2" opacity=".65"/>
      <g fill="#1a121e"><circle cx="95" cy="100" r="9"/><path d="M82 140 C82 118 90 112 98 112 C106 112 114 118 114 140 Z"/>
      <circle cx="205" cy="98" r="8.5"/><path d="M198 94 C194 106 194 118 196 126 L202 122 C200 112 201 102 206 96 Z"/><path d="M190 140 C190 118 198 110 206 110 C214 110 222 118 222 140 Z"/></g>
      <path d="M110 125 L125 115" stroke="#1a121e" stroke-width="3" stroke-linecap="round"/>
      <path d="M190 125 L175 115" stroke="#1a121e" stroke-width="3" stroke-linecap="round"/>`,
    icecream: () => `
      <defs><linearGradient id="sa-ice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1222"/><stop offset="1" stop-color="#221b38"/></linearGradient>
      <linearGradient id="sa-lamp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fef08a" stop-opacity=".7"/><stop offset="1" stop-color="#fef08a" stop-opacity="0"/></linearGradient></defs>
      <rect width="300" height="180" fill="url(#sa-ice)"/>
      ${Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 61) % 300}" cy="${(i * 31) % 90}" r="${i % 4 ? 0.8 : 1.3}" fill="#fff" opacity=".8"/>`).join('')}
      <path d="M220 20 L200 150 L260 150 Z" fill="url(#sa-lamp)"/>
      <path d="M220 20 L220 150" stroke="#334155" stroke-width="3.5"/>
      <circle cx="220" cy="20" r="7" fill="#fef08a"/><circle cx="220" cy="20" r="16" fill="#fef08a" opacity=".35"/>
      <rect y="148" width="300" height="32" fill="#1e293b"/><line y1="148" y2="148" x1="0" x2="300" stroke="#475569" stroke-width="2"/>
      <g fill="#0f172a" stroke="#0f172a"><circle cx="70" cy="144" r="13" fill="none" stroke-width="3"/><circle cx="118" cy="144" r="13" fill="none" stroke-width="3"/>
      <path d="M70 144 L88 132 L112 132 L118 144" fill="none" stroke-width="3"/><path d="M82 131 C84 122 98 122 108 126 L106 133 Z" stroke-width="1"/></g>
      <g fill="#0b0e1b"><circle cx="148" cy="116" r="8"/><path d="M136 148 C136 130 144 125 152 125 C160 125 168 130 168 148 Z"/>
      <circle cx="172" cy="114" r="7.8"/><path d="M165 110 C162 120 162 130 164 136 L168 134 C167 126 167 118 172 112 Z"/><path d="M162 148 C162 130 168 123 174 123 C180 123 186 130 186 148 Z"/></g>
      <path d="M158 125 L160 132 L156 132 Z" fill="#d97706"/><circle cx="158" cy="124" r="3.2" fill="#ec4899"/>
      <path d="M166 125 L168 132 L164 132 Z" fill="#d97706"/><circle cx="166" cy="124" r="3.2" fill="#92400e"/>`,
    veranda: () => `
      <defs><linearGradient id="sa-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f97316"/><stop offset=".45" stop-color="#fbbf24"/><stop offset="1" stop-color="#fed7aa"/></linearGradient></defs>
      <rect width="300" height="180" fill="url(#sa-gold)"/>
      <circle cx="230" cy="85" r="26" fill="#fff7ed"/><circle cx="230" cy="85" r="48" fill="#ffedd5" opacity=".35"/>
      <path d="M0 130 L60 105 L140 125 L210 100 L300 120 L300 180 L0 180 Z" fill="#78350f" opacity=".3"/>
      <rect y="0" width="300" height="24" fill="#3f2e27"/>
      <rect x="25" y="24" width="8" height="116" fill="#543d34"/>
      <rect x="270" y="24" width="8" height="116" fill="#543d34"/>
      <rect y="138" width="300" height="42" fill="#2d1f19"/><line y1="138" y2="138" x1="0" x2="300" stroke="#543d34" stroke-width="3"/>
      <rect x="50" y="122" width="22" height="16" rx="2" fill="#78350f"/>
      <rect x="54" y="126" width="14" height="8" rx="1" fill="#fef08a" opacity=".7"/>
      <circle cx="61" cy="130" r="2" fill="#1c1917"/><circle cx="67" cy="130" r="2" fill="#1c1917"/>
      <path d="M58 114 q3 -4 6 0 t6 0" fill="none" stroke="#78350f" stroke-width="1.2"/>
      <text x="75" y="112" font-size="11" fill="#451a03">♪</text><text x="83" y="102" font-size="9" fill="#451a03">♫</text>
      <g fill="#1f1614"><circle cx="140" cy="116" r="7.5"/><path d="M130 144 C130 128 136 124 142 124 C148 124 154 128 154 144 Z"/>
      <circle cx="160" cy="116" r="7.2"/><path d="M152 144 C152 128 158 124 164 124 C170 124 176 128 176 144 Z"/>
      <path d="M144 128 L158 128" stroke="#1f1614" stroke-width="3.5" stroke-linecap="round"/></g>
      <path d="M120 140 H184" stroke="#451a03" stroke-width="4"/><line x1="126" y1="140" x2="124" y2="155" stroke="#451a03" stroke-width="3"/><line x1="178" y1="140" x2="180" y2="155" stroke="#451a03" stroke-width="3"/>`,
    oldtravel: () => `
      <defs><linearGradient id="sa-trv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38bdf8"/><stop offset=".6" stop-color="#c084fc"/><stop offset="1" stop-color="#f472b6"/></linearGradient></defs>
      <rect width="300" height="180" fill="url(#sa-trv)"/>
      <circle cx="70" cy="45" r="16" fill="#fef08a"/>
      <path d="M220 30 Q240 28 260 22" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3,3"/>
      <path d="M260 22 l-6 1 l2 4 z" fill="#fff"/>
      <ellipse cx="230" cy="65" rx="10" ry="13" fill="#ef4444"/><polygon points="225,78 235,78 232,83 228,83" fill="#b91c1c"/>
      <rect y="134" width="300" height="46" fill="#15803d"/><path d="M0 134 C80 120 180 142 300 130 L300 180 L0 180 Z" fill="#166534"/>
      <rect x="55" y="132" width="22" height="16" rx="2" fill="#b45309"/><rect x="53" y="136" width="26" height="3" fill="#78350f"/>
      <rect x="70" y="126" width="18" height="22" rx="2" fill="#0284c7"/><rect x="68" y="132" width="22" height="3" fill="#0369a1"/>
      ${coupleStanding(170, 150, 0.9, '#1e293b')}`
  };
  const storySvg = (id) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 180">${(STORY_ART[id] || STORY_ART.sunset)()}</svg>`;

  enterFns.story = () => {
    const S = C.story || {};
    const stages = S.stages || [];
    $('story-title').textContent = S.title || '';
    $('story-sub').textContent = fill(S.subtitle || '');
    $('btn-story-next').textContent = S.nextButton || 'Aage →';
    const picks = [];
    let stage = 0;

    function renderStage() {
      const st = stages[stage];
      $('story-chapter').textContent = `Chapter ${stage + 1} / ${stages.length}`;
      $('story-q').textContent = st.q;
      const box = $('story-choices');
      box.innerHTML = '';
      st.options.forEach((o) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'story-choice';
        b.innerHTML = `<span class="story-art">${storySvg(o.id)}</span><span class="story-label"></span>`;
        b.querySelector('.story-label').textContent = o.label;
        b.addEventListener('click', () => choose(o, b));
        box.appendChild(b);
      });
      const book = $('storybook');
      book.classList.remove('turn'); void book.offsetWidth; book.classList.add('turn');
    }

    function choose(o, b) {
      // One pick per chapter: a quick second tap must not skip the next chapter
      if (b.classList.contains('picked') || b.parentElement.querySelector('.picked')) return;
      b.classList.add('picked');
      Sound.chime();
      heartsFrom(b, ['💛', '✨', '📖'], 6);
      picks.push(o);
      Log.send('story_choice', { stage: stage + 1, q: stages[stage].q, choice: o.label });
      setTimeout(() => {
        stage++;
        if (stage < stages.length) renderStage(); else ending();
      }, 650);
    }

    function ending() {
      $('storybook').classList.add('hidden');
      const end = $('story-ending');
      end.classList.remove('hidden');
      $('story-end-title').textContent = fill(S.endTitle || '');
      const pages = $('story-pages');
      pages.innerHTML = '';
      const intro = document.createElement('p');
      intro.className = 'story-para';
      intro.textContent = fill(S.intro || '');
      pages.appendChild(intro);
      picks.forEach((o) => {
        const fig = document.createElement('figure');
        fig.className = 'story-page';
        fig.innerHTML = `<div class="story-art big">${storySvg(o.id)}</div><figcaption class="story-para"></figcaption>`;
        fig.querySelector('figcaption').textContent = fill(o.line);
        pages.appendChild(fig);
      });
      $('story-outro').textContent = fill(S.outro || '');
      Log.send('story_done', { choices: picks.map((o) => o.label) });
      Sound.fanfare();
      confettiBurst({ particleCount: 70 });
      end.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Save the whole storybook as one image she can keep
    async function storyPng() {
      try { await document.fonts.load('44px Caveat'); await document.fonts.load('700 60px Caveat'); } catch (e) { /* optional */ }
      const W = 1080, PAD = 80, MAXW = W - PAD * 2;
      const imgs = await Promise.all(picks.map((o) => new Promise((resolve) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => resolve(null);
        im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(storySvg(o.id));
      })));
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      const wrap = (text, font) => {
        ctx.font = font;
        const out = []; let ln = '';
        text.split(' ').forEach((w) => { const t = ln ? `${ln} ${w}` : w; if (ctx.measureText(t).width > MAXW && ln) { out.push(ln); ln = w; } else ln = t; });
        if (ln) out.push(ln);
        return out;
      };
      const BODY = '500 40px Caveat, cursive', BIG = '700 60px Caveat, cursive';
      const IMG_H = Math.round(MAXW * 180 / 300);
      const blocks = [{ lines: wrap(fill(S.endTitle || ''), BIG), font: BIG, color: '#c8325e', lh: 70, gap: 24 },
        { lines: wrap(fill(S.intro || ''), BODY), font: BODY, color: '#2b1d3a', lh: 50, gap: 30 }];
      picks.forEach((o, i) => { blocks.push({ img: imgs[i], gap: 18 }); blocks.push({ lines: wrap(fill(o.line), BODY), font: BODY, color: '#2b1d3a', lh: 50, gap: 34 }); });
      blocks.push({ lines: wrap(fill(S.outro || ''), BODY), font: BODY, color: '#a8742a', lh: 50, gap: 0 });
      const H = PAD * 2 + blocks.reduce((h, b) => h + (b.img !== undefined ? IMG_H : b.lines.length * b.lh) + b.gap, 0);
      c.width = W; c.height = H;
      ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#f3c5d3'; ctx.lineWidth = 6; ctx.strokeRect(30, 30, W - 60, H - 60);
      ctx.textBaseline = 'top';
      let y = PAD;
      blocks.forEach((b) => {
        if (b.img !== undefined) {
          if (b.img) ctx.drawImage(b.img, PAD, y, MAXW, IMG_H);
          y += IMG_H + b.gap;
          return;
        }
        ctx.font = b.font; ctx.fillStyle = b.color; ctx.textAlign = 'left';
        b.lines.forEach((ln) => { ctx.fillText(ln, PAD, y); y += b.lh; });
        y += b.gap;
      });
      return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
    }

    $('btn-story-save').addEventListener('click', async () => {
      Log.send('story_saved');
      saveImage(await storyPng(), 'hamari-kahani.png', 'Kahani save ho gayi 📖💛');
    });
    $('btn-story-next').addEventListener('click', () => { Sound.chime(); show('questions'); });

    renderStage();
  };

  // ==============================================================================
  // 6. MEMORIES — flip polaroids
  // ==============================================================================
  enterFns.memories = () => {
    const M = C.memories;
    $('mem-title').textContent = M.title;
    $('mem-sub').textContent = M.subtitle;
    const wrap = $('polaroids');
    (M.items || []).forEach((m, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'polaroid';
      b.style.setProperty('--tilt', `${[-3, 2, -1.5, 3, -2, 1.5][i % 6]}deg`);
      b.setAttribute('aria-label', `${m.title} — palatne ke liye tap karo`);
      b.innerHTML = `
        <span class="polaroid-inner">
          <span class="pol-face pol-front">
            <span class="tape"></span>
            <span class="pol-title"></span>
            <span class="pol-date"></span>
            <p class="pol-note"></p>
            <span class="pol-tap-hint">📸 Tap to see photo ✨</span>
          </span>
          <span class="pol-face pol-back">
            <img alt="" loading="lazy">
            <span class="pol-cap"><span class="pol-title"></span><span class="pol-date"></span></span>
          </span>
        </span>`;
      const img = b.querySelector('.pol-back img');
      img.src = m.photo;
      img.alt = m.title;
      b.querySelectorAll('.pol-title').forEach((el) => { el.textContent = m.title; });
      b.querySelectorAll('.pol-date').forEach((el) => { el.textContent = m.date || ''; });
      b.querySelector('.pol-note').textContent = m.caption;
      b.addEventListener('click', () => { b.classList.toggle('flipped'); Sound.whoosh(); });
      wrap.appendChild(b);
    });
    $('btn-mem-next').addEventListener('click', () => { Sound.chime(); show('stars'); });
  };

  // ==============================================================================
  // 6b. STARS — tap the glowing star, connect them into a heart
  // ==============================================================================
  enterFns.stars = () => {
    const S = C.stars;
    $('stars-title').textContent = S.title;
    $('stars-sub').textContent = S.subtitle;
    $('stars-done-title').textContent = S.doneTitle;
    $('stars-done-text').textContent = S.doneText;

    const NS = 'http://www.w3.org/2000/svg';
    const words = S.words || [];
    const n = Math.max(words.length, 6);
    // Classic heart curve, sampled clockwise from the top dip
    const pts = Array.from({ length: n }, (_, i) => {
      const t = Math.PI * 2 * (i / n);
      const x = 16 * Math.sin(t) ** 3;
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      return [150 + x * 7.6, 128 - y * 7.6];
    });

    const dust = $('star-dust');
    for (let i = 0; i < 46; i++) {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', rand(4, 296).toFixed(1));
      c.setAttribute('cy', rand(4, 276).toFixed(1));
      c.setAttribute('r', rand(0.4, 1.2).toFixed(2));
      c.setAttribute('class', 'dust');
      c.style.animationDelay = `${rand(0, 3).toFixed(2)}s`;
      dust.appendChild(c);
    }
    $('heart-fill').setAttribute('d', 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L') + ' Z');

    const lines = $('star-lines');
    const group = $('star-points');
    const sentence = $('star-sentence');
    let next = 0;
    const stars = pts.map(([x, y], i) => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'star');
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      g.innerHTML = '<circle r="14" class="star-hit"/><circle r="9" class="star-glow"/><path class="star-shape" d="M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6 Z"/>';
      g.addEventListener('click', () => tap(i));
      group.appendChild(g);
      return g;
    });

    function link(a, b) {
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', pts[a][0]); l.setAttribute('y1', pts[a][1]);
      l.setAttribute('x2', pts[b][0]); l.setAttribute('y2', pts[b][1]);
      l.setAttribute('class', 'star-line');
      lines.appendChild(l);
    }

    function mark() { stars.forEach((s, i) => s.classList.toggle('next', i === next)); }

    function tap(i) {
      if (next >= n) return;
      if (i !== next) {
        if (!stars[i].classList.contains('lit')) toast(S.wrongTap || '😉', 1500);
        return;
      }
      stars[i].classList.add('lit');
      if (i > 0) link(i - 1, i);
      const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
      Sound.ensure();
      Sound.note(notes[i % notes.length] * (i >= notes.length ? 1.5 : 1));
      const w = document.createElement('span');
      w.textContent = (i ? ' ' : '') + (words[i] || '✨');
      sentence.appendChild(w);
      next++;
      mark();
      if (next >= n) {
        link(n - 1, 0);
        $('heart-fill').style.transition = 'opacity 1.6s ease';
        $('heart-fill').setAttribute('opacity', '1');
        $('star-sky').classList.add('complete');
        setTimeout(() => {
          confettiBurst({ particleCount: 70, colors: ['#ffd27a', '#ff8fb1', '#ffffff'] });
          Sound.fanfare();
          $('stars-done').classList.remove('hidden');
          $('stars-done').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 900);
      }
    }
    mark();

    $('btn-stars-next').addEventListener('click', () => { Sound.chime(); show('poem'); });
  };

  // ==============================================================================
  // 8b. QUESTIONS — "Dil ki baatein", a little chat with his reactions
  // ==============================================================================
  enterFns.questions = () => {
    const Q = C.questions;
    $('q-title').textContent = Q.title;
    $('q-sub').textContent = Q.subtitle;
    $('btn-q-next').textContent = Q.letterButton;

    const chat = $('chat');
    const choices = $('chat-choices');
    const items = Q.items || [];

    function bubble(text, who) {
      const b = document.createElement('div');
      b.className = `bubble ${who}`;
      if (who === 'him') {
        const name = document.createElement('span');
        name.className = 'bubble-name';
        name.textContent = Q.typingName || C.fromName;
        b.appendChild(name);
      }
      const t = document.createElement('span');
      t.textContent = text;
      b.appendChild(t);
      chat.appendChild(b);
      b.scrollIntoView({ behavior: 'smooth', block: 'end' });
      return b;
    }

    async function himSays(text) {
      const typing = document.createElement('div');
      typing.className = 'bubble him typing';
      typing.innerHTML = '<i></i><i></i><i></i>';
      chat.appendChild(typing);
      typing.scrollIntoView({ behavior: 'smooth', block: 'end' });
      await wait(Math.min(1800, 600 + text.length * 14));
      typing.remove();
      bubble(text, 'him');
      Sound.click();
    }

    function ask(i) {
      if (i >= items.length) return finish();
      const item = items[i];
      himSays(item.q).then(() => {
        choices.innerHTML = '';
        let nahiTries = 0;
        const answer = async (label, reaction, typed = false) => {
          choices.innerHTML = '';
          choices.style.minHeight = '';
          bubble(label, 'her');
          Log.send('answer', { q: item.q, a: label, typed, nahiTries });
          Sound.chime();
          if (reaction) await himSays(reaction);
          await wait(500);
          ask(i + 1);
        };

        (item.options || []).forEach((opt) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'chat-option';
          b.textContent = opt.label;
          if (opt.dodge) {
            let k = 0;
            const run = (e) => {
              e.preventDefault();
              // Run around in the empty strip below the real options, never over them
              const others = [...choices.children].filter((x) => x !== b);
              const floor = Math.max(0, ...others.map((x) => x.offsetTop + x.offsetHeight)) + 10;
              choices.style.minHeight = `${floor + b.offsetHeight + 90}px`;
              b.classList.add('dodging');
              b.style.left = `${rand(0, Math.max(10, choices.clientWidth - b.offsetWidth))}px`;
              b.style.top = `${rand(floor, Math.max(floor, choices.clientHeight - b.offsetHeight))}px`;
              const texts = Q.dodgeTexts || [];
              if (texts.length) b.textContent = texts[k++ % texts.length];
              nahiTries++;
              Sound.pop();
            };
            b.addEventListener('pointerenter', run);
            b.addEventListener('pointerdown', run);
            b.addEventListener('click', (e) => e.preventDefault());
          } else {
            b.addEventListener('click', () => answer(opt.label, opt.reaction));
          }
          choices.appendChild(b);
        });

        if (item.free) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'chat-option ghost';
          b.textContent = Q.freeLabel;
          b.addEventListener('click', () => {
            choices.innerHTML = '';
            const form = document.createElement('form');
            form.className = 'chat-input';
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = Q.freePlaceholder || '';
            input.maxLength = 300;
            const send = document.createElement('button');
            send.type = 'submit';
            send.className = 'btn btn-primary';
            send.textContent = '➤';
            send.setAttribute('aria-label', 'Bhejo');
            form.append(input, send);
            form.addEventListener('submit', (e) => {
              e.preventDefault();
              const v = input.value.trim();
              if (!v) { input.focus(); return; }
              answer(v, item.freeReaction, true);
            });
            choices.appendChild(form);
            input.focus();
          });
          choices.appendChild(b);
        }
      });
    }

    async function finish() {
      await himSays(Q.outro);
      $('chat-end').classList.remove('hidden');
      $('chat-end').scrollIntoView({ behavior: 'smooth', block: 'end' });
      hearts(window.innerWidth / 2, window.innerHeight * 0.7, ['💛', '💌', '✨'], 8);
    }

    $('btn-q-next').addEventListener('click', () => { Sound.chime(); show('letter'); });

    setTimeout(() => ask(0), 600);
  };

  // ==============================================================================
  // 7. POEM — line by line, then her turn
  // ==============================================================================
  enterFns.poem = () => {
    const P = C.poem;
    $('poem-title').textContent = P.title;
    $('poem-sub').textContent = P.subtitle;
    $('reply-prompt').textContent = P.replyPrompt;
    $('reply-text').placeholder = P.replyPlaceholder;
    $('btn-reply-send').textContent = P.replyButton;

    const lines = P.lines || [];
    const out = $('poem-lines');
    let i = 0;
    const reveal = () => {
      if (i >= lines.length) return;
      const s = document.createElement('span');
      s.className = 'poem-line' + (i % 4 === 3 && i < lines.length - 1 ? ' gap' : '');
      s.textContent = lines[i];
      out.appendChild(s);
      Sound.click();
      i++;
      if (i >= lines.length) {
        $('tap-more').classList.add('hidden');
        setTimeout(() => { $('reply-card').classList.remove('hidden'); Sound.sparkle(); }, 900);
      }
    };
    $('notebook').addEventListener('click', reveal);
    reveal();

    $('btn-reply-send').addEventListener('click', () => {
      const text = $('reply-text').value.trim();
      if (!text) {
        toast('Pehle kuch likho na, poetess ji ✍️');
        $('reply-text').focus();
        return;
      }
      Log.send('poem_reply', { text });
      const saved = $('reply-saved');
      saved.textContent = P.replySaved || '💛';
      saved.classList.remove('hidden');
      Sound.sparkle();
      heartsFrom($('btn-reply-send'), ['💛', '✍️', '✨'], 6);
      // Writing is done — make "next" the main button now
      $('btn-reply-send').className = 'btn btn-ghost';
      $('btn-poem-next').className = 'btn btn-primary';
    });
    $('btn-poem-next').addEventListener('click', () => { Sound.chime(); show('cake'); });
  };

  // ==============================================================================
  // 8. CAKE — "2" & "4" candles, blow with mic or tap, then a wish
  // ==============================================================================
  enterFns.cake = () => {
    const K = C.cake;
    $('cake-title').textContent = K.title;
    $('cake-sub').textContent = K.subtitle;
    $('btn-mic').textContent = K.micButton;
    $('wish-text').textContent = K.wishText;
    $('wish-done').textContent = K.wishDone;
    $('cake-name').textContent = C.petName;

    const candles = [...document.querySelectorAll('.candle')];
    let micStream = null;
    let micRaf = null;

    function blow(c) {
      if (c.classList.contains('out')) return;
      c.classList.add('out');
      Sound.whoosh();
      heartsFrom(c, ['💨', '✨'], 3);
      if (candles.every((x) => x.classList.contains('out'))) {
        stopMic();
        $('btn-mic').classList.add('hidden');
        setTimeout(makeWish, 900);
      }
    }
    candles.forEach((c) => c.addEventListener('click', () => blow(c)));

    function stopMic() {
      cancelAnimationFrame(micRaf);
      if (micStream) micStream.getTracks().forEach((t) => t.stop());
      micStream = null;
      $('btn-mic').classList.remove('listening');
    }

    $('btn-mic').addEventListener('click', async () => {
      const ctx = Sound.ensure();
      if (!ctx || !navigator.mediaDevices?.getUserMedia) {
        toast('Mic nahi mila — flame pe tap karo 👆');
        return;
      }
      if (micStream) { stopMic(); return; }
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        toast('Mic ki permission nahi mili — koi baat nahi, flame pe tap karo 👆');
        return;
      }
      $('btn-mic').classList.add('listening');
      $('btn-mic').textContent = '🎤 Ab zor se phoonko…';
      const src = ctx.createMediaStreamSource(micStream);
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      const data = new Uint8Array(an.fftSize);
      let loud = 0;
      const listen = () => {
        an.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / data.length);
        loud = rms > 0.16 ? loud + 1 : Math.max(0, loud - 1);
        if (loud > 5) {
          loud = 0;
          const next = candles.find((c) => !c.classList.contains('out'));
          if (next) blow(next);
        }
        if (micStream) micRaf = requestAnimationFrame(listen);
      };
      listen();
    });

    async function makeWish() {
      const overlay = $('wish-overlay');
      const ring = $('wish-ring-fg');
      const sec = $('wish-sec');
      overlay.classList.remove('hidden');
      Sound.stopAmbient();
      const total = 10;
      ring.style.strokeDashoffset = '0';
      for (let s = total; s > 0; s--) {
        sec.textContent = s;
        ring.style.strokeDashoffset = String(327 * (1 - (s - 1) / total));
        await wait(1000);
      }
      overlay.classList.add('hidden');
      $('cake-done').classList.remove('hidden');
      Log.send('wish_made');
      confettiShow(3500);
      const ms = Sound.happyBirthday();
      setTimeout(() => Sound.startAmbient(), ms + 400);
    }

    $('btn-cake-next').addEventListener('click', () => { Sound.chime(); show('story'); });
  };

  // ==============================================================================
  // 9. LETTER + COUPONS
  // ==============================================================================
  enterFns.letter = () => {
    const L = C.letter;
    $('letter-title').textContent = L.title;
    $('letter-salutation').textContent = L.salutation;
    $('letter-closing').textContent = L.closing;
    $('letter-sign').textContent = L.signature;
    // A paragraph starting with "~" is a shayari couplet (lines split by newlines)
    const isShayari = (t) => t.trim().startsWith('~');
    const paras = (L.paragraphs || []).map((t) => fill(t));
    const body = $('letter-body');
    paras.forEach((t) => {
      const p = document.createElement('p');
      if (isShayari(t)) {
        p.className = 'shayari';
        p.textContent = t.trim().slice(1).trim();
      } else {
        p.textContent = t;
      }
      body.appendChild(p);
    });

    const env = $('envelope');
    env.addEventListener('click', () => {
      if (env.classList.contains('open')) return;
      env.classList.add('open');
      Log.send('letter_opened');
      Sound.whoosh();
      setTimeout(() => {
        env.classList.add('hidden');
        $('letter').classList.remove('hidden');
        $('letter-save-row').classList.remove('hidden');
        $('coupons').classList.remove('hidden');
        Sound.chime();
      }, 1300);
    });

    // Render the letter onto a tall paper image she can keep
    async function letterPng() {
      try { await document.fonts.load('44px Caveat'); await document.fonts.load('700 60px Caveat'); } catch (e) { /* optional */ }
      const W = 1080, PAD = 90, MAXW = W - PAD * 2;
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      const blocks = [];
      const wrap = (text, font) => {
        ctx.font = font;
        const out = [];
        text.split('\n').forEach((para) => {
          let lineTxt = '';
          para.split(' ').forEach((w) => {
            const test = lineTxt ? `${lineTxt} ${w}` : w;
            if (ctx.measureText(test).width > MAXW && lineTxt) { out.push(lineTxt); lineTxt = w; } else lineTxt = test;
          });
          out.push(lineTxt);
        });
        return out;
      };
      const BODY = '500 44px Caveat, cursive';
      const SHAYARI = '700 46px Caveat, cursive';
      const BIG = '700 64px Caveat, cursive';
      blocks.push({ lines: wrap(L.salutation, BIG), font: BIG, color: '#c8325e', lh: 76, gap: 30 });
      paras.forEach((t) => {
        if (isShayari(t)) blocks.push({ lines: wrap(t.trim().slice(1).trim(), SHAYARI), font: SHAYARI, color: '#a8742a', lh: 60, gap: 34, center: true });
        else blocks.push({ lines: wrap(t, BODY), font: BODY, color: '#2b1d3a', lh: 56, gap: 30 });
      });
      blocks.push({ lines: [L.closing], font: BODY, color: '#2b1d3a', lh: 56, gap: 6 });
      blocks.push({ lines: [L.signature], font: BIG, color: '#c8325e', lh: 76, gap: 0 });
      const H = PAD * 2 + 40 + blocks.reduce((h, b) => h + b.lines.length * b.lh + b.gap, 0);
      c.width = W; c.height = H;
      ctx.fillStyle = '#fffaf0';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#f3c5d3';
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, W - 60, H - 60);
      ctx.textBaseline = 'top';
      let y = PAD;
      blocks.forEach((b) => {
        ctx.font = b.font;
        ctx.fillStyle = b.color;
        ctx.textAlign = b.center ? 'center' : 'left';
        b.lines.forEach((ln) => { ctx.fillText(ln, b.center ? W / 2 : PAD, y); y += b.lh; });
        y += b.gap;
      });
      ctx.font = '500 26px "Baloo 2", sans-serif';
      ctx.fillStyle = '#b8a8c8';
      ctx.textAlign = 'center';
      ctx.fillText('21 · 10 · 2026', W / 2, H - PAD + 20);
      return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
    }

    $('btn-letter-save').addEventListener('click', async () => {
      Log.send('letter_saved');
      const blob = await letterPng();
      saveImage(blob, 'meri-chitthi.png', 'Chitthi save ho gayi 💌 Hamesha tumhare paas rahegi.');
    });

    const K = C.coupons;
    $('coupons-title').textContent = K.title;
    $('coupons-sub').textContent = K.subtitle;
    const claimed = new Set(store.get('coupons', []));
    const grid = $('coupon-grid');
    (K.items || []).forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'coupon' + (claimed.has(i) ? ' claimed' : '');
      b.innerHTML = '<span class="c-icon"></span><span><p class="c-title"></p><p class="c-text"></p></span><span class="c-claimed">CLAIMED</span>';
      b.querySelector('.c-icon').textContent = c.icon;
      b.querySelector('.c-title').textContent = c.title;
      b.querySelector('.c-text').textContent = c.text;
      b.addEventListener('click', (e) => {
        if (claimed.has(i)) return;
        claimed.add(i);
        store.set('coupons', [...claimed]);
        Log.send('coupon', { title: c.title, icon: c.icon });
        b.classList.add('claimed');
        Sound.thud(); setTimeout(Sound.sparkle, 150);
        hearts(e.clientX, e.clientY, [c.icon, '✨', '💛'], 5);
      });
      grid.appendChild(b);
    });

    $('btn-letter-next').addEventListener('click', () => { Sound.chime(); show('goodnight'); });
  };

  // ==============================================================================
  // 10. GOODNIGHT — lights off, so jao
  // ==============================================================================
  enterFns.goodnight = () => {
    const G = C.goodnight;
    $('gn-title').textContent = G.title;
    $('gn-text').textContent = G.text;
    $('btn-lights-off').textContent = G.button;
    $('gn-final-title').textContent = G.finalTitle;
    $('gn-final-text').textContent = G.finalText;
    $('gn-sign').textContent = `— ${C.fromName}`;

    $('btn-lights-off').addEventListener('click', async () => {
      $('btn-lights-off').disabled = true;
      Log.send('finished');
      Sound.stopAmbient();
      await Lights.turnOff();
      document.body.classList.add('lights-off');
      $('gn-ask').classList.add('hidden');
      $('gn-final').classList.remove('hidden');
      Sound.lullaby();
    });

    $('btn-replay').addEventListener('click', () => {
      store.clear();
      location.reload();
    });
  };

  // ==============================================================================
  // 🚀 BOOT
  // ==============================================================================
  initSky();

  // Little romantic touch: tapping empty space leaves a heart behind
  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a, input, textarea, label, form, svg, .sheet, .scene-ride, .scene-dream, .chat-choices')) return;
    hearts(e.clientX, e.clientY, ['💛', '💖', '✨'], 2);
  });

  if (isLocked()) {
    show('lock');
  } else {
    const jump = params.get('scene');
    if (isPreview && jump && SCENES.includes(jump) && jump !== 'hello') {
      Lights.turnOn(true);
      revealSoundButton();
      document.addEventListener('pointerdown', () => { Sound.ensure(); Sound.startAmbient(); }, { once: true });
      // Make sure earlier scenes' content exists if she navigates via resume later
      show(jump);
    } else {
      show('hello');
    }
  }
})();

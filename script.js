/**
 * ==============================================================================
 * 💛 CHETNA'S BIRTHDAY — interaction engine
 * Scenes: lock → hello → rule → playground → ride → court → memories → poem
 *         → cake → letter → goodnight
 * All words come from config.js (window.SURPRISE_CONFIG).
 * Handy for testing: ?preview skips the countdown, ?preview&scene=ride jumps.
 * ==============================================================================
 */

(function () {
  'use strict';

  const C = window.SURPRISE_CONFIG;
  const $ = (id) => document.getElementById(id);
  const SCENES = ['hello', 'rule', 'playground', 'ride', 'court', 'memories', 'stars', 'poem', 'cake', 'questions', 'letter', 'goodnight'];
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
        Object.keys(localStorage).filter((k) => k.startsWith('chetna_bday_')).forEach((k) => localStorage.removeItem(k));
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
        musicEl.src = C.musicUrl;
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
      // Soft closing phrase for goodnight
      lullaby: () => [783.99, 659.25, 523.25, 587.33, 659.25, 523.25, 392].forEach((f, i) => box(f, i * 0.62, 0.1))
    };
  })();

  // ==============================================================================
  // ✨ EFFECTS
  // ==============================================================================
  const COLORS = ['#ffd27a', '#ff8fb1', '#7fd6c2', '#b9a6ff', '#ffffff'];

  function confettiBurst(opts = {}) {
    if (typeof confetti !== 'function' || reducedMotion) return;
    confetti(Object.assign({ particleCount: 90, spread: 90, origin: { y: 0.6 }, colors: COLORS, disableForReducedMotion: true }, opts));
  }

  function confettiShow(ms = 2600) {
    if (typeof confetti !== 'function' || reducedMotion) return;
    const end = Date.now() + ms;
    const timer = setInterval(() => {
      confetti({ particleCount: 7, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors: COLORS });
      confetti({ particleCount: 7, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors: COLORS });
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
        shards(x, y, 3);
        return;
      }
      Sound.crash();
      if (navigator.vibrate) navigator.vibrate([40, 30, 80]);
      board.classList.add('broken');
      shards(x, y, 22);
      confettiBurst({ origin: { x: x / window.innerWidth, y: y / window.innerHeight } });
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
    $('pg-title').textContent = P.title;
    $('pg-sub').textContent = P.subtitle;
    $('tareef-intro').textContent = P.tareefIntro;
    $('lantern-intro').textContent = P.lanternIntro;
    $('wardrobe-intro').textContent = P.wardrobeIntro;

    const TOYS = ['balloons', 'tareef', 'lantern', 'wardrobe'];
    const done = new Set(store.get('toys', []).filter((t) => TOYS.includes(t)));
    let openSheet = null;

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
    }
    function close() {
      if (!openSheet) return;
      openSheet.classList.remove('open');
      openSheet = null;
    }

    document.querySelectorAll('.toy').forEach((t) => t.addEventListener('click', () => open(t.dataset.toy)));
    document.querySelectorAll('.sheet').forEach((s) => {
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
          add(row('', O.dresses.map((d) => chip(d.label, look.dress === d.id, () => { look.dress = d.id; }))));
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

    $('btn-wd-random').addEventListener('click', () => {
      W.randomize(look);
      Sound.sparkle();
      drawDoll(); renderOptions();
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
        $('wd-result-text').textContent = P.wardrobeResult || '';
        $('wd-result').classList.remove('hidden');
        $('wd-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (err) {
        toast('Photo ban nahi paayi 😅 Screenshot le lo!');
      }
    });

    renderTabs();
    renderOptions();
    drawDoll();

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

      // Find local peaks to draw 3D triangular faceted mountain faces
      let facets = '';
      for (let i = 2; i < pts.length - 2; i++) {
        const [px, py] = pts[i];
        if (py < pts[i - 1][1] && py < pts[i + 1][1] && py < 220) {
          // Local mountain peak! Draw sunlit right face and shadowed left face
          const rightFoot = Math.min(W, px + 45 + (f(px) % 30));
          const leftFoot = Math.max(0, px - 35 - (f(px) % 25));
          const depthY = Math.min(H, py + 95 + (f(px) % 40));
          // Sunlit face (facing sunrise on right)
          facets += `<polygon points="${px},${n1(py)} ${rightFoot},${n1(depthY)} ${px + 8},${n1(depthY + 20)}" fill="url(#sunFacet)" opacity=".75"/>`;
          // Shadowed face (facing left away from sunrise)
          facets += `<polygon points="${px},${n1(py)} ${leftFoot},${n1(depthY - 10)} ${px - 6},${n1(depthY + 15)}" fill="url(#shadowFacet)" opacity=".65"/>`;
        }
      }

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

    $('btn-court-next').addEventListener('click', () => { Sound.chime(); show('memories'); });
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
            <img alt="" loading="lazy">
            <span class="pol-cap"><span class="pol-title"></span><span class="pol-date"></span></span>
          </span>
          <span class="pol-face pol-back"><p></p></span>
        </span>`;
      const img = b.querySelector('img');
      img.src = m.photo;
      img.alt = m.title;
      b.querySelector('.pol-title').textContent = m.title;
      b.querySelector('.pol-date').textContent = m.date || '';
      b.querySelector('.pol-back p').textContent = m.caption;
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

    $('btn-cake-next').addEventListener('click', () => { Sound.chime(); show('questions'); });
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
    if (e.target.closest('button, a, input, textarea, label, form, svg, .sheet, .scene-ride, .chat-choices')) return;
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

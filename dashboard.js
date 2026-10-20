/**
 * Dashboard — reads the activity log (/api/logs) and shows what she did:
 * her answers, wishes, poem line, wardrobe looks, coupons and the full journey.
 * Locally (admin_server.py) no key is needed; on Netlify/Vercel it asks for ADMIN_KEY once.
 */
(function () {
  'use strict';

  const C = window.SURPRISE_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const herName = C.herName || 'Wo';

  const SCENES = {
    hello: '🤫 Midnight hello',
    rule: '👊 "Log kya kahenge" board',
    playground: '🎠 Playground',
    ride: '🏍️ Bike ride',
    court: '🧑‍⚖️ Adalat',
    dream: '🌙 Sapno ki duniya',
    memories: '📸 Yaadein',
    stars: '✨ Taaron wala dil',
    poem: '✍️ Poem',
    cake: '🎂 Cake',
    story: '📖 Hamari kahani',
    questions: '💬 Dil ki baatein',
    letter: '💌 Chitthi',
    goodnight: '🌙 Goodnight'
  };
  const SCENE_ORDER = Object.keys(SCENES);
  const TOYS = { balloons: '🎈 Balloons', tareef: '💐 Tareef Machine', lantern: '🏮 Wish Lantern', wardrobe: '👗 Wardrobe', hearts: '💕 Dil Pakdo' };
  const DREAM = { eyes_closed: 'Aankhen band kin — sapna shuru 😌', fireflies: '🌿 Jugnu jar me bhar diye', lake: '🪷 Jheel ki dhun baja di', mirrors: '🔮 Chaand ki roshni gulab tak pahuncha di' };

  let key = '';
  try { key = localStorage.getItem('bday_dash_key') || ''; } catch (e) { /* private mode */ }
  let showTests = false;
  let events = [];
  let liveTimer = null;

  // ------------------------------------------------------------------ helpers
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  const when = (e) => e.t || Date.parse(e.at) || 0;
  const fmt = (ms) => new Date(ms).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', second: '2-digit'
  });
  const ago = (ms) => {
    const s = Math.round((Date.now() - ms) / 1000);
    if (s < 60) return 'abhi abhi';
    if (s < 3600) return `${Math.floor(s / 60)} min pehle`;
    if (s < 86400) return `${Math.floor(s / 3600)} ghante pehle`;
    return `${Math.floor(s / 86400)} din pehle`;
  };
  function setStatus(text, kind = '') {
    $('status').textContent = text;
    $('status').className = 'status ' + kind;
  }
  function badge(text, cls = '') { return el('span', 'badge ' + cls, text); }

  function describe(e) {
    const d = e.data || {};
    switch (e.type) {
      case 'peek': return '🔒 Countdown pe aayi — time se pehle peek kiya 😏';
      case 'scene': return d.name === 'hello' ? '🤫 Site kholi' : `➡️ Pahunchi: ${SCENES[d.name] || d.name}`;
      case 'lights_on': return '💡 Lights jalayi';
      case 'toy_done': return `✅ Khel liya: ${TOYS[d.toy] || d.toy}`;
      case 'lantern': return `🏮 Lantern udaaya: "${d.wish}"`;
      case 'look': return '👗 Apna look banaya';
      case 'answer': return `💬 "${d.a}"`;
      case 'poem_reply': return `✍️ Poem ka jawaab: "${d.text}"`;
      case 'wish_made': return '🎂 Candles bujhayi, wish maangi';
      case 'letter_opened': return '💌 Chitthi kholi';
      case 'letter_saved': return '📥 Chitthi save ki';
      case 'coupon': return `🎟️ Coupon claim kiya: ${d.icon || ''} ${d.title}`;
      case 'finished': return '🌙 Lights band ki — poora dekh liya 💛';
      case 'golden_heart': return `💛 Sunehra dil pakda (${d.caught || ''} dil pakdne ke baad)`;
      case 'voice_played': return '🎧 Tumhari voice note suni';
      case 'ai_try': return `🪄 AI try-on dabaya: "${d.dress || ''}"`;
      case 'dress_wish': return `🎁 Ye dress chahiye: "${d.dress || ''}" — list me add karo, Mishra ji!`;
      case 'dream_step': return `🌙 Sapne me: ${DREAM[d.step] || d.step}`;
      case 'dream_done': return '🌕 Sapna poora — chaand khil gaya, jhoole pe tum dono';
      case 'story_choice': return `📖 ${d.q} → "${d.choice}"`;
      case 'story_done': return '📖 Apni kahani poori ki';
      case 'story_saved': return '📥 Kahani save ki';
      default: return e.type;
    }
  }

  // ------------------------------------------------------------------ loading
  async function load() {
    setStatus('Loading…');
    try {
      const res = await fetch('/api/logs', { headers: key ? { 'x-admin-key': key } : {}, cache: 'no-store' });
      if (res.status === 401) return askKey(key ? 'Ye key galat hai. Phir se daalo:' : null);
      if (res.status === 404 || res.status === 405) {
        return showNotice('Log ka backend nahi mila. Computer pe <code>python3 admin_server.py</code> se kholo, ya live site pe Netlify me ADMIN_KEY set karke dobara deploy karo (README dekho).');
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      $('key-box').classList.add('hidden');
      $('notice').classList.add('hidden');
      $('content').classList.remove('hidden');
      events = (json.events || []).slice().sort((a, b) => when(a) - when(b));
      render();
      setStatus(`Updated ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`, 'ok');
    } catch (e) {
      setStatus(e.message, 'err');
    }
  }

  function askKey(msg) {
    $('content').classList.add('hidden');
    $('key-box').classList.remove('hidden');
    if (msg) $('key-msg').textContent = msg;
    $('key-input').focus();
    setStatus('');
  }
  function showNotice(html) {
    $('content').classList.add('hidden');
    const n = $('notice');
    n.innerHTML = html;
    n.classList.remove('hidden');
    setStatus('');
  }

  $('key-box').addEventListener('submit', (e) => {
    e.preventDefault();
    key = $('key-input').value.trim();
    try { localStorage.setItem('bday_dash_key', key); } catch (err) { /* ignore */ }
    load();
  });

  // ------------------------------------------------------------------ render
  function render() {
    const tests = events.filter((e) => e.preview).length;
    const list = events.filter((e) => showTests || !e.preview);
    $('tests-label').textContent = tests
      ? `Test (?preview) entries bhi dikhao — ${tests} chhupi hui hain`
      : 'Test (?preview) entries bhi dikhao';
    $('btn-clear-tests').classList.toggle('hidden', !tests);
    const devices = new Set(list.map((e) => e.device));

    renderStats(list);
    renderAnswers(list.filter((e) => e.type === 'answer'), devices.size > 1);
    renderSimple('story', list.filter((e) => e.type === 'story_choice'), (d) => `${d.q} → ${d.choice}`, 'Abhi tak kahani nahi banayi.');
    renderSimple('wishes', list.filter((e) => e.type === 'lantern'), (d) => d.wish, 'Abhi tak koi lantern nahi udaaya.');
    renderSimple('poem', list.filter((e) => e.type === 'poem_reply'), (d) => d.text, 'Abhi tak kuch nahi likha.');
    renderLooks(list.filter((e) => e.type === 'look'));
    renderCoupons(list.filter((e) => e.type === 'coupon'));
    renderTimeline(list, devices.size > 1);
  }

  function stat(label, value, sub, cls = '') {
    const s = el('div', 'stat ' + cls);
    s.append(el('div', 'label', label), el('div', 'value', value));
    if (sub instanceof Node) s.appendChild(sub);
    else if (sub) s.appendChild(el('div', 'sub', sub));
    return s;
  }

  function renderStats(list) {
    const box = $('stats');
    box.innerHTML = '';
    if (!list.length) {
      box.appendChild(stat('Status', 'Abhi tak nahi kholi', 'Jaise hi wo kholegi, yahan live dikhega 💛'));
      return;
    }
    const opened = list.find((e) => e.type === 'scene');
    const last = list[list.length - 1];
    const lastScene = [...list].reverse().find((e) => e.type === 'scene');
    const furthest = Math.max(-1, ...list.filter((e) => e.type === 'scene').map((e) => SCENE_ORDER.indexOf(e.data.name)));
    const finished = list.find((e) => e.type === 'finished');
    const peeks = list.filter((e) => e.type === 'peek');
    const isLive = Date.now() - when(last) < 2 * 60 * 1000;

    box.appendChild(stat('Pehli baar kholi', opened ? fmt(when(opened)) : '—', opened ? ago(when(opened)) : 'Abhi sirf countdown dekha'));
    box.appendChild(stat(isLive ? 'Abhi site pe hai' : 'Last activity', ago(when(last)), describe(last), isLive ? 'live' : ''));
    const bar = el('div', 'bar');
    const fill = el('i');
    fill.style.width = `${((furthest + 1) / SCENE_ORDER.length) * 100}%`;
    bar.appendChild(fill);
    const progress = el('div');
    progress.append(el('div', 'sub', lastScene ? `Abhi: ${SCENES[lastScene.data.name] || lastScene.data.name}` : ''), bar);
    box.appendChild(stat('Kahan tak pahunchi', `${furthest + 1} / ${SCENE_ORDER.length}`, progress));
    box.appendChild(stat('Poora dekha?', finished ? 'Haan 💛' : 'Abhi nahi', finished ? fmt(when(finished)) : ''));
    if (peeks.length) box.appendChild(stat('Time se pehle peek 😏', `${peeks.length} baar`, `Pehli baar: ${fmt(when(peeks[0]))}`));
  }

  function renderAnswers(list, multiDevice) {
    const box = $('answers');
    box.innerHTML = '';
    if (!list.length) { box.appendChild(el('p', 'empty', 'Abhi tak koi jawaab nahi.')); return; }
    list.forEach((e) => {
      const d = e.data || {};
      const row = el('div', 'qa');
      row.append(el('div', 'q', d.q || ''), el('div', 'a', d.a || ''));
      const badges = el('div', 'badges');
      if (d.typed) badges.appendChild(badge('✍️ khud likha', 'hot'));
      if (d.nahiTries) badges.appendChild(badge(`😏 "Nahi" dabane ki koshish: ${d.nahiTries} baar`, 'hot'));
      if (e.preview) badges.appendChild(badge('test', 'test'));
      if (multiDevice) badges.appendChild(badge(`device ${e.device}`));
      badges.appendChild(el('span', 'time', fmt(when(e))));
      row.appendChild(badges);
      box.appendChild(row);
    });
  }

  function renderSimple(id, list, pick, emptyText) {
    const box = $(id);
    box.innerHTML = '';
    if (!list.length) { box.appendChild(el('p', 'empty', emptyText)); return; }
    list.forEach((e) => {
      const item = el('div', 'item');
      item.appendChild(el('p', 'quote', pick(e.data || {})));
      const meta = el('div', 'badges');
      if (e.preview) meta.appendChild(badge('test', 'test'));
      meta.appendChild(el('span', 'time', fmt(when(e))));
      item.appendChild(meta);
      box.appendChild(item);
    });
  }

  function renderLooks(list) {
    const box = $('looks');
    box.innerHTML = '';
    if (!list.length || !window.Wardrobe) { box.appendChild(el('p', 'empty', 'Abhi tak koi look nahi banaya.')); return; }
    list.forEach((e, i) => {
      const look = Object.assign(window.Wardrobe.defaultState(), e.data.look || {});
      look.extras = new Set((e.data.look && e.data.look.extras) || []);
      const wrap = el('div', 'look');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('viewBox', '0 0 450 600');
      svg.innerHTML = window.Wardrobe.render(look, `look${i}-`);
      wrap.appendChild(svg);
      wrap.appendChild(el('span', 'time', fmt(when(e)) + (e.preview ? ' · test' : '')));
      const dl = el('button', 'btn ghost small', '⬇️ Photo');
      dl.type = 'button';
      dl.addEventListener('click', async () => {
        const blob = await window.Wardrobe.toPng(svg, 'Billu ka birthday look 💛', `${herName} · 21 Oct`, window.Wardrobe.get3DOutfit(look));
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'billu-ka-look.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
      wrap.appendChild(dl);
      box.appendChild(wrap);
    });
  }

  function renderCoupons(list) {
    const box = $('coupons');
    box.innerHTML = '';
    if (!list.length) { box.appendChild(el('p', 'empty', 'Abhi tak koi coupon claim nahi kiya.')); return; }
    list.forEach((e) => {
      const item = el('div', 'item');
      item.appendChild(el('strong', '', `${e.data.icon || '🎟️'} ${e.data.title}`));
      item.appendChild(el('div', 'time', fmt(when(e)) + (e.preview ? ' · test' : '')));
      box.appendChild(item);
    });
  }

  function renderTimeline(list, multiDevice) {
    const box = $('timeline');
    box.innerHTML = '';
    if (!list.length) { box.appendChild(el('li', 'empty', 'Abhi tak kuch nahi hua.')); return; }
    [...list].reverse().forEach((e) => {
      const li = el('li');
      li.appendChild(el('span', 'time', fmt(when(e))));
      const what = el('span', 'what', describe(e));
      if (e.preview) what.append(' ', badge('test', 'test'));
      if (multiDevice) what.append(' ', badge(`device ${e.device}`));
      li.appendChild(what);
      box.appendChild(li);
    });
  }

  // ------------------------------------------------------------------ actions
  async function clear(mode) {
    const res = await fetch(`/api/logs?clear=${mode}`, { method: 'DELETE', headers: key ? { 'x-admin-key': key } : {} });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setStatus(json.error || 'Clear failed', 'err'); return; }
    load();
  }
  $('btn-clear-tests').addEventListener('click', () => {
    if (confirm('Saari test (?preview) entries hata dein? Uski asli activity safe rahegi.')) clear('preview');
  });
  $('btn-clear-all').addEventListener('click', () => {
    if (confirm('Saari activity hamesha ke liye mit jaayegi — uski bhi. Pakka?') && confirm('Sach me? Ye wapas nahi aayegi.')) clear('all');
  });
  $('show-tests').addEventListener('change', (e) => { showTests = e.target.checked; render(); });
  $('btn-refresh').addEventListener('click', load);

  function setLive(on) {
    clearInterval(liveTimer);
    if (on) liveTimer = setInterval(() => { if (!document.hidden && !$('content').classList.contains('hidden')) load(); }, 10000);
  }
  $('live').addEventListener('change', (e) => setLive(e.target.checked));

  // The studio only exists on this computer, so only link to it here
  if (['localhost', '127.0.0.1'].includes(location.hostname)) $('studio-link').classList.remove('hidden');
  $('subtitle').textContent = `${herName} ne jo bhi kiya, yahan dikhega`;

  setLive(true);
  load();
})();

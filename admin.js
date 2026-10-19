/**
 * Birthday Studio — edits window.SURPRISE_CONFIG and saves it back to config.js
 * through admin_server.py. Without the server, Save downloads config.js instead.
 */
(function () {
  'use strict';

  const cfg = JSON.parse(JSON.stringify(window.SURPRISE_CONFIG));
  const $ = (id) => document.getElementById(id);
  let serverOnline = false;
  let dirty = false;

  // ------------------------------------------------------------------
  // What can be edited, grouped the way she experiences it.
  // scene: which ?scene= to open for "Preview".
  // ------------------------------------------------------------------
  const SCHEMA = [
    {
      id: 'basics', title: '💛 Basics', scene: 'hello',
      desc: 'Naam, unlock time, aur gaana.',
      fields: [
        { k: 'herName', label: 'Uska naam', type: 'text' },
        { k: 'nickname', label: 'Nickname', type: 'text', help: 'Jaise "Mishrayin". {nickname} likhne pe ye aata hai.' },
        { k: 'petName', label: 'Pet name', type: 'text', help: 'Jaise "Billu". Cake pe yahi likha aata hai.' },
        { k: 'fromName', label: 'Tumhara sign-off', type: 'text', help: 'Last screen pe "— ___" me dikhta hai.' },
        { k: 'age', label: 'Age (is birthday pe)', type: 'number' },
        { k: 'unlockAt', label: 'Kab khulega (India time)', type: 'ist', help: 'Isse pehle sirf countdown dikhega.' },
        { k: 'musicUrl', label: 'Background gaana (optional)', type: 'music', help: 'Khaali = built-in soft music-box. Apna gaana upload kar sakte ho (mp3/m4a).' }
      ]
    },
    {
      id: 'lock', title: '🔒 Countdown screen', scene: null,
      desc: 'Agar wo time se pehle khole to ye dikhega.',
      fields: [
        { k: 'lock.title', label: 'Heading', type: 'text' },
        { k: 'lock.subtitle', label: 'Neeche ki line', type: 'textarea' },
        { k: 'lock.teases', label: 'Chidhane wali lines (ek line = ek tease)', type: 'lines' }
      ]
    },
    {
      id: 'hello', title: '🤫 Midnight hello', scene: 'hello',
      fields: [
        { k: 'hello.whispers', label: 'Andhere me dheere dheere aane wali lines', type: 'lines' },
        { k: 'hello.lightButton', label: 'Light wala button', type: 'text' },
        { k: 'hello.soundHint', label: 'Button ke neeche awaaz ka hint', type: 'text' },
        { k: 'hello.subline', label: 'Naam ke neeche', type: 'text', help: '{nickname} aur {age} apne aap bhar jaate hain.' },
        { k: 'hello.nextButton', label: 'Aage ka button', type: 'text' }
      ]
    },
    {
      id: 'rule', title: '👊 "Log kya kahenge" board', scene: 'rule',
      fields: [
        { k: 'rule.heading', label: 'Heading', type: 'text' },
        { k: 'rule.board', label: 'Board pe likha', type: 'text' },
        { k: 'rule.instruction', label: 'Instruction', type: 'text' },
        { k: 'rule.hitLines', label: 'Har tap pe line (jitni lines, utne taps me tootega)', type: 'lines' },
        { k: 'rule.brokenTitle', label: 'Tootne ke baad heading', type: 'text' },
        { k: 'rule.brokenBody', label: 'Tootne ke baad message', type: 'textarea' },
        { k: 'rule.promiseButton', label: 'Button', type: 'text' }
      ]
    },
    {
      id: 'playground', title: '🎠 Playground', scene: 'playground',
      fields: [
        { k: 'playground.title', label: 'Heading', type: 'text' },
        { k: 'playground.subtitle', label: 'Subheading', type: 'textarea' },
        { k: 'playground.balloons', label: 'Balloon messages (order me aate hain; last wala sabse khaas)', type: 'lines' },
        { k: 'playground.tareefIntro', label: 'Tareef Machine intro', type: 'textarea' },
        { k: 'playground.compliments', label: 'Tareefein (random aati hain)', type: 'lines' },
        { k: 'playground.lanternIntro', label: 'Wish Lantern intro', type: 'textarea' },
        { k: 'playground.lanternSuggestions', label: 'Lantern ke liye ready wishes (wo chun sakti hai)', type: 'lines' },
        { k: 'playground.lanternReplies', label: 'Har lantern ke baad tumhara reply', type: 'lines' },
        { k: 'playground.lanternPlaceholder', label: 'Wish box placeholder', type: 'text' },
        { k: 'playground.lanternButton', label: 'Udaane ka button', type: 'text' },
        { k: 'playground.lanternDone', label: '3 lantern ke baad message', type: 'text' },
        { k: 'playground.wardrobeIntro', label: 'Wardrobe intro', type: 'text' },
        { k: 'playground.wardrobeStamp', label: 'Wardrobe stamp', type: 'text' },
        { k: 'playground.wardrobeCaption', label: 'Look photo pe caption', type: 'text' },
        { k: 'playground.wardrobeResult', label: 'Photo ke neeche message', type: 'textarea' }
      ]
    },
    {
      id: 'ride', title: '🏍️ Bike ride', scene: 'ride',
      desc: 'Har milestone pe bike rukti hai aur ek kahani dikhti hai. Last wala = pahad.',
      fields: [
        { k: 'ride.title', label: 'Heading', type: 'text' },
        { k: 'ride.subtitle', label: 'Subheading', type: 'textarea' },
        { k: 'ride.holdLabel', label: 'Hold button', type: 'text' },
        { k: 'ride.bikeImage', label: 'Bike pe tum dono ki artwork (optional)', type: 'text', help: 'Khaali = built-in silhouette. Gemini ya kisi aur se bani transparent PNG ka path, jaise assets/ride/couple-bike.png' },
        {
          k: 'ride.milestones', label: 'Milestones', type: 'list', itemName: 'Milestone',
          fields: [{ k: 'sign', label: 'Board pe', type: 'text' }, { k: 'text', label: 'Kahani', type: 'textarea' }],
          blank: { sign: '📍 Naya stop', text: '' }
        }
      ]
    },
    {
      id: 'court', title: '🧑‍⚖️ Adalat', scene: 'court',
      fields: [
        { k: 'court.title', label: 'Heading', type: 'text' },
        { k: 'court.caseTitle', label: 'Case ka naam', type: 'text' },
        { k: 'court.caseText', label: 'Aarop', type: 'textarea' },
        { k: 'court.question', label: 'Sawaal', type: 'text' },
        {
          k: 'court.answers', label: 'Jawaab options', type: 'list', itemName: 'Option',
          fields: [{ k: 'label', label: 'Button', type: 'text' }, { k: 'reply', label: 'Court ka reply', type: 'textarea' }],
          blank: { label: '', reply: '' }
        },
        {
          k: 'court.exhibits', label: 'Saboot', type: 'list', itemName: 'Saboot',
          fields: [
            { k: 'tag', label: 'Tag', type: 'text' },
            { k: 'icon', label: 'Emoji', type: 'text' },
            { k: 'title', label: 'Title', type: 'text' },
            { k: 'text', label: 'Saboot', type: 'textarea' }
          ],
          blank: { tag: 'Saboot', icon: '💛', title: '', text: '' }
        },
        { k: 'court.gavelButton', label: 'Hathoda button', type: 'text' },
        { k: 'court.verdictTitle', label: 'Faisla heading', type: 'text' },
        { k: 'court.verdictText', label: 'Faisla', type: 'textarea' }
      ]
    },
    {
      id: 'memories', title: '📸 Photos & yaadein', scene: 'memories',
      desc: 'Photo badlo button se upload karo — apne aap chhoti hoke save ho jaati hai.',
      fields: [
        { k: 'memories.title', label: 'Heading', type: 'text' },
        { k: 'memories.subtitle', label: 'Subheading', type: 'text' },
        {
          k: 'memories.items', label: 'Photos', type: 'list', itemName: 'Photo',
          fields: [
            { k: 'photo', label: 'Photo', type: 'photo' },
            { k: 'title', label: 'Title', type: 'text' },
            { k: 'date', label: 'Date / chhoti line', type: 'text' },
            { k: 'caption', label: 'Peeche likhi baat', type: 'textarea' }
          ],
          blank: { photo: 'assets/photos/memory-1.svg', title: '', date: '', caption: '' }
        }
      ]
    },
    {
      id: 'stars', title: '✨ Taaron wala dil', scene: 'stars',
      desc: 'Har taare pe ek word judta hai; saare milke ek line banate hain aur taare dil ki shape bana dete hain.',
      fields: [
        { k: 'stars.title', label: 'Heading', type: 'text' },
        { k: 'stars.subtitle', label: 'Subheading', type: 'textarea' },
        { k: 'stars.words', label: 'Words (ek line = ek taara; 10-16 best)', type: 'lines' },
        { k: 'stars.wrongTap', label: 'Galat taare pe', type: 'text' },
        { k: 'stars.doneTitle', label: 'Dil banne ke baad heading', type: 'text' },
        { k: 'stars.doneText', label: 'Dil banne ke baad message', type: 'textarea' }
      ]
    },
    {
      id: 'poem', title: '✍️ Poem', scene: 'poem',
      fields: [
        { k: 'poem.title', label: 'Heading', type: 'text' },
        { k: 'poem.subtitle', label: 'Subheading', type: 'text' },
        { k: 'poem.lines', label: 'Poem (ek line = ek line; har 4 line pe stanza break)', type: 'lines' },
        { k: 'poem.replyPrompt', label: 'Uski baari wali line', type: 'text' },
        { k: 'poem.replyPlaceholder', label: 'Placeholder', type: 'text' },
        { k: 'poem.replyButton', label: 'Likh diya button', type: 'text' },
        { k: 'poem.replySaved', label: 'Likhne ke baad tumhara reply', type: 'text' }
      ]
    },
    {
      id: 'cake', title: '🎂 Cake', scene: 'cake',
      fields: [
        { k: 'cake.title', label: 'Heading', type: 'text' },
        { k: 'cake.subtitle', label: 'Subheading', type: 'textarea' },
        { k: 'cake.micButton', label: 'Mic button', type: 'text' },
        { k: 'cake.wishText', label: 'Wish screen', type: 'text' },
        { k: 'cake.wishDone', label: 'Wish ke baad', type: 'textarea' }
      ]
    },
    {
      id: 'questions', title: '💬 Dil ki baatein', scene: 'questions',
      desc: 'Chitthi se pehle chat. Har jawaab pe tumhara reaction aata hai. "Bhaagne wala" option kabhi click nahi hota 😜',
      fields: [
        { k: 'questions.title', label: 'Heading', type: 'text' },
        { k: 'questions.subtitle', label: 'Subheading', type: 'text' },
        { k: 'questions.typingName', label: 'Chat me tumhara naam', type: 'text' },
        {
          k: 'questions.items', label: 'Sawaal', type: 'list', itemName: 'Sawaal',
          fields: [
            { k: 'q', label: 'Sawaal', type: 'textarea' },
            {
              k: 'options', label: 'Options', type: 'list', itemName: 'Option',
              fields: [
                { k: 'label', label: 'Uska jawaab (button)', type: 'text' },
                { k: 'reaction', label: 'Tumhara reaction', type: 'textarea' },
                { k: 'dodge', label: 'Bhaagne wala button (kabhi click nahi hoga)', type: 'bool' }
              ],
              blank: { label: '', reaction: '' }
            },
            { k: 'free', label: 'Khud likhne ka option bhi do', type: 'bool' },
            { k: 'freeReaction', label: 'Khud likhe jawaab pe reaction', type: 'textarea' }
          ],
          blank: { q: '', options: [], free: true, freeReaction: '' }
        },
        { k: 'questions.freeLabel', label: '"Khud likhti hoon" button', type: 'text' },
        { k: 'questions.dodgeTexts', label: 'Bhaagne wale button ke text', type: 'lines' },
        { k: 'questions.outro', label: 'Aakhri message', type: 'textarea' },
        { k: 'questions.letterButton', label: 'Chitthi button', type: 'text' }
      ]
    },
    {
      id: 'letter', title: '💌 Chitthi', scene: 'letter',
      fields: [
        { k: 'letter.title', label: 'Heading', type: 'text' },
        { k: 'letter.salutation', label: 'Shuruaat', type: 'text' },
        { k: 'letter.paragraphs', label: 'Chitthi (paragraphs ke beech ek khaali line chhodo)', type: 'paras', help: 'Shayari ke liye paragraph "~" se shuru karo; har misra nayi line pe.' },
        { k: 'letter.closing', label: 'Closing', type: 'text' },
        { k: 'letter.signature', label: 'Signature', type: 'text' }
      ]
    },
    {
      id: 'coupons', title: '🎟️ Coupons', scene: 'letter',
      fields: [
        { k: 'coupons.title', label: 'Heading', type: 'text' },
        { k: 'coupons.subtitle', label: 'Subheading', type: 'textarea' },
        {
          k: 'coupons.items', label: 'Coupons', type: 'list', itemName: 'Coupon',
          fields: [{ k: 'icon', label: 'Emoji', type: 'text' }, { k: 'title', label: 'Title', type: 'text' }, { k: 'text', label: 'Details', type: 'textarea' }],
          blank: { icon: '🎁', title: '', text: '' }
        }
      ]
    },
    {
      id: 'goodnight', title: '🌙 Goodnight', scene: 'goodnight',
      fields: [
        { k: 'goodnight.title', label: 'Heading', type: 'text' },
        { k: 'goodnight.text', label: 'Message', type: 'textarea' },
        { k: 'goodnight.button', label: 'Lights off button', type: 'text' },
        { k: 'goodnight.finalTitle', label: 'Aakhri heading', type: 'text' },
        { k: 'goodnight.finalText', label: 'Aakhri message', type: 'textarea' }
      ]
    }
  ];

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  function setPath(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, k) => (o[k] = o[k] || {}), obj);
    target[last] = value;
  }

  function el(tag, attrs = {}, children = []) {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'text') n.textContent = v;
      else if (k === 'class') n.className = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    [].concat(children).forEach((c) => c && n.appendChild(c));
    return n;
  }

  function setStatus(text, kind = '') {
    const s = $('status');
    s.textContent = text;
    s.className = 'status ' + kind;
  }

  function markDirty() {
    dirty = true;
    setStatus('Unsaved changes', 'dirty');
  }

  window.addEventListener('beforeunload', (e) => {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  // IST datetime <-> input value
  const istToInput = (s) => (s || '').slice(0, 16);
  const inputToIst = (v) => (v ? `${v}:00+05:30` : '');

  // Resize a photo in the browser so uploads stay small and load fast on her phone
  function fileToJpegBase64(file, maxSide = 1600, quality = 0.86) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', quality).split(',')[1]);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Ye photo browser me khul nahi rahi. JPG/PNG try karo (iPhone HEIC ho to pehle JPG me convert karo).')); };
      img.src = url;
    });
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1]);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }

  async function upload(kind, slot, filename, data) {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, slot, filename, data })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Upload failed');
    return json.path;
  }

  // ------------------------------------------------------------------
  // Field renderers. Each gets (value, onChange) and returns a node.
  // ------------------------------------------------------------------
  function renderField(f, value, onChange, ctx = {}) {
    const id = 'f-' + Math.random().toString(36).slice(2, 9);
    const wrap = el('div', { class: 'field' });
    wrap.appendChild(el('label', { for: id, text: f.label }));
    let input;

    switch (f.type) {
      case 'textarea':
        input = el('textarea', { id, rows: 3 });
        input.value = value || '';
        input.addEventListener('input', () => onChange(input.value));
        break;
      case 'number':
        input = el('input', { id, type: 'number' });
        input.value = value ?? '';
        input.addEventListener('input', () => onChange(Number(input.value)));
        break;
      case 'ist':
        input = el('input', { id, type: 'datetime-local' });
        input.value = istToInput(value);
        input.addEventListener('input', () => onChange(inputToIst(input.value)));
        break;
      case 'lines':
        input = el('textarea', { id, rows: Math.min(12, Math.max(3, (value || []).length + 1)) });
        input.value = (value || []).join('\n');
        input.addEventListener('input', () => onChange(input.value.split('\n').map((s) => s.trim()).filter(Boolean)));
        break;
      case 'paras':
        input = el('textarea', { id, rows: 14 });
        input.value = (value || []).join('\n\n');
        input.addEventListener('input', () => onChange(input.value.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)));
        break;
      case 'bool':
        input = el('input', { id, type: 'checkbox' });
        input.checked = !!value;
        input.addEventListener('change', () => onChange(input.checked));
        break;
      case 'photo':
        input = renderPhoto(id, value, onChange, ctx);
        break;
      case 'music':
        input = renderMusic(id, value, onChange);
        break;
      default:
        input = el('input', { id, type: 'text' });
        input.value = value ?? '';
        input.addEventListener('input', () => onChange(input.value));
    }
    wrap.appendChild(input);
    if (f.help) wrap.appendChild(el('span', { class: 'help', text: f.help }));
    return wrap;
  }

  function renderPhoto(id, value, onChange, ctx) {
    const img = el('img', { alt: 'Preview' });
    img.src = value ? `${value}?t=${Date.now()}` : '';
    const path = el('input', { id, type: 'text' });
    path.value = value || '';
    path.addEventListener('input', () => { onChange(path.value); img.src = path.value; });

    const file = el('input', { type: 'file', accept: 'image/*' });
    const label = el('label', { class: 'btn ghost small upload-label' }, [document.createTextNode('📷 Photo badlo'), file]);
    file.addEventListener('change', async () => {
      const f = file.files[0];
      if (!f) return;
      if (!serverOnline) {
        alert('Upload ke liye studio server chalana padega (python3 admin_server.py). Ya photo khud assets/photos/ me daal ke uska path likh do.');
        return;
      }
      try {
        setStatus('Photo upload ho rahi hai…');
        const data = await fileToJpegBase64(f);
        const current = /assets\/photos\/(memory-[a-z0-9-]+)\./.exec(path.value);
        const slot = current ? current[1] : `memory-${ctx.index + 1}`;
        const saved = await upload('photo', slot, `${slot}.jpg`, data);
        path.value = saved;
        onChange(saved);
        img.src = `${saved}?t=${Date.now()}`;
        setStatus('Photo upload ho gayi — ab Save dabao', 'dirty');
      } catch (e) {
        setStatus(e.message, 'err');
      }
      file.value = '';
    });

    return el('div', { class: 'photo-row' }, [img, el('div', { class: 'photo-actions' }, [label, path])]);
  }

  function renderMusic(id, value, onChange) {
    const path = el('input', { id, type: 'text', placeholder: 'Khaali = built-in music-box' });
    path.value = value || '';
    path.addEventListener('input', () => onChange(path.value.trim()));
    const file = el('input', { type: 'file', accept: 'audio/*' });
    const label = el('label', { class: 'btn ghost small upload-label' }, [document.createTextNode('🎵 Gaana upload karo'), file]);
    file.addEventListener('change', async () => {
      const f = file.files[0];
      if (!f) return;
      if (!serverOnline) { alert('Upload ke liye studio server chalana padega (python3 admin_server.py).'); return; }
      try {
        setStatus('Gaana upload ho raha hai…');
        const ext = (f.name.match(/\.[a-z0-9]+$/i) || ['.mp3'])[0].toLowerCase();
        const saved = await upload('music', 'song', `song${ext}`, await fileToBase64(f));
        path.value = saved;
        onChange(saved);
        setStatus('Gaana upload ho gaya — ab Save dabao', 'dirty');
      } catch (e) {
        setStatus(e.message, 'err');
      }
      file.value = '';
    });
    const clear = el('button', { type: 'button', class: 'btn ghost small', text: 'Built-in music use karo', onclick: () => { path.value = ''; onChange(''); } });
    return el('div', { class: 'photo-actions' }, [path, el('div', {}, [label, document.createTextNode(' '), clear])]);
  }

  // `arr` lets lists nest (e.g. options inside each question)
  function renderList(f, container, arr) {
    if (!arr) {
      arr = getPath(cfg, f.k) || [];
      setPath(cfg, f.k, arr);
    }
    const box = el('div', { class: 'field' });
    box.appendChild(el('label', { text: f.label }));
    const list = el('div', { class: 'list' });
    box.appendChild(list);

    function redraw() {
      list.innerHTML = '';
      arr.forEach((item, i) => {
        const head = el('div', { class: 'list-item-head' }, [
          el('strong', { text: `${f.itemName} ${i + 1}` }),
          el('div', { class: 'tools' }, [
            el('button', { type: 'button', class: 'btn ghost small', text: '↑', title: 'Upar', onclick: () => move(i, -1) }),
            el('button', { type: 'button', class: 'btn ghost small', text: '↓', title: 'Neeche', onclick: () => move(i, 1) }),
            el('button', { type: 'button', class: 'btn danger small', text: 'Hatao', onclick: () => remove(i) })
          ])
        ]);
        const itemEl = el('div', { class: 'list-item' }, [head]);
        f.fields.forEach((sub) => {
          if (sub.type === 'list') {
            item[sub.k] = item[sub.k] || [];
            renderList(sub, itemEl, item[sub.k]);
          } else {
            itemEl.appendChild(renderField(sub, item[sub.k], (v) => { item[sub.k] = v; markDirty(); }, { index: i }));
          }
        });
        list.appendChild(itemEl);
      });
      list.appendChild(el('button', {
        type: 'button', class: 'btn ghost small', text: `+ ${f.itemName} jodo`,
        onclick: () => { arr.push(JSON.parse(JSON.stringify(f.blank))); markDirty(); redraw(); }
      }));
    }
    function move(i, d) {
      const j = i + d;
      if (j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      markDirty(); redraw();
    }
    function remove(i) {
      if (!confirm(`${f.itemName} ${i + 1} hata dein?`)) return;
      arr.splice(i, 1);
      markDirty(); redraw();
    }
    redraw();
    container.appendChild(box);
  }

  // ------------------------------------------------------------------
  // Build the page
  // ------------------------------------------------------------------
  function build() {
    const nav = $('sidenav');
    const main = $('sections');
    SCHEMA.forEach((sec) => {
      nav.appendChild(el('a', { href: `#${sec.id}`, text: sec.title }));
      const head = el('div', { class: 'section-head' }, [el('h2', { text: sec.title })]);
      const previewHref = sec.scene ? `/?preview&scene=${sec.scene}` : '/';
      head.appendChild(el('a', { class: 'btn ghost small', href: previewHref, target: '_blank', rel: 'noopener', text: 'Preview ↗' }));
      const s = el('section', { class: 'section', id: sec.id }, [head]);
      if (sec.desc) s.appendChild(el('p', { class: 'section-desc', text: sec.desc }));
      sec.fields.forEach((f) => {
        if (f.type === 'list') renderList(f, s);
        else s.appendChild(renderField(f, getPath(cfg, f.k), (v) => { setPath(cfg, f.k, v); markDirty(); }));
      });
      main.appendChild(s);
    });
  }

  // ------------------------------------------------------------------
  // Save
  // ------------------------------------------------------------------
  function configText() {
    return '// 💛 Chetna\'s birthday — content. Edited with the Birthday Studio.\n\n'
      + 'window.SURPRISE_CONFIG = ' + JSON.stringify(cfg, null, 2) + ';\n';
  }

  async function save() {
    const btn = $('btn-save');
    btn.disabled = true;
    try {
      if (serverOnline) {
        setStatus('Saving…');
        const res = await fetch('/api/save-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: cfg })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Save failed');
        dirty = false;
        setStatus('Saved ✓ config.js update ho gaya', 'ok');
      } else {
        const blob = new Blob([configText()], { type: 'text/javascript' });
        const a = el('a', { href: URL.createObjectURL(blob), download: 'config.js' });
        document.body.appendChild(a);
        a.click();
        a.remove();
        dirty = false;
        setStatus('config.js download ho gaya — project folder me replace karo', 'ok');
      }
    } catch (e) {
      setStatus(e.message, 'err');
    } finally {
      btn.disabled = false;
    }
  }

  $('btn-save').addEventListener('click', save);
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save(); }
  });

  fetch('/api/ping', { cache: 'no-store' })
    .then((r) => { serverOnline = r.ok; })
    .catch(() => { serverOnline = false; })
    .finally(() => {
      $('offline-banner').classList.toggle('hidden', serverOnline);
      setStatus(serverOnline ? 'Studio ready' : 'Offline mode');
    });

  build();
})();

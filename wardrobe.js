/**
 * ==============================================================================
 * 👗 WARDROBE — Real 3D Pixar Stylized Character System for Chetna
 * ==============================================================================
 * - Authentic 3D Pixar Girl Character: Full-body 3D Pixar renders of Chetna,
 *   preserving her beautiful expressive almond eyes, radiant smile, and lush wavy dark hair.
 * - Dynamic Outfit Switching:
 *   - Dresses: Anarkali 🌸, Banarasi Saree 🥻, Lavender Lehenga ✨, Midnight Gown 👑, Daisy Sundress 🌼, Casual Chic 👟, Night suit 🧸.
 *   - Separate Tops: Lotus Crop top ✨, Peach Kurti 🌸, Off-shoulder blouse 👗, Pastel Shirt 👔, Denim jacket 🧥, Bear Hoodie 🧸, White Tee 👕.
 *   - Separate Bottoms: Slim Jeans 👖, Flared Palazzo 🌸, Pleated Midi Skirt 💃, Comfort Joggers 👟, Silk Churidar ✨.
 * - Dynamic Fabric Color Grading: Real-time 3D color grade tinting with feathered mask.
 * - Dynamic Fabric Patterns: Lucknowi Chikankari ✨, Polka dots ⚪, Romantic floral 🌸, Pinstripes, Gingham checks.
 * - Live Interactive Accessories: Royal Diamond Tiara 👑, Golden Shades 🕶️, Ruby Bindi 🔴, Golden Jhumka ✨, Jasmine Blossom 🌸 —
 *   anchored to her eyes in each render (FACE_ANCHORS), so they sit right on every outfit.
 * - Thematic Backdrops: Mela 🎡, Fountain ⛲, Mountain view ⛰️, Beach 🏖️, Cafe ☕, Studio ✨.
 * - HD Polaroid photo export with "Approved by Tumhara ✅" seal.
 * ==============================================================================
 */
window.Wardrobe = (function () {
  'use strict';

  const OPTIONS = {
    dresses: [
      { id: 'anarkali', label: 'Anarkali 🌸' },
      { id: 'saree', label: 'Banarasi Saree 🥻' },
      { id: 'lehenga', label: 'Lavender Lehenga ✨' },
      { id: 'gown', label: 'Midnight Gown 👑' },
      { id: 'sundress', label: 'Daisy Sundress 🌼' },
      { id: 'casual', label: 'Denim Kurti Chic 👟' },
      { id: 'nightsuit', label: 'Mint Night Suit 🧸' }
    ],
    tops: [
      { id: 'crop', label: 'Lotus Crop Top ✨' },
      { id: 'kurti', label: 'Peach Kurti 🌸' },
      { id: 'offshoulder', label: 'Off-shoulder 👗' },
      { id: 'shirt', label: 'Pastel Shirt 👔' },
      { id: 'jacket', label: 'Denim Jacket 🧥' },
      { id: 'hoodie', label: 'Bear Hoodie 🧸' },
      { id: 'tee', label: 'Classic White Tee 👕' }
    ],
    bottoms: [
      { id: 'jeans', label: 'Slim Jeans 👖' },
      { id: 'palazzo', label: 'Flared Palazzo 🌸' },
      { id: 'skirt', label: 'Pleated Midi Skirt 💃' },
      { id: 'joggers', label: 'Comfort Joggers 👟' },
      { id: 'churidar', label: 'Silk Churidar ✨' }
    ],
    patterns: [
      { id: 'plain', label: 'Plain (Original 🌸)' },
      { id: 'chikan', label: 'Chikankari ✨' },
      { id: 'polka', label: 'Polka Dots ⚪' },
      { id: 'floral', label: 'Floral 🌸' },
      { id: 'stripes', label: 'Stripes' },
      { id: 'checks', label: 'Checks' }
    ],
    hair: [
      { id: 'open', label: 'Khule baal 💁‍♀️' },
      { id: 'ponytail', label: 'Ponytail' },
      { id: 'bun', label: 'Juda' },
      { id: 'braid', label: 'Choti' },
      { id: 'bob', label: 'Short' }
    ],
    hairColors: ['#120e10', '#2b1b16', '#4a2d1e', '#643123'],
    shoes: [
      { id: 'juttis', label: 'Golden Juttis ✨' },
      { id: 'heels', label: 'Pink Heels 👠' },
      { id: 'sneakers', label: 'White Sneakers 👟' },
      { id: 'flats', label: 'Comfort Flats' }
    ],
    extras: [
      { id: 'tiara', label: 'Tiara 👑' },
      { id: 'shades', label: 'Shades 🕶️' },
      { id: 'jhumka', label: 'Golden Jhumka ✨' },
      { id: 'bindi', label: 'Ruby Bindi 🔴' },
      { id: 'flower', label: 'Phool 🌸' }
    ],
    colors: [
      '#e9a48c', '#f3c4b0', '#e8507f', '#ff9fbf', '#c81d3a', '#7a1f2b', '#f27a3a', '#ffcf5a',
      '#8a9a5b', '#7fd6c2', '#3fa7a0', '#9b8cff', '#5b3fa0', '#3b5fa8', '#1f2a44', '#f5efe6', '#2b2b2b'
    ],
    scenes: [
      { id: 'studio', label: 'Fairy lights ✨' },
      { id: 'mela', label: 'Mela 🎡' },
      { id: 'fountain', label: 'Fountain ⛲' },
      { id: 'pahad', label: 'Mountain view ⛰️' },
      { id: 'beach', label: 'Beach 🏖️' },
      { id: 'cafe', label: 'Cafe ☕' }
    ]
  };

  // ---------------------------------------------------------------- Outfit images
  // Every outfit is one full-body render (same pose and framing), so a top and a
  // bottom can only be shown together if that exact pairing has its own image.
  // To add a combination: save it as assets/wardrobe/look-<top>-<bottom>.jpg
  // (ids from OPTIONS.tops / OPTIONS.bottoms) and add one line here. The Tops and
  // Bottoms tabs only offer what exists, so picking a bottom never changes the top.
  const DRESS_IMAGES = {
    anarkali: 'assets/wardrobe/dress-anarkali.jpg',
    saree: 'assets/wardrobe/dress-saree.jpg',
    lehenga: 'assets/wardrobe/dress-lehenga.jpg',
    gown: 'assets/wardrobe/dress-gown.jpg',
    sundress: 'assets/wardrobe/dress-sundress.jpg',
    casual: 'assets/wardrobe/dress-casual.jpg',
    nightsuit: 'assets/wardrobe/dress-nightsuit.jpg'
  };
  const LOOKS = [
    { top: 'crop', bottom: 'jeans', file: 'assets/wardrobe/look-crop-jeans.jpg' },
    { top: 'kurti', bottom: 'palazzo', file: 'assets/wardrobe/look-kurti-palazzo.jpg' },
    { top: 'offshoulder', bottom: 'skirt', file: 'assets/wardrobe/look-offshoulder-skirt.jpg' },
    { top: 'shirt', bottom: 'jeans', file: 'assets/wardrobe/look-shirt-jeans.jpg' }
  ];

  // Show curated signature dresses, live face-anchored accessories, and romantic scenes
  const CONTROLS = ['dresses', 'extras', 'scene'];

  const findLook = (top, bottom) => LOOKS.find((l) => l.top === top && l.bottom === bottom);
  const hasTop = (top) => LOOKS.some((l) => l.top === top);
  const hasBottom = (bottom) => LOOKS.some((l) => l.bottom === bottom);
  const bottomsFor = (top) => LOOKS.filter((l) => l.top === top).map((l) => l.bottom);

  // Make a state point at a real image: keep the chosen top, and only move the
  // bottom if that pairing doesn't exist yet.
  function normalizeSeparates(st) {
    if (!hasTop(st.top)) st.top = LOOKS[0].top;
    if (!findLook(st.top, st.bottom)) st.bottom = bottomsFor(st.top)[0];
    return st;
  }

  function get3DOutfit(st) {
    if (st.dress && DRESS_IMAGES[st.dress]) return DRESS_IMAGES[st.dress];
    const n = normalizeSeparates({ ...st });
    const look = findLook(n.top, n.bottom);
    return look ? look.file : DRESS_IMAGES.anarkali;
  }

  // ---------------------------------------------------------------- SVG Definitions (Masks, Gradients & Filters)
  function renderDefs(st, prefix) {
    const c2 = st.second || '#ffd700';
    return `
      <defs>
        <filter id="${prefix}soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="12" result="blur"/>
        </filter>
        <filter id="${prefix}dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#000" flood-opacity=".42"/>
        </filter>
        <filter id="${prefix}goldGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="glow"/>
          <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="${prefix}sparkleGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="sglow"/>
          <feMerge><feMergeNode in="sglow"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        <!-- Metallic & Specular Gradients -->
        <linearGradient id="${prefix}goldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fff4cc"/>
          <stop offset="35%" stop-color="#ffd700"/>
          <stop offset="70%" stop-color="#d4af37"/>
          <stop offset="100%" stop-color="#aa820a"/>
        </linearGradient>
        <linearGradient id="${prefix}lensGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1c1926" stop-opacity="0.95"/>
          <stop offset="65%" stop-color="#2a2033" stop-opacity="0.92"/>
          <stop offset="100%" stop-color="#442a4f" stop-opacity="0.86"/>
        </linearGradient>

        <!-- Soft Feathered Mask for Garment Tinting & Patterns (Prevents rectangular box artifacts) -->
        <mask id="${prefix}garmentMask">
          <radialGradient id="${prefix}gMaskGrad" cx="50%" cy="48%" r="50%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
            <stop offset="60%" stop-color="#ffffff" stop-opacity="0.9"/>
            <stop offset="85%" stop-color="#ffffff" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
          </radialGradient>
          <ellipse cx="225" cy="390" rx="130" ry="175" fill="url(#${prefix}gMaskGrad)"/>
        </mask>

        <!-- Cinematic Fabric Light Sheen Gradient -->
        <linearGradient id="${prefix}sheenGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="45%" stop-color="#ffffff" stop-opacity="0.35"/>
          <stop offset="50%" stop-color="#ffffff" stop-opacity="0.65"/>
          <stop offset="55%" stop-color="#ffffff" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>

        <!-- Dynamic Fabric Patterns -->
        <!-- 1. Chikankari Lace Pattern ✨ -->
        <pattern id="${prefix}pat-chikan" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M15,0 L30,15 L15,30 L0,15 Z" fill="none" stroke="${c2}" stroke-width="0.9" opacity="0.6"/>
          <circle cx="15" cy="15" r="3.2" fill="${c2}" opacity="0.75"/>
          <circle cx="15" cy="15" r="1.5" fill="#ffffff" opacity="0.95"/>
          <circle cx="15" cy="8" r="1.2" fill="#ffffff" opacity="0.85"/>
          <circle cx="15" cy="22" r="1.2" fill="#ffffff" opacity="0.85"/>
          <circle cx="8" cy="15" r="1.2" fill="#ffffff" opacity="0.85"/>
          <circle cx="22" cy="15" r="1.2" fill="#ffffff" opacity="0.85"/>
          <circle cx="0" cy="0" r="1.8" fill="${c2}" opacity="0.55"/>
          <circle cx="30" cy="0" r="1.8" fill="${c2}" opacity="0.55"/>
          <circle cx="0" cy="30" r="1.8" fill="${c2}" opacity="0.55"/>
          <circle cx="30" cy="30" r="1.8" fill="${c2}" opacity="0.55"/>
        </pattern>

        <!-- 2. Polka Dots Pattern ⚪ -->
        <pattern id="${prefix}pat-polka" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="3.8" fill="${c2}" opacity="0.85"/>
          <circle cx="12" cy="12" r="1.4" fill="#ffffff" opacity="0.9"/>
          <circle cx="0" cy="0" r="3.8" fill="${c2}" opacity="0.85"/>
          <circle cx="24" cy="0" r="3.8" fill="${c2}" opacity="0.85"/>
          <circle cx="0" cy="24" r="3.8" fill="${c2}" opacity="0.85"/>
          <circle cx="24" cy="24" r="3.8" fill="${c2}" opacity="0.85"/>
        </pattern>

        <!-- 3. Romantic Floral Pattern 🌸 -->
        <pattern id="${prefix}pat-floral" width="36" height="36" patternUnits="userSpaceOnUse">
          <g transform="translate(18,18)">
            <circle cx="0" cy="-4" r="3.2" fill="#ffb7b2" opacity="0.85"/>
            <circle cx="4" cy="0" r="3.2" fill="#ffb7b2" opacity="0.85"/>
            <circle cx="0" cy="4" r="3.2" fill="#ffb7b2" opacity="0.85"/>
            <circle cx="-4" cy="0" r="3.2" fill="#ffb7b2" opacity="0.85"/>
            <circle cx="0" cy="0" r="2.2" fill="${c2}"/>
            <path d="M4,4 Q8,3 9,7 Q5,8 4,4" fill="#a8d5ba" opacity="0.75"/>
          </g>
          <circle cx="0" cy="0" r="2.2" fill="#ffd1dc" opacity="0.85"/>
          <circle cx="36" cy="0" r="2.2" fill="#ffd1dc" opacity="0.85"/>
          <circle cx="0" cy="36" r="2.2" fill="#ffd1dc" opacity="0.85"/>
          <circle cx="36" cy="36" r="2.2" fill="#ffd1dc" opacity="0.85"/>
        </pattern>

        <!-- 4. Pinstripes Pattern -->
        <pattern id="${prefix}pat-stripes" width="14" height="14" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="14" stroke="${c2}" stroke-width="2.6" opacity="0.85"/>
          <line x1="7" y1="0" x2="7" y2="14" stroke="#ffffff" stroke-width="1.1" opacity="0.4"/>
        </pattern>

        <!-- 5. Gingham Checks Pattern -->
        <pattern id="${prefix}pat-checks" width="22" height="22" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="11" height="11" fill="${c2}" opacity="0.32"/>
          <rect x="11" y="11" width="11" height="11" fill="${c2}" opacity="0.32"/>
          <line x1="0" y1="11" x2="22" y2="11" stroke="${c2}" stroke-width="1.2" opacity="0.5"/>
          <line x1="11" y1="0" x2="11" y2="22" stroke="${c2}" stroke-width="1.2" opacity="0.5"/>
        </pattern>

        <!-- Rounded clip for the 3D character -->
        <clipPath id="${prefix}charClip">
          <rect x="0" y="0" width="450" height="600" rx="20"/>
        </clipPath>
      </defs>
    `;
  }

  // ---------------------------------------------------------------- Thematic Atmospheric Overlays
  function renderSceneAtmosphere(sceneId, prefix) {
    switch (sceneId) {
      case 'mela':
        return `
          <g class="scene-atmo-mela" style="pointer-events: none;">
            <circle cx="60" cy="90" r="50" fill="#ff7eb3" opacity=".18" filter="url(#${prefix}soft)"/>
            <circle cx="380" cy="130" r="60" fill="#ffd166" opacity=".22" filter="url(#${prefix}soft)"/>
            <circle cx="80" cy="78" r="4.5" fill="#ffd700" filter="url(#${prefix}sparkleGlow)"/>
            <circle cx="160" cy="85" r="4" fill="#ff6b8b" filter="url(#${prefix}sparkleGlow)"/>
            <circle cx="280" cy="68" r="4.5" fill="#06d6a0" filter="url(#${prefix}sparkleGlow)"/>
            <circle cx="360" cy="74" r="4" fill="#ffd166" filter="url(#${prefix}sparkleGlow)"/>
          </g>
        `;
      case 'fountain':
        return `
          <g class="scene-atmo-fountain" style="pointer-events: none;">
            <rect width="450" height="600" fill="#00e5ff" opacity=".08" style="mix-blend-mode: color;"/>
            <ellipse cx="225" cy="520" rx="150" ry="30" fill="#18ffff" opacity=".18" filter="url(#${prefix}soft)"/>
          </g>
        `;
      case 'pahad':
        return `
          <g class="scene-atmo-pahad" style="pointer-events: none;">
            <rect width="450" height="600" fill="#ffab40" opacity=".09" style="mix-blend-mode: overlay;"/>
            <circle cx="370" cy="90" r="40" fill="#fff9d2" opacity=".25" filter="url(#${prefix}goldGlow)"/>
          </g>
        `;
      case 'beach':
        return `
          <g class="scene-atmo-beach" style="pointer-events: none;">
            <rect width="450" height="600" fill="#ff6d00" opacity=".12" style="mix-blend-mode: soft-light;"/>
            <circle cx="225" cy="180" r="80" fill="#ffab00" opacity=".2" filter="url(#${prefix}soft)"/>
          </g>
        `;
      case 'cafe':
        return `
          <g class="scene-atmo-cafe" style="pointer-events: none;">
            <rect width="450" height="600" fill="#795548" opacity=".12" style="mix-blend-mode: soft-light;"/>
            <circle cx="90" cy="100" r="7" fill="#ffd166" opacity=".6" filter="url(#${prefix}sparkleGlow)"/>
            <circle cx="190" cy="85" r="8" fill="#ffd166" opacity=".65" filter="url(#${prefix}sparkleGlow)"/>
            <circle cx="290" cy="100" r="7" fill="#ffd166" opacity=".6" filter="url(#${prefix}sparkleGlow)"/>
          </g>
        `;
      default: // studio
        return `
          <g class="scene-atmo-studio" style="pointer-events: none;">
            <ellipse cx="225" cy="200" rx="140" ry="180" fill="#e0aaff" opacity=".08" filter="url(#${prefix}soft)"/>
          </g>
        `;
    }
  }

  // ---------------------------------------------------------------- Interactive Accessories
  // Accessories are drawn once against the standard render (eyes measured at
  // (208.2, 81.4) and (239.9, 80.9) in this 450×600 frame) and then moved,
  // rotated and scaled onto each image's own eye positions — so shades sit on
  // her eyes and the bindi on her forehead in every outfit.
  // Renders with a different framing get their own entry in FACE_ANCHORS.
  const STD_EYES = { l: [208.2, 81.4], r: [239.9, 80.9] };
  const FACE_ANCHORS = {
    'assets/wardrobe/dress-nightsuit.jpg': { l: [208.7, 91.5], r: [242.0, 83.6] }
  };

  function faceTransform(file) {
    const a = FACE_ANCHORS[file] || STD_EYES;
    const mid0 = [(STD_EYES.l[0] + STD_EYES.r[0]) / 2, (STD_EYES.l[1] + STD_EYES.r[1]) / 2];
    const mid = [(a.l[0] + a.r[0]) / 2, (a.l[1] + a.r[1]) / 2];
    const d0 = Math.hypot(STD_EYES.r[0] - STD_EYES.l[0], STD_EYES.r[1] - STD_EYES.l[1]);
    const d = Math.hypot(a.r[0] - a.l[0], a.r[1] - a.l[1]);
    const ang0 = Math.atan2(STD_EYES.r[1] - STD_EYES.l[1], STD_EYES.r[0] - STD_EYES.l[0]);
    const ang = Math.atan2(a.r[1] - a.l[1], a.r[0] - a.l[0]);
    const deg = ((ang - ang0) * 180) / Math.PI;
    return `translate(${mid[0].toFixed(2)} ${mid[1].toFixed(2)}) rotate(${deg.toFixed(2)}) scale(${(d / d0).toFixed(4)}) translate(${(-mid0[0]).toFixed(2)} ${(-mid0[1]).toFixed(2)})`;
  }

  function goldJhumka(x, y, prefix) {
    let beads = '';
    for (let i = -4; i <= 4; i += 2) beads += `<circle cx="${x + i}" cy="${y + 15.4}" r=".75" fill="#fff6d6"/>`;
    return `<g filter="url(#${prefix}goldGlow)">
        <circle cx="${x}" cy="${y}" r="2.1" fill="url(#${prefix}goldGrad)"/>
        <path d="M${x} ${y + 2} L${x} ${y + 4}" stroke="#b8860b" stroke-width=".6"/>
        <path d="M${x - 5} ${y + 13} Q${x} ${y + 3.6} ${x + 5} ${y + 13} L${x + 5.6} ${y + 14.6} L${x - 5.6} ${y + 14.6} Z" fill="url(#${prefix}goldGrad)"/>
        <path d="M${x - 3.6} ${y + 11} Q${x} ${y + 7} ${x + 3.6} ${y + 11}" fill="none" stroke="#b8860b" stroke-width=".45" stroke-dasharray=".8 1.1"/>
        ${beads}
      </g>`;
  }

  function renderAccessories(extras, prefix, file) {
    const ext = extras instanceof Set ? extras : new Set(extras || []);
    let out = '';

    if (ext.has('tiara')) {
      out += `
        <g class="overlay-tiara" filter="url(#${prefix}dropShadow)">
          <path d="M199 57 Q224 45 249 57" fill="none" stroke="url(#${prefix}goldGrad)" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M201 56 Q224 46.4 247 56" fill="none" stroke="#fff" stroke-width=".6" opacity=".6"/>
          <path d="M203 55 Q210 46 215 51.5 Q224 36 233 51.5 Q238 46 245 55" fill="none" stroke="url(#${prefix}goldGrad)" stroke-width="1.5"/>
          <polygon points="224,35.5 227,43 224,50 221,43" fill="#ffffff" filter="url(#${prefix}sparkleGlow)"/>
          <polygon points="214.5,45 216.6,50 214.5,55 212.4,50" fill="#ffffff" opacity=".9"/>
          <polygon points="233.5,45 235.6,50 233.5,55 231.4,50" fill="#ffffff" opacity=".9"/>
          <circle cx="206" cy="53.6" r="1.3" fill="#ff7aa8"/><circle cx="242" cy="53.6" r="1.3" fill="#ff7aa8"/>
          <path d="M224 31.5 L224 39.5 M220 35.5 L228 35.5" stroke="#fff" stroke-width=".9" opacity=".95"/>
        </g>`;
    }

    if (ext.has('flower')) {
      out += `
        <g class="overlay-flower" transform="translate(256 63)" filter="url(#${prefix}dropShadow)">
          <path d="M0,0 Q-6,-5 -4.6,-9.6 Q-.8,-8.6 0,0" fill="#ffcdd2"/>
          <path d="M0,0 Q-9.6,-1.6 -10.4,4 Q-5.6,4.8 0,0" fill="#f8bbd0"/>
          <path d="M0,0 Q-6.4,8 -2.4,10.4 Q.8,6.4 0,0" fill="#ffcdd2"/>
          <path d="M0,0 Q4.8,7.2 8,4.8 Q5.6,0 0,0" fill="#f8bbd0"/>
          <path d="M0,0 Q6.4,-5.6 3.2,-9.6 Q-.8,-6.4 0,0" fill="#ffcdd2"/>
          <circle cx="0" cy="0" r="2.4" fill="#ffe082"/><circle cx="0" cy="0" r="1.1" fill="#ffd54f"/>
        </g>`;
    }

    if (ext.has('bindi')) {
      out += `
        <g class="overlay-bindi" filter="url(#${prefix}sparkleGlow)">
          <circle cx="221.3" cy="71.8" r="2.3" fill="#880e4f"/>
          <circle cx="221.3" cy="71.8" r="1.7" fill="#c2185b"/>
          <circle cx="221.3" cy="71.8" r=".85" fill="#ff4081"/>
          <circle cx="220.8" cy="71.2" r=".4" fill="#ffffff"/>
        </g>`;
    }

    if (ext.has('jhumka')) {
      out += `<g class="overlay-jhumka">${goldJhumka(253.6, 99.6, prefix)}${goldJhumka(197.2, 102.6, prefix)}</g>`;
    }

    if (ext.has('shades')) {
      out += `
        <g class="overlay-shades" filter="url(#${prefix}dropShadow)">
          <path d="M196.6 77.2 L191.4 76.2 M251.5 76.6 L256.6 75.6" stroke="url(#${prefix}goldGrad)" stroke-width="1.3" stroke-linecap="round"/>
          <rect x="196.7" y="74.1" width="23" height="15" rx="5.5" fill="url(#${prefix}lensGrad)" stroke="url(#${prefix}goldGrad)" stroke-width="1.1"/>
          <rect x="228.4" y="73.6" width="23" height="15" rx="5.5" fill="url(#${prefix}lensGrad)" stroke="url(#${prefix}goldGrad)" stroke-width="1.1"/>
          <path d="M219.7 78.4 Q224 75.9 228.4 77.9" fill="none" stroke="url(#${prefix}goldGrad)" stroke-width="1.4" stroke-linecap="round"/>
          <path d="M199.5 76.4 L208.5 76.4 L202 87 L199.5 87 Z" fill="#fff" opacity=".22"/>
          <path d="M231.2 75.9 L240.2 75.9 L233.7 86.5 L231.2 86.5 Z" fill="#fff" opacity=".22"/>
        </g>`;
    }

    return out ? `<g transform="${faceTransform(file)}">${out}</g>` : '';
  }

  // ---------------------------------------------------------------- Places (Jagah)
  // The renders come with their own fairy-light background baked in, so each dress
  // also has a subject mask (assets/wardrobe/mask/, made with macOS "lift subject").
  // For every place except Studio she is cut out and stands in front of a softly
  // defocused backdrop, like a portrait-mode photo. Studio keeps the original render.
  const maskFor = (file) => (/\/dress-[a-z]+\.jpg$/.test(file) ? file.replace('/wardrobe/', '/wardrobe/mask/').replace(/\.jpg$/, '.png') : null);

  const bokeh = (spots) => spots.map(([x, y, r, c, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o}"/>`).join('');

  function sceneBackdrop(id, prefix) {
    const P = prefix;
    let art = '';
    switch (id) {
      case 'mela': {
        const wheel = Array.from({ length: 16 }, (_, k) => {
          const a = (k / 16) * Math.PI * 2;
          const x = 110 + Math.cos(a) * 140, y = 220 + Math.sin(a) * 140;
          return `<line x1="110" y1="220" x2="${x.toFixed(0)}" y2="${y.toFixed(0)}" stroke="#ffd27a" stroke-width="2" opacity=".35"/><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="9" fill="${['#ff8fb1', '#ffd27a', '#7fd6c2', '#b9a6ff'][k % 4]}"/>`;
        }).join('');
        art = `<rect width="450" height="600" fill="url(#${P}bgMela)"/>
          <g opacity=".9">${wheel}<circle cx="110" cy="220" r="140" fill="none" stroke="#ffd27a" stroke-width="4" opacity=".5"/></g>
          <path d="M0 70 Q 225 150 450 60" fill="none" stroke="#3a2a4a" stroke-width="2"/>
          ${bokeh(Array.from({ length: 12 }, (_, k) => [20 + k * 38, 70 + Math.sin(k / 11 * Math.PI) * 42 + 8, 7, ['#ffd27a', '#ff8fb1', '#fff1c1'][k % 3], 0.95]))}
          <path d="M250 470 L310 400 L370 470 Z M330 470 L400 395 L470 470 Z" fill="#c8325e" opacity=".75"/>
          <path d="M262 470 L310 412 L358 470 Z" fill="#ffe3c0" opacity=".5"/>
          <rect y="455" width="450" height="145" fill="url(#${P}bgGround)"/>
          ${bokeh([[380, 150, 26, '#ff8fb1', 0.35], [420, 260, 18, '#ffd27a', 0.4], [300, 120, 14, '#7fd6c2', 0.35], [40, 430, 22, '#ffd27a', 0.3], [410, 420, 30, '#ff8fb1', 0.25]])}`;
        break;
      }
      case 'fountain':
        art = `<rect width="450" height="600" fill="url(#${P}bgDusk)"/>
          <path d="M0 400 L0 250 L40 250 L40 210 L70 190 L100 210 L100 260 L150 260 L150 300 L300 300 L300 240 L330 220 L360 240 L360 200 L400 170 L440 200 L450 200 L450 400 Z" fill="#3b3a5e" opacity=".85"/>
          ${bokeh([[60, 270, 4, '#ffd98a', 0.9], [85, 240, 4, '#ffd98a', 0.9], [125, 285, 4, '#ffd98a', 0.8], [320, 260, 4, '#ffd98a', 0.9], [345, 290, 4, '#ffd98a', 0.8], [410, 230, 4, '#ffd98a', 0.9], [420, 280, 4, '#ffd98a', 0.85]])}
          <rect x="52" y="250" width="5" height="200" fill="#2a2840"/><circle cx="54" cy="248" r="22" fill="#ffd98a" opacity=".55"/><circle cx="54" cy="248" r="8" fill="#fff4d0"/>
          <rect x="400" y="235" width="5" height="215" fill="#2a2840"/><circle cx="402" cy="233" r="22" fill="#ffd98a" opacity=".55"/><circle cx="402" cy="233" r="8" fill="#fff4d0"/>
          <rect y="430" width="450" height="170" fill="url(#${P}bgPlaza)"/>
          <ellipse cx="330" cy="440" rx="110" ry="22" fill="#5d6a8e"/><ellipse cx="330" cy="436" rx="100" ry="16" fill="#9fc4e8" opacity=".8"/>
          <path d="M330 436 C 300 360 260 360 240 430 M330 436 C 360 360 400 360 420 430 M330 436 L330 330" stroke="#eaf6ff" stroke-width="6" fill="none" opacity=".85" stroke-linecap="round"/>
          <circle cx="330" cy="330" r="30" fill="#eaf6ff" opacity=".35"/>`;
        break;
      case 'pahad':
        art = `<rect width="450" height="600" fill="url(#${P}bgDawn)"/>
          <circle cx="335" cy="250" r="70" fill="#fff1c9" opacity=".55"/><circle cx="335" cy="250" r="30" fill="#fff8e4"/>
          <path d="M0 330 L60 240 L120 290 L190 200 L260 280 L330 210 L400 270 L450 230 L450 400 L0 400 Z" fill="#9aa9cf" opacity=".9"/>
          <path d="M0 380 L80 290 L150 340 L230 270 L300 350 L380 300 L450 340 L450 450 L0 450 Z" fill="#6f84aa"/>
          <path d="M0 440 L90 370 L170 420 L260 360 L350 420 L450 380 L450 500 L0 500 Z" fill="#46637a"/>
          ${[[20, 470, 1], [55, 480, 0.8], [395, 470, 1], [430, 485, 0.75]].map(([x, y, s]) => `<path d="M${x} ${y} l${-18 * s} ${-10 * s} l${10 * s} 0 l${-14 * s} ${-26 * s} l${9 * s} 0 l${-10 * s} ${-28 * s} l${-10 * s} ${28 * s} l${9 * s} 0 l${-14 * s} ${26 * s} l${10 * s} 0 l${-18 * s} ${10 * s} Z" fill="#2c4a3e" transform="translate(${18 * s} 0)"/>`).join('')}
          <rect y="470" width="450" height="130" fill="url(#${P}bgMeadow)"/>`;
        break;
      case 'beach':
        art = `<rect width="450" height="600" fill="url(#${P}bgSunset)"/>
          <circle cx="300" cy="352" r="90" fill="#ffd9a0" opacity=".45"/><circle cx="300" cy="352" r="38" fill="#fff1c9"/>
          <rect y="360" width="450" height="110" fill="url(#${P}bgSea)"/>
          ${[0, 1, 2, 3, 4, 5].map((k) => `<rect x="${280 - k * 3}" y="${370 + k * 15}" width="${40 + k * 6}" height="4" rx="2" fill="#ffe6b8" opacity="${0.8 - k * 0.1}"/>`).join('')}
          <path d="M0 455 Q 110 445 225 458 T 450 452 L450 470 L0 470 Z" fill="#fff" opacity=".35"/>
          <rect y="465" width="450" height="135" fill="url(#${P}bgSand)"/>
          <path d="M28 470 C 30 400 40 330 60 280" stroke="#3a2a35" stroke-width="7" fill="none"/>
          <path d="M60 280 C 20 270 0 290 -10 310 M60 280 C 90 260 120 270 135 295 M60 280 C 40 250 10 245 -5 255 M60 280 C 80 250 110 240 130 250" stroke="#3a2a35" stroke-width="9" fill="none" stroke-linecap="round"/>`;
        break;
      case 'cafe':
        art = `<rect width="450" height="600" fill="url(#${P}bgCafe)"/>
          <rect x="40" y="70" width="370" height="300" rx="8" fill="#22314f"/>
          ${bokeh([[90, 150, 14, '#ffd27a', 0.6], [150, 230, 10, '#7fd6c2', 0.5], [230, 130, 16, '#ff8fb1', 0.45], [300, 210, 12, '#ffd27a', 0.6], [360, 140, 18, '#fff1c1', 0.4], [120, 320, 12, '#ffd27a', 0.45], [330, 310, 14, '#b9a6ff', 0.45], [260, 280, 9, '#fff1c1', 0.6]])}
          <path d="M40 220 H410 M225 70 V370" stroke="#3b2418" stroke-width="10"/>
          <rect x="40" y="70" width="370" height="300" rx="8" fill="none" stroke="#3b2418" stroke-width="14"/>
          ${[70, 150, 300, 380].map((x, k) => `<line x1="${x}" y1="0" x2="${x}" y2="${60 + (k % 2) * 30}" stroke="#2a1a14" stroke-width="2"/><circle cx="${x}" cy="${72 + (k % 2) * 30}" r="26" fill="#ffd27a" opacity=".4"/><circle cx="${x}" cy="${72 + (k % 2) * 30}" r="10" fill="#fff1c1"/>`).join('')}
          <path d="M0 330 C 30 300 20 260 45 240 C 50 280 70 300 60 340 Z M450 320 C 420 290 430 250 405 230 C 400 270 380 300 392 335 Z" fill="#2f5a3a"/>
          <rect y="460" width="450" height="140" fill="url(#${P}bgWood)"/>`;
        break;
      default:
        return '';
    }
    return `<g class="doll-backdrop">
      <defs>
        <filter id="${P}bgBlur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="5"/></filter>
        <linearGradient id="${P}bgMela" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15123a"/><stop offset=".6" stop-color="#3a2370"/><stop offset="1" stop-color="#7a3d6e"/></linearGradient>
        <linearGradient id="${P}bgGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2a3e"/><stop offset="1" stop-color="#1f1426"/></linearGradient>
        <linearGradient id="${P}bgDusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26346a"/><stop offset=".55" stop-color="#7a7fb8"/><stop offset="1" stop-color="#f3b9a2"/></linearGradient>
        <linearGradient id="${P}bgPlaza" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e8496"/><stop offset="1" stop-color="#4c4258"/></linearGradient>
        <linearGradient id="${P}bgDawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fa9e0"/><stop offset=".5" stop-color="#f6cdb6"/><stop offset=".7" stop-color="#ffd9a0"/></linearGradient>
        <linearGradient id="${P}bgMeadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c9c5a"/><stop offset="1" stop-color="#3d5a30"/></linearGradient>
        <linearGradient id="${P}bgSunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a6fb0"/><stop offset=".5" stop-color="#f0907e"/><stop offset=".62" stop-color="#ffc27a"/></linearGradient>
        <linearGradient id="${P}bgSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a77b0"/><stop offset="1" stop-color="#3a5590"/></linearGradient>
        <linearGradient id="${P}bgSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ecd0a8"/><stop offset="1" stop-color="#c9a37a"/></linearGradient>
        <linearGradient id="${P}bgCafe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3628"/><stop offset="1" stop-color="#7a4a34"/></linearGradient>
        <linearGradient id="${P}bgWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a3a"/><stop offset="1" stop-color="#4a2e1e"/></linearGradient>
      </defs>
      <g filter="url(#${P}bgBlur)">${art}</g>
      <rect width="450" height="600" fill="url(#${P}bgVignette)"/>
      <radialGradient id="${P}bgVignette" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
    </g>`;
  }

  // ---------------------------------------------------------------- Main SVG Renderer
  function render(st, prefix = 'w-') {
    const outfitUrl = get3DOutfit(st);
    // Any place but Studio: cut her out and put the place behind her
    const cutout = st.scene && st.scene !== 'studio' ? maskFor(outfitUrl) : null;

    return `
      ${renderDefs(st, prefix)}

      <!-- 1. Authentic, Complete 3D Pixar Stylized Character of Chetna -->
      <g class="doll-3d-character" clip-path="url(#${prefix}charClip)">
        ${cutout ? `${sceneBackdrop(st.scene, prefix)}
        <mask id="${prefix}cutMask" maskUnits="userSpaceOnUse" x="0" y="0" width="450" height="600">
          <image class="doll-mask" href="${cutout}" x="0" y="0" width="450" height="600" preserveAspectRatio="xMidYMid slice" />
        </mask>
        <ellipse cx="225" cy="586" rx="120" ry="12" fill="#000000" opacity=".45" filter="url(#${prefix}soft)"/>
        <image id="${prefix}charImg" href="${outfitUrl}" x="0" y="0" width="450" height="600" preserveAspectRatio="xMidYMid slice" mask="url(#${prefix}cutMask)" />` : `
        <image id="${prefix}charImg" href="${outfitUrl}" x="0" y="0" width="450" height="600" preserveAspectRatio="xMidYMid slice" />
        <!-- Contact Floor Drop Shadow -->
        <ellipse cx="225" cy="584" rx="140" ry="14" fill="#000000" opacity=".55" filter="url(#${prefix}soft)"/>`}
      </g>

      <!-- 2. Scene Atmosphere Tone Filter -->
      ${renderSceneAtmosphere(st.scene, prefix)}

      <!-- 6. Interactive Accessories -->
      <g class="doll-3d-accessories">
        ${renderAccessories(st.extras, prefix, outfitUrl)}
      </g>

      <!-- 7. Ambient Magic Floating Sparkles -->
      <g class="doll-3d-sparkles" fill="#ffffff">
        <circle cx="50" cy="220" r="1.5" class="sparkle-p1"/>
        <circle cx="80" cy="380" r="2.2" filter="url(#${prefix}sparkleGlow)" class="sparkle-p2"/>
        <circle cx="390" cy="260" r="2.0" filter="url(#${prefix}sparkleGlow)" class="sparkle-p3"/>
        <circle cx="410" cy="420" r="1.6" class="sparkle-p4"/>
        <path d="M70,160 L71.5,164.5 L76,165.5 L71.5,166.5 L70,171 L68.5,166.5 L64,165.5 L68.5,164.5 Z" fill="#ffd700" opacity=".7" class="sparkle-star1"/>
        <path d="M380,330 L381.5,334.5 L386,335.5 L381.5,336.5 L380,341 L378.5,336.5 L374,335.5 L378.5,334.5 Z" fill="#ffd700" opacity=".75" class="sparkle-star2"/>
      </g>
    `;
  }

  // ---------------------------------------------------------------- High-Res Polaroid Export
  const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

  // Rasterise exactly what she sees: the render plus colour tint, pattern and
  // accessories. The outfit image is inlined first, because an SVG drawn as an
  // image can't load external files.
  async function snapshotSvg(svgEl, outfitUrl) {
    const clone = svgEl.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', '900');
    clone.setAttribute('height', '1200');
    clone.querySelectorAll('.doll-3d-sparkles').forEach((n) => n.remove());
    for (const imgEl of clone.querySelectorAll('image')) {
      const src = imgEl.id && imgEl.id.endsWith('charImg') && outfitUrl ? outfitUrl : imgEl.getAttribute('href');
      if (!src || src.startsWith('data:')) continue;
      const blob = await fetch(src).then((r) => r.blob());
      imgEl.setAttribute('href', await blobToDataUrl(blob));
    }
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    await img.decode();
    return img;
  }

  async function toPng(svgEl, caption, sub, outfitUrl) {
    // Photo window keeps the render's own 3:4 shape (no stretching)
    const W = 720, PW = 620, PH = Math.round(PW * 600 / 450), H = 50 + PH + 190;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(230, 222, 212, 0.45)';
    ctx.fillRect(40, 40, W - 80, H - 80);

    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(50, 50, PW, PH, 24); else ctx.rect(50, 50, PW, PH);
    ctx.clip();
    try {
      ctx.drawImage(await snapshotSvg(svgEl, outfitUrl), 50, 50, PW, PH);
    } catch (err) {
      // Fallback: the plain render, still at the right proportions
      const img = new Image();
      img.src = outfitUrl || svgEl.querySelector('image')?.getAttribute('href') || 'assets/wardrobe/dress-anarkali.jpg';
      try { await img.decode(); ctx.drawImage(img, 50, 50, PW, PH); } catch (e) { /* leave paper */ }
    }

    const stampEl = document.getElementById('wardrobe-stamp');
    if (stampEl && !stampEl.classList.contains('hidden')) {
      ctx.save();
      ctx.translate(W - 170, 140);
      ctx.rotate(-0.16);
      ctx.strokeStyle = '#2f7d4f';
      ctx.lineWidth = 5.5;
      ctx.fillStyle = 'rgba(230, 245, 235, 0.9)';
      ctx.fillRect(-120, -32, 240, 64);
      ctx.strokeRect(-120, -32, 240, 64);
      ctx.fillStyle = '#2f7d4f';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('APPROVED ✅', 0, 8);
      ctx.restore();
    }
    ctx.restore();

    try {
      await document.fonts.load('700 54px Caveat');
      await document.fonts.load('500 24px "Baloo 2"');
    } catch (e) { /* fonts optional */ }
    ctx.fillStyle = '#e8507f';
    ctx.textAlign = 'center';
    ctx.font = '700 54px Caveat, cursive';
    ctx.fillText(caption || 'Billu ka look 💛', W / 2, 50 + PH + 92);
    ctx.fillStyle = '#7a6a8a';
    ctx.font = '500 24px "Baloo 2", system-ui, sans-serif';
    ctx.fillText(sub || '21 Oct · Happy Birthday', W / 2, 50 + PH + 136);

    return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
  }

  // Load every outfit render up front so switching outfits is instant (no blank flash)
  let preloaded = false;
  function preload() {
    if (preloaded) return;
    preloaded = true;
    [...Object.values(DRESS_IMAGES), ...Object.values(DRESS_IMAGES).map(maskFor), ...LOOKS.map((l) => l.file)].forEach((src) => { const i = new Image(); i.src = src; });
  }

  function defaultState() {
    return {
      dress: 'anarkali',
      top: 'crop',
      bottom: 'jeans',
      main: null,
      second: '#ffd700',
      pattern: 'plain',
      hair: 'open',
      hairColor: OPTIONS.hairColors[0],
      shoes: 'juttis',
      extras: new Set([]), // Clean, photorealistic 3D Pixar character by default
      scene: 'studio' // the render's own fairy-light backdrop; other places cut her out
    };
  }

  function randomize(st) {
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const availableDresses = OPTIONS.dresses.filter((d) => DRESS_IMAGES[d.id]);
    st.dress = pick(availableDresses).id;
    st.main = null;
    st.pattern = 'plain';
    st.scene = pick(OPTIONS.scenes).id;
    st.extras = new Set();
    if (Math.random() < 0.45) st.extras.add(pick(OPTIONS.extras).id);
    return st.dress;
  }

  return {
    OPTIONS,
    render,
    toPng,
    defaultState,
    randomize,
    get3DOutfit,
    preload,
    CONTROLS,
    hasTop,
    hasBottom,
    bottomsFor,
    findLook,
    normalizeSeparates
  };
})();

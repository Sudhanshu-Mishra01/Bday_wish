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
 * - Live Interactive Accessories: Royal Diamond Tiara 👑, Golden Shades 🕶️, Ruby Bindi 🔴, Jhumka Shimmer ✨, Jasmine Blossom 🌸, Choodiyan ✨, Minaudière Clutch 👛, Sheer Dupatta 🧣.
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
      { id: 'jhumka', label: 'Jhumka ✨' },
      { id: 'bindi', label: 'Ruby Bindi 🔴' },
      { id: 'flower', label: 'Phool 🌸' },
      { id: 'bangles', label: 'Choodiyan ✨' },
      { id: 'bag', label: 'Clutch 👛' },
      { id: 'dupatta', label: 'Dupatta 🧣' }
    ],
    colors: [
      '#e9a48c', '#f3c4b0', '#e8507f', '#ff9fbf', '#c81d3a', '#7a1f2b', '#f27a3a', '#ffcf5a',
      '#8a9a5b', '#7fd6c2', '#3fa7a0', '#9b8cff', '#5b3fa0', '#3b5fa8', '#1f2a44', '#f5efe6', '#2b2b2b'
    ],
    scenes: [
      { id: 'mela', label: 'Mela 🎡' },
      { id: 'fountain', label: 'Fountain ⛲' },
      { id: 'pahad', label: 'Mountain view ⛰️' },
      { id: 'beach', label: 'Beach 🏖️' },
      { id: 'cafe', label: 'Cafe ☕' },
      { id: 'studio', label: 'Studio ✨' }
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

  // Tabs shown in the dress-up sheet. Hair and shoes are left out because the
  // renders don't vary by them yet — add 'hair' / 'shoes' back once images do.
  const CONTROLS = ['dresses', 'tops', 'bottoms', 'colors', 'pattern', 'extras', 'scene'];

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
  function renderAccessories(extras, prefix) {
    const ext = extras instanceof Set ? extras : new Set(extras || []);
    let out = '';

    // 1. Tiara (👑 Royal Diamond Princess Tiara)
    if (ext.has('tiara')) {
      out += `
        <g class="overlay-tiara" filter="url(#${prefix}dropShadow)">
          <!-- Base delicate curved headband -->
          <path d="M192,72 Q225,54 258,72" fill="none" stroke="url(#${prefix}goldGrad)" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M194,71 Q225,56 256,71" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.6"/>
          <!-- Ornate filigree arches -->
          <path d="M196,71 Q206,58 214,66 Q225,48 236,66 Q244,58 254,71" fill="none" stroke="url(#${prefix}goldGrad)" stroke-width="1.8"/>
          <!-- Central royal diamond crest -->
          <polygon points="225,44 229,54 225,64 221,54" fill="#ffffff" filter="url(#${prefix}sparkleGlow)"/>
          <polygon points="214,54 217,61 214,68 211,61" fill="#ffffff" opacity="0.9"/>
          <polygon points="236,54 239,61 236,68 233,61" fill="#ffffff" opacity="0.9"/>
          <polygon points="204,61 206,66 204,71 202,66" fill="#ffd700"/>
          <polygon points="246,61 248,66 246,71 244,66" fill="#ffd700"/>
          <!-- Shimmering star glint on apex -->
          <circle cx="225" cy="44" r="2.8" fill="#ffffff" filter="url(#${prefix}sparkleGlow)"/>
          <path d="M225,40 L225,48 M221,44 L229,44" stroke="#ffffff" stroke-width="1.2" opacity="0.95"/>
        </g>
      `;
    }

    // 2. Sunglasses (🕶️ Shades)
    if (ext.has('shades')) {
      out += `
        <g class="overlay-shades" filter="url(#${prefix}dropShadow)">
          <!-- Left Frame -->
          <rect x="182" y="94" width="38" height="25" rx="8" fill="url(#${prefix}lensGrad)" stroke="url(#${prefix}goldGrad)" stroke-width="1.8"/>
          <!-- Right Frame -->
          <rect x="230" y="94" width="38" height="25" rx="8" fill="url(#${prefix}lensGrad)" stroke="url(#${prefix}goldGrad)" stroke-width="1.8"/>
          <!-- Golden Bridge -->
          <path d="M220,101 Q225,98 230,101" fill="none" stroke="url(#${prefix}goldGrad)" stroke-width="2.2" stroke-linecap="round"/>
          <!-- Specular Glass Light Reflections -->
          <path d="M186,98 L206,98 L192,115 L186,115 Z" fill="#ffffff" opacity="0.28"/>
          <path d="M234,98 L254,98 L240,115 L234,115 Z" fill="#ffffff" opacity="0.28"/>
          <circle cx="216" cy="99" r="1.2" fill="#fff" opacity="0.7"/>
          <circle cx="264" cy="99" r="1.2" fill="#fff" opacity="0.7"/>
        </g>
      `;
    }

    // 3. Flower (🌸 Jasmine / Lotus Blossom behind ear)
    if (ext.has('flower')) {
      out += `
        <g class="overlay-flower" transform="translate(164, 88)" filter="url(#${prefix}dropShadow)">
          <g filter="url(#${prefix}soft)" opacity="0.3"><circle cx="0" cy="0" r="10" fill="#f48fb1"/></g>
          <path d="M0,0 Q-8,-6 -6,-12 Q-1,-11 0,0" fill="#ffcdd2"/>
          <path d="M0,0 Q-12,-2 -13,5 Q-7,6 0,0" fill="#f8bbd0"/>
          <path d="M0,0 Q-8,10 -3,13 Q1,8 0,0" fill="#ffcdd2"/>
          <path d="M0,0 Q6,9 10,6 Q7,0 0,0" fill="#f8bbd0"/>
          <path d="M0,0 Q8,-7 4,-12 Q-1,-8 0,0" fill="#ffcdd2"/>
          <circle cx="0" cy="0" r="3" fill="#ffe082"/>
          <circle cx="0" cy="0" r="1.5" fill="#ffd54f"/>
        </g>
      `;
    }

    // 4. Bindi (🔴 Glistening Ruby Bindi)
    if (ext.has('bindi')) {
      out += `
        <g class="overlay-bindi" filter="url(#${prefix}sparkleGlow)">
          <circle cx="225" cy="86" r="3.2" fill="#880e4f"/>
          <circle cx="225" cy="86" r="2.4" fill="#c2185b"/>
          <circle cx="225" cy="86" r="1.2" fill="#ff4081"/>
          <circle cx="224.2" cy="85.2" r="0.6" fill="#ffffff"/>
        </g>
      `;
    }

    // 5. Jhumka Sparkle (✨ Delicate Golden Dangler Glints)
    if (ext.has('jhumka')) {
      out += `
        <g class="overlay-jhumka">
          <g transform="translate(176, 142)" filter="url(#${prefix}goldGlow)">
            <circle cx="0" cy="0" r="2.8" fill="url(#${prefix}goldGrad)"/>
            <path d="M-4,3 Q0,2 4,3 L3,8 Q0,9 -3,8 Z" fill="url(#${prefix}goldGrad)"/>
            <circle cx="-2.5" cy="10" r="1" fill="#ffffff"/>
            <circle cx="0" cy="10.5" r="1.2" fill="#ffffff"/>
            <circle cx="2.5" cy="10" r="1" fill="#ffffff"/>
          </g>
          <g transform="translate(274, 142)" filter="url(#${prefix}goldGlow)">
            <circle cx="0" cy="0" r="2.8" fill="url(#${prefix}goldGrad)"/>
            <path d="M-4,3 Q0,2 4,3 L3,8 Q0,9 -3,8 Z" fill="url(#${prefix}goldGrad)"/>
            <circle cx="-2.5" cy="10" r="1" fill="#ffffff"/>
            <circle cx="0" cy="10.5" r="1.2" fill="#ffffff"/>
            <circle cx="2.5" cy="10" r="1" fill="#ffffff"/>
          </g>
        </g>
      `;
    }

    // 6. Bangles (✨ Stacked Golden Choodiyan)
    if (ext.has('bangles')) {
      out += `
        <g class="overlay-bangles" filter="url(#${prefix}goldGlow)">
          <ellipse cx="173" cy="342" rx="7" ry="3.5" fill="none" stroke="url(#${prefix}goldGrad)" stroke-width="2"/>
          <ellipse cx="174" cy="345" rx="7" ry="3.5" fill="none" stroke="#c2185b" stroke-width="1.6"/>
          <ellipse cx="175" cy="348" rx="7" ry="3.5" fill="none" stroke="url(#${prefix}goldGrad)" stroke-width="2"/>
          <ellipse cx="277" cy="342" rx="7" ry="3.5" fill="none" stroke="url(#${prefix}goldGrad)" stroke-width="2"/>
          <ellipse cx="276" cy="345" rx="7" ry="3.5" fill="none" stroke="#c2185b" stroke-width="1.6"/>
          <ellipse cx="275" cy="348" rx="7" ry="3.5" fill="none" stroke="url(#${prefix}goldGrad)" stroke-width="2"/>
        </g>
      `;
    }

    // 7. Clutch (👛 Minaudière Bag)
    if (ext.has('bag')) {
      out += `
        <g class="overlay-clutch" transform="translate(254, 336)" filter="url(#${prefix}dropShadow)">
          <rect x="0" y="0" width="46" height="30" rx="7" fill="#2b1a38" stroke="url(#${prefix}goldGrad)" stroke-width="2"/>
          <path d="M0,2 L23,18 L46,2" fill="none" stroke="url(#${prefix}goldGrad)" stroke-width="1.6"/>
          <circle cx="23" cy="18" r="3.5" fill="#ffffff" filter="url(#${prefix}sparkleGlow)"/>
          <circle cx="23" cy="18" r="1.8" fill="#ffd700"/>
        </g>
      `;
    }

    // 8. Dupatta (🧣 Floating Shimmering Dupatta)
    if (ext.has('dupatta')) {
      out += `
        <g class="overlay-dupatta" opacity="0.82" filter="url(#${prefix}dropShadow)">
          <path d="M148,212 Q136,295 156,380 Q168,425 156,480 L142,476 Q150,425 142,380 Q124,295 138,212 Z" fill="#ffe082"/>
          <path d="M148,212 Q136,295 156,380 Q168,425 156,480" fill="none" stroke="url(#${prefix}goldGrad)" stroke-width="2.5"/>
          <path d="M138,212 Q225,236 292,216" fill="none" stroke="url(#${prefix}goldGrad)" stroke-width="4.5" opacity="0.75"/>
          <path d="M138,212 Q225,236 292,216" fill="none" stroke="#fff8e1" stroke-width="1.5" opacity="0.85"/>
        </g>
      `;
    }

    return out;
  }

  // ---------------------------------------------------------------- Main SVG Renderer
  function render(st, prefix = 'w-') {
    const outfitUrl = get3DOutfit(st);

    return `
      ${renderDefs(st, prefix)}

      <!-- 1. Authentic, Complete 3D Pixar Stylized Character of Chetna -->
      <g class="doll-3d-character" clip-path="url(#${prefix}charClip)">
        <image id="${prefix}charImg" href="${outfitUrl}" x="0" y="0" width="450" height="600" preserveAspectRatio="xMidYMid slice" />
        <!-- Contact Floor Drop Shadow -->
        <ellipse cx="225" cy="584" rx="140" ry="14" fill="#000000" opacity=".55" filter="url(#${prefix}soft)"/>
      </g>

      <!-- 2. Dynamic Garment Color Tint Overlay (Soft Feathered Mask to prevent box artifacts) -->
      ${st.main && st.main !== '#e9a48c' && st.main !== 'original' ? `
        <rect x="60" y="190" width="330" height="390" fill="${st.main}" opacity=".30" mask="url(#${prefix}garmentMask)" style="mix-blend-mode: color; pointer-events: none;"/>
      ` : ''}

      <!-- 3. Dynamic Garment Pattern Overlay (Chikankari, Polka, Floral, Stripes, Checks) -->
      ${st.pattern && st.pattern !== 'plain' ? `
        <rect x="60" y="190" width="330" height="390" fill="url(#${prefix}pat-${st.pattern})" opacity=".32" mask="url(#${prefix}garmentMask)" style="mix-blend-mode: overlay; pointer-events: none;"/>
      ` : ''}

      <!-- 4. Subtle Cinematic Fabric Sheen Gleam -->
      <g class="doll-fabric-sheen" mask="url(#${prefix}garmentMask)" style="mix-blend-mode: overlay; pointer-events: none;">
        <rect x="-120" y="200" width="100" height="420" fill="url(#${prefix}sheenGrad)" transform="rotate(-25 225 350)" class="sheen-sweep"/>
      </g>

      <!-- 5. Scene Atmosphere Tone Filter -->
      ${renderSceneAtmosphere(st.scene, prefix)}

      <!-- 6. Interactive Accessories -->
      <g class="doll-3d-accessories">
        ${renderAccessories(st.extras, prefix)}
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
  async function toPng(svgEl, caption, sub, outfitUrl) {
    const W = 720, H = 1320;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    // 1. Warm Polaroid Paper Background
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(0, 0, W, H);

    // 2. Polaroid Outer Soft Shadow
    ctx.fillStyle = 'rgba(230, 222, 212, 0.45)';
    ctx.fillRect(40, 40, W - 80, H - 80);

    // 3. Main Photo Window (Clip rounded rectangle)
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(50, 50, 620, 1100, 24);
    } else {
      ctx.rect(50, 50, 620, 1100);
    }
    ctx.clip();

    // 4. Draw 3D Character Outfit Image
    const imgSrc = outfitUrl || svgEl.querySelector('image')?.getAttribute('href') || 'assets/wardrobe/dress-anarkali.jpg';
    const img = new Image();
    img.src = imgSrc;
    try {
      await img.decode();
      ctx.drawImage(img, 50, 50, 620, 1100);
    } catch (err) {}

    // 5. If "Approved" Stamp is visible, stamp it onto the photo
    const stampEl = document.getElementById('wardrobe-stamp');
    if (stampEl && !stampEl.classList.contains('hidden')) {
      ctx.save();
      ctx.translate(W - 170, 160);
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

    // 6. Romantic Handwritten Caption
    try {
      await document.fonts.load('700 54px Caveat');
      await document.fonts.load('500 24px "Baloo 2"');
    } catch (e) {}

    ctx.fillStyle = '#e8507f';
    ctx.textAlign = 'center';
    ctx.font = '700 54px Caveat, cursive';
    ctx.fillText(caption || 'Billu ka look 💛', W / 2, 1228);

    ctx.fillStyle = '#7a6a8a';
    ctx.font = '500 24px "Baloo 2", system-ui, sans-serif';
    ctx.fillText(sub || '21 Oct · Happy Birthday', W / 2, 1272);

    return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
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
      scene: 'mela'
    };
  }

  function randomize(st) {
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    if (Math.random() < 0.5) {
      st.dress = pick(OPTIONS.dresses.filter((d) => DRESS_IMAGES[d.id])).id;
    } else {
      const l = pick(LOOKS);
      st.dress = null;
      st.top = l.top;
      st.bottom = l.bottom;
    }
    st.main = Math.random() < 0.6 ? null : pick(OPTIONS.colors);
    do { st.second = pick(OPTIONS.colors); } while (st.second === st.main);
    st.pattern = Math.random() < 0.7 ? 'plain' : pick(OPTIONS.patterns).id;
    st.shoes = pick(OPTIONS.shoes).id;
    st.scene = pick(OPTIONS.scenes).id;
    // 25% chance to add 1 cute accessory
    st.extras = new Set();
    if (Math.random() < 0.3) st.extras.add(pick(OPTIONS.extras).id);
  }

  return {
    OPTIONS,
    render,
    toPng,
    defaultState,
    randomize,
    get3DOutfit,
    CONTROLS,
    hasTop,
    hasBottom,
    bottomsFor,
    findLook,
    normalizeSeparates
  };
})();

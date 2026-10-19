# Prompts for Gemini

Copy a prompt below into Gemini. Her reference photo is at `assets/reference/chetna-reference.jpg` (kept off the live site by `.vercelignore` — don't push this folder to a public GitHub repo).

Test everything with:

```bash
python3 admin_server.py
```

then open `http://localhost:5173/?preview&scene=ride` (bike) or `http://localhost:5173/?preview&scene=playground` → 👗 (dress-up).

---

## 1. Bike ride — improve the couple on the bike (Gemini as coding agent)

```
You are working in a static birthday website (plain HTML/CSS/JS, no build step).
Improve the couple-on-a-motorcycle illustration in the bike ride scene.

Where it lives
- index.html → inside <section data-scene="ride"> there is <svg class="bike" id="bike" viewBox="0 0 260 160">.
- style.css → the "4. Ride" section styles .bike, .sil, .beam, .wheel, .hair-fly, .dupatta-fly.
- script.js → enterFns.ride animates it; do not change that logic.

What to draw (side view, facing right, cinematic silhouette style)
- A classic Indian cruiser motorcycle (Royal Enfield Classic 350 style): round headlight, teardrop tank,
  spoked wheels, chrome exhaust, rear fender with tail light.
- Him riding: full-face helmet, jacket, both hands on the handlebar, slightly leaning forward.
- Her behind him, sitting side-saddle (both legs on the viewer's side) in a long kurta, one arm around
  his waist, long voluminous wavy black hair streaming back, a dupatta flying behind her.
  Her features come from assets/reference/chetna-reference.jpg (side profile: soft rounded face,
  jhumka earring visible, hair falling over one shoulder).
- Realistic adult proportions — not cartoonish, not chibi.

Hard constraints (the animation depends on these)
- Keep viewBox="0 0 260 160"; ground line at y = 151.
- Rear wheel centre (58,124), front wheel centre (204,124), radius ~27. Each wheel stays a
  <g class="wheel" style="transform-origin:Xpx Ypx"> with visible spokes (it spins).
- Keep a <path class="beam"> headlight beam starting near (190,62), class "hair-fly" on her hair and
  "dupatta-fly" on the dupatta (they flutter), and put silhouette shapes inside <g class="sil">
  (CSS gives them the dark fill and the warm rim light that grows at sunrise).
- Inline SVG only, no external images, no new JS. Keep it under ~25 KB.
- Must read clearly at 300px wide on a phone, both at night (dark sky) and at sunrise.
```

## 2. Bike ride — a finished artwork instead (Gemini image generation)

Attach `assets/reference/chetna-reference.jpg`, then:

```
Create a side-view illustration of a young Indian couple riding a classic Royal Enfield-style
motorcycle, facing right. The man rides wearing a helmet and a dark jacket. Behind him, the woman
from the attached photo sits side-saddle in a peach chikankari anarkali kurta, one arm around his
waist, long wavy black hair and a sheer peach dupatta flowing back in the wind, oxidised silver
jhumka earrings. Keep her face true to the photo. Semi-realistic digital painting, soft warm
sunrise rim light from behind, cinematic. Full bike visible, wheels touching the bottom edge.
Transparent background (PNG), no road, no scenery, no text. 1600 × 1000 px.
```

Save the result as `assets/ride/couple-bike.png`, then in the Studio (🏍️ Bike ride → "Bike pe tum dono ki artwork") set the path to `assets/ride/couple-bike.png` and Save. The site uses the image instead of the drawn silhouette (the scenery, sunrise and milestones stay the same).

## 3. Dress-up character — make her look even more like the photo (Gemini as coding agent)

> **Outdated:** the dress-up now uses full-body rendered images (`assets/wardrobe/`), not the drawn SVG character this prompt describes. For more outfits, use section 4.

```
You are working in a static birthday website (plain HTML/CSS/JS, no build step).
Refine the dress-up character in wardrobe.js so her face and hair resemble the woman in
assets/reference/chetna-reference.jpg even more closely, in a realistic semi-painterly illustrated style
(adult woman, not cartoon, not anime, not chibi).

What she looks like (from the photo)
- Soft oval face with gently full cheeks and a rounded chin; fair, warm skin.
- Almond, dark-brown eyes with kajal and a small wing; well-defined, arched dark brows.
- Small dark bindi; straight nose; full lips with peach-coral lipstick in a soft closed smile.
- Very voluminous, wavy black hair with a side parting: one side falls over her shoulder in front,
  the other side is tucked behind her ear showing a big oxidised-silver jhumka.
- Head slightly tilted; hands softly clasped at the waist with a stack of gold bangles on one wrist.

How wardrobe.js works (keep this contract)
- window.Wardrobe = { OPTIONS, render(state, idPrefix), toPng, defaultState, randomize }.
- render() returns SVG markup for viewBox 0 0 300 600; the figure is centred on x = 150, feet at ~560.
- Every id must be created with id('name') and referenced with url('name') (several SVGs can be on
  one page, e.g. the dashboard).
- Use inline fills only (no CSS classes), because toPng() serialises the SVG into an image.
- Draw order in render(): scene → hairBack → bodySkin → shoes → dupattaBack → garment body →
  dupattaFront → necklace → both(armSkin + sleeve) → clutch → hands + bangles → (tilted group) face,
  hairFront, extrasHead. Garments and sleeves are positioned for the current body and arm pose
  (BODY and ARM constants), so change face() / hairBack() / hairFront() / extrasHead() first and only
  move the body if you also adjust every garment.
- Keep OPTIONS, the state shape (dress/top/bottom/main/second/pattern/hair/hairColor/shoes/extras/scene)
  and defaultState() unchanged so saved looks on the dashboard keep working.
- Check every outfit, hairstyle and background in the 👗 sheet after your change, and that
  "Ye pehnungi" still produces the photo card.
```

---

## 4. Dress-up — more top × bottom combinations (fixes "mix & match")

Each outfit in the dress-up is one full-body render, so a top and a bottom can only be shown together if that exact pairing has its own image. The code is already set up for this: picking a bottom never changes the top, and the Tops/Bottoms tabs only offer pairings that have an image. To unlock more mixing, generate the missing pairings below. Each new image shows up in the dress-up automatically once it's listed in `LOOKS`.

**Step A — generate the images (Gemini image generation).** Attach `assets/wardrobe/look-crop-jeans.jpg` (pose/style reference) and `assets/reference/chetna-reference.jpg` (face reference), then send this once per pairing, changing only the two outfit lines:

```
Recreate the attached render exactly — same 3D Pixar-style young Indian woman (face from the photo),
same pose with hands softly clasped at the waist, same camera, framing, size and position in the frame,
same fairy-light bokeh background with gold confetti, same lighting. Only the clothes change:

TOP: <top description>
BOTTOM: <bottom description>

Full body visible head to shoes, 896 × 1200 px, JPG. No text, no watermark.
```

Save each as `assets/wardrobe/look-<top>-<bottom>.jpg` using these ids and descriptions:

| File | TOP | BOTTOM |
|------|-----|--------|
| look-crop-skirt.jpg | white fitted crop top with a small lotus print | blush-pink pleated midi skirt |
| look-crop-palazzo.jpg | white fitted crop top with a small lotus print | flowing white palazzo pants |
| look-crop-joggers.jpg | white fitted crop top with a small lotus print | soft grey joggers |
| look-kurti-jeans.jpg | peach kurti with gold embroidery, 3/4 sleeves | slim blue jeans |
| look-kurti-churidar.jpg | peach kurti with gold embroidery, 3/4 sleeves | ivory silk churidar |
| look-offshoulder-jeans.jpg | blush-pink ruffled off-shoulder top, tucked in | slim blue jeans |
| look-offshoulder-palazzo.jpg | blush-pink ruffled off-shoulder top | flowing white palazzo pants |
| look-shirt-skirt.jpg | pastel peach shirt, sleeves rolled, tucked in | blush-pink pleated midi skirt |
| look-shirt-palazzo.jpg | pastel peach shirt, sleeves rolled, tucked in | flowing white palazzo pants |
| look-tee-jeans.jpg | classic white crew-neck t-shirt, half tucked | slim blue jeans |
| look-tee-joggers.jpg | classic white crew-neck t-shirt | soft grey joggers |
| look-tee-skirt.jpg | classic white crew-neck t-shirt, tucked in | blush-pink pleated midi skirt |
| look-hoodie-joggers.jpg | cosy pastel hoodie with a small bear motif | soft grey joggers |
| look-hoodie-jeans.jpg | cosy pastel hoodie with a small bear motif | slim blue jeans |
| look-jacket-jeans.jpg | light denim jacket over a white tee | slim blue jeans |
| look-jacket-skirt.jpg | light denim jacket over a white tee | blush-pink pleated midi skirt |

Check every image against `look-crop-jeans.jpg` side by side: the head, hands and feet should sit in the same place. If one drifts, regenerate it; otherwise switching outfits will visibly jump.

**Step B — register them (Gemini as coding agent):**

```
In wardrobe.js, find the LOOKS array (next to DRESS_IMAGES) and add one entry per new image in
assets/wardrobe/ named look-<top>-<bottom>.jpg, e.g.
  { top: 'tee', bottom: 'jeans', file: 'assets/wardrobe/look-tee-jeans.jpg' },
Only add files that actually exist. Use ids from OPTIONS.tops / OPTIONS.bottoms exactly.
Do not change script.js: the Tops tab shows any top that has at least one look, and the Bottoms tab
shows the bottoms available for the selected top, so new pairings appear automatically.
Then bump the ?v= number on wardrobe.js in index.html and dashboard.html.
Test: http://localhost:5173/?preview&scene=playground → 👗 → pick each top, then each bottom; the top
must never change when a bottom is picked.
```

**Hair and shoes:** the Baal and Joote tabs are hidden because the renders don't change with them. Making them work would need a separate image for every outfit × hairstyle × shoe — dozens of renders — so they're best left out. To bring a tab back anyway, add `'hair'` or `'shoes'` to `CONTROLS` in wardrobe.js.

# 💛 Chetna's Midnight Birthday

A one-night, no-one-is-watching birthday experience for Chetna (Mishrayin / Billu), unlocking at **21 Oct 2026, 12:00 AM IST**.

## The journey

| # | Scene | What she does |
|---|-------|---------------|
| 0 | Countdown | Before midnight she only sees a teasing countdown and a gift box she can shake |
| 1 | Shhh… | Whispers in the dark → she switches on the fairy lights → "Happy Birthday, Chetna" |
| 2 | Aaj ka rule | Smashes the **"LOG KYA KAHENGE?"** board |
| 3 | Bachpan playground | Five toys: Balloon pop, Tareef Machine, Wish Lantern (she writes 3 wishes, each lantern floats up and becomes a star), **Apne Mann Ke Kapde** (realistic renders of her made with Gemini: 7 dresses + 4 top-and-bottom looks, 17 colours, 6 prints incl. chikankari, tiara / shades / jhumka / bindi / flower, 6 backgrounds incl. fountain and pahad — she can save the look as a photo) and **Dil Pakdo** (she taps floating hearts, stars and gifts for compliments, memories, confessions and kiss tokens; no timer, no score; after 5 a rare golden heart floats up and plays your secret voice note) |
| 4 | Bike ride | Holds a button to ride through the mountains at night — you two on the bike, headlight on — and your story appears at each milestone until the sun rises |
| 5 | Adalat | *Mishrayin vs. "Tumhe meri kadar nahi"* — the exhibits are your real memories |
| 6 | Sapno ki duniya | *"Chalo, sapne me milte hain"* — she closes her eyes and wakes in a dream: a hot-air balloon for two floats up past three sky-islands, each a different little game — 🌿 lasso fireflies into a jar (they end up drawing a heart), 🪷 a moonlit lake hums a tune and she plays it back on glowing lotuses, 🔮 she turns crystal mirrors to guide moonlight to a sleeping rose (2 puzzles, hint after a while). Each island gives her a light; she holds to give all three to the moon, it blooms like a flower, and you two are on a crescent-moon swing. Then *"Ab aankhen kholo…"* |
| 7 | Yaadein | Polaroids that flip to show a note |
| 8 | Taaron wala dil | She taps glowing stars in order; they join into a heart and spell out a line for her |
| 9 | Poem | Your poem, line by line; then she writes a line back for you |
| 10 | Cake | "2" and "4" candles — blow into the mic or tap, then a 10-second wish |
| 11 | Hamari kahani | Build-your-own love story: 3 choices (baarish wala café / sunset walk, pahad / samandar, movie night / kuch nahi bas saath) become an illustrated ending she can save |
| 12 | Dil ki baatein | A chat: you ask about your moments together, she answers, you react (the "Nahi" button runs away) |
| 13 | Chitthi + coupons | Letter with promises and shayari (saveable as an image), then claimable coupons |
| 14 | Goodnight | "Lights band karo" — lights switch off, moon, goodnight |

Her progress is remembered on her phone, so if she closes the tab she can continue where she left off.

Everything she writes or picks — chat answers, lantern wishes, her poem line, the looks she designs, her love-story choices, how far she got in the dream, whether she heard your voice note, coupons she claims — plus how far she has got, is logged to **your dashboard** (below). Nothing asks her to send anything.

## Edit texts and photos (the Studio)

```bash
python3 admin_server.py
```

- Studio: http://localhost:5173/admin.html — edit every text, upload photos and an optional song, then press **Save** (or ⌘S). It rewrites `config.js` and keeps the previous version in `.backups/`.
- Site preview: http://localhost:5173/?preview (skips the countdown).
- Jump to a scene: `?preview&scene=ride` (scenes: hello, rule, playground, ride, court, dream, memories, stars, poem, cake, story, questions, letter, goodnight).
- To see exactly what she'll see before midnight, open http://localhost:5173/ without `?preview`.

Photos are resized in the browser before upload and saved as `assets/photos/memory-N.jpg`. You can also drop files there yourself and type the path in the Studio, or edit `config.js` directly.

### Your secret voice note (golden heart)

Record a short voice note on your phone (Voice Memos → share → save as `.m4a`, or any `.mp3`). In the Studio open **💕 Dil Pakdo → Secret voice note**, upload it, listen to the preview, and press **Save**. It's stored as `assets/voice/secret-voice.<ext>`. Until you upload one, the golden heart shows a written note instead (`goldenFallback`), so nothing breaks.

## Your dashboard (her activity)

- Locally: http://localhost:5173/dashboard.html (also linked from the Studio). Logs are kept in `.logs/events.jsonl`.
- Live: `https://<your-site>.vercel.app/dashboard` — asks for your admin key once, then refreshes every 10 seconds, so you can watch live at midnight.
- Visits with `?preview` (your own testing) are tagged **test** and hidden by default; "Test entries hatao" removes them without touching hers.

## Her reference photo & Gemini

`assets/reference/chetna-reference.jpg` is the photo the dress-up character is modelled on. It's excluded from Vercel uploads; don't push it to a public repo. Gemini's test renders and the old template images are also kept out of uploads via `.vercelignore` (they're still in the folder, nothing was deleted).

The dress-up uses one full-body image per outfit (`assets/wardrobe/`). A top + bottom pair only shows if that exact combination has an image, so picking a bottom never swaps her top. Section 4 of [GEMINI_PROMPTS.md](GEMINI_PROMPTS.md) lists the 16 missing combinations with a ready prompt; for each new `look-<top>-<bottom>.jpg`, add one line to `LOOKS` in `wardrobe.js` and it appears automatically. If a new render has her head in a different spot or tilt, add its eye positions to `FACE_ANCHORS` in `wardrobe.js` so the bindi, shades, jhumkas, tiara and flower stay on her face.

## Put it online (Netlify)

The site deploys from GitHub to Netlify. The activity log runs as two Netlify Functions (`netlify/functions/log.mjs`, `logs.mjs`) and stores events in Netlify Blobs, which every Netlify site has built in, so there's no database to set up. One-time setup:

1. Netlify → your site → **Site configuration → Environment variables** → add `ADMIN_KEY` = any secret phrase only you know (this is your dashboard password).
2. **Deploys → Trigger deploy** (env vars only reach the functions after a new deploy). Every `git push` to `main` also deploys.
3. Open `https://<your-site>.netlify.app/dashboard`, enter the key, then open the site with `?preview`, do something, check it appears, and press "Test entries hatao".

`netlify.toml` keeps her reference photo (`/assets/reference/`), `.logs`, `.backups` and the Gemini notes off the live site, because Netlify ignores `.vercelignore`.

Vercel still works too (`api/log.js`, `api/logs.js` + Upstash for Redis + `ADMIN_KEY`), if you ever switch.

## Before you send the link

- [ ] Check the 6 memory photos (Studio → 📸 Photos & yaadein); swap in real ones if you like
- [ ] Record and upload your secret voice note (Studio → 💕 Dil Pakdo)
- [ ] Set `ADMIN_KEY` on Netlify, redeploy, and confirm a test entry shows on `/dashboard`, then clear test entries
- [ ] Read every text once in your own voice and adjust anything that isn't quite *you*
- [ ] Open the live link on a phone with `?preview`, play it end to end with sound on
- [ ] Send her the plain link (no `?preview`), e.g. at 11:59 PM, or earlier so she sees the countdown

Note: all the text lives in `config.js`, so someone who opens the page source could read it early. Chetna won't, but don't put anything there you'd mind being seen.

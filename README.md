# 💛 Chetna's Midnight Birthday

A one-night, no-one-is-watching birthday experience for Chetna (Mishrayin / Billu), unlocking at **21 Oct 2026, 12:00 AM IST**.

## The journey

| # | Scene | What she does |
|---|-------|---------------|
| 0 | Countdown | Before midnight she only sees a teasing countdown and a gift box she can shake |
| 1 | Shhh… | Whispers in the dark → she switches on the fairy lights → "Happy Birthday, Chetna" |
| 2 | Aaj ka rule | Smashes the **"LOG KYA KAHENGE?"** board |
| 3 | Bachpan playground | Balloon pop, Tareef Machine, Wish Lantern (she writes 3 wishes, each lantern floats up and becomes a star), Apne Mann Ke Kapde (a realistic illustrated version of her, modelled on her photo, starting in her peach chikankari anarkali at a mela; 6 dresses, 7 tops, 5 bottoms, prints incl. chikankari, hair, shoes, jewellery, 6 backgrounds incl. fountain plaza and mountain view — she can save the look as a photo) |
| 4 | Bike ride | Holds a button to ride through the mountains at night — a silhouette of you two on the bike, headlight on — and your story appears at each milestone until the sun rises |
| 5 | Adalat | *Mishrayin vs. "Tumhe meri kadar nahi"* — the exhibits are your real memories |
| 6 | Yaadein | Polaroids that flip to show a note |
| 7 | Taaron wala dil | She taps glowing stars in order; they join into a heart and spell out a line for her |
| 8 | Poem | Your poem, line by line; then she writes a line back for you |
| 9 | Cake | "2" and "4" candles — blow into the mic or tap, then a 10-second wish |
| 10 | Dil ki baatein | A chat: you ask about your moments together, she answers, you react (the "Nahi" button runs away) |
| 11 | Chitthi + coupons | Letter with promises and shayari (saveable as an image), then claimable coupons |
| 12 | Goodnight | "Lights band karo" — lights switch off, moon, goodnight |

Her progress is remembered on her phone, so if she closes the tab she can continue where she left off.

Everything she writes or picks — chat answers, lantern wishes, her poem line, the looks she designs, coupons she claims — plus how far she has got, is logged to **your dashboard** (below). Nothing asks her to send anything.

## Edit texts and photos (the Studio)

```bash
python3 admin_server.py
```

- Studio: http://localhost:5173/admin.html — edit every text, upload photos and an optional song, then press **Save** (or ⌘S). It rewrites `config.js` and keeps the previous version in `.backups/`.
- Site preview: http://localhost:5173/?preview (skips the countdown).
- Jump to a scene: `?preview&scene=ride` (scenes: hello, rule, playground, ride, court, memories, stars, poem, cake, questions, letter, goodnight).
- To see exactly what she'll see before midnight, open http://localhost:5173/ without `?preview`.

Photos are resized in the browser before upload and saved as `assets/photos/memory-N.jpg`. You can also drop files there yourself and type the path in the Studio, or edit `config.js` directly.

## Your dashboard (her activity)

- Locally: http://localhost:5173/dashboard.html (also linked from the Studio). Logs are kept in `.logs/events.jsonl`.
- Live: `https://<your-site>.vercel.app/dashboard` — asks for your admin key once, then refreshes every 10 seconds, so you can watch live at midnight.
- Visits with `?preview` (your own testing) are tagged **test** and hidden by default; "Test entries hatao" removes them without touching hers.

## Her reference photo & Gemini

`assets/reference/chetna-reference.jpg` is the photo the dress-up character is modelled on. It's excluded from Vercel uploads; don't push it to a public repo. Ready prompts for Gemini (improve the bike couple, generate a bike artwork, refine the character) are in [GEMINI_PROMPTS.md](GEMINI_PROMPTS.md). A generated bike image can be switched on from the Studio (🏍️ Bike ride → artwork path).

## Put it online (Vercel)

The live site needs Vercel, because the activity log runs on two small Vercel functions (`api/log.js`, `api/logs.js`). One-time setup:

1. `npx vercel` from this folder (log in, accept the defaults) to create the project.
2. Vercel dashboard → your project → **Storage** → **Upstash for Redis** (free) → connect it to the project. This adds the database URL/token automatically.
3. **Settings → Environment Variables** → add `ADMIN_KEY` = any secret phrase only you know (this is your dashboard password).
4. `npx vercel --prod` to deploy with storage + key in place.
5. Open `/dashboard`, enter the key, then open the site with `?preview`, do something, and check it appears (then clear the test entries).

The Studio only works on your computer: on the live site `admin.*` redirects to the home page, and `.vercelignore` keeps it out of uploads. After editing texts/photos, run `npx vercel --prod` again.

(Netlify Drop would serve the pages, but not the log functions — so nothing would reach your dashboard. Use Vercel.)

## Before you send the link

- [ ] Replace the 6 placeholder photos (Studio → 📸 Photos & yaadein)
- [ ] Do the Vercel setup above and confirm a test entry shows on `/dashboard`, then clear test entries
- [ ] Read every text once in your own voice and adjust anything that isn't quite *you*
- [ ] Open the live link on a phone with `?preview`, play it end to end with sound on
- [ ] Send her the plain link (no `?preview`), e.g. at 11:59 PM, or earlier so she sees the countdown

Note: all the text lives in `config.js`, so someone who opens the page source could read it early. Chetna won't, but don't put anything there you'd mind being seen.

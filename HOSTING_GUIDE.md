# 💖 Complete Birthday Surprise Hosting & Customization Guide

This project is a multi-stage, romantic birthday web app designed to impress your girlfriend. It features:
- 💌 **Act I:** Vintage 3D Wax-Sealed Envelope & Secret Invitation
- ✨ **Act II:** Floating Love Crystals Quest (Interactive reasons why you love her)
- 📸 **Act III:** 3D Polaroid Memory Lane + Golden Scratch-Off Secret Card
- 📜 **Act IV:** Heartfelt Love Letter Parchment Scroll with Interactive Reactions
- 🎂 **Act V:** Interactive Birthday Cake Cutting Ceremony (Blow flickering candles + Golden Knife Slice)
- 🎥 **Act VI:** Birthday Wish Video Screening / Romantic Keepsake Generator
- 🎵 **Built-in Romantic Procedural Music Synthesizer** (Plays automatically without needing audio files!)
- ⚙️ **In-App Boyfriend Customizer** (Tweak names, texts, and links right in the browser!)

---

## 🚀 Free Hosting Methods (Choose What's Easiest For You)

### Method 1: Deploy on Vercel (Recommended — Takes 1 Minute)

#### Option A: 1-Command CLI Deployment (No GitHub Needed!)
1. Open your Mac Terminal.
2. Navigate to this project folder:
   ```bash
   cd "/Volumes/D drive/bday "
   ```
3. Run the Vercel deploy command:
   ```bash
   npx vercel
   ```
4. Follow the brief prompts:
   - Log in with your email or GitHub (if prompted).
   - `Set up and deploy?` Type `Y` and press **Enter**.
   - Which scope? Press **Enter**.
   - Link to existing project? Type `N` and press **Enter**.
   - Project name? Press **Enter** (or type a custom name like `happy-birthday-my-queen`).
   - In which directory is code located? Press **Enter**.
5. Once uploaded, run:
   ```bash
   npx vercel --prod
   ```
6. **You get an instant, beautiful live HTTPS URL** (e.g. `https://happy-birthday-queen.vercel.app`) to send to her!

#### Option B: Via GitHub & Vercel Dashboard
1. Create a free account on [GitHub.com](https://github.com).
2. Create a new repository (e.g., `birthday-surprise`).
3. Push this folder to GitHub:
   ```bash
   cd "/Volumes/D drive/bday "
   git init
   git add .
   git commit -m "My romantic birthday surprise web app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/birthday-surprise.git
   git push -u origin main
   ```
4. Go to [Vercel.com](https://vercel.com) and log in with GitHub.
5. Click **"Add New"** → **"Project"** → Select your repository → Click **"Deploy"**.
6. Done! Vercel gives you a permanent, free URL with a free SSL certificate.

---

### Method 2: Netlify Drag-and-Drop (Zero Coding / Zero Git Required!)

If you don't want to use Git or the command line:
1. Go to **[app.netlify.com/drop](https://app.netlify.com/drop)** in your web browser.
2. Sign in with a free account (Google or GitHub).
3. Open Finder on your Mac and drag the entire **`bday`** folder directly into the browser box.
4. Netlify will deploy it in **10 seconds** and give you a free live link like `https://romantic-surprise-12345.netlify.app`.
5. You can even customize the site name for free in **Site Settings** → **Change site name** (e.g. `sarah-birthday.netlify.app`).

---

### Method 3: GitHub Pages (100% Free Forever)
1. Push your repository to GitHub (as shown in Option B above).
2. On your repository page, click **Settings** → **Pages** (on the left menu).
3. Under **Build and deployment** → **Branch**, select `main` and `/ (root)`.
4. Click **Save**.
5. In 1 minute, your site will be live at `https://YOUR_USERNAME.github.io/birthday-surprise/`.

---

## 🎨 How to Personalize Everything For Her

### Method A: Use the In-App Settings Button (Easiest)
1. Open the project in your browser (e.g., at `http://localhost:3333` or double click `index.html`).
2. In the top-right corner, click the small gear icon (`⚙️`).
3. A popup will open where you can change:
   - Her name / nickname
   - Your name
   - Birthday date
   - Scratch card secret promise
   - Love letter paragraphs
   - Video link
   - Music URL
4. Click **"Save & Apply Changes ✨"** — your edits will be saved and applied instantly!

### Method B: Edit `config.js` (For Permanent Deployment)
Open [`config.js`](file:///Volumes/D%20drive/bday%20/config.js) in your code editor. Everything is clearly labeled:

```javascript
window.SURPRISE_CONFIG = {
  recipientName: "Sarah", // <-- Put her name or nickname here!
  senderName: "Alex",     // <-- Your name
  birthdayDate: "October 24", // <-- Her birthday date

  // Add your own love reasons:
  loveReasons: [
    { title: "Your Smile ✨", text: "...", icon: "💖" },
    // ...
  ],

  // Replace with her real photos in assets/:
  gallery: [
    { image: "assets/her_photo1.jpg", title: "My Queen 👑", caption: "..." },
    { image: "assets/her_photo2.jpg", title: "Coffee Date ☕", caption: "..." }
  ],

  // Add your wish video:
  video: {
    videoSrc: "assets/wish_video.mp4", // or a YouTube link: "https://www.youtube.com/embed/YOUR_ID"
    endQuote: "Happy Birthday to the love of my life! 💖"
  }
};
```

---

## 📸 Replacing Photos With Her Real Pictures
1. Copy 3–5 of her cutest photos into the `assets/` folder.
2. You can rename them to `girlfriend_portrait.jpg`, `memory_date.jpg`, `memory_sunset.jpg`, etc., OR update the paths in `config.js`!

---

## 🎥 Adding Her Birthday Wish Video
You have 3 easy choices in `config.js`:
1. **Local MP4 file:** Record a video, place it in `assets/wish_video.mp4`, and set `videoSrc: "assets/wish_video.mp4"`.
2. **Unlisted YouTube Video:** Upload your video to YouTube as "Unlisted" (so only people with the link can see it), and paste the link in `videoSrc: "https://www.youtube.com/embed/YOUR_VIDEO_ID"`.
3. **Built-in Memory Reel Slideshow:** If you don't have a video yet, leave `videoSrc: ""` — the website will automatically run an animated slideshow with her photos and romantic quotes!

---

## 🎵 Background Music
- **Built-in Harp/Piano Synth:** Enabled by default! It plays a soothing romantic melody using the Web Audio API without requiring any audio downloads.
- **Your Own Song:** If you want a specific song (e.g., Ed Sheeran, Taylor Swift, or your special song), download the `.mp3`, place it in `assets/our_song.mp3`, and set `bgmUrl: "assets/our_song.mp3"` in `config.js`.

---

## 🧪 Local Preview
To preview anytime on your computer:
```bash
cd "/Volumes/D drive/bday "
python3 -m http.server 3333
```
Then visit **`http://localhost:3333`** in your browser!

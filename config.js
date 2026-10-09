// ==============================================================================
// 💖 BIRTHDAY SURPRISE CONFIGURATION
// Customize everything here! Change her name, your love messages, photos, and video.
// ==============================================================================

window.SURPRISE_CONFIG = {
  // 🌟 Recipient & Sender Info
  recipientName: "My Princess", // Her name or cute nickname (e.g., "Aaradhya", "Sarah", "Babu")
  senderName: "Your Forever Love", // Your name or nickname
  birthdayDate: "Happy Birthday!", // e.g. "October 24", "18th October", or whatever date!
  specialYear: "2026",

  // 🎵 Romantic Music Settings
  // You can keep procedural romantic chimes (built-in, no files needed)
  // or put a link to an MP3 file (e.g. "assets/romantic_bgm.mp3" or online url)
  bgmUrl: "", // leave empty to use built-in sweet romantic harp/piano synth, or put your MP3 url
  bgmAutoplayText: "🎵 Click anywhere for romantic melody",

  // 💌 Envelope / Invitation Text
  envelope: {
    stampText: "FOR HER",
    tagline: "A secret adventure created with love, just for you.",
    buttonText: "Break the Wax Seal ✨",
    teaserTitle: "Hey Beautiful! 💕",
    teaserBody: "Today is all about you. But before you get to the grand birthday finale, you have to journey through our memories and unlock each secret chamber with love. Are you ready?",
    startButtonText: "Start the Love Quest 🗝️"
  },

  // 🌟 Quest 1: Floating Love Crystals (Clickable Reasons)
  loveReasons: [
    {
      id: 1,
      title: "Your Radiant Smile ✨",
      text: "The way your eyes crinkle when you laugh can brighten up even the gloomiest of my days. It's my absolute favorite sight in the world.",
      icon: "💖",
      color: "#ff6b8b"
    },
    {
      id: 2,
      title: "Your Heart of Gold 🌸",
      text: "You care so deeply about the people you love. Your kindness, compassion, and gentleness inspire me to be a better person every day.",
      icon: "🌟",
      color: "#ff8fa3"
    },
    {
      id: 3,
      title: "Our Silly Inside Jokes 🤭",
      text: "The little glances we share across a crowded room where we know exactly what the other is thinking. Nobody gets me the way you do.",
      icon: "💫",
      color: "#e056fd"
    },
    {
      id: 4,
      title: "Your Warm Warm Hugs 🧸",
      text: "Wrapping my arms around you is where all my stress evaporates. In your embrace, I've found my safest, most peaceful home.",
      icon: "🫂",
      color: "#ff7675"
    },
    {
      id: 5,
      title: "Your Inspiring Strength 💪",
      text: "You are not just cute and loving — you're incredibly smart, resilient, and brave. I am so endlessly proud of everything you do.",
      icon: "👑",
      color: "#fd79a8"
    },
    {
      id: 6,
      title: "You are My Best Friend ♾️",
      text: "Beyond anything else, you are the person I want to share every win with, every silly meme with, and every dream for the future with.",
      icon: "💍",
      color: "#e84393"
    }
  ],

  // 📸 Quest 2: Polaroid Scrapbook & Photos
  // Replace these image paths with her real photos in the assets/ folder!
  // e.g., "assets/her_photo1.jpg"
  gallery: [
    {
      image: "assets/girlfriend_portrait.jpg",
      title: "The Birthday Queen 👑",
      date: "Forever Gorgeous",
      caption: "You look breathtaking in every single moment, even when you make your goofy faces."
    },
    {
      image: "assets/memory_date.jpg",
      title: "Our Cozy Coffee Talks ☕",
      date: "Sweet Memories",
      caption: "Hours pass by like minutes whenever we sit together and lose track of time."
    },
    {
      image: "assets/memory_sunset.jpg",
      title: "Hand in Hand 🌅",
      date: "Sunset Walks",
      caption: "Walking beside you is where I belong. Here is to a thousand more golden sunsets together."
    },
    {
      image: "assets/hero_couple.jpg",
      title: "Under the Stars ✨",
      date: "Magical Nights",
      caption: "Out of 8 billion people on this planet, my heart picked you and never looked back."
    }
  ],

  // 🪙 Interactive Scratch Card Secret
  scratchCard: {
    instruction: "Scratch this golden heart with your finger or mouse to reveal a hidden secret! ✨",
    secretTitle: "My Eternal Promise To You 💌",
    secretMessage: "No matter how many years pass, how many birthdays we celebrate, or where life takes us: I will always choose you, cherish you, make you laugh, and love you with every beat of my heart. Happy Birthday, my whole world! 💖"
  },

  // 📜 Quest 3: The Long Heartfelt Love Letter
  loveLetter: {
    salutation: "To My Dearest Love,",
    paragraphs: [
      "On this very day, the universe gifted the world someone extraordinarily pure, radiant, and deeply special — and somehow, against all odds, I became the luckiest guy alive to hold your hand and call you mine.",
      "Thank you for being my anchor when life feels chaotic, for laughing at my terrible jokes, and for understanding my quiet moments when words fall short. You bring an effortless warmth into everything you touch. Just watching you be passionate about things makes me fall in love with you all over again.",
      "I love the little things: the way your voice sounds when you're sleepy, the random songs you hum, the way you pout when you're teasing me, and the comforting comfort of just existing in the same room as you.",
      "Today, as you turn a year more wonderful, I want you to know how deeply you are appreciated, celebrated, and adored. May this year bring you all the gentle joy, big dreams fulfilled, good health, and boundless happiness your heart can hold. I will be right here cheering for you every step of the way.",
      "Happy Birthday, my love. You are my favorite hello, my hardest goodbye, and my happiest forever."
    ],
    closing: "Forever & Always Yours,",
    signature: "With All My Heart ❤️"
  },

  // 🎂 Grand Finale: Cake & Wishes
  cake: {
    candlesCount: 3,
    title: "Make a Birthday Wish! 🎂",
    subtitle: "Tap each glowing candle to blow them out, then slice the cake with the golden knife!",
    sliceSuccessTitle: "YAY! A SWEET WISH FOR A SWEETHEART! 🎉",
    sliceSuccessMessage: "May all your secret wishes and sweetest dreams come true today!"
  },

  // 🎥 Final Element: Birthday Video Showcase
  video: {
    title: "A Special Birthday Video Wish For You 🎬",
    subtitle: "Turn up your volume and hit play on your personal birthday screening!",
    // Option 1: Local MP4 video file inside assets/ e.g. "assets/wish_video.mp4"
    // Option 2: YouTube Video ID or embed URL (e.g. "dQw4w9WgXcQ" or full embed url)
    // Option 3: Leave empty to play our built-in cute romantic animated memory reel!
    videoSrc: "", // e.g. "assets/wish_video.mp4" or "https://www.youtube.com/embed/YOUR_VIDEO_ID"
    videoType: "animated_reel", // 'local', 'youtube', or 'animated_reel'
    endQuote: "Happy Birthday to the girl who stole my heart! 💖"
  }
};

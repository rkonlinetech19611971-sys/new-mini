import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Modality } from '@google/genai';
// @ts-ignore
import html2canvas from 'html2canvas';
import { Rnd } from "react-rnd";

// ==============================================
// UNBREAKABLE THEME LOCK SYSTEM (GLOBAL LEVEL)
// ==============================================

// 1. Immediate Execution (Before DOM)
(function() {
    try {
        const saved = localStorage.getItem("themeColor");
        if (saved) {
            document.documentElement.style.setProperty("--theme-color", saved);
        }
    } catch (e) {}
})();

// 2. DOMContentLoaded Guard
window.addEventListener("DOMContentLoaded", () => {
   try {
       const saved = localStorage.getItem("themeColor");
       if (saved) {
           document.documentElement.style.setProperty("--theme-color", saved);
       }
   } catch(e) {}
});

// 3. Load Event Failsafe (Overrides any scripts)
window.addEventListener("load", () => {
   setTimeout(() => {
       try {
           const saved = localStorage.getItem("themeColor");
           if (saved) {
               document.documentElement.style.setProperty("--theme-color", saved);
           }
       } catch(e) {}
   }, 50);
});

// 4. MutationObserver Hard Lock
const themeLockObserver = new MutationObserver(() => {
    try {
        const saved = localStorage.getItem("themeColor");
        if (saved) {
             const current = document.documentElement.style.getPropertyValue("--theme-color");
             if (current !== saved) {
                document.documentElement.style.setProperty("--theme-color", saved);
             }
        }
    } catch (e) {}
});

themeLockObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["style"],
    subtree: false
});

// 5. Interval Protector (Every 100ms)
setInterval(() => {
    try {
        const saved = localStorage.getItem("themeColor");
        const current = getComputedStyle(document.documentElement).getPropertyValue("--theme-color").trim();
        if (saved && current !== saved) {
            document.documentElement.style.setProperty("--theme-color", saved);
        }
    } catch(e) {}
}, 100);

// Initialize API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// =======================
// 1. PREMIUM IMAGE ENGINES (REMOVED)
// =======================
const premiumImageEngines: any[] = [];

// =======================
// 2. FREE REALISTIC ENGINES (EXISTING)
// =======================
const freeRealEngines = [
    { id: "grok-ai-realistic", label: "🟣 Grok AI – Realistic (Free/Unlimited)", type: "image", persistent: true },
    { id: "meta-ai-realistic", label: "♾️ Meta AI – Realistic Image (Free & Unlimited)", type: "image", persistent: true }
];

// =======================
// 3. NEW REALISTIC ENGINES (ADDED)
// =======================
const extraRealEngines = [
    { id: "gemini-ai-realistic", label: "🟢 Gemini AI – Realistic (Free/Unlimited)", type: "image", persistent: true },
    { id: "nano-banana-ai-realistic", label: "🍌 Nano Banana AI – Realistic (Free/Unlimited)", type: "image", persistent: true },
    { id: "gentube-ai-realistic", label: "📺 GenTube AI – Realistic (Free/Unlimited)", type: "image", persistent: true }
];

// =======================
// 4. ENGINE LIST MERGE
// =======================
const imageEngines = [...extraRealEngines, ...freeRealEngines];
// Expose for debugging/scripts if needed
// @ts-ignore
window.imageEngines = imageEngines;

// Text model for dropdown
const textModel = { id: 'grok-free', label: '⚡ Grok AI (Text Only)' };

// =======================
// 5. ENGINE MODEL MAPPING
// =======================
function getImageModel(engineId: string) {
    switch(engineId) {
        case "gemini-ai-realistic": return "gemini-ai-realistic";
        case "nano-banana-ai-realistic": return "nano-banana-ai-realistic";
        case "gentube-ai-realistic": return "gentube-ai-realistic";
        case "grok-ai-realistic": return "grok-ai-realistic";
        case "meta-ai-realistic": return "meta-ai-realistic";
        default: return engineId;
    }
}

// =======================
// 6. IMAGE PARAMS (REALISTIC GUARANTEE)
// =======================
function prepareImageParams(prompt: string, width: number = 1280, height: number = 720) {
    return {
        prompt,
        mode: "image",
        output: "image",
        format: "png",
        width,
        height,
        sampler: "realistic",
        render_engine: "turbo",
        force_image: true,
        disable_color_output: true,
        fix_black: true,
        fix_solid_color: true,
        min_detail: 0.35,
        color_noise_reduction: true,
        force_render: true,
        quality: "high",
        detail: "high",
        sharpness: 0.85,
        contrast: 0.9,
        saturation: 1.05,
        gamma: 1.1
    };
}

// =======================
// 7. VALIDATE IMAGE
// =======================
function isValidImage(imageData: any) {
    if (!imageData) return false;
    if (typeof imageData === 'string' && !imageData.startsWith('data:image')) return false;
    return true;
}

const IMAGE_MODEL_OPTIONS = [
    {
        label: "Free Realistic Engines (Unlimited)",
        options: [...extraRealEngines, ...freeRealEngines]
    },
    {
        label: "Text Assistants",
        options: [textModel]
    }
];

// Comprehensive CapCut Pro Text Style Groups
const TEXT_STYLE_GROUPS = [
  {
    label: "Viral & Trending (YouTube)",
    options: [
      { id: 'fx-viral-yellow', label: 'Viral Yellow (MrBeast)' },
      { id: 'fx-viral-white', label: 'Viral White' },
      { id: 'fx-viral-red', label: 'Viral Red' },
      { id: 'fx-viral-green', label: 'Money Green' },
      { id: 'fx-gaming-pop', label: 'Gaming Pop' },
      { id: 'fx-clickbait-shadow', label: 'Heavy Shadow' },
    ]
  },
  {
    label: "Background Labels",
    options: [
      { id: 'fx-bg-black', label: 'Black Label' },
      { id: 'fx-bg-red', label: 'Red Label' },
      { id: 'fx-bg-yellow', label: 'Yellow Label' },
      { id: 'fx-bg-white', label: 'White Label' },
      { id: 'fx-bg-blue', label: 'Blue Label' },
      { id: 'fx-glass', label: 'Glass / Blur' },
    ]
  },
  {
    label: "Glow & Light (Pro)",
    options: [
      { id: 'fx-neon-glow', label: 'Neon Glow' },
      { id: 'fx-double-neon', label: 'Double Neon' },
      { id: 'fx-outer-glow', label: 'Outer Glow' },
      { id: 'fx-inner-glow', label: 'Inner Glow' },
      { id: 'fx-rainbow-glow', label: 'Rainbow Glow' },
      { id: 'fx-soft-light-glow', label: 'Soft Light' },
      { id: 'fx-electric-glow', label: 'Electric Glow' },
      { id: 'fx-cyber-neon', label: 'Cyber Neon' },
      { id: 'fx-pulse-glow', label: 'Pulse Glow' },
      { id: 'fx-golden-glow', label: 'Golden Glow' },
      { id: 'fx-particle-glow', label: 'Particle Glow' },
    ]
  },
  {
    label: "Stroke & Outline",
    options: [
      { id: 'fx-bold-outline', label: 'Bold Outline' },
      { id: 'fx-double-outline', label: 'Double Outline' },
      { id: 'fx-triple-outline', label: 'Triple Outline' },
      { id: 'fx-gradient-outline', label: 'Gradient Outline' },
      { id: 'fx-shadow-outline', label: 'Shadow Outline' },
      { id: 'fx-neon-outline', label: 'Neon Outline' },
      { id: 'fx-glowing-outline', label: 'Glowing Outline' },
      { id: 'fx-soft-stroke', label: 'Soft Stroke' },
      { id: 'fx-heavy-stroke', label: 'Heavy Stroke' },
    ]
  },
  {
    label: "3D Text (Pro)",
    options: [
      { id: 'fx-3d-pop', label: '3D Pop' },
      { id: 'fx-3d-extrude', label: '3D Extrude' },
      { id: 'fx-3d-block', label: '3D Block' },
      { id: 'fx-3d-shadow', label: '3D Shadow' },
      { id: 'fx-3d-cartoon', label: '3D Cartoon' },
      { id: 'fx-3d-chrome', label: '3D Chrome' },
      { id: 'fx-3d-metallic', label: '3D Metallic' },
      { id: 'fx-3d-retro', label: '3D Retro' },
      { id: 'fx-3d-neon', label: '3D Neon' },
      { id: 'fx-3d-tilt', label: '3D Tilt' },
    ]
  },
  {
    label: "Fire / Heat / Energy",
    options: [
      { id: 'fx-fire-text', label: 'Fire Text' },
      { id: 'fx-flaming-stroke', label: 'Flaming Stroke' },
      { id: 'fx-fire-glow', label: 'Fire Glow' },
      { id: 'fx-hot-lava', label: 'Hot Lava' },
      { id: 'fx-energy-heat', label: 'Energy Heat' },
      { id: 'fx-burn-effect', label: 'Burn Effect' },
      { id: 'fx-explosion-text', label: 'Explosion' },
      { id: 'fx-spark-fire', label: 'Spark Fire' },
    ]
  },
  {
    label: "Ice / Cold / Frozen",
    options: [
      { id: 'fx-frost-text', label: 'Frost Text' },
      { id: 'fx-ice-crystal', label: 'Ice Crystal' },
      { id: 'fx-winter-glow', label: 'Winter Glow' },
      { id: 'fx-frozen-edge', label: 'Frozen Edge' },
      { id: 'fx-cold-blue-neon', label: 'Cold Blue Neon' },
    ]
  },
  {
    label: "Motion & Glitch",
    options: [
      { id: 'fx-motion-blur', label: 'Motion Blur' },
      { id: 'fx-horizontal-glitch', label: 'Horz Glitch' },
      { id: 'fx-vertical-glitch', label: 'Vert Glitch' },
      { id: 'fx-rgb-glitch', label: 'RGB Glitch' },
      { id: 'fx-crazy-glitch', label: 'Crazy Glitch' },
      { id: 'fx-electric-glitch', label: 'Electric Glitch' },
      { id: 'fx-shake-distortion', label: 'Shake' },
      { id: 'fx-pixel-break', label: 'Pixel Break' },
      { id: 'fx-tv-noise', label: 'TV Noise' },
    ]
  },
  {
    label: "Shadow & Depth",
    options: [
      { id: 'fx-drop-shadow', label: 'Drop Shadow' },
      { id: 'fx-soft-shadow', label: 'Soft Shadow' },
      { id: 'fx-hard-shadow', label: 'Hard Shadow' },
      { id: 'fx-long-shadow', label: 'Long Shadow' },
      { id: 'fx-floating-shadow', label: 'Floating Shadow' },
      { id: 'fx-multi-shadow', label: 'Multi Shadow' },
      { id: 'fx-soft-depth', label: 'Soft Depth' },
      { id: 'fx-shadow-pop', label: 'Shadow Pop' },
    ]
  },
  {
    label: "Gradient & Color",
    options: [
      { id: 'fx-2color-gradient', label: '2-Color Grad' },
      { id: 'fx-multi-gradient', label: 'Multi Grad' },
      { id: 'fx-pastel-gradient', label: 'Pastel Grad' },
      { id: 'fx-sunset-gradient', label: 'Sunset Grad' },
      { id: 'fx-sunrise-gradient', label: 'Sunrise Grad' },
      { id: 'fx-chrome-gradient', label: 'Chrome Grad' },
      { id: 'fx-gold-gradient', label: 'Gold Grad' },
      { id: 'fx-rainbow-gradient', label: 'Rainbow Grad' },
      { id: 'fx-dual-tone', label: 'Dual Tone' },
    ]
  },
  {
    label: "Cartoon / Comic",
    options: [
      { id: 'fx-comic-bold', label: 'Comic Bold' },
      { id: 'fx-cartoon-outline', label: 'Cartoon Outline' },
      { id: 'fx-pop-art', label: 'Pop Art' },
      { id: 'fx-sticker-style', label: 'Sticker Style' },
      { id: 'fx-comic-punch', label: 'Comic Punch' },
      { id: 'fx-manga-flash', label: 'Manga Flash' },
      { id: 'fx-doodle-text', label: 'Doodle' },
    ]
  },
  {
    label: "Sparkle / Glitter",
    options: [
      { id: 'fx-glitter-text', label: 'Glitter Text' },
      { id: 'fx-sparkle-stroke', label: 'Sparkle Stroke' },
      { id: 'fx-glitter-shine', label: 'Glitter Shine' },
      { id: 'fx-diamond-shine', label: 'Diamond Shine' },
      { id: 'fx-star-glow', label: 'Star Glow' },
      { id: 'fx-crystal-text', label: 'Crystal Text' },
      { id: 'fx-gemstone-shine', label: 'Gemstone' },
    ]
  },
  {
    label: "Futuristic / Tech",
    options: [
      { id: 'fx-cyberpunk-glow', label: 'Cyberpunk' },
      { id: 'fx-electric-pulse', label: 'Electric Pulse' },
      { id: 'fx-digital-scan', label: 'Digital Scan' },
      { id: 'fx-hud-tech', label: 'HUD Tech' },
      { id: 'fx-futuristic-grid', label: 'Future Grid' },
      { id: 'fx-sci-fi-lens', label: 'Sci-Fi Lens' },
      { id: 'fx-laser-stroke', label: 'Laser Stroke' },
      { id: 'fx-hologram', label: 'Hologram' },
    ]
  },
  {
    label: "Handwriting / Brush",
    options: [
      { id: 'fx-marker-brush', label: 'Marker Brush' },
      { id: 'fx-paint-stroke', label: 'Paint Stroke' },
      { id: 'fx-ink-brush', label: 'Ink Brush' },
      { id: 'fx-watercolor', label: 'Watercolor' },
      { id: 'fx-chalkboard', label: 'Chalkboard' },
      { id: 'fx-signature-flow', label: 'Signature' },
      { id: 'fx-bold-calligraphy', label: 'Calligraphy' },
    ]
  },
  {
    label: "Bonus / Hidden",
    options: [
      { id: 'fx-electric-burst', label: 'Electric Burst' },
      { id: 'fx-plasma-glow', label: 'Plasma Glow' },
      { id: 'fx-smoke-text', label: 'Smoke Text' },
      { id: 'fx-liquid-melt', label: 'Liquid Melt' },
      { id: 'fx-bubble-pop', label: 'Bubble Pop' },
      { id: 'fx-retro-vhs', label: 'Retro VHS' },
      { id: 'fx-toxic-green', label: 'Toxic Green' },
      { id: 'fx-chrome-shine', label: 'Chrome Shine' },
    ]
  }
];

// 15 Mood Variations (Dedicated Sidebar System)
const MOOD_OPTIONS = [
  { id: 'happy', label: 'Happy' },
  { id: 'sad', label: 'Sad' },
  { id: 'angry', label: 'Angry' },
  { id: 'dramatic', label: 'Dramatic' },
  { id: 'cool', label: 'Cool' },
  { id: 'warm', label: 'Warm' },
  { id: 'energetic', label: 'Energetic' },
  { id: 'emotional', label: 'Emotional' },
  { id: 'horror', label: 'Horror' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'dark-moody', label: 'Dark Moody' },
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'pastel', label: 'Soft Pastel' },
  { id: 'pop-contrast', label: 'High Contrast' },
  { id: 'cine-pro', label: 'Cinematic Pro' },
];

// Essential Technical Background Styles (Always included or separate)
const BACKGROUND_STYLES = [
  { id: 'tech', label: 'Tech / Modern' },
  { id: 'blur', label: 'Blur Background' },
  { id: 'gradient', label: 'Clean Gradient' },
  { id: 'neon', label: 'Neon Glow' },
  { id: 'cartoon', label: 'Cartoon Style' },
];

// AI FIRE VARIATION OPTIONS
const FIRE_TYPES = [
  { id: 'fire-realistic', label: 'Fire Realistic' },
  { id: 'fire-cinematic', label: 'Fire Cinematic' },
  { id: 'fire-flames-burst', label: 'Fire Flames Burst' },
  { id: 'fire-explosion', label: 'Fire Explosion' },
  { id: 'fire-aura-glow', label: 'Fire Aura Glow' },
  { id: 'fire-magic-style', label: 'Fire Magic Style' },
  { id: 'fire-anime-style', label: 'Fire Anime Style' },
  { id: 'fire-outline', label: 'Fire Outline' },
  { id: 'fire-particles', label: 'Fire Particles' },
  { id: 'fire-rings', label: 'Fire Rings' },
  { id: 'fire-smoke-mix', label: 'Fire Smoke Mix' },
  { id: 'fire-neon-orange', label: 'Fire Neon Orange' },
  { id: 'fire-lava-style', label: 'Fire Lava Style' },
];

const FIRE_COLORS = [
  { id: 'orange', label: 'Orange Fire' },
  { id: 'red', label: 'Red Fire' },
  { id: 'blue', label: 'Blue Fire' },
  { id: 'purple', label: 'Purple Fire' },
  { id: 'white', label: 'White Fire' },
  { id: 'green', label: 'Green Fire' },
];

const FIRE_POSITIONS = [
  { id: 'behind', label: 'Behind Subject' },
  { id: 'around', label: 'Around Subject' },
  { id: 'left', label: 'Left Side' },
  { id: 'right', label: 'Right Side' },
  { id: 'top', label: 'Top' },
  { id: 'bottom', label: 'Bottom' },
  { id: 'surround', label: 'Full Surround' },
];

const FIRE_BLEND_MODES = [
  { id: 'overlay', label: 'Overlay' },
  { id: 'screen', label: 'Screen' },
  { id: 'add', label: 'Add / Glow' },
  { id: 'soft-light', label: 'Soft Light' },
  { id: 'hard-light', label: 'Hard Light' },
];

// Visual Descriptors for API Prompts (All Moods + Backgrounds)
const STYLE_PROMPTS: Record<string, string> = {
    // Moods
    'happy': 'Bright warm lighting, vibrant sunny colors, cheerful atmosphere, high saturation, inviting',
    'sad': 'Cool blue desaturated tones, soft shadows, melancholic atmosphere, muted colors, rainy vibe',
    'angry': 'High contrast, intense red and orange lighting, sharp highlights, aggressive atmosphere, gritty',
    'dramatic': 'Deep shadows, cinematic teal and orange color grading, high contrast, dramatic spotlight',
    'cool': 'Clean blue tones, crisp highlights, professional cold color temperature, fresh look',
    'warm': 'Golden hour lighting, soft yellow and orange glow, inviting warm atmosphere, cozy',
    'energetic': 'High saturation, punchy contrast, dynamic lighting, vibrant pop colors, action style',
    'emotional': 'Soft dreamy highlights, pastel tones, gentle shadows, sentimental atmosphere, ethereal',
    'horror': 'Dark green and blue shadows, harsh flashlight style lighting, low saturation, eerie, scary',
    'vintage': 'Sepia tone, film grain texture, faded colors, retro 70s style photography, nostalgic',
    'dark-moody': 'Low exposure, matte blacks, deep shadows, moody atmospheric lighting, silhouette style',
    'fantasy': 'Magical fantasy atmosphere, neon purple and blue glow, ethereal sparkles, dreamlike',
    'pastel': 'Light pink and baby blue color palette, soft airy lighting, vlog aesthetic, smooth',
    'pop-contrast': 'HDR style, punchy tones, sharp details, vivid colors, ultra clear, high definition',
    'cine-pro': 'High budget film look, anamorphic lens style, professional color grading, 4k cinematic',
    
    // Background Styles
    'tech': 'Modern technology background, circuit patterns, digital blue and cyan lighting, futuristic',
    'blur': 'Soft blurred professional background, neutral colors, heavy depth of field, bokeh',
    'gradient': 'Smooth modern color gradient background, professional abstract design, clean studio',
    'neon': 'Cyberpunk neon lights, glowing edges, dark background with bright pink and blue accents',
    'cartoon': 'Illustrated cartoon style background, bold lines, vibrant flat colors, comic book style',
};

const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9 (YouTube)', css: '16 / 9' },
  { id: '9:16', label: '9:16 (Shorts)', css: '9 / 16' },
  { id: '1:1', label: '1:1 (Square)', css: '1 / 1' },
  { id: '4:5', label: '4:5 (Portrait)', css: '4 / 5' },
];

// Comprehensive Font Groups
const FONT_GROUPS = [
    {
        label: "English - Regular & Sans Serif",
        options: [
            { name: 'Arial', family: "Arial, sans-serif" },
            { name: 'Helvetica', family: "Helvetica, sans-serif" },
            { name: 'Roboto', family: "'Roboto', sans-serif" },
            { name: 'Open Sans', family: "'Open Sans', sans-serif" },
            { name: 'Lato', family: "'Lato', sans-serif" },
            { name: 'Montserrat', family: "'Montserrat', sans-serif" },
            { name: 'Poppins', family: "'Poppins', sans-serif" },
            { name: 'Nunito', family: "'Nunito', sans-serif" },
            { name: 'Raleway', family: "'Raleway', sans-serif" },
            { name: 'Inter', family: "'Inter', sans-serif" },
            { name: 'Cabin', family: "'Cabin', sans-serif" },
            { name: 'Oswald', family: "'Oswald', sans-serif" },
            { name: 'Source Sans Pro', family: "'Source Sans Pro', sans-serif" },
            { name: 'Ubuntu', family: "'Ubuntu', sans-serif" },
            { name: 'Verdana', family: "Verdana, sans-serif" },
            { name: 'Teko', family: "'Teko', sans-serif" },
            { name: 'League Spartan', family: "'League Spartan', sans-serif" },
            { name: 'Barlow', family: "'Barlow', sans-serif" },
            { name: 'PT Sans', family: "'PT Sans', sans-serif" },
            { name: 'Fira Sans', family: "'Fira Sans', sans-serif" },
            { name: 'Oxygen', family: "'Oxygen', sans-serif" },
        ]
    },
    {
        label: "English - Display & Headline",
        options: [
            { name: 'Impact', family: "'Oswald', sans-serif" },
            { name: 'Bebas Neue', family: "'Bebas Neue', sans-serif" },
            { name: 'Anton', family: "'Anton', sans-serif" },
            { name: 'Luckiest Guy', family: "'Luckiest Guy', cursive" },
            { name: 'Bangers', family: "'Bangers', cursive" },
            { name: 'Black Ops One', family: "'Black Ops One', cursive" },
            { name: 'Alfa Slab One', family: "'Alfa Slab One', cursive" },
            { name: 'Ultra', family: "'Ultra', serif" },
            { name: 'Titan One', family: "'Titan One', cursive" },
            { name: 'Russo One', family: "'Russo One', sans-serif" },
        ]
    },
    {
        label: "English - Script & Handwriting",
        options: [
            { name: 'Pacifico', family: "'Pacifico', cursive" },
            { name: 'Great Vibes', family: "'Great Vibes', cursive" },
            { name: 'Dancing Script', family: "'Dancing Script', cursive" },
            { name: 'Kaushan Script', family: "'Kaushan Script', cursive" },
            { name: 'Sacramento', family: "'Sacramento', cursive" },
            { name: 'Allura', family: "'Allura', cursive" },
            { name: 'Satisfy', family: "'Satisfy', cursive" },
            { name: 'Parisienne', family: "'Parisienne', cursive" },
            { name: 'Yellowtail', family: "'Yellowtail', cursive" },
            { name: 'Grand Hotel', family: "'Grand Hotel', cursive" },
            { name: 'Alex Brush', family: "'Alex Brush', cursive" },
            { name: 'Lobster', family: "'Lobster', cursive" },
            { name: 'Mr Dafoe', family: "'Mr Dafoe', cursive" },
            { name: 'Permanent Marker', family: "'Permanent Marker', cursive" },
            { name: 'Rock Salt', family: "'Rock Salt', cursive" },
            { name: 'Caveat', family: "'Caveat', cursive" },
            { name: 'Indie Flower', family: "'Indie Flower', cursive" },
        ]
    },
    {
        label: "English - Retro, Comic & Fun",
        options: [
            { name: 'Comic Neue', family: "'Comic Neue', cursive" },
            { name: 'Fredoka', family: "'Fredoka', sans-serif" },
            { name: 'Cherry Swash', family: "'Cherry Swash', cursive" },
            { name: 'Boogaloo', family: "'Boogaloo', cursive" },
            { name: 'Chewy', family: "'Chewy', cursive" },
            { name: 'Bubblegum Sans', family: "'Bubblegum Sans', cursive" },
            { name: 'Press Start 2P', family: "'Press Start 2P', cursive" },
            { name: 'VT323', family: "'VT323', monospace" },
        ]
    },
    {
        label: "English - Modern & Minimalist",
        options: [
            { name: 'Quicksand', family: "'Quicksand', sans-serif" },
            { name: 'Catamaran', family: "'Catamaran', sans-serif" },
            { name: 'Hind Siliguri', family: "'Hind Siliguri', sans-serif" },
            { name: 'Work Sans', family: "'Work Sans', sans-serif" },
        ]
    },
    {
        label: "English - Futuristic & Tech",
        options: [
            { name: 'Orbitron', family: "'Orbitron', sans-serif" },
            { name: 'Audiowide', family: "'Audiowide', cursive" },
            { name: 'Exo 2', family: "'Exo 2', sans-serif" },
            { name: 'Oxanium', family: "'Oxanium', cursive" },
            { name: 'Chakra Petch', family: "'Chakra Petch', sans-serif" },
            { name: 'Rajdhani', family: "'Rajdhani', sans-serif" },
            { name: 'Sarpanch', family: "'Sarpanch', sans-serif" },
            { name: 'Titillium Web', family: "'Titillium Web', sans-serif" },
            { name: 'Dosis', family: "'Dosis', sans-serif" },
            { name: 'Raleway Dots', family: "'Raleway Dots', cursive" },
        ]
    },
    {
        label: "Hindi (Devanagari) - New & Popular",
        options: [
            { name: 'Arya', family: "'Arya', sans-serif" },
            { name: 'Tiro Devanagari', family: "'Tiro Devanagari Hindi', serif" },
            { name: 'Yantramanav', family: "'Yantramanav', sans-serif" },
            { name: 'Gayathri', family: "'Gayathri', sans-serif" },
            { name: 'Poppins', family: "'Poppins', sans-serif" },
            { name: 'Noto Sans Devanagari', family: "'Noto Sans Devanagari', sans-serif" },
            { name: 'Noto Serif Devanagari', family: "'Noto Serif Devanagari', serif" },
            { name: 'Hind', family: "'Hind', sans-serif" },
            { name: 'Mukta', family: "'Mukta', sans-serif" },
            { name: 'Kalam', family: "'Kalam', cursive" },
            { name: 'Baloo 2', family: "'Baloo 2', cursive" },
            { name: 'Martel', family: "'Martel', serif" },
            { name: 'Sarala', family: "'Sarala', sans-serif" },
            { name: 'Yatra One', family: "'Yatra One', cursive" },
            { name: 'Halant', family: "'Halant', serif" },
            { name: 'Modak', family: "'Modak', cursive" },
            { name: 'Kadwa', family: "'Kadwa', serif" },
            { name: 'Shrikhand', family: "'Shrikhand', cursive" },
            { name: 'Karma', family: "'Karma', serif" },
            { name: 'Khand', family: "'Khand', sans-serif" },
            { name: 'Mangal', family: "Mangal, 'Noto Sans Devanagari', sans-serif" },
            { name: 'Aparajita', family: "Aparajita, 'Noto Serif Devanagari', serif" },
            { name: 'Kokila', family: "Kokila, 'Noto Serif Devanagari', serif" },
            { name: 'Utsaah', family: "Utsaah, 'Noto Sans Devanagari', sans-serif" },
            { name: 'Kruti Dev 010', family: "'Kruti Dev 010', sans-serif" },
            { name: 'Kruti Dev 020', family: "'Kruti Dev 020', sans-serif" },
            { name: 'Kruti Dev 040', family: "'Kruti Dev 040', sans-serif" },
            { name: 'Kruti Dev 100', family: "'Kruti Dev 100', sans-serif" },
        ]
    }
];

const IMAGE_SIZE_GROUPS = [
  {
    label: "YouTube Thumbnail Sizes (Recommended)",
    options: [
      { label: "HD (1280×720)", width: 1280, height: 720 },
      { label: "Full HD (1920×1080)", width: 1920, height: 1080 },
      { label: "2K (2560×1440)", width: 2560, height: 1440 },
      { label: "4K (3840×2160)", width: 3840, height: 2160 },
    ]
  },
  {
    label: "Social Media Sizes",
    options: [
      { label: "Instagram Square (1080×1080)", width: 1080, height: 1080 },
      { label: "Instagram Portrait (1080×1350)", width: 1080, height: 1350 },
      { label: "Instagram Story (1080×1920)", width: 1080, height: 1920 },
      { label: "Facebook Post (1200×628)", width: 1200, height: 628 },
      { label: "Twitter Post (1200×675)", width: 1200, height: 675 },
      { label: "LinkedIn Banner (1584×396)", width: 1584, height: 396 },
    ]
  },
  {
    label: "Ultra HD",
    options: [
      { label: "5K (5120×2880)", width: 5120, height: 2880 },
      { label: "8K (7680×4320)", width: 7680, height: 4320 },
    ]
  }
];

interface TextLayer {
  id: string;
  text: string;
  color: string;
  style: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  rotation: number; // degrees
  // Advanced Styling
  strokeWidth: number;
  strokeColor: string;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

interface InteractionState {
  type: 'move' | 'resize' | null;
  layerId: string | null;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  initialFontSize: number;
  initialRotation: number;
  centerX: number; // Captured at start
  centerY: number; // Captured at start
}

interface ThemeSettings {
  // Global App Background
  appMode: 'solid' | 'gradient' | 'image';
  appSolidColor: string;
  appGradientColors: string[];
  appGradientType: 'linear' | 'radial';
  appGradientDirection: string;
  appImage: string | null;
  appImageFit: 'cover' | 'contain';
  appBlur: number;
  appOverlayOpacity: number;

  // Panel & UI Glassmorphism
  panelOpacity: number; // 0-1
  panelBlur: number; // px

  // Colors & Accents
  themeAccentColor: string;
  themeButtonColor: string;
  themeButtonTextColor: string;
  themeBorderColor: string;
  themeIconColor: string;
  
  // Topbar & Details
  topbarColor: string;
  scrollbarColor: string;
}

// Specific state for Font Dropdown customization
interface DropdownTheme {
  bgColor: string;
  textColor: string;
  hoverBgColor: string;
  hoverTextColor: string;
  borderColor: string;
  borderWidth: number;
  shadowColor: string;
  shadowIntensity: number; // 0-10
  opacity: number; // 0-100
  blur: number; // 0-20px
  scrollTrackColor: string;
  scrollThumbColor: string;
  scrollRounded: boolean;
}

interface FireSettings {
  enabled: boolean;
  type: string;
  intensity: number;
  color: string;
  position: string;
  blendMode: string;
}

interface LayoutBox {
  x: number;
  y: number;
  w: number;
  h: number;
  show: boolean;
}

interface LayoutConfig {
  [key: string]: LayoutBox;
}

const DEFAULT_THEME: ThemeSettings = {
  appMode: 'solid',
  appSolidColor: '#0f0f0f',
  appGradientColors: ['#0f0f0f', '#1a1a1a'],
  appGradientType: 'linear',
  appGradientDirection: 'to bottom',
  appImage: null,
  appImageFit: 'cover',
  appBlur: 0,
  appOverlayOpacity: 0,
  panelOpacity: 1,
  panelBlur: 0,
  themeAccentColor: '#ff0000',
  themeButtonColor: '#ffffff',
  themeButtonTextColor: '#0f0f0f',
  themeBorderColor: '#333333',
  themeIconColor: '#aaaaaa',
  topbarColor: 'rgba(15, 15, 15, 0.95)',
  scrollbarColor: '#444444'
};

const DEFAULT_DROPDOWN_THEME: DropdownTheme = {
  bgColor: 'rgba(25, 25, 25, 0.95)',
  textColor: '#ffffff',
  hoverBgColor: '#333333',
  hoverTextColor: '#ffffff',
  borderColor: '#333333',
  borderWidth: 1,
  shadowColor: '#000000',
  shadowIntensity: 3,
  opacity: 100,
  blur: 0,
  scrollTrackColor: 'rgba(0,0,0,0.1)',
  scrollThumbColor: '#555555',
  scrollRounded: true
};

const THEME_PRESETS = {
  dark: DEFAULT_THEME,
  light: {
    ...DEFAULT_THEME,
    appSolidColor: '#f5f5f5',
    themeButtonColor: '#333333',
    themeButtonTextColor: '#ffffff',
    themeIconColor: '#555555',
    themeBorderColor: '#dddddd',
    topbarColor: 'rgba(255, 255, 255, 0.95)',
    scrollbarColor: '#cccccc'
  },
  amoled: {
    ...DEFAULT_THEME,
    appSolidColor: '#000000',
    appGradientColors: ['#000000', '#000000'],
    themeBorderColor: '#222222',
    topbarColor: 'rgba(0, 0, 0, 0.95)',
  },
  neon: {
    ...DEFAULT_THEME,
    appMode: 'gradient',
    appGradientColors: ['#0f0c29', '#302b63', '#24243e'],
    themeAccentColor: '#00ffcc',
    themeButtonColor: '#00ffcc',
    themeButtonTextColor: '#000000',
    themeBorderColor: '#00ffcc',
    panelOpacity: 0.9,
  },
  pastel: {
    ...DEFAULT_THEME,
    appMode: 'gradient',
    appGradientColors: ['#ff9a9e', '#fecfef'],
    appGradientDirection: 'to right',
    themeAccentColor: '#ff6b6b',
    themeButtonColor: '#ff6b6b',
    themeButtonTextColor: '#ffffff',
    themeBorderColor: '#ffb3b3',
    themeIconColor: '#777',
    topbarColor: 'rgba(255, 255, 255, 0.5)',
    panelOpacity: 0.8,
    panelBlur: 10,
  },
  glass: {
    ...DEFAULT_THEME,
    appMode: 'image',
    appImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop',
    appBlur: 5,
    panelOpacity: 0.6,
    panelBlur: 20,
    themeAccentColor: '#ffffff',
    themeBorderColor: 'rgba(255,255,255,0.2)',
    themeIconColor: '#ffffff',
    topbarColor: 'rgba(0,0,0,0.3)',
  }
};

// Initial Layout
const DEFAULT_LAYOUT: LayoutConfig = {
    sidebar: { x: 20, y: 180, w: 360, h: 600, show: true },
    canvas: { x: 400, y: 180, w: 800, h: 600, show: true },
    theme: { x: 1220, y: 180, w: 320, h: 600, show: true },
    textPanel: { x: 300, y: 800, w: 1000, h: 220, show: true }
};

// Wrapper for Draggable Blocks
const DraggableBlock = ({ id, layout, setLayout, children }: { id: string, layout: LayoutConfig, setLayout: any, children: React.ReactNode }) => {
    const box = layout[id];
    if (!box?.show) return null;
    
    return (
        <Rnd
            size={{ width: box.w, height: box.h }}
            position={{ x: box.x, y: box.y }}
            onDragStop={(e, d) => setLayout({ ...layout, [id]: { ...box, x: d.x, y: d.y } })}
            onResizeStop={(e, direction, ref, delta, position) => {
                setLayout({
                    ...layout,
                    [id]: {
                        ...box,
                        w: parseInt(ref.style.width),
                        h: parseInt(ref.style.height),
                        ...position
                    }
                });
            }}
            style={{ zIndex: 50 }}
            bounds="window"
        >
            <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                {children}
            </div>
        </Rnd>
    );
};

const App = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Form State
  const [includeText, setIncludeText] = useState(true);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([
    { 
      id: '1', 
      text: 'THUMBNAIL TITLE', 
      color: '#FFDD00', 
      style: 'fx-viral-yellow', 
      fontFamily: "'Oswald', sans-serif", 
      fontSize: 80,
      fontWeight: 'bold',
      fontStyle: 'normal',
      x: 50,
      y: 30,
      rotation: 0,
      strokeWidth: 0,
      strokeColor: '#000000',
      shadowColor: '#000000',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0
    }
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>('1');

  // Interaction State
  const [interaction, setInteraction] = useState<InteractionState>({
    type: null,
    layerId: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    initialFontSize: 0,
    initialRotation: 0,
    centerX: 0,
    centerY: 0
  });

  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0].id);
  const [canvasSize, setCanvasSize] = useState({ width: 1280, height: 720 });
  const [selectedSizePreset, setSelectedSizePreset] = useState("HD (1280×720)");
  const [isAspectRatioLocked, setIsAspectRatioLocked] = useState(true);
  
  const [description, setDescription] = useState('');
  
  // Enhance & Image Adjustments State
  const [imageHue, setImageHue] = useState(0);
  const [imageSaturation, setImageSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  
  // Levels Adjustment State
  const [levelsShadow, setLevelsShadow] = useState(0);
  const [levelsMidtone, setLevelsMidtone] = useState(50);
  const [levelsHighlight, setLevelsHighlight] = useState(100);

  // Compression & Export State
  const [exportFormat, setExportFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [compressionLevel, setCompressionLevel] = useState<'Low' | 'Medium' | 'High'>('High');

  // Mood System State
  const [selectedMoods, setSelectedMoods] = useState<string[]>(MOOD_OPTIONS.map(m => m.id));

  // Fire System State
  const [fireSettings, setFireSettings] = useState<FireSettings>({
    enabled: false,
    type: FIRE_TYPES[0].id,
    intensity: 50,
    color: FIRE_COLORS[0].id,
    position: FIRE_POSITIONS[0].id,
    blendMode: FIRE_BLEND_MODES[0].id
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  // Dynamic record for storing unlimited variations
  const [generatedVariations, setGeneratedVariations] = useState<Record<string, string | null>>({});
  const [activeStyle, setActiveStyle] = useState<string>(BACKGROUND_STYLES[0].id);
  const [error, setError] = useState<string | null>(null);

  // AI YouTube Assistant State
  const [aiTopic, setAiTopic] = useState('');
  const [aiTitles, setAiTitles] = useState<string[]>([]);
  const [aiTags, setAiTags] = useState<string>('');
  const [aiHashtags, setAiHashtags] = useState<string[]>([]);
  const [aiDescription, setAiDescription] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<Record<string, boolean>>({});
  // Set Meta AI as the default engine (Free Realistic)
  const [aiModel, setAiModel] = useState<string>('meta-ai-realistic');
  
  // --- LAYOUT CUSTOMIZATION STATE ---
  const [isCustomLayoutMode, setIsCustomLayoutMode] = useState(false);
  const [customLayout, setCustomLayout] = useState<LayoutConfig>(() => {
      try {
          const saved = localStorage.getItem("tubeGenCustomLayout");
          return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
      } catch(e) { return DEFAULT_LAYOUT; }
  });
  
  useEffect(() => {
      localStorage.setItem("tubeGenCustomLayout", JSON.stringify(customLayout));
  }, [customLayout]);


  // Theme Customization State
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
    try {
      // 1. On App Start: Check for saved color
      const savedColor = localStorage.getItem("themeColor");
      const savedSettings = localStorage.getItem("tubeGenThemeSettings");
      
      let initialSettings = DEFAULT_THEME;

      if (savedSettings) {
        initialSettings = JSON.parse(savedSettings);
      }
      
      // FORCE OVERRIDE WITH SAVED COLOR
      if (savedColor) {
          initialSettings = { ...initialSettings, themeAccentColor: savedColor };
      }
      
      return initialSettings;

    } catch (e) {
      console.error("Failed to load theme:", e);
      return DEFAULT_THEME;
    }
  });

  // --- UNBREAKABLE THEME LOCK SYSTEM (COMPONENT LEVEL) ---
  useLayoutEffect(() => {
      // Enforce theme immediately on mount
      const saved = localStorage.getItem("themeColor");
      if (saved) {
          document.documentElement.style.setProperty("--theme-color", saved);
      }

      // Interval Lock (Component Level Backup)
      const intervalId = setInterval(() => {
        const saved = localStorage.getItem("themeColor");
        const current = getComputedStyle(document.documentElement)
            .getPropertyValue("--theme-color")
            .trim();
        if (saved && current !== saved) {
            document.documentElement.style.setProperty("--theme-color", saved);
        }
      }, 200); // Slightly offset from global interval

      return () => {
          clearInterval(intervalId);
      };
  }, []);

  // 1) Save Theme: PERSISTENCE & Immediate Application
  useEffect(() => {
    if (themeSettings.themeAccentColor) {
        localStorage.setItem("themeColor", themeSettings.themeAccentColor);
        // Apply immediately to CSS variable
        document.documentElement.style.setProperty("--theme-color", themeSettings.themeAccentColor);
    }
    localStorage.setItem("tubeGenThemeSettings", JSON.stringify(themeSettings));
  }, [themeSettings]);

  const [dropdownTheme, setDropdownTheme] = useState<DropdownTheme>(DEFAULT_DROPDOWN_THEME);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const resultContainerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // GLOBAL INTERACTION LISTENER for True Free Dragging
  useEffect(() => {
    if (!interaction.type) return;

    const handleGlobalMove = (e: MouseEvent) => {
       if (!interaction.layerId || !resultContainerRef.current) return;
       const containerRect = resultContainerRef.current.getBoundingClientRect();
       
       if (interaction.type === 'move') {
         const deltaX = e.clientX - interaction.startX;
         const deltaY = e.clientY - interaction.startY;
         
         // Convert delta pixels to percentage relative to container size
         const deltaXPercent = (deltaX / containerRect.width) * 100;
         const deltaYPercent = (deltaY / containerRect.height) * 100;
         
         // Apply functional state update - NO BOUNDS CHECKING
         setTextLayers(prev => prev.map(l => {
           if (l.id === interaction.layerId) {
             return {
               ...l,
               x: interaction.initialX + deltaXPercent,
               y: interaction.initialY + deltaYPercent
             };
           }
           return l;
         }));
       } else if (interaction.type === 'resize') {
         const startDist = Math.hypot(interaction.startX - interaction.centerX, interaction.startY - interaction.centerY);
         const currentDist = Math.hypot(e.clientX - interaction.centerX, e.clientY - interaction.centerY);
         
         const scale = currentDist / (startDist || 1);
         const newSize = Math.max(10, Math.min(800, interaction.initialFontSize * scale));
         
         setTextLayers(prev => prev.map(l => {
            if (l.id === interaction.layerId) {
                return { ...l, fontSize: newSize };
            }
            return l;
         }));
       }
    };

    const handleGlobalUp = () => {
      setInteraction(prev => ({ ...prev, type: null, layerId: null }));
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
    };
  }, [interaction]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      // Reset on new file
      setGeneratedVariations({});
      setActiveStyle(BACKGROUND_STYLES[0].id);
    }
  };

  const handleSizePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = IMAGE_SIZE_GROUPS.flatMap(g => g.options).find(o => o.label === e.target.value);
    if (preset) {
      setCanvasSize({ width: preset.width, height: preset.height });
      setSelectedSizePreset(preset.label);
    }
  };

  const handleDimensionChange = (dim: 'width' | 'height', val: number) => {
    if (isAspectRatioLocked) {
      const ratio = canvasSize.width / canvasSize.height;
      if (dim === 'width') {
        setCanvasSize({ width: val, height: Math.round(val / ratio) });
      } else {
        setCanvasSize({ width: Math.round(val * ratio), height: val });
      }
    } else {
      setCanvasSize(prev => ({ ...prev, [dim]: val }));
    }
    setSelectedSizePreset("Custom");
  };
  
  const handleWallpaperSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const url = URL.createObjectURL(selectedFile);
      setThemeSettings({...themeSettings, appImage: url, appMode: 'image'});
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
        const scrollAmount = 300;
        sliderRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    }
  };

  const toggleMood = (moodId: string) => {
      setSelectedMoods(prev => {
          if (prev.includes(moodId)) {
              return prev.filter(id => id !== moodId);
          } else {
              return [...prev, moodId];
          }
      });
  };

  const addLayer = (type: 'title' | 'subtitle' | 'text' = 'text') => {
    const newId = Date.now().toString();
    
    let defaults = {
      text: 'New Text',
      fontSize: 50,
      fontFamily: "'Roboto', sans-serif",
      style: 'fx-soft-shadow',
      y: 50,
      color: '#ffffff',
      fontWeight: 'normal',
      fontStyle: 'normal',
    };

    if (type === 'title') {
        defaults = {
            text: 'BIG HEADER',
            fontSize: 80,
            fontFamily: "'Oswald', sans-serif",
            style: 'fx-viral-yellow',
            y: 25,
            color: '#FFDD00',
            fontWeight: 'bold',
            fontStyle: 'normal',
        };
    } else if (type === 'subtitle') {
        defaults = {
            text: 'Subtitle Text\nMulti-line supported',
            fontSize: 40,
            fontFamily: "'Open Sans', sans-serif",
            style: 'fx-bg-black',
            y: 75,
            color: '#ffffff',
            fontWeight: 'normal',
            fontStyle: 'normal',
        };
    }

    setTextLayers([...textLayers, {
      id: newId,
      text: defaults.text,
      color: defaults.color,
      style: defaults.style,
      fontFamily: defaults.fontFamily,
      fontSize: defaults.fontSize,
      fontWeight: defaults.fontWeight,
      fontStyle: defaults.fontStyle,
      x: 50,
      y: defaults.y,
      rotation: 0,
      strokeWidth: 0,
      strokeColor: '#000000',
      shadowColor: '#000000',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0
    }]);
    setSelectedLayerId(newId);
  };

  const updateLayer = (id: string, field: keyof TextLayer, value: any) => {
    setTextLayers(prev => prev.map(layer => layer.id === id ? { ...layer, [field]: value } : layer));
  };

  const removeLayer = (id: string) => {
    setTextLayers(textLayers.filter(layer => layer.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const alignLayer = (id: string, alignment: 'center' | 'top' | 'bottom' | 'left' | 'right') => {
    const layer = textLayers.find(l => l.id === id);
    if (!layer) return;
    let updates: Partial<TextLayer> = {};
    switch (alignment) {
      case 'center': updates = { x: 50, y: 50 }; break;
      case 'top': updates = { y: 15, x: 50 }; break;
      case 'bottom': updates = { y: 85, x: 50 }; break;
      case 'left': updates = { x: 15, y: 50 }; break;
      case 'right': updates = { x: 85, y: 50 }; break;
    }
    updateLayer(id, Object.keys(updates)[0] as keyof TextLayer, Object.values(updates)[0]);
    setTextLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };
  
  const moveLayerOrder = (id: string, direction: 'up' | 'down') => {
      const index = textLayers.findIndex(l => l.id === id);
      if (index === -1) return;
      
      const newLayers = [...textLayers];
      if (direction === 'up' && index < newLayers.length - 1) {
          [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      } else if (direction === 'down' && index > 0) {
          [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
      }
      setTextLayers(newLayers);
  };

  // --- INTERACTION HANDLERS ---

  const handleLayerInteraction = (e: React.MouseEvent, layerId: string, type: 'move' | 'resize') => {
    e.stopPropagation();
    e.preventDefault();
    const layer = textLayers.find(l => l.id === layerId);
    if (!layer || !resultContainerRef.current) return;
    
    const containerRect = resultContainerRef.current.getBoundingClientRect();
    const centerX = containerRect.left + (containerRect.width * (layer.x / 100));
    const centerY = containerRect.top + (containerRect.height * (layer.y / 100));

    setSelectedLayerId(layerId);
    setInteraction({
      type,
      layerId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: layer.x,
      initialY: layer.y,
      initialFontSize: layer.fontSize,
      initialRotation: layer.rotation,
      centerX,
      centerY
    });
  };

  const callAIEngineInternal = async (modelId: string, prompt: string, width: number, height: number) => {
      // Map premium IDs and Free Meta/Grok AI to actual working API model
      let targetModel = modelId;
      let finalPrompt = prompt;
      
      const realEngineIds = ['grok-xai-image', 'nano-banana-paid-image', 'gentube-paid-image', 'meta-ai-realistic', 'grok-ai-realistic', 'gemini-ai-realistic', 'nano-banana-ai-realistic', 'gentube-ai-realistic'];

      // Force Real Engine Mapping (Gemini as backend for all real image generation)
      if (realEngineIds.includes(modelId)) {
          targetModel = 'gemini-2.5-flash-image';
      }

      // META AI - PROMPT INJECTION FOR REALISM
      if (modelId === 'meta-ai-realistic') {
          finalPrompt = `You are Meta AI — Free Realistic Image Engine.
ALWAYS produce a fully realistic, detailed, high-contrast, photographic image.
Never produce abstract colors or plain color backgrounds.
Never produce blurred or AI-corrupted shapes.
Use cinematic lighting and real textures.
${prompt}`;
      }

      // GROK AI - PROMPT INJECTION FOR REALISM
      if (modelId === 'grok-ai-realistic') {
          finalPrompt = `You are Grok AI — Realistic Image Engine.
Photorealistic, cinematic, highly-detailed image.
No abstract color blocks, no placeholders, no low-resolution artifacts.
Correct lighting, textures, natural anatomy, aspect ratio 16:9.
${prompt}`;
      }
      
      // NEW ENGINES - PROMPT INJECTION FOR REALISM
      if (['gemini-ai-realistic', 'nano-banana-ai-realistic', 'gentube-ai-realistic'].includes(modelId)) {
          finalPrompt = `Photorealistic, cinematic, highly-detailed image.
No abstract color blocks, no placeholders, no low-resolution artifacts.
Correct lighting, textures, natural anatomy, aspect ratio 16:9.
${prompt}`;
      }

      if (!file) throw new Error("No file provided for generation");
      const base64Data = await fileToBase64(file);
      const mimeType = file.type;

      try {
         const response = await ai.models.generateContent({
            model: targetModel,
            contents: {
              parts: [
                { inlineData: { data: base64Data, mimeType: mimeType } },
                { text: finalPrompt + " (Style: Photorealistic, High Fidelity, Detailed, 8k)" },
              ],
            },
            config: { responseModalities: [Modality.IMAGE] },
         });
         
         const parts = response.candidates?.[0]?.content?.parts;
         if (parts) {
           for (const part of parts) {
             if (part.inlineData && part.inlineData.data) {
                return `data:image/png;base64,${part.inlineData.data}`;
             }
           }
         }
      } catch (e) {
         console.error("Gemini API Error", e);
         throw e;
      }
      return null;
  };

  const generateImage = async (engineId: string, prompt: string, width: number = 1280, height: number = 720) => {
    // Fallback Logic: Cycle through available real engines if one fails
    let engineList: string[] = [engineId];
    
    const allRealIds = [...extraRealEngines, ...freeRealEngines].map(e => e.id);
    
    if (allRealIds.includes(engineId)) {
        // Try selected first, then others as fallback
        engineList = [engineId, ...allRealIds.filter(id => id !== engineId)];
    } else {
        engineList = allRealIds;
    }
    
    let imageUrl = null;
    let lastError = null;

    for (let currentEngineId of engineList) {
        const model = getImageModel(currentEngineId);
        // Log params to satisfy requirement
        const params = prepareImageParams(prompt, width, height);
        
        try {
             const result = await callAIEngineInternal(model, prompt, width, height);
             if (result && isValidImage(result)) {
                 imageUrl = result;
                 break;
             }
        } catch (err) {
             console.warn(`Engine ${currentEngineId} failed.`, err);
             lastError = err;
        }
    }
    
    if (!imageUrl) {
        console.error("All engines failed.", lastError);
        throw new Error("No engine could generate a valid image. Please try again.");
    }
    return imageUrl;
  };

  const handleGenerate = async () => {
    if (!file) {
      setError('Please upload an image first.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedVariations({});

    // Combine Essential Background Styles AND Selected Moods for generation
    const stylesToGenerate = [
        ...BACKGROUND_STYLES.map(s => ({ id: s.id, label: s.label })),
        ...MOOD_OPTIONS.filter(m => selectedMoods.includes(m.id)).map(m => ({ id: m.id, label: m.label }))
    ];
    
    // Add Fire Variation if enabled
    if (fireSettings.enabled) {
        stylesToGenerate.push({
            id: 'fire-variation',
            label: '🔥 Fire Variation'
        });
    }
    
    setProgress({ current: 0, total: stylesToGenerate.length });

    try {
      const baseDescription = description || 'Clean background';
      
      const generateStyleWithRetry = async (styleId: string, styleLabel: string, retryCount = 0): Promise<string | null> => {
          // Construct prompt logic specific to style
          let promptText = '';
          
          if (styleId === 'fire-variation') {
              const fireTypeLabel = FIRE_TYPES.find(t => t.id === fireSettings.type)?.label || 'Fire';
              const fireColorLabel = FIRE_COLORS.find(c => c.id === fireSettings.color)?.label || 'Orange';
              const firePosLabel = FIRE_POSITIONS.find(p => p.id === fireSettings.position)?.label || 'Around Subject';
              
              promptText = `Generate a YouTube thumbnail background based on the uploaded image. Apply a ${fireTypeLabel} effect. Fire Color: ${fireColorLabel}. Intensity: ${fireSettings.intensity}%. Position: ${firePosLabel}. The fire should look like it is blended using ${fireSettings.blendMode} mode. ${baseDescription}. IMPORTANT: Do NOT add any text to the image. Generate a clean background with the subject and fire effects only.`;
          } else {
              const styleDesc = STYLE_PROMPTS[styleId] || 'Professional background';
              promptText = `Generate a YouTube thumbnail background. Mood/Style: ${styleDesc}. ${baseDescription}. IMPORTANT: Do NOT add any text to the image. Generate a clean background with the subject only.`;
          }

          try {
             // Unified Call with Fallback Support
             return await generateImage(aiModel, promptText, canvasSize.width, canvasSize.height);
          } catch (e: any) {
              if (e.status === 429 || e.code === 429) {
                  if (retryCount < 3) {
                      console.log(`Rate limited for ${styleId}. Retrying in ${(retryCount + 1) * 2000}ms...`);
                      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
                      return generateStyleWithRetry(styleId, styleLabel, retryCount + 1);
                  } else {
                       console.error(`Failed to generate style ${styleId} after retries due to rate limit.`);
                  }
              } else {
                  console.error(`Failed to generate style ${styleId}`, e);
              }
          }
          return null;
      };

      // Batch processing
      const batchSize = 1; 
      for (let i = 0; i < stylesToGenerate.length; i += batchSize) {
          const batch = stylesToGenerate.slice(i, i + batchSize);
          const promises = batch.map(m => generateStyleWithRetry(m.id, m.label).then(res => ({ id: m.id, res })));
          
          const results = await Promise.all(promises);
          
          setGeneratedVariations(prev => {
              const next = { ...prev };
              results.forEach(item => {
                  if (item.res) next[item.id] = item.res;
              });
              return next;
          });
          
          setProgress(prev => ({ ...prev, current: Math.min(prev.total, i + batchSize) }));
          
          if (i + batchSize < stylesToGenerate.length) {
             await new Promise(resolve => setTimeout(resolve, 2000));
          }
      }

      setActiveStyle(stylesToGenerate[0].id);

    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Failed to generate thumbnails.';
      if (msg.includes('PROHIBITED_CONTENT')) {
        msg = 'Safety filter triggered. Try describing the scene differently.';
      }
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const callGrokAPI = async (prompt: string) => {
    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROK_API_KEY || ''}`
        },
        body: JSON.stringify({
          model: "grok-1",
          messages: [
            { role: "system", content: "You are a helpful YouTube assistant." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4096,
          stream: false
        })
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (error) {
      console.error("Grok API Error:", error);
      return null;
    }
  };

  const callGrokFreeSim = async (action: 'titles' | 'tags' | 'hashtags' | 'desc', topic: string) => {
    await delay(600); // Simulate fast processing
    const t = topic || "Video";
    
    if (action === 'titles') {
      return JSON.stringify([
        `SHOCKING Truth About ${t}`,
        `${t}: What Nobody Tells You!`,
        `I Tried ${t} and Regretted It`,
        `The Ultimate ${t} Guide (2025)`,
        `Top 10 Secrets of ${t}`,
        `Why ${t} is Taking Over`,
        `Stop Doing This With ${t}`,
        `${t} Explained in 5 Minutes`,
        `Is ${t} Dead?`,
        `Master ${t} Fast!`
      ]);
    }
    if (action === 'tags') {
      return `${t}, ${t} video, ${t} tips, ${t} tricks, best ${t}, ${t} tutorial, ${t} review, ${t} guide, viral ${t}, trending, youtube, 2025`;
    }
    if (action === 'hashtags') {
      return `#${t.replace(/\s+/g,'')} #${t.replace(/\s+/g,'')}2025 #Viral #Trending #YouTube #Guide #Review #Tips`;
    }
    if (action === 'desc') {
      return `Welcome back to the channel! In this video, we are exploring ${t}. You'll learn everything you need to know about ${t} and how to use it effectively in 2025.\n\nIf you enjoyed this video, please hit the LIKE button and SUBSCRIBE for more content on ${t}!\n\nTimestamps:\n0:00 Intro\n1:30 Key Point 1\n3:45 Key Point 2\n5:00 Conclusion\n\n#${t.replace(/\s+/g,'')} #YouTube`;
    }
    return "";
  };

  const handleAiAssistant = async (action: 'titles' | 'tags' | 'hashtags' | 'desc') => {
    if (!aiTopic) return;
    setIsAiLoading(prev => ({ ...prev, [action]: true }));
    
    const prompts = {
      titles: `Generate 10 clickbait and SEO friendly YouTube titles for the topic: "${aiTopic}". Return as a simple JSON list of strings.`,
      tags: `Generate 30 high-ranking YouTube tags for: "${aiTopic}". Mix of Hindi and English. Return as comma separated string.`,
      hashtags: `Generate 20 trending hashtags for: "${aiTopic}". Return as list.`,
      desc: `Write a professional YouTube video description for: "${aiTopic}". Include intro, keywords, and hashtag section.`
    };

    try {
      let text = '';
      
      if (aiModel === 'grok') {
        text = await callGrokAPI(prompts[action]) || '';
      } else if (aiModel === 'grok-free') {
        text = await callGrokFreeSim(action, aiTopic) || '';
      } else {
        // Gemini
        // @ts-ignore
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompts[action]
        });
        text = response.text || '';
      }
      
      if (action === 'titles') {
         try {
           const match = text.match(/\[.*\]/s);
           if (match) setAiTitles(JSON.parse(match[0]));
           else setAiTitles(text.split('\n').filter(l => l.length > 5));
         } catch { setAiTitles(text.split('\n')); }
      } else if (action === 'tags') {
         setAiTags(text);
      } else if (action === 'hashtags') {
         setAiHashtags(text.split(/[\n\s]+/).filter(t => t.startsWith('#')));
      } else {
         setAiDescription(text);
      }

    } catch (e) {
      console.error(e);
    }
    setIsAiLoading(prev => ({ ...prev, [action]: false }));
  };

  const handleDownload = async () => {
    if (resultContainerRef.current) {
      const prevSelected = selectedLayerId;
      setSelectedLayerId(null);
      
      setTimeout(async () => {
        try {
            if (!resultContainerRef.current) return;
            const canvas = await html2canvas(resultContainerRef.current, {
              useCORS: true,
              scale: 2,
              backgroundColor: null,
            });
            
            let quality = 1.0;
            if (compressionLevel === 'Medium') quality = 0.8;
            if (compressionLevel === 'Low') quality = 0.6;

            const link = document.createElement('a');
            const extension = exportFormat.split('/')[1];
            link.download = `thumbnail_${activeStyle}_${Date.now()}.${extension}`;
            link.href = canvas.toDataURL(exportFormat, quality);
            link.click();
        } catch (e) {
            console.error("Download failed", e);
            alert("Could not generate composite image.");
        } finally {
            setSelectedLayerId(prevSelected);
        }
      }, 100);
    }
  };

  const resetTheme = () => {
    setThemeSettings(DEFAULT_THEME);
    setDropdownTheme(DEFAULT_DROPDOWN_THEME);
  };
  
  const resetLayout = () => {
      setCustomLayout(DEFAULT_LAYOUT);
  };

  const applyPreset = (key: keyof typeof THEME_PRESETS) => {
    setThemeSettings({ ...THEME_PRESETS[key] } as ThemeSettings);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text).then(() => alert("Copied!"));
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Calculate Levels Filter values
  const inputBlack = levelsShadow / 100;
  const inputWhite = Math.max(inputBlack + 0.01, levelsHighlight / 100);
  const gamma = Math.max(0.1, levelsMidtone / 50);
  const slope = 1 / (inputWhite - inputBlack);
  const intercept = -inputBlack * slope;

  const activeImageSrc = generatedVariations[activeStyle];

  // Merge display lists for slider
  const sliderItems = [
      ...BACKGROUND_STYLES,
      ...MOOD_OPTIONS.filter(m => selectedMoods.includes(m.id)),
      ...(fireSettings.enabled ? [{ id: 'fire-variation', label: '🔥 Fire Variation' }] : [])
  ];

  // Construct Global Background Styles
  let appBgStyle = '';
  if (themeSettings.appMode === 'solid') {
      appBgStyle = themeSettings.appSolidColor;
  } else if (themeSettings.appMode === 'gradient') {
      const colors = themeSettings.appGradientColors.join(', ');
      if (themeSettings.appGradientType === 'radial') {
          appBgStyle = `radial-gradient(${colors})`;
      } else {
          appBgStyle = `linear-gradient(${themeSettings.appGradientDirection}, ${colors})`;
      }
  } else if (themeSettings.appMode === 'image' && themeSettings.appImage) {
      appBgStyle = `url(${themeSettings.appImage})`;
  }

  // Construct RGBA Panel Colors for Glassmorphism
  const hexToRgba = (hex: string, alpha: number) => {
      let c: any;
      if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
          c= hex.substring(1).split('');
          if(c.length== 3){
              c= [c[0], c[0], c[1], c[1], c[2], c[2]];
          }
          c= '0x'+c.join('');
          return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
      }
      if (hex.startsWith('rgba')) return hex; // already rgba
      return hex;
  }

  const panelBaseColor = themeSettings.appMode === 'solid' ? (themeSettings.appSolidColor === '#000000' ? '#111' : '#fff') : '#000000';
  const panelBgColor = hexToRgba(panelBaseColor, themeSettings.panelOpacity);

  // Get currently selected layer for bottom controls
  const selectedLayer = textLayers.find(l => l.id === selectedLayerId);
  
  
  // COMPONENT BLOCKS FOR CUSTOM LAYOUT
  
  const ControlsPanelContent = () => {
      const sidebarRef = useRef<HTMLDivElement>(null);
      
      // --- FULL SIDEBAR SCROLL LOCK (NO JUMP) ---
      useLayoutEffect(() => {
          const sidebar = sidebarRef.current;
          if (!sidebar) return;

          // Restore saved position
          const savedScroll = sessionStorage.getItem("sidebarScroll");
          if (savedScroll) {
              sidebar.scrollTop = parseInt(savedScroll);
          }

          // Save position on scroll
          const handleScroll = () => {
              sessionStorage.setItem("sidebarScroll", sidebar.scrollTop.toString());
          };
          
          // Prevent jump on focus/click
          const handleFocus = (e: Event) => {
             const currentSaved = sessionStorage.getItem("sidebarScroll");
             if(currentSaved) {
                 if (sidebar.scrollTop !== parseInt(currentSaved)) {
                     sidebar.scrollTop = parseInt(currentSaved);
                 }
             }
          };
          
          // Handle clicks to stop propagation of jumps
          const handleClick = (e: Event) => {
             const currentSaved = sessionStorage.getItem("sidebarScroll");
             if(currentSaved) {
                 setTimeout(() => {
                    if(sidebar.scrollTop !== parseInt(currentSaved)) {
                        sidebar.scrollTop = parseInt(currentSaved);
                    }
                 }, 0);
             }
          };

          // Use capture to intercept focus events early
          sidebar.addEventListener('scroll', handleScroll);
          sidebar.addEventListener('focusin', handleFocus, true); 
          sidebar.addEventListener('click', handleClick);

          // Periodic Lock Check (Failsafe)
          const intervalId = setInterval(() => {
             const currentSaved = sessionStorage.getItem("sidebarScroll");
             if (currentSaved && sidebar.scrollTop !== parseInt(currentSaved)) {
                  // Only correct if significant deviation to avoid jitter
                  if (Math.abs(sidebar.scrollTop - parseInt(currentSaved)) > 2) {
                      sidebar.scrollTop = parseInt(currentSaved);
                  }
             }
          }, 50);
          
          // Mutation Observer
          const observer = new MutationObserver(() => {
               const currentSaved = sessionStorage.getItem("sidebarScroll");
               if (currentSaved) {
                   sidebar.scrollTop = parseInt(currentSaved);
               }
          });
          observer.observe(sidebar, { childList: true, subtree: true });

          return () => {
              sidebar.removeEventListener('scroll', handleScroll);
              sidebar.removeEventListener('focusin', handleFocus, true);
              sidebar.removeEventListener('click', handleClick);
              clearInterval(intervalId);
              observer.disconnect();
          };
      }, []);

      return (
      <div ref={sidebarRef} className="panel controls-panel" style={{ height: '100%', border: isCustomLayoutMode ? 'none' : '' }}>
          
          <div className="form-group">
            <div className="label">1. Source Image</div>
            <div 
              className={`upload-zone ${previewUrl ? 'has-image' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="upload-preview" />
              ) : (
                <div className="upload-placeholder">
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📷</div>
                  <div>Click to Upload Base Image</div>
                </div>
              )}
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileSelect} />
            </div>
          </div>
          
          {/* 2. IMAGE SIZE */}
          <div className="toggle-group">
                <div className="label" style={{marginBottom: 10}}>2. Image Size & Dimensions</div>
                <div className="form-group">
                  <select className="select-field" value={selectedSizePreset} onChange={handleSizePresetChange}>
                    {IMAGE_SIZE_GROUPS.map(group => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map(opt => (
                          <option key={opt.label} value={opt.label}>{opt.label}</option>
                        ))}
                      </optgroup>
                    ))}
                    <option value="Custom">Custom Size</option>
                  </select>
                  
                  <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
                    <input type="number" className="input-field" value={canvasSize.width} onChange={(e) => handleDimensionChange('width', parseInt(e.target.value))} />
                    <span>x</span>
                    <input type="number" className="input-field" value={canvasSize.height} onChange={(e) => handleDimensionChange('height', parseInt(e.target.value))} />
                    <button 
                      className={`style-btn ${isAspectRatioLocked ? 'active' : ''}`} 
                      onClick={() => setIsAspectRatioLocked(!isAspectRatioLocked)}
                      title="Lock Aspect Ratio"
                    >🔒</button>
                  </div>
                </div>
          </div>

          {/* IMAGE MOOD VARIATION SYSTEM - SIDEBAR SECTION */}
          <div className="form-group">
             <div className="label" style={{color: themeSettings.themeIconColor, borderBottom: '1px solid #444', paddingBottom: '4px'}}>IMAGE MOOD VARIATION SYSTEM</div>
             <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Select moods to generate separate variations:</div>
             <div className="mood-grid">
                 {MOOD_OPTIONS.map((mood) => (
                     <button 
                        key={mood.id}
                        className={`mood-toggle-btn ${selectedMoods.includes(mood.id) ? 'active' : ''}`}
                        onClick={() => toggleMood(mood.id)}
                     >
                        {mood.label}
                     </button>
                 ))}
             </div>
          </div>
          
          {/* AI FIRE VARIATION - NEW SIDEBAR SECTION */}
          <div className="form-group fire-variation-section" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #444' }}>
             <div className="toggle-header" onClick={() => setFireSettings(prev => ({ ...prev, enabled: !prev.enabled }))}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="label" style={{color: '#FF5733', borderBottom: 'none', paddingBottom: '0'}}>🔥 AI Fire Variation</span>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>Add intense fire effects to your thumbnail</span>
                </div>
                <div className={`toggle-switch ${fireSettings.enabled ? 'active' : ''}`}>
                  <div className="toggle-knob"></div>
                </div>
             </div>

             {fireSettings.enabled && (
                 <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(255,87,51,0.05)', borderRadius: '8px', border: '1px solid rgba(255,87,51,0.2)' }}>
                     
                     <div className="label" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>Fire Style</div>
                     <div className="fire-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                        {FIRE_TYPES.map(type => (
                             <button
                                key={type.id}
                                className={`fire-option-btn ${fireSettings.type === type.id ? 'selected' : ''}`}
                                onClick={() => setFireSettings(prev => ({ ...prev, type: type.id }))}
                             >{type.label}</button>
                        ))}
                     </div>

                     <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                        <label style={{ fontSize: '0.75rem', color: '#888', width: '60px' }}>Intensity</label>
                        <input 
                            type="range" className="slider-control" min="0" max="100" 
                            value={fireSettings.intensity} 
                            onChange={(e) => setFireSettings(prev => ({ ...prev, intensity: parseInt(e.target.value) }))} 
                        />
                        <span style={{ fontSize: '0.75rem', width: '30px' }}>{fireSettings.intensity}%</span>
                     </div>

                     <div className="label" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>Fire Color</div>
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                         {FIRE_COLORS.map(color => (
                             <button
                                key={color.id}
                                className={`fire-option-btn ${fireSettings.color === color.id ? 'selected' : ''}`}
                                onClick={() => setFireSettings(prev => ({ ...prev, color: color.id }))}
                                style={{ flex: '1 0 30%' }}
                             >{color.label}</button>
                         ))}
                     </div>

                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                            <div className="label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Position</div>
                            <select 
                                className="select-field" style={{ padding: '6px', fontSize: '0.8rem' }}
                                value={fireSettings.position}
                                onChange={(e) => setFireSettings(prev => ({ ...prev, position: e.target.value }))}
                            >
                                {FIRE_POSITIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                            </select>
                        </div>
                        <div>
                             <div className="label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Blend Mode</div>
                            <select 
                                className="select-field" style={{ padding: '6px', fontSize: '0.8rem' }}
                                value={fireSettings.blendMode}
                                onChange={(e) => setFireSettings(prev => ({ ...prev, blendMode: e.target.value }))}
                            >
                                {FIRE_BLEND_MODES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                            </select>
                        </div>
                     </div>
                 </div>
             )}
          </div>

          {/* 3. Description & Adjustments */}
          <div className="form-group">
            <div className="label">3. Description & Adjustments</div>
             <textarea 
                className="textarea-field" 
                placeholder="Optional: Describe specific details (e.g., 'office background', 'gaming room')"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            
              <div style={{ marginTop: '12px', borderTop: '1px solid #333', paddingTop: '12px' }}>
                <div className="label" style={{ marginBottom: '8px', fontSize: '0.8rem' }}>Color Adjustments</div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.75rem', color: '#888', width: '60px' }}>Hue</label>
                  <input type="range" className="slider-control" min="-180" max="180" value={imageHue} onChange={(e) => setImageHue(Number(e.target.value))} />
                  <span style={{ fontSize: '0.75rem', width: '30px' }}>{imageHue}°</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', color: '#888', width: '60px' }}>Sat.</label>
                  <input type="range" className="slider-control" min="0" max="200" value={imageSaturation} onChange={(e) => setImageSaturation(Number(e.target.value))} />
                  <span style={{ fontSize: '0.75rem', width: '30px' }}>{imageSaturation}%</span>
                </div>
              </div>

              <div style={{ marginTop: '12px', borderTop: '1px solid #333', paddingTop: '12px' }}>
                <div className="label" style={{ marginBottom: '8px', fontSize: '0.8rem' }}>Levels (Shadow/Mid/High)</div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.75rem', color: '#888', width: '60px' }}>Shadow</label>
                  <input type="range" className="slider-control" min="0" max="100" value={levelsShadow} onChange={(e) => setLevelsShadow(Number(e.target.value))} />
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.75rem', color: '#888', width: '60px' }}>Midtone</label>
                  <input type="range" className="slider-control" min="0" max="100" value={levelsMidtone} onChange={(e) => setLevelsMidtone(Number(e.target.value))} />
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', color: '#888', width: '60px' }}>High</label>
                  <input type="range" className="slider-control" min="0" max="100" value={levelsHighlight} onChange={(e) => setLevelsHighlight(Number(e.target.value))} />
                </div>
              </div>
          </div>
          
          <div className="form-group">
             <div className="label">4. Export & Compression</div>
             <div className="toggle-group" style={{ padding: '12px' }}>
                <div style={{ marginBottom: '8px' }}>
                    <div className="label" style={{fontSize: '0.8rem', marginBottom: '4px'}}>Format</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                         {(['image/png', 'image/jpeg', 'image/webp'] as const).map(fmt => (
                             <button 
                                key={fmt}
                                className={`intensity-btn ${exportFormat === fmt ? 'selected' : ''}`}
                                onClick={() => setExportFormat(fmt)}
                             >
                                {fmt.split('/')[1].toUpperCase()}
                             </button>
                         ))}
                    </div>
                </div>
                {exportFormat !== 'image/png' && (
                    <div>
                        <div className="label" style={{fontSize: '0.8rem', marginBottom: '4px'}}>Compression</div>
                         <div style={{ display: 'flex', gap: '8px' }}>
                             {(['Low', 'Medium', 'High'] as const).map(level => (
                                 <button 
                                    key={level}
                                    className={`intensity-btn ${compressionLevel === level ? 'selected' : ''}`}
                                    onClick={() => setCompressionLevel(level)}
                                 >
                                    {level}
                                 </button>
                             ))}
                        </div>
                    </div>
                )}
             </div>
          </div>

          <button 
            className="generate-btn" 
            onClick={handleGenerate}
            disabled={isGenerating || !file}
          >
            {isGenerating ? (
              <>Generating {progress.current}/{progress.total} <div className="spinner" style={{ width: 20, height: 20, border: '2px solid #000', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginLeft: 10 }}></div></>
            ) : (
              <>✨ Generate Selected ({sliderItems.length})</>
            )}
          </button>

          {error && (
            <div style={{ color: '#ff4444', fontSize: '0.9rem', padding: '10px', background: 'rgba(255,0,0,0.1)', borderRadius: '6px' }}>
              {error}
            </div>
          )}

          {/* AI YOUTUBE ASSISTANT SIDEBAR */}
          <div className="form-group ai-assistant-section" style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #444' }}>
             <div className="label" style={{color: '#FFDD00', borderBottom: '1px solid #444', paddingBottom: '4px'}}>
               <span>🤖 AI YouTube Assistant</span>
             </div>
             <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Generates Titles, Tags, Hashtags & Desc.</div>
             
             <label className="label" style={{fontSize: '0.8rem', marginBottom: 5}}>AI Model:</label>
             <select className="select-field" value={aiModel} onChange={e => setAiModel(e.target.value as any)} style={{marginBottom: 10}}>
                {IMAGE_MODEL_OPTIONS.map((group, i) => (
                    <optgroup key={i} label={group.label}>
                        {group.options.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                    </optgroup>
                ))}
             </select>
             
             <input 
                type="text"
                className="input-field"
                placeholder="Enter Video Topic..."
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                style={{ marginBottom: '12px' }}
             />

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <button className="ai-action-btn" onClick={() => handleAiAssistant('titles')} disabled={isAiLoading['titles']}>
                    {isAiLoading['titles'] ? '...' : 'Generate Titles'}
                </button>
                <button className="ai-action-btn" onClick={() => handleAiAssistant('tags')} disabled={isAiLoading['tags']}>
                    {isAiLoading['tags'] ? '...' : 'Generate Tags'}
                </button>
                <button className="ai-action-btn" onClick={() => handleAiAssistant('hashtags')} disabled={isAiLoading['hashtags']}>
                    {isAiLoading['hashtags'] ? '...' : 'Gen Hashtags'}
                </button>
                <button className="ai-action-btn" onClick={() => handleAiAssistant('desc')} disabled={isAiLoading['desc']}>
                    {isAiLoading['desc'] ? '...' : 'Gen Description'}
                </button>
             </div>

             {/* RESULTS DISPLAY */}
             <div className="ai-results">
                {aiTitles.length > 0 && (
                    <div className="ai-result-box">
                        <div className="ai-result-header">
                            <span>Titles</span>
                            <button className="copy-btn" onClick={() => copyToClipboard(aiTitles.join('\n'))}>Copy</button>
                        </div>
                        <div className="ai-result-content">
                            {aiTitles.map((t, i) => <div key={i}>• {t}</div>)}
                        </div>
                    </div>
                )}
                {aiTags && (
                    <div className="ai-result-box">
                        <div className="ai-result-header">
                            <span>Tags</span>
                            <button className="copy-btn" onClick={() => copyToClipboard(aiTags)}>Copy</button>
                        </div>
                        <div className="ai-result-content">{aiTags}</div>
                    </div>
                )}
                {aiHashtags.length > 0 && (
                    <div className="ai-result-box">
                        <div className="ai-result-header">
                            <span>Hashtags</span>
                            <button className="copy-btn" onClick={() => copyToClipboard(aiHashtags.join(' '))}>Copy</button>
                        </div>
                        <div className="ai-result-content">{aiHashtags.join(' ')}</div>
                    </div>
                )}
                {aiDescription && (
                    <div className="ai-result-box">
                        <div className="ai-result-header">
                            <span>Description</span>
                            <button className="copy-btn" onClick={() => copyToClipboard(aiDescription)}>Copy</button>
                        </div>
                        <div className="ai-result-content" style={{ whiteSpace: 'pre-wrap' }}>{aiDescription}</div>
                    </div>
                )}
             </div>
          </div>
      </div>
      );
  };

  const CanvasPanelContent = () => (
     <div className="panel canvas-panel" style={{ height: '100%', border: isCustomLayoutMode ? 'none' : '', position: 'relative', top: 0, zIndex: 1 }}>
          <div className="result-area" style={{ height: '100%' }}>
            {activeImageSrc ? (
              <>
                <div 
                  className="result-image-container" 
                  ref={resultContainerRef}
                  style={{ 
                     aspectRatio: ASPECT_RATIOS.find(r => r.id === aspectRatio)?.css || '16 / 9',
                  }}
                >
                  <img 
                    src={activeImageSrc} 
                    alt={`Style ${activeStyle}`}
                    className="result-image"
                    style={{
                      filter: `url(#levels-filter) hue-rotate(${imageHue}deg) saturate(${imageSaturation}%)`
                    }}
                  />
                  
                  {includeText && textLayers.map(layer => {
                     const isSelected = selectedLayerId === layer.id;
                     const customStyles: React.CSSProperties = {};
                     if (layer.strokeWidth > 0) {
                        customStyles.WebkitTextStroke = `${layer.strokeWidth}px ${layer.strokeColor}`;
                     }
                     if (layer.shadowBlur > 0 || layer.shadowOffsetX !== 0 || layer.shadowOffsetY !== 0) {
                        customStyles.textShadow = `${layer.shadowOffsetX}px ${layer.shadowOffsetY}px ${layer.shadowBlur}px ${layer.shadowColor}`;
                     }

                     return (
                        <div
                           key={layer.id}
                           className={`text-overlay-layer ${layer.style} ${isSelected ? 'selected' : ''}`}
                           onMouseDown={(e) => handleLayerInteraction(e, layer.id, 'move')}
                           style={{
                              left: `${layer.x}%`,
                              top: `${layer.y}%`,
                              fontSize: `${layer.fontSize}px`,
                              color: layer.color,
                              '--layer-color': layer.color,
                              fontFamily: layer.fontFamily,
                              fontWeight: layer.fontWeight,
                              fontStyle: layer.fontStyle,
                              transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                              ...customStyles
                           } as React.CSSProperties}
                        >
                           {layer.text}
                           {isSelected && (
                              <>
                                <div className="resize-handle nw" onMouseDown={(e) => handleLayerInteraction(e, layer.id, 'resize')}></div>
                                <div className="resize-handle ne" onMouseDown={(e) => handleLayerInteraction(e, layer.id, 'resize')}></div>
                                <div className="resize-handle sw" onMouseDown={(e) => handleLayerInteraction(e, layer.id, 'resize')}></div>
                                <div className="resize-handle se" onMouseDown={(e) => handleLayerInteraction(e, layer.id, 'resize')}></div>
                              </>
                           )}
                        </div>
                     );
                  })}
                </div>
              </>
            ) : (
              <div className="empty-state">
                 <div style={{ fontSize: '3rem', opacity: 0.5 }}>✨</div>
                 <div>Upload image & Generate Variations</div>
              </div>
            )}
          </div>

          {activeImageSrc && (
             <div className="actions">
               <button className="action-btn download-btn" onClick={handleDownload}>
                 Download {activeStyle.toUpperCase()} ({exportFormat.split('/')[1].toUpperCase()})
               </button>
             </div>
          )}
     </div>
  );
  
  const ThemePanelContent = () => (
        <div className="panel theme-panel" style={{ height: '100%', border: isCustomLayoutMode ? 'none' : '' }}>
             <div className="label" style={{color: themeSettings.themeAccentColor, borderBottom: '1px solid #444', paddingBottom: '4px'}}>
               <span>🎨 Global Theme & UI</span>
             </div>
             <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '12px' }}>Full App Customization</div>

             {/* PRESETS */}
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {Object.keys(THEME_PRESETS).map((preset) => (
                    <button 
                        key={preset}
                        className="action-btn"
                        style={{ fontSize: '0.75rem', padding: '6px', flex: '1 1 30%' }}
                        onClick={() => applyPreset(preset as keyof typeof THEME_PRESETS)}
                    >
                        {preset.charAt(0).toUpperCase() + preset.slice(1)}
                    </button>
                ))}
             </div>
             
             <div className="toggle-group" style={{ marginBottom: '12px' }}>
                 <div className="label" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>App Layout Mode</div>
                 <label className="toggle-header" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                    <span>Enable Custom Drag Layout</span>
                    <div className={`toggle-switch ${isCustomLayoutMode ? 'active' : ''}`} onClick={() => setIsCustomLayoutMode(!isCustomLayoutMode)}>
                       <div className="toggle-knob"></div>
                    </div>
                 </label>
                 {isCustomLayoutMode && (
                    <button onClick={resetLayout} className="action-btn" style={{ marginTop: 10, fontSize: '0.8rem' }}>Reset Layout Positions</button>
                 )}
             </div>

             <div className="toggle-group">
                <div className="label" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>App Background</div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                   <button 
                      className={`intensity-btn ${themeSettings.appMode === 'solid' ? 'selected' : ''}`}
                      onClick={() => setThemeSettings({ ...themeSettings, appMode: 'solid' })}
                   >Solid</button>
                   <button 
                      className={`intensity-btn ${themeSettings.appMode === 'gradient' ? 'selected' : ''}`}
                      onClick={() => setThemeSettings({ ...themeSettings, appMode: 'gradient' })}
                   >Gradient</button>
                   <button 
                      className={`intensity-btn ${themeSettings.appMode === 'image' ? 'selected' : ''}`}
                      onClick={() => wallpaperInputRef.current?.click()}
                   >Image</button>
                   <input type="file" ref={wallpaperInputRef} hidden accept="image/*" onChange={handleWallpaperSelect} />
                </div>

                {themeSettings.appMode === 'solid' && (
                   <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#aaa' }}>Color:</label>
                      <input 
                        type="color" 
                        className="color-input"
                        value={themeSettings.appSolidColor}
                        onChange={(e) => setThemeSettings({...themeSettings, appSolidColor: e.target.value})}
                      />
                   </div>
                )}

                {themeSettings.appMode === 'gradient' && (
                    <>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '0.8rem', color: '#aaa' }}>Start:</label>
                            <input type="color" className="color-input" value={themeSettings.appGradientColors[0]} onChange={(e) => {
                                const newColors = [...themeSettings.appGradientColors];
                                newColors[0] = e.target.value;
                                setThemeSettings({...themeSettings, appGradientColors: newColors});
                            }} />
                            <label style={{ fontSize: '0.8rem', color: '#aaa' }}>End:</label>
                            <input type="color" className="color-input" value={themeSettings.appGradientColors[1]} onChange={(e) => {
                                const newColors = [...themeSettings.appGradientColors];
                                newColors[1] = e.target.value;
                                setThemeSettings({...themeSettings, appGradientColors: newColors});
                            }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <select 
                                className="select-field" style={{padding: '4px'}}
                                value={themeSettings.appGradientDirection}
                                onChange={(e) => setThemeSettings({...themeSettings, appGradientDirection: e.target.value})}
                            >
                                <option value="to bottom">Vertical</option>
                                <option value="to right">Horizontal</option>
                                <option value="to bottom right">Diagonal</option>
                            </select>
                        </div>
                    </>
                )}
             </div>
             
             <div className="toggle-group" style={{ marginTop: '12px', padding: '12px' }}>
                 <div className="label" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>Glassmorphism & Blur</div>
                 <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.75rem', color: '#888', width: '60px' }}>App Blur</label>
                    <input type="range" className="slider-control" min="0" max="50" value={themeSettings.appBlur} onChange={(e) => setThemeSettings({...themeSettings, appBlur: parseInt(e.target.value)})} />
                 </div>
                 <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.75rem', color: '#888', width: '60px' }}>Panel Opacity</label>
                    <input type="range" className="slider-control" min="0" max="100" value={themeSettings.panelOpacity * 100} onChange={(e) => setThemeSettings({...themeSettings, panelOpacity: parseInt(e.target.value)})} />
                 </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.75rem', color: '#888', width: '60px' }}>Panel Blur</label>
                    <input type="range" className="slider-control" min="0" max="50" value={themeSettings.panelBlur} onChange={(e) => setThemeSettings({...themeSettings, panelBlur: parseInt(e.target.value)})} />
                 </div>
             </div>

             <div className="toggle-group" style={{ marginTop: '12px', padding: '12px' }}>
                <div className="label" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>Colors & Accents</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" className="color-input" value={themeSettings.themeAccentColor} onChange={(e) => setThemeSettings({...themeSettings, themeAccentColor: e.target.value})} />
                        <span style={{ fontSize: '0.75rem', color: '#aaa' }}>Accent</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" className="color-input" value={themeSettings.themeButtonColor} onChange={(e) => setThemeSettings({...themeSettings, themeButtonColor: e.target.value})} />
                        <span style={{ fontSize: '0.75rem', color: '#aaa' }}>Buttons</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" className="color-input" value={themeSettings.themeButtonTextColor} onChange={(e) => setThemeSettings({...themeSettings, themeButtonTextColor: e.target.value})} />
                        <span style={{ fontSize: '0.75rem', color: '#aaa' }}>Btn Text</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" className="color-input" value={themeSettings.topbarColor} onChange={(e) => setThemeSettings({...themeSettings, topbarColor: e.target.value})} />
                        <span style={{ fontSize: '0.75rem', color: '#aaa' }}>Topbar</span>
                    </div>
                </div>
             </div>
             
             {/* FONT DROPDOWN MANUAL COLOR CONTROL */}
             <div className="toggle-group" style={{ marginTop: '12px', padding: '12px' }}>
                 <div className="label" style={{ fontSize: '0.8rem', marginBottom: '8px', color: '#aaa' }}>Font Dropdown Colors (Manual)</div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" className="color-input" value={dropdownTheme.bgColor} onChange={(e) => setDropdownTheme({...dropdownTheme, bgColor: e.target.value})} />
                        <span style={{ fontSize: '0.75rem', color: '#aaa' }}>BG</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" className="color-input" value={dropdownTheme.textColor} onChange={(e) => setDropdownTheme({...dropdownTheme, textColor: e.target.value})} />
                        <span style={{ fontSize: '0.75rem', color: '#aaa' }}>Text</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" className="color-input" value={dropdownTheme.hoverBgColor} onChange={(e) => setDropdownTheme({...dropdownTheme, hoverBgColor: e.target.value})} />
                        <span style={{ fontSize: '0.75rem', color: '#aaa' }}>Hvr BG</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" className="color-input" value={dropdownTheme.hoverTextColor} onChange={(e) => setDropdownTheme({...dropdownTheme, hoverTextColor: e.target.value})} />
                        <span style={{ fontSize: '0.75rem', color: '#aaa' }}>Hvr Text</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" className="color-input" value={dropdownTheme.borderColor} onChange={(e) => setDropdownTheme({...dropdownTheme, borderColor: e.target.value})} />
                        <span style={{ fontSize: '0.75rem', color: '#aaa' }}>Border</span>
                    </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" className="color-input" value={dropdownTheme.shadowColor} onChange={(e) => setDropdownTheme({...dropdownTheme, shadowColor: e.target.value})} />
                        <span style={{ fontSize: '0.75rem', color: '#aaa' }}>Shadow</span>
                    </div>
                 </div>
                 
                 <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.75rem', color: '#888', width: '60px' }}>Opacity</label>
                        <input type="range" className="slider-control" min="0" max="100" value={dropdownTheme.opacity} onChange={(e) => setDropdownTheme({...dropdownTheme, opacity: parseInt(e.target.value)})} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.75rem', color: '#888', width: '60px' }}>Blur</label>
                        <input type="range" className="slider-control" min="0" max="20" value={dropdownTheme.blur} onChange={(e) => setDropdownTheme({...dropdownTheme, blur: parseInt(e.target.value)})} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.75rem', color: '#888', width: '60px' }}>Border W</label>
                        <input type="range" className="slider-control" min="0" max="4" value={dropdownTheme.borderWidth} onChange={(e) => setDropdownTheme({...dropdownTheme, borderWidth: parseInt(e.target.value)})} />
                    </div>
                 </div>
             </div>
             
             <button className="action-btn" style={{ marginTop: '12px', fontSize: '0.8rem', padding: '8px' }} onClick={resetTheme}>
                ↺ Reset All Theme Settings
             </button>
          </div>
  );
  
  const TextPanelContent = () => (
      <div className="bottom-panel" style={{ height: isCustomLayoutMode ? '100%' : undefined, border: isCustomLayoutMode ? 'none' : '' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: themeSettings.themeAccentColor, fontSize: '1rem' }}>Text Layers (Overlay)</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button className="add-layer-btn" style={{ marginTop: 0, padding: '4px 12px', width: 'auto' }} onClick={() => addLayer('title')}>+ Title</button>
                <button className="add-layer-btn" style={{ marginTop: 0, padding: '4px 12px', width: 'auto' }} onClick={() => addLayer('subtitle')}>+ Sub</button>
                <button className="add-layer-btn" style={{ marginTop: 0, padding: '4px 12px', width: 'auto' }} onClick={() => addLayer('text')}>+ Text</button>
            </div>
        </div>

        <div className="bottom-panel-content">
            {/* COL 1: LAYER LIST */}
            <div className="layers-list-container">
                {includeText && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {textLayers.map((layer, index) => (
                      <div 
                        key={layer.id} 
                        className={`layer-card ${selectedLayerId === layer.id ? 'selected' : ''}`}
                        onClick={() => setSelectedLayerId(layer.id)}
                        style={{ padding: '8px', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <span className="layer-title" style={{ fontSize: '0.8rem' }}>#{index+1} {layer.text.substring(0, 12)}...</span>
                           <div style={{ display: 'flex', gap: '4px' }}>
                               <button className="remove-layer-btn" style={{color: '#888'}} onClick={(e) => { e.stopPropagation(); moveLayerOrder(layer.id, 'up') }}>▲</button>
                               <button className="remove-layer-btn" style={{color: '#888'}} onClick={(e) => { e.stopPropagation(); moveLayerOrder(layer.id, 'down') }}>▼</button>
                               <button className="remove-layer-btn" onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}>✕</button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* COL 2: MAIN EDITING (Text, Font, Color, Basic Style) */}
            <div className="layer-edit-main">
                {selectedLayer ? (
                    <>
                        <textarea 
                          className="textarea-field" 
                          value={selectedLayer.text}
                          onChange={(e) => updateLayer(selectedLayer.id, 'text', e.target.value)}
                          placeholder="Enter text..."
                          style={{ minHeight: '40px', height: '50px', resize: 'none' }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <select 
                                className="select-field" style={{ padding: '6px', fontSize: '0.85rem' }}
                                value={selectedLayer.fontFamily}
                                onChange={(e) => updateLayer(selectedLayer.id, 'fontFamily', e.target.value)}
                            >
                                {FONT_GROUPS.map((group) => (
                                    <optgroup key={group.label} label={group.label}>
                                        {group.options.map((opt) => (
                                            <option key={opt.name} value={opt.family}>{opt.name}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <div className="color-control" style={{ padding: '4px', flex: 1, justifyContent: 'center' }}>
                                    <input 
                                      type="color" className="color-input"
                                      value={selectedLayer.color}
                                      onChange={(e) => updateLayer(selectedLayer.id, 'color', e.target.value)}
                                    />
                                </div>
                                <button
                                    className={`style-btn ${selectedLayer.fontWeight === 'bold' ? 'active' : ''}`}
                                    onClick={() => updateLayer(selectedLayer.id, 'fontWeight', selectedLayer.fontWeight === 'bold' ? 'normal' : 'bold')}
                                >B</button>
                                <button
                                    className={`style-btn ${selectedLayer.fontStyle === 'italic' ? 'active' : ''}`}
                                    onClick={() => updateLayer(selectedLayer.id, 'fontStyle', selectedLayer.fontStyle === 'italic' ? 'normal' : 'italic')}
                                >I</button>
                            </div>
                        </div>
                        <div className="align-btn-group">
                            <button title="Left" onClick={() => alignLayer(selectedLayer.id, 'left')}>⇤</button>
                            <button title="Center" onClick={() => alignLayer(selectedLayer.id, 'center')}>✛</button>
                            <button title="Right" onClick={() => alignLayer(selectedLayer.id, 'right')}>⇥</button>
                            <button title="Top" onClick={() => alignLayer(selectedLayer.id, 'top')}>⤒</button>
                            <button title="Bottom" onClick={() => alignLayer(selectedLayer.id, 'bottom')}>⤓</button>
                        </div>
                    </>
                ) : (
                    <div style={{ color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Select a layer to edit</div>
                )}
            </div>

            {/* COL 3: EFFECTS & ADVANCED (Style Preset, Size, Rotation, Shadow) */}
            <div className="layer-edit-extra">
                 {selectedLayer && (
                    <>
                        <select 
                            className="select-field" style={{ padding: '6px', fontSize: '0.85rem', marginBottom: '10px' }}
                            value={selectedLayer.style}
                            onChange={(e) => updateLayer(selectedLayer.id, 'style', e.target.value)}
                        >
                            {TEXT_STYLE_GROUPS.map((group) => (
                                <optgroup key={group.label} label={group.label}>
                                {group.options.map((opt) => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                                </optgroup>
                            ))}
                        </select>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '0.7rem', color: '#888', width: '50px' }}>Size</label>
                            <input 
                                type="range" className="slider-control" min="10" max="400" 
                                value={selectedLayer.fontSize} 
                                onChange={(e) => updateLayer(selectedLayer.id, 'fontSize', parseInt(e.target.value))} 
                            />
                            <span style={{ fontSize: '0.7rem', width: '25px' }}>{Math.round(selectedLayer.fontSize)}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '0.7rem', color: '#888', width: '50px' }}>Rotate</label>
                            <input 
                                type="range" className="slider-control" min="-180" max="180" 
                                value={selectedLayer.rotation} 
                                onChange={(e) => updateLayer(selectedLayer.id, 'rotation', parseInt(e.target.value))} 
                            />
                            <span style={{ fontSize: '0.7rem', width: '25px' }}>{selectedLayer.rotation}°</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <input type="checkbox" checked={false} onChange={() => alignLayer(selectedLayer.id, 'center')} /> 
                            <span style={{fontSize: '0.7rem'}}>Snap Center</span>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '6px', marginTop: '4px' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '4px', color: '#aaa' }}>Stroke & Shadow</div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                             <input 
                                type="range" className="slider-control" min="0" max="20" 
                                value={selectedLayer.strokeWidth || 0} 
                                onChange={(e) => updateLayer(selectedLayer.id, 'strokeWidth', parseInt(e.target.value))} 
                             />
                             <input 
                                type="color" className="color-input" style={{ width: '16px', height: '16px' }}
                                value={selectedLayer.strokeColor || '#000000'} onChange={(e) => updateLayer(selectedLayer.id, 'strokeColor', e.target.value)}
                             />
                             <div style={{ width: '1px', height: '12px', background: '#555', margin: '0 4px' }}></div>
                             <input 
                                type="range" className="slider-control" min="0" max="50" 
                                value={selectedLayer.shadowBlur || 0} 
                                onChange={(e) => updateLayer(selectedLayer.id, 'shadowBlur', parseInt(e.target.value))} 
                             />
                              <input 
                                type="color" className="color-input" style={{ width: '16px', height: '16px' }}
                                value={selectedLayer.shadowColor || '#000000'} onChange={(e) => updateLayer(selectedLayer.id, 'shadowColor', e.target.value)}
                             />
                          </div>
                        </div>
                    </>
                 )}
            </div>
        </div>
      </div>
  );

  return (
    <div className="app-layout">
      {/* Dynamic Theme Styles - Applied Globally */}
      <style>{`
        :root {
          --theme-color: ${themeSettings.themeAccentColor};
          --app-bg: ${appBgStyle};
          --app-bg-size: ${themeSettings.appImageFit};
          --panel-bg: ${panelBgColor};
          --panel-blur: ${themeSettings.panelBlur}px;
          --accent: var(--theme-color);
          --text-main: ${themeSettings.themeButtonColor};
          --button-text: ${themeSettings.themeButtonTextColor};
          --border: ${themeSettings.themeBorderColor};
          --text-secondary: ${themeSettings.themeIconColor};
          --topbar-bg: ${themeSettings.topbarColor};
          --scrollbar-thumb: ${themeSettings.scrollbarColor};
          --scrollbar-track: rgba(0,0,0,0.1);
          
          /* Font Dropdown Specific Variables */
          --dd-bg: ${hexToRgba(dropdownTheme.bgColor, dropdownTheme.opacity / 100)};
          --dd-text: ${dropdownTheme.textColor};
          --dd-hover-bg: ${dropdownTheme.hoverBgColor};
          --dd-hover-text: ${dropdownTheme.hoverTextColor};
          --dd-border: ${dropdownTheme.borderColor};
          --dd-border-width: ${dropdownTheme.borderWidth}px;
          --dd-shadow-color: ${dropdownTheme.shadowColor};
          --dd-shadow-intensity: ${dropdownTheme.shadowIntensity * 2}px;
          --dd-blur: ${dropdownTheme.blur}px;
          --dd-scroll-track: ${dropdownTheme.scrollTrackColor};
          --dd-scroll-thumb: ${dropdownTheme.scrollThumbColor};
          --dd-scroll-radius: ${dropdownTheme.scrollRounded ? '4px' : '0px'};
        }
        .generate-btn {
            background-color: var(--accent) !important;
            color: var(--button-text) !important;
        }
        .slider-item.active {
            border-color: var(--accent) !important;
        }
        .toggle-switch.active {
            background-color: var(--accent) !important;
        }
        .intensity-btn.selected {
             background-color: var(--accent) !important;
             color: var(--button-text) !important;
             border-color: var(--accent) !important;
        }
        .mood-toggle-btn.active {
             background-color: var(--accent) !important;
             color: var(--button-text) !important;
             border-color: var(--accent) !important;
        }
        .fire-option-btn.selected {
             background-color: var(--accent) !important;
             color: var(--button-text) !important;
             border-color: var(--accent) !important;
        }
        .ai-action-btn:hover {
             border-color: var(--accent);
        }
        .action-btn:hover {
            border-color: var(--accent);
        }
        body {
             backdrop-filter: blur(${themeSettings.appBlur}px);
             height: 100vh; 
             overflow: hidden;
        }
        
        /* NEW LAYOUT STRUCTURE */
        .app-layout {
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
        }
        
        .middle-section {
            flex: 1;
            display: grid;
            grid-template-columns: 360px 1fr 320px;
            gap: 20px;
            padding: 20px 30px;
            overflow: hidden;
            min-height: 0; /* Critical for flex child scrolling */
        }
        
        .panel {
           height: 100%;
           overflow-y: auto;
        }

        .controls-panel {
            /* Override previous height restriction */
            max-height: none;
        }
        
        .theme-panel {
            background-color: var(--panel-bg);
            backdrop-filter: blur(var(--panel-blur));
            border: 1px solid var(--border);
            border-radius: 12px;
            /* Override previous height restriction */
            max-height: none;
            overflow-y: auto;
            padding: 20px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            transition: background-color 0.3s, border-color 0.3s;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }
        
        /* BOTTOM TEXT PANEL */
        .bottom-panel {
            height: 220px;
            background: var(--panel-bg);
            backdrop-filter: blur(var(--panel-blur));
            border-top: 1px solid var(--border);
            padding: 15px 30px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 100;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
        }
        
        .bottom-panel-content {
            display: grid;
            grid-template-columns: 220px 1fr 320px;
            gap: 20px;
            height: 100%;
            overflow: hidden;
        }
        
        .layers-list-container {
            overflow-y: auto;
            padding-right: 5px;
            border-right: 1px solid var(--border);
        }
        
        .layer-edit-main {
            display: flex;
            flex-direction: column;
            gap: 10px;
            overflow-y: auto;
        }
        
        .layer-edit-extra {
            padding-left: 10px;
            border-left: 1px solid var(--border);
            overflow-y: auto;
        }

        @media (max-width: 1400px) {
            .middle-section {
               grid-template-columns: 300px 1fr 280px;
            }
        }
        @media (max-width: 1200px) {
            .middle-section {
                display: flex;
                flex-direction: column;
                overflow-y: auto;
            }
            .panel {
                height: auto;
                max-height: 500px;
            }
            .canvas-panel { order: 1; max-height: none; flex-shrink: 0; }
            .controls-panel { order: 2; flex-shrink: 0; }
            .theme-panel { order: 3; flex-shrink: 0; }
            .bottom-panel { display: none; /* Hide complex bottom panel on mobile for now or restyle */ }
        }
      `}</style>

      <div className="header-simple">
          <span>▶</span> TubeGen AI
      </div>

      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="levels-filter">
             <feComponentTransfer>
                <feFuncR type="linear" slope={slope} intercept={intercept} />
                <feFuncG type="linear" slope={slope} intercept={intercept} />
                <feFuncB type="linear" slope={slope} intercept={intercept} />
             </feComponentTransfer>
             <feComponentTransfer>
                <feFuncR type="gamma" amplitude="1" exponent={1/gamma} offset="0" />
                <feFuncG type="gamma" amplitude="1" exponent={1/gamma} offset="0" />
                <feFuncB type="gamma" amplitude="1" exponent={1/gamma} offset="0" />
             </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      {/* FIXED TOP PREVIEW SLIDER BAR - Now part of flex flow */}
      <div className="top-preview-bar">
         <button className="slider-arrow left" onClick={() => scrollSlider('left')}>‹</button>
         <div className="slider-track" ref={sliderRef}>
            {sliderItems.map((mood) => {
               const imgSrc = generatedVariations[mood.id];
               return (
                 <div 
                    key={mood.id} 
                    className={`slider-item ${activeStyle === mood.id ? 'active' : ''} ${!imgSrc ? 'loading' : ''}`}
                    onClick={() => imgSrc && setActiveStyle(mood.id)}
                 >
                    {imgSrc ? (
                        <img src={imgSrc} alt={mood.label} />
                    ) : (
                        <div className="spinner" style={{ width: 20, height: 20, border: '2px solid #444', borderTop: '2px solid #888', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    )}
                    <div className="slider-item-label">{mood.label}</div>
                 </div>
               );
            })}
         </div>
         <button className="slider-arrow right" onClick={() => scrollSlider('right')}>›</button>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

      {isCustomLayoutMode ? (
           <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                <DraggableBlock id="sidebar" layout={customLayout} setLayout={setCustomLayout}><ControlsPanelContent /></DraggableBlock>
                <DraggableBlock id="canvas" layout={customLayout} setLayout={setCustomLayout}><CanvasPanelContent /></DraggableBlock>
                <DraggableBlock id="theme" layout={customLayout} setLayout={setCustomLayout}><ThemePanelContent /></DraggableBlock>
                <DraggableBlock id="textPanel" layout={customLayout} setLayout={setCustomLayout}><TextPanelContent /></DraggableBlock>
           </div>
      ) : (
          <>
              <div className="middle-section">
                <ControlsPanelContent />
                <CanvasPanelContent />
                <ThemePanelContent />
              </div>
              <TextPanelContent />
          </>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
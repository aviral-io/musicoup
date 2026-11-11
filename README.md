# 🎵 MusiCoup

> **Listen together in sync — free for couples and friends.**

MusiCoup is a real-time synchronized music player web application designed for couples and groups of friends to listen to music simultaneously from anywhere in the world.

---

## ✨ Features

### 💑 Couple Mode
- **Intimate Cozy Theme**: Romantic ambient glowing aesthetics.
- **Dual Connected Avatars**: Side-by-side avatars with synchronized pulse animation.
- **Listening Together Timer**: Real-time counter showing how long you've been listening together.
- **Shared Love Note**: A real-time scratchpad for leaving sweet notes, memories, or song requests.
- **Floating Heart Reactions**: Send quick hearts (`💖`, `❤️`, `🌹`, `🌙`, `✨`, `🫂`, `🥰`) that float up on both screens.

### 🎉 Group / Party Mode
- **6-Digit Room Code & Invite Links**: Easy one-click sharing (`musicoup?room=CODE`).
- **Live Active Listeners Grid**: See everyone who is currently jamming with you, with host indicator.
- **Democratic Vote to Skip**: Need consensus to skip a track so no single troll ruins the vibe.
- **Live Party Soundboard**: Floating reactions (`🔥`, `💃`, `🎧`, `🚀`, `👏`, `🥳`, `⚡`).

### 🎧 Free Music & Sub-Second Sync Engine
- **100% Free**: Powered by YouTube Player API — access millions of tracks, lofi streams, and music videos without subscriptions or API keys.
- **In-App Search & Direct Links**: Search by song title/artist or paste any YouTube URL directly.
- **Sub-Second Sync**: Auto drift correction ensures all listeners stay in sync.
- **Resync Button**: Instant one-click manual synchronization if connection lags.
- **Shared Live Queue**: Anyone can add songs, browse search results, or pick from quick vibes.
- **Live Room Chat**: Built-in room chat with system activity logs.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# In server directory
npm install --prefix server

# In client directory
npm install --prefix client
```

### 2. Run the App

#### Development Mode (with Hot Reloading)
Open two terminal tabs:

```bash
# Tab 1: Start Backend (Port 4000)
npm run dev --prefix server

# Tab 2: Start Frontend (Port 5173)
npm run dev --prefix client
```
Open your browser to `http://localhost:5173`.

#### Production Mode (Single Command)
```bash
# Build frontend
npm run build --prefix client

# Start unified server
npm start --prefix server
```
Open your browser to `http://localhost:4000`.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Socket.io-client
- **Backend**: Node.js, Express, Socket.io, `yt-search`
- **Audio Provider**: YouTube IFrame Player API

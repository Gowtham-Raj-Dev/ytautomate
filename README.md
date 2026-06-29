# YT Automate

> Upload YouTube Shorts in seconds — connect your channel, upload your short, and publish instantly without opening YouTube Studio.

A modern, premium SaaS application built with **Next.js 15 (App Router)**, **TypeScript**, **Firebase**, and the **YouTube Data API v3**. Dark theme, glassmorphism UI, Framer Motion animations, and pure CSS Modules (no Tailwind).

- **Live domain:** [ytautomate.codelove.in](https://ytautomate.codelove.in)
- **Tagline:** Upload Shorts Faster Than Ever

## ✨ Features

- 🎬 Drag-and-drop Shorts upload (MP4, up to 200MB) with live progress
- 🔗 One-click YouTube channel connection via Google OAuth
- 📊 Dashboard with total uploads, last upload, and channel status
- 🔒 Visibility controls (Public / Unlisted / Private)
- 📁 Upload history stored in Firestore
- ⚙️ Settings: reconnect / disconnect channel, account management, delete account
- 🌙 Dark theme, fully responsive, accessible, SEO-optimized

## 🧱 Tech Stack

| Area            | Technology                          |
| --------------- | ----------------------------------- |
| Framework       | Next.js 15 (App Router)             |
| Language        | TypeScript                          |
| Auth            | Firebase Authentication (Google)    |
| Database        | Cloud Firestore                     |
| Video upload    | YouTube Data API v3 (resumable)     |
| Animations      | Framer Motion                       |
| Styling         | Pure CSS Modules                    |

## 📂 Project Structure

```
src/
├── app/              # App Router pages (landing, login, dashboard, settings)
│   ├── login/
│   ├── dashboard/
│   └── settings/
├── components/       # UI + landing + dashboard components
│   ├── ui/
│   ├── landing/
│   └── dashboard/
├── firebase/         # Firebase app, auth providers
├── services/         # Firestore + YouTube API logic
├── hooks/            # AuthContext + Toast context
├── lib/              # Utilities & validation
├── styles/           # Global styles + CSS Modules
└── types/            # Shared TypeScript types
```

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and fill in your Firebase values:

```bash
cp .env.local.example .env.local
```

### 3. Firebase setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication → Sign-in method →** enable **Google**.
3. **Firestore Database →** create a database, then publish the rules from
   [`firestore.rules`](./firestore.rules).
4. **Project settings → Your apps → Web app →** copy the SDK config into `.env.local`.

### 4. Google Cloud / YouTube API setup

1. In [Google Cloud Console](https://console.cloud.google.com), select the same
   project that backs your Firebase app.
2. **APIs & Services → Library →** enable **YouTube Data API v3**.
3. **OAuth consent screen →** add the scopes:
   - `openid`, `email`, `profile`
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube.readonly`
4. Add your domain(s) to **Authorized domains** (e.g. `ytautomate.codelove.in`,
   `localhost`).

> While the OAuth consent screen is in **Testing**, add your Google account under
> **Test users**, or uploads will be rejected.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 📜 Scripts

| Command             | Description                     |
| ------------------- | ------------------------------- |
| `npm run dev`       | Start the dev server            |
| `npm run build`     | Production build                |
| `npm run start`     | Run the production build        |
| `npm run lint`      | Lint the project                |
| `npm run typecheck` | Type-check without emitting     |

## 🔐 How uploads work

YT Automate uses Google OAuth to obtain a short-lived `youtube.upload` access
token at sign-in (captured client-side via Firebase). Videos are streamed
directly to YouTube using a **resumable upload session** with real progress
events, so large files never pass through an intermediary server. Upload
metadata is recorded in Firestore for history and analytics.

---

Built by **CodeLove**.

# Brain

AI-powered reading companion for Meta Ray-Ban smart glasses. Captures text in the real world via the glasses camera and delivers personalized audio or on-screen output — tailored for users with visual impairment, dyslexia, ADHD, and language learners.

## How it works

1. User selects a mode (Read, Simplify, Translate, or Define)
2. Camera captures text in the environment
3. OCR runs on-device via Apple Vision / ML Kit — **no images ever leave the device**
4. Only the extracted text string is sent to the Brain backend
5. Backend proxies to Claude claude-sonnet-4-20250514, streams the response back
6. App reads the result aloud via on-device TTS

---

## Prerequisites

- Node.js 20+
- Python 3.11+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for device builds): `npm install -g eas-cli`
- An [Anthropic API key](https://console.anthropic.com)
- Xcode (iOS simulator / device builds)

---

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd brain
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set EXPO_PUBLIC_BACKEND_URL to your machine's local IP
# e.g. EXPO_PUBLIC_BACKEND_URL=http://192.168.1.42:8000
```

### 3. Start the backend

```bash
cd backend
cp .env.example .env
# Edit backend/.env — add your ANTHROPIC_API_KEY

python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
./run.sh
# Backend runs at http://localhost:8000
```

### 4. Add the OpenDyslexic font

Download [OpenDyslexic-Regular.otf](https://opendyslexic.org/) and place it at:

```
assets/fonts/OpenDyslexic-Regular.otf
```

### 5. Run on iOS simulator

```bash
# In project root (not backend/)
npx expo start --ios
```

### 6. Run on a physical device (requires EAS)

```bash
eas build --profile development --platform ios
# Then open the generated .ipa on your device
```

---

## Architecture

```
brain/
├── app/                     # Expo Router screens (file-based routing)
│   ├── _layout.tsx          # Root layout — font loading, DB init, store hydration
│   ├── index.tsx            # Entry redirect (onboarding vs. tabs)
│   ├── output.tsx           # Processed text + audio playback
│   ├── onboarding/          # 3-step onboarding flow
│   │   ├── reading-level.tsx
│   │   ├── language.tsx
│   │   └── display.tsx
│   └── (tabs)/              # Main app tabs
│       ├── index.tsx        # Home — mode selection + capture button
│       ├── camera.tsx       # Camera viewfinder + OCR trigger
│       └── profile.tsx      # Reading stats + settings
│
├── components/              # Reusable UI
│   ├── ModeCard.tsx
│   ├── AudioControls.tsx
│   ├── TextDisplay.tsx      # Word-tap support for Define mode
│   └── OnboardingStep.tsx
│
├── lib/
│   ├── claude.ts            # Streaming fetch client → backend
│   ├── ocr.ts               # ML Kit text recognition wrapper
│   ├── tts.ts               # expo-speech helpers
│   └── db.ts                # SQLite schema, queries, session logging
│
├── hooks/
│   ├── useReadingProfile.ts # Profile load/update, syncs store ↔ SQLite
│   ├── useOCR.ts            # OCR state machine
│   └── useTTS.ts            # Play/stop/toggle TTS
│
├── store/index.ts           # Zustand global state
├── constants/index.ts       # Colors, modes, languages, reading levels
│
└── backend/
    ├── main.py              # FastAPI — /api/read, /api/simplify, /api/translate, /api/define
    ├── requirements.txt
    └── run.sh
```

---

## The 4 modes

| Mode | What it does |
|---|---|
| **Read** | Cleans OCR noise and reads aloud |
| **Simplify** | Rewrites at user's chosen reading level (1–5) |
| **Translate** | Translates to the user's target language |
| **Define** | Tap any word → plain-English definition + example |

---

## Privacy

- OCR runs entirely on-device using Apple Vision (iOS) or ML Kit (Android).
- Raw images are never transmitted anywhere.
- Only the extracted text string goes to the backend, where it's forwarded to Claude.
- Session history is stored in on-device SQLite only.

---

## Offline fallback

The last 10 session outputs are cached in SQLite. If the backend is unreachable, the Output screen displays the cached processed text for that captured input (where available) rather than failing silently.

---

## Accessibility

- All interactive elements have `accessibilityLabel` and `accessibilityRole`.
- Minimum tap target: 44×44pt.
- OpenDyslexic font toggle available in onboarding and profile settings.
- Adjustable font size (12–36pt) on the Output screen.
- Audio controls are VoiceOver-announced.

---

## EAS build profile (eas.json)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

---

## Environment variables

| Variable | Where | Description |
|---|---|---|
| `EXPO_PUBLIC_BACKEND_URL` | `.env` | Backend base URL (e.g. `http://192.168.1.42:8000`) |
| `EXPO_PUBLIC_SUPABASE_URL` | `.env` | Supabase project URL (optional, for cloud sync) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env` | Supabase anon key (optional) |
| `ANTHROPIC_API_KEY` | `backend/.env` | Anthropic API key |

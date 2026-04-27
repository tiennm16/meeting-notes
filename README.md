# In-Person Meeting Notes App

Record in-person meetings with one tap. The app keeps recording in the background, uploads the audio when you stop, and sends a push notification with the transcript and summary when processing is done. Tapping the notification opens the meeting detail directly.

---

## Repository Layout

```
/mobile     — Expo SDK 54 app (TypeScript, Expo Router)
/backend    — Python FastAPI server
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| Python | 3.11+ |
| Expo CLI | `npx expo` (bundled) |
| EAS CLI | `npm i -g eas-cli` |
| Supabase project | with Storage + a `recordings` bucket |
| Firebase project | with FCM enabled (for push notifications) |

---

## Setup — Backend

```bash
cd backend

# 1. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env — fill in all required values (see below)

# 4. Create a test user in Supabase
python scripts/create_test_user.py

# 5. Start the server
uvicorn app.main:app --reload --port 8000
```

### Backend environment variables (`.env`)

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=          # service-role key from Supabase dashboard
SUPABASE_STORAGE_BUCKET=recordings  # must exist and be public or signed-URL enabled
PORT=8000
MAX_AUDIO_BYTES=26214400            # 25 MB default

OPENAI_API_KEY=                     # leave blank to use mock transcription
OPENAI_TRANSCRIPTION_MODEL=whisper-1

FIREBASE_CREDENTIALS=/absolute/path/to/firebase-service-account.json
```

> **Transcription:** if `OPENAI_API_KEY` is blank the backend uses a mock that returns placeholder text. This is fine for local development.

---

## Setup — Mobile App

```bash
cd mobile

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — fill in values (see below)

# 3a. Run in Expo Go (limited — background audio requires a dev build)
npx expo start

# 3b. Run a development build (recommended for full background recording)
npx expo prebuild
npx expo run:ios       # or run:android
```

### Mobile environment variables (`.env`)

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000   # backend URL reachable from the device
EXPO_PROJECT_ID=                                 # EAS project ID (from expo.dev)
EXPO_PUBLIC_DEEP_LINK_HOST=                      # optional: HTTPS host for Universal Links
```

> **Firebase:** place your `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) in `mobile/` before running prebuild. These files are git-ignored.

---

## Supabase Database Setup

Run the following SQL in the Supabase SQL editor:

```sql
create table meetings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users,
  title       text,
  status      text default 'recording',  -- 'recording' | 'processing' | 'done'
  audio_url   text,
  transcript  text,
  summary     text,
  created_at  timestamptz default now()
);

alter table meetings enable row level security;

create policy "Users can manage their own meetings"
  on meetings for all
  using (auth.uid() = user_id);
```

---

## How It Works

```
Mobile app                          Backend (FastAPI)            Supabase
──────────────────────────────────────────────────────────────────────────
1. Login (email/password)   ──▶  POST /auth/login
                            ◀──  JWT
2. Register push token      ──▶  POST /auth/push-token
3. Tap Record              (expo-audio starts recording)
4. Tap Stop               ──▶  POST /meetings  (multipart: audio file)
                            ──▶  uploads audio ─────────────▶  Storage
                            ──▶  inserts row ────────────────▶  meetings
                            ◀──  { meeting_id }
   [background job]
5. Transcribe + summarize   ──▶  updates row ──────────────▶  meetings
6. Send push via FCM        ──▶  Firebase FCM
                                      │
                                      ▼ notification
7. User taps notification
   → deep links to /meeting/[id]
```

---

## Architecture Decisions

### Backend owns Supabase; mobile only talks to FastAPI
The mobile app sends raw audio to the backend and receives meeting IDs back. Supabase credentials (service-role key) never leave the server. This keeps the attack surface small and lets the backend enforce business logic (file size limits, format validation, RLS) in one place.

### Custom auth instead of Supabase Auth on the device
Users are pre-seeded server-side. The app ships a login-only screen (no registration). The backend issues short-lived JWTs; Supabase Auth is used only for RLS enforcement via the service-role key on the backend.

### expo-audio for recording
`expo-audio` (SDK 54) is the current recommended audio library. Background recording is enabled via `UIBackgroundModes: ["audio"]` (iOS) and a foreground service with `microphone` type (Android) — both declared in `app.config.ts` using built-in Expo config keys and `expo-build-properties`. No custom native module is needed.

### Firebase for push notifications
`@react-native-firebase/messaging` is used over `expo-notifications` for more reliable FCM delivery, especially when the app is killed. The backend sends messages via the `firebase-admin` SDK directly to FCM tokens.

### Mock transcription by default
The transcription service is behind a simple async interface. The default implementation calls OpenAI Whisper when `OPENAI_API_KEY` is set, and falls back to a mock. The summarize step is always mocked — replacing it with an LLM call is a one-function change.

---

## What I'd Improve With More Time

1. **Real summarization** — swap the mock `summarize()` for a GPT-4o call with a meeting-optimised system prompt (action items, decisions, attendees).
2. **Chunked / streaming upload** — large audio files (30+ minutes) should upload in chunks rather than one multipart POST, with progress feedback in the UI.
3. **Retry queue** — if the device loses connectivity before the upload completes, the recording should be queued locally and retried on reconnect.
4. **Speaker diarization** — distinguish speakers in the transcript using Whisper's word timestamps + a diarization model (e.g. pyannote).
5. **End-to-end tests** — integration tests covering the full pipeline (upload → transcribe → notify) using a test Supabase project and a mock FCM endpoint.
6. **CI/CD** — GitHub Actions workflow: lint + typecheck on PRs, EAS build on merge to main.

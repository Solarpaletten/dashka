# 🇺🇸 Dashka English Translato — v1.0.1

DE-only production wrapper for Dashka Chat API.

## 🌐 Live URLs

| Service | URL |
|---------|-----|
| Frontend | https://dashka-chat.onrender.com |
| Backend  | https://api-dashka-chat.onrender.com |
| Health   | https://api-dashka-chat.onrender.com/health |

---

## 🏗 Architecture

```
Browser / iOS / Android
        ↓
Static Site (web/)  →  https://dashka-chat.onrender.com
        ↓
REST API (backend/) →  https://api-dashka-chat.onrender.com
        ↓
OpenAI (GPT-4o-mini + Whisper)
```

---

## 📦 Project Structure

```
backend/   → Node.js API (Render Web Service)
web/       → Vite + React DE-only wrapper (Render Static Site)
docs/      → mobile reference implementations (iOS / Android)
```

---

## 🎯 Product Scope (v1.0.1)

- German-only target language (DE)
- Auto-detect source language
- Text translation (`POST /translate`)
- Voice translation (`POST /voice-translate`)
- No WebSocket in client layer
- Unified state model: Web / iOS / Android

---

## 🚀 Deployment (Render)

Both services are defined in `render.yaml`.

### Backend — Web Service
| Setting | Value |
|---------|-------|
| Root Dir | `backend` |
| Build | `npm install` |
| Start | `node src/server.js` |
| Health Check | `/health` |

### Frontend — Static Site
| Setting | Value |
|---------|-------|
| Root Dir | `web` |
| Build | `npm install && npm run build` |
| Publish Dir | `dist` |

---

## 🔐 Required Render Environment Variables

### Backend service:
| Variable | Value |
|----------|-------|
| `OPENAI_API_KEY` | *(secret — set in Render dashboard)* |
| `CORS_ORIGIN` | `https://dashka.onrender.com` |
| `NODE_ENV` | `production` |

### Frontend (Static Site):
| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://dashka-api.onrender.com` |

---

## 💻 Local Development

```bash
# Backend
cd backend
cp .env.example .env
# → заполни OPENAI_API_KEY в .env
npm install
npm run dev   # → http://localhost:8080

# Frontend
cd web
echo "VITE_API_URL=http://localhost:8080" > .env
npm install
npm run dev   # → http://localhost:5173
```

---

## 📡 API Contract (v1.0.1)

### `GET /health`
```json
{ "status": "ok", "version": "1.0.1", "timestamp": "..." }
```

### `POST /translate`
Request: `{ "text": "...", "target_language": "DE" }`
Response: `{ "status": "success", "original_text": "...", "translated_text": "..." }`

### `POST /voice-translate`
Request: `multipart/form-data` — fields: `audio` (file) + `target_language=DE`
Response: `{ "status": "success", "original_text": "...", "translated_text": "..." }`

---

## 📱 Mobile Reference

iOS and Android skeleton implementations are in `docs/`.
State model is identical across all platforms:
`inputText · translatedText · isTranslating · isRecording · backendAwake · error`

---

## 📋 Changelog

### v1.0.1 — Stabilization Patch
- **P0 FIX**: `/voice-translate` response now returns `snake_case` fields (`original_text`, `translated_text`) — fixes Web/iOS/Android voice path
- **P1 SEC**: CORS never allows `*` in production — defaults to `https://dashka-chat.onrender.com`
- **P2 REL**: `UnifiedTranslationService` fails fast with HTTP 503 if `OPENAI_API_KEY` missing
- **P3 HYG**: All `console.log` replaced with `winston` logger; no user text in logs
- **P4 OPT**: `/health` returns lightweight JSON; extended info moved to `/health/details`
- **P5 OPS**: `render.yaml` includes both Backend + Static Site; `CORS_ORIGIN` documented

### v1.0.0 — Initial Production Release
- DE-only production wrapper
- Removed legacy multi-language frontend
- Unified state model with mobile apps
- Production split: static frontend + API backend

git add \
  backend/src/routes/voice.js \
  backend/src/config/cors.js \
  backend/src/services/unifiedTranslationService.js \
  backend/src/services/whisperService.js \
  backend/src/routes/health.js \
  render.yaml \
  backend/.env.example \
  README.md

git commit -F patch-v1.0.1/COMMIT_MESSAGE_super.txt

git tag v1.0.1-de-stable_super

git push origin main --tags

v1.2/
├── COMMIT_MESSAGE.txt
├── MOBILE_PORTING.md
└── web/
    ├── tailwind.config.js
    └── src/
        ├── core/
        │   ├── network/
        │   │   └── apiClient.ts
        │   └── types/
        │       └── translator.types.ts
        └── feature/
            └── german/
                ├── useGermanTranslator.ts
                ├── GermanScreen.tsx
                ├── DirectionToggle.tsx
                └── ConversationMode.tsx
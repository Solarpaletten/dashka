# 🚀 RELEASE GUIDE — v1.0.1-de-stable

## Шаги применения патча

### 1. Скопировать файлы из патча в репо

```bash
# Из корня репозитория Solarpaletten/dashka-chat:

cp patch-v1.0.1/backend/src/routes/voice.js        backend/src/routes/voice.js
cp patch-v1.0.1/backend/src/config/cors.js          backend/src/config/cors.js
cp patch-v1.0.1/backend/src/services/unifiedTranslationService.js  backend/src/services/unifiedTranslationService.js
cp patch-v1.0.1/backend/src/services/whisperService.js             backend/src/services/whisperService.js
cp patch-v1.0.1/backend/src/routes/health.js        backend/src/routes/health.js
cp patch-v1.0.1/render.yaml                         render.yaml
cp patch-v1.0.1/backend/.env.example                backend/.env.example
cp patch-v1.0.1/README.md                           README.md
```

### 2. Локальная проверка (backend)

```bash
cd backend
npm install

# Тест без ключа — должен ответить 503, не crash
OPENAI_API_KEY= node src/server.js
# → в логах: [UnifiedTranslationService] OPENAI_API_KEY не установлен

# Тест health
curl http://localhost:8080/health
# → {"status":"ok","version":"1.0.1","timestamp":"..."}

# Тест с ключом
OPENAI_API_KEY=sk-... node src/server.js
curl -X POST http://localhost:8080/voice-translate ... 
# → {"status":"success","original_text":"...","translated_text":"..."}
```

### 3. Проверка CORS в production

```bash
# backend/src/config/cors.js тест:
NODE_ENV=production CORS_ORIGIN= node -e "
  require('./backend/src/config/cors.js');
"
# → [CORS] CORS_ORIGIN не задан → дефолт: https://dashka.onrender.com
```

### 4. Commit & Tag

```bash
git add \
  backend/src/routes/voice.js \
  backend/src/config/cors.js \
  backend/src/services/unifiedTranslationService.js \
  backend/src/services/whisperService.js \
  backend/src/routes/health.js \
  render.yaml \
  backend/.env.example \
  README.md

git commit -F patch-v1.0.1/COMMIT_MESSAGE.txt

git tag v1.0.1-de-stable

git push origin main --tags
```

---

## Acceptance Criteria Checklist

```
☐ curl https://dashka-api.onrender.com/health
  → {"status":"ok","version":"1.0.1",...}

☐ Web: voice translate → translatedText НЕ undefined

☐ iOS/Android: VoiceResult.translated_text декодируется корректно

☐ Backend: CORS_ORIGIN в Render env = https://dashka.onrender.com
  → curl с другого домена → 403/blocked

☐ GitHub push protection: не срабатывает
  → .env.example содержит только REPLACE_ME

☐ Логи production: нет console.log, нет текстов пользователя
```

---

## Render Dashboard — после деплоя

Проверить в Backend service → Environment:
- `OPENAI_API_KEY` = реальный ключ (secret)
- `CORS_ORIGIN` = `https://dashka.onrender.com`
- `NODE_ENV` = `production`

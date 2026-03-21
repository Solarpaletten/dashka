# 🇩🇪 Dashka DE — Web · RUN.md

## Запуск (development)

```bash
cd web
npm install
npm run dev
# → http://localhost:5173
```

## Билд (production)

```bash
npm run build
npm run preview
```

## Env

`.env` уже настроен на production backend:
```
VITE_API_URL=https://dashka-translate.onrender.com
```
Для local backend: замени на `http://localhost:8080`

## Критерии приёмки

- Страница открывается
- Виден заголовок "Dashka / German Translator"
- Кнопка Wake Up пробуждает Render backend
- Индикатор зеленеет после wake-up
- Текстовый перевод работает -> Deutsch
- Кнопка микрофона запускает запись
- Responsive: 320 / 390 / 768 / 1024+

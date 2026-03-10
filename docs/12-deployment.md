# 12. Деплой

**Приоритет:** P4 (деплой) / P0 (firebase-артефакты) | **Сложность:** S

## Важно: бэкенд не рефакторим

**json-server (`api.js`) и файлы данных (`data/*.json`) остаются без изменений.** Это сознательное архитектурное решение. Рефакторинг затрагивает только фронтенд.

## Firebase-артефакты

В проекте присутствуют файлы Firebase:

| Файл            | Содержимое                          |
| --------------- | ----------------------------------- |
| `firebase.json` | Конфиг Firebase Hosting             |
| `.firebaserc`   | Project alias                       |
| `.firebase/`    | Кэш деплоя (`hosting.ZGlzdA.cache`) |

### Действие

**Если Firebase используется для деплоя** — оставить файлы, добавить `.firebase/` в `.gitignore`.

**Если Firebase НЕ используется** — удалить все три:

```bash
rm firebase.json .firebaserc
rm -rf .firebase/
```

И убрать упоминание `firebase deploy` из документации.

**Рекомендация:** уточнить у владельца проекта, используется ли Firebase для деплоя.

## Варианты деплоя фронтенда

### Вариант A: Firebase Hosting (текущий)

Уже настроен. Команда: `firebase deploy`.

Убедиться, что `firebase.json` содержит корректный `rewrites` для SPA:

```json
{
	"hosting": {
		"public": "dist",
		"rewrites": [{ "source": "**", "destination": "/index.html" }]
	}
}
```

### Вариант B: Vercel

```bash
npm i -g vercel
vercel
```

Vercel автоматически определяет Vite-проект. Настройки:

- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: `VITE_API_BASE_URL`

### Вариант C: Netlify

Файл `netlify.toml` в корне:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Вариант D: GitHub Pages

Настройка `base` в `vite.config.ts`:

```typescript
export default defineConfig({
	base: '/resource-planner/', // имя репозитория
	// ...
});
```

GitHub Actions workflow для автодеплоя.

## Переменные окружения для production

| Переменная          | Назначение              | Пример                     |
| ------------------- | ----------------------- | -------------------------- |
| `VITE_API_BASE_URL` | URL API-сервера         | `https://api.example.com`  |
| `VITE_HELP_URL`     | URL справки в NavHeader | `https://docs.example.com` |

**Важно:** в production `VITE_API_BASE_URL` должен указывать на реальный API-сервер (или json-server, развёрнутый отдельно), а не на `localhost:3001`.

## Файлы для изменения

| Файл             | Действие                                       |
| ---------------- | ---------------------------------------------- |
| `.gitignore`     | Добавить `.firebase/` (если Firebase остаётся) |
| `firebase.json`  | Проверить конфиг / удалить если не нужен       |
| `.firebaserc`    | Проверить / удалить если не нужен              |
| `.firebase/`     | Добавить в .gitignore / удалить если не нужен  |
| `vite.config.ts` | Настроить `base` при деплое на GitHub Pages    |

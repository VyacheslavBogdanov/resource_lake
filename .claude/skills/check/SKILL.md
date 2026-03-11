---
name: check
description: Регрессионное тестирование — автоматическая проверка сборки, API, страниц и кода после рефакторинга
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(npm run build*, npm run test*, npx vitest*, npx playwright*, lsof*, curl*, kill*, npm run dev*, wc*)
---

# /check — Регрессионное тестирование

Выполни все проверки последовательно и выведи финальный отчёт. Работай в директории проекта.

## 1. Сборка (`npm run build`)

Запусти `npm run build`. Проверь exit code:
- **0** → ✅ Сборка успешна
- **не 0** → ❌ Ошибка сборки (покажи вывод ошибки)

## 1.5. Unit-тесты (vitest)

Запусти `npx vitest run --reporter=verbose 2>&1`. Проверь exit code:
- **0** → ✅ Unit-тесты: N passed
- **не 0** → ❌ Unit-тесты: N failed (покажи ошибки)

## 2. Dev-сервер

Проверь, запущены ли процессы на портах 5173 и 3001:
```bash
lsof -ti:5173
lsof -ti:3001
```

Если **оба** порта заняты — сервер уже работает, переходи к шагу 2.5.

Если хотя бы один порт свободен — запусти dev-сервер:
```bash
npm run dev &
```
Дождись готовности (до 15 секунд), проверяя `lsof -ti:5173` и `lsof -ti:3001`.

Результат:
- Оба порта отвечают → ✅ Dev-сервер запущен
- Таймаут → ❌ Dev-сервер не запустился

## 2.5. E2E-тесты (playwright)

Запусти `npx playwright test --reporter=list 2>&1`. Проверь exit code:
- **0** → ✅ E2E-тесты: N passed
- **не 0** → ❌ E2E-тесты: N failed (покажи ошибки)

## 3. API отвечает

Выполни curl-запросы к API (порт 3001):
```bash
curl -s http://localhost:3001/projects
curl -s http://localhost:3001/groups
curl -s http://localhost:3001/allocations
```

Для каждого эндпоинта проверь:
- Ответ — валидный JSON-массив (начинается с `[`)
- Массив не пустой (содержит хотя бы один элемент)

Результат по каждому:
- ✅ `/projects` — N записей
- ✅ `/groups` — N записей
- ✅ `/allocations` — N записей
- ❌ если запрос упал или ответ не массив

## 4. Страницы отдают HTML

Выполни curl-запросы к клиенту (порт 5173):
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/plan
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/projects
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/groups
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/manage
```

Для каждой страницы:
- HTTP 200 → ✅
- Другой код → ❌

## 5. Валидация данных

Прочитай файлы `data/projects.json`, `data/groups.json`, `data/data.json` с помощью Read.

**projects.json** — массив `projects`, каждый объект должен содержать:
- `id` (number), `name` (string) — обязательные
- `archived`, `order`, `url`, `customer`, `projectType`, `projectManager`, `description` — опциональные

**groups.json** — массив `groups`, каждый объект должен содержать:
- `id` (number), `name` (string), `capacityHours` (number) — обязательные
- `supportPercent`, `resourceType`, `position` — опциональные

**data.json** — массив `allocations`, каждый объект должен содержать:
- `id` (number), `projectId` (number), `groupId` (number), `hours` (number) — обязательные
- `q1`, `q2`, `q3`, `q4` — опциональные (number)

Проверь, что все обязательные поля присутствуют и имеют правильный тип в каждой записи.

Результат:
- ✅ `projects.json` — N записей, структура корректна
- ✅ `groups.json` — N записей, структура корректна
- ✅ `data.json` — N записей, структура корректна
- ❌ если файл не найден, не парсится, или обязательные поля отсутствуют

## 6. Качество кода

### 6a. Проверка на `any`

Используй Grep для поиска `: any` и `as any` в файлах `*.ts` и `*.vue` в `src/`:
```
pattern: "(: any|as any)[^a-zA-Z]"
glob: "*.{ts,vue}"
path: "src/"
```

- Не найдено → ✅ Нет `any` в коде
- Найдено → ❌ Найдено N использований `any` (покажи файлы и строки)

### 6b. Размер компонентов (лимит 300 строк)

Используй Bash для проверки количества строк в `.vue` файлах:
```bash
wc -l src/pages/*.vue src/components/*.vue
```

- Все файлы ≤ 300 строк → ✅
- Есть файлы > 300 строк → ❌ (перечисли файлы и количество строк)

## 7. Финальный отчёт

Выведи таблицу результатов:

```
## Результаты автоматической проверки

| #   | Проверка                  | Результат |
|-----|---------------------------|-----------|
| 1   | Сборка (npm run build)    | ✅ / ❌    |
| 1.5 | Unit-тесты (vitest)       | ✅ / ❌    |
| 2   | Dev-сервер (5173 + 3001)  | ✅ / ❌    |
| 2.5 | E2E-тесты (playwright)    | ✅ / ❌    |
| 3a  | API: /projects            | ✅ / ❌    |
| 3b  | API: /groups              | ✅ / ❌    |
| 3c  | API: /allocations         | ✅ / ❌    |
| 4a  | Страница: /plan           | ✅ / ❌    |
| 4b  | Страница: /projects       | ✅ / ❌    |
| 4c  | Страница: /groups         | ✅ / ❌    |
| 4d  | Страница: /manage         | ✅ / ❌    |
| 5a  | Данные: projects.json     | ✅ / ❌    |
| 5b  | Данные: groups.json       | ✅ / ❌    |
| 5c  | Данные: data.json         | ✅ / ❌    |
| 6a  | Нет `any` в коде          | ✅ / ❌    |
| 6b  | Компоненты ≤ 300 строк    | ✅ / ❌    |
```

## 8. Ручной чеклист

После таблицы выведи напоминание о проверке, которая требует ручного тестирования:

```
## Требует ручной проверки

- [ ] Визуальное оформление не изменилось (цвета, отступы, шрифты, тени)
```

# Resource Planner

Веб-приложение для управления распределением ресурсов по проектам и группам.

## Возможности

- Матрица распределения ресурсов (проекты × группы)
- Поквартальная разбивка часов (q1–q4)
- Автоматический расчёт итогов и загрузки мощностей
- Импорт/экспорт данных
- Управление проектами и ресурсными группами

## Начало работы

### Требования

- Node.js (LTS)
- npm

### Установка

```bash
git clone <repo-url>
cd resource_lake
npm install
```

### Запуск

```bash
npm run dev          # Клиент (порт 5173) + API (порт 3001) параллельно
npm run dev:client   # Только Vite dev server
npm run dev:api      # Только json-server API
npm run build        # Production-сборка
npm run preview      # Превью сборки (порт 5173)
npm run lint         # ESLint --fix
npm run format       # Prettier --write src/
```

### Тестирование

```bash
npm run test         # Unit-тесты (vitest)
npm run test:watch   # Unit-тесты в watch-режиме
npm run test:e2e     # E2E-тесты (playwright, требует запущенный dev-сервер)
npm run test:all     # Unit + E2E тесты последовательно
```

### Утилиты для данных

```bash
npm run seed          # Генерация тестовых данных (30 проектов, 15 групп, allocations)
npm run reset         # Очистка всех данных (пустые JSON-файлы)
```

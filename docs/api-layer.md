# API-слой

## Архитектура

HTTP-клиент находится в `src/services/`:

- `http.ts` — fetch-обёртка с retry и типизированным API
- `errors.ts` — класс `ApiError`

### ApiError

```typescript
// src/services/errors.ts
export class ApiError extends Error {
	constructor(
		public readonly status: number,
		public readonly statusText: string,
		public readonly body?: unknown,
	) {
		super(`${status} ${statusText}`);
		this.name = 'ApiError';
	}

	get isNotFound() {
		return this.status === 404;
	}
	get isServerError() {
		return this.status >= 500;
	}
	get isNetworkError() {
		return this.status === 0;
	}
}
```

### HTTP-клиент с retry

```typescript
// src/services/http.ts
const MAX_RETRIES = 2;
const RETRY_DELAYS = [500, 1500]; // ms
```

- Автоматический retry для 5xx и сетевых ошибок (до 2 попыток с backoff)
- `Content-Type: application/json` для методов с body
- DELETE возвращает `undefined`, остальные — `res.json()`

### API-методы

HTTP-клиент экспортирует типизированные методы:

```typescript
api.list<T>(resource); // GET /resource
api.get<T>(resource, id); // GET /resource/:id
api.create<T>(resource, data); // POST /resource
api.update<T>(resource, id, data); // PUT /resource/:id
api.remove(resource, id); // DELETE /resource/:id
```

### Обработка ошибок в сторах

Все async-экшены сторов оборачивают API-вызовы в try/catch. Ошибки логируются в консоль и пробрасываются для обработки в компоненте при необходимости.

### Рекомендация

Для уведомления пользователя об ошибках можно добавить useToast composable + AppToast компонент. Текущая реализация ограничивается console-логированием.

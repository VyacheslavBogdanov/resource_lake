# 08. API-слой и обработка ошибок

**Приоритет:** P2 | **Сложность:** M

## Текущее состояние

`src/services/http.ts` (38 строк):

```typescript
if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
```

**Проблемы:**

- Единственная обработка ошибок — `throw new Error(status)`
- Нет retry для временных сбоев (5xx)
- Нет структурированного класса ошибки (теряется status code, response body)
- В экшенах стора нет try/catch — ошибки всплывают без обработки
- Пользователь не видит уведомлений об ошибках

## Решение

### 1. ApiError class

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

### 2. Retry с backoff для 5xx

```typescript
// src/services/http.ts
const MAX_RETRIES = 2;
const RETRY_DELAYS = [500, 1500]; // ms

async function http<T>(input: RequestInfo, init: RequestInit = {}): Promise<T> {
	const method = (init.method || 'GET').toUpperCase();
	const isBodyMethod = !['GET', 'HEAD'].includes(method);
	const baseHeaders: HeadersInit = isBodyMethod ? { 'Content-Type': 'application/json' } : {};

	let lastError: ApiError | null = null;

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		if (attempt > 0) {
			await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt - 1]));
		}

		try {
			const res = await fetch(input, {
				...init,
				headers: { ...baseHeaders, ...(init.headers || {}) },
			});

			if (!res.ok) {
				const body = await res.text().catch(() => undefined);
				throw new ApiError(res.status, res.statusText, body);
			}

			return method === 'DELETE' ? (undefined as unknown as T) : ((await res.json()) as T);
		} catch (err) {
			if (err instanceof ApiError && err.isServerError && attempt < MAX_RETRIES) {
				lastError = err;
				continue;
			}
			if (err instanceof TypeError) {
				// Network error (fetch failed)
				lastError = new ApiError(0, 'Network Error');
				if (attempt < MAX_RETRIES) continue;
			}
			throw err;
		}
	}

	throw lastError;
}
```

### 3. useToast composable + AppToast компонент

```typescript
// src/composables/useToast.ts
import { ref } from 'vue';

interface Toast {
	id: number;
	type: 'success' | 'error' | 'warning';
	message: string;
}

const toasts = ref<Toast[]>([]);
let nextId = 0;

export function useToast() {
	function show(type: Toast['type'], message: string, duration = 5000) {
		const id = nextId++;
		toasts.value.push({ id, type, message });
		setTimeout(() => remove(id), duration);
	}

	function remove(id: number) {
		toasts.value = toasts.value.filter((t) => t.id !== id);
	}

	return {
		toasts,
		success: (msg: string) => show('success', msg),
		error: (msg: string) => show('error', msg),
		warning: (msg: string) => show('warning', msg),
		remove,
	};
}
```

Компонент `AppToast` описан в [04-ui-kit-and-shared-components.md](04-ui-kit-and-shared-components.md).

### 4. Обработка ошибок в actions

Паттерн для каждого экшена стора:

```typescript
// Было (без обработки):
async addProject(name: string, ...) {
    const created = await api.create<Project>('projects', { name, ... });
    this.projects.push(created);
}

// Стало:
async addProject(name: string, ...) {
    try {
        const created = await api.create<Project>('projects', { name, ... });
        this.projects.push(created);
    } catch (err) {
        const toast = useToast();
        if (err instanceof ApiError) {
            toast.error(`Ошибка при создании проекта: ${err.message}`);
        } else {
            toast.error('Неизвестная ошибка при создании проекта');
        }
        throw err; // Пробрасываем для обработки в компоненте при необходимости
    }
}
```

Для уменьшения boilerplate можно создать обёртку:

```typescript
// src/services/withErrorHandling.ts
import { ApiError } from './errors';
import { useToast } from '@/composables/useToast';

export async function withApiCall<T>(
	action: () => Promise<T>,
	errorMessage: string,
): Promise<T | undefined> {
	try {
		return await action();
	} catch (err) {
		const toast = useToast();
		if (err instanceof ApiError) {
			toast.error(`${errorMessage}: ${err.message}`);
		} else {
			toast.error(errorMessage);
		}
		return undefined;
	}
}
```

### 5. Dev-логирование (опционально)

```typescript
// Interceptor для dev-окружения
if (import.meta.env.DEV) {
	console.groupCollapsed(`[API] ${method} ${input}`);
	console.log('Status:', res.status);
	console.log('Body:', body);
	console.groupEnd();
}
```

## Альтернатива: миграция на axios

Если проект будет расти, можно рассмотреть axios:

```bash
npm i axios
```

Плюсы: interceptors из коробки, автоматический retry (axios-retry), отмена запросов, прогресс загрузки.

Минусы: лишняя зависимость для текущего масштаба проекта.

**Рекомендация:** оставить fetch с кастомными улучшениями — проект маленький, axios избыточен.

## Файлы для изменения/создания

| Файл                             | Действие                               |
| -------------------------------- | -------------------------------------- |
| `src/services/errors.ts`         | Создать: ApiError class                |
| `src/services/http.ts`           | Изменить: retry, ApiError вместо Error |
| `src/composables/useToast.ts`    | Создать: toast система                 |
| `src/components/ui/AppToast.vue` | Создать: UI-компонент тостов           |
| `src/stores/*.ts`                | Изменить: добавить try/catch в экшены  |

## Связанные документы

- [04-ui-kit-and-shared-components.md](04-ui-kit-and-shared-components.md) — AppToast компонент
- [05-store-decomposition.md](05-store-decomposition.md) — обработка ошибок в новых сторах

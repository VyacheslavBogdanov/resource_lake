# 09. Оптимизация производительности

**Приоритет:** P2 | **Сложность:** S

## Проблема

Геттеры `valueByPair()` и `quarterByPair()` в `src/stores/resource/index.ts` (строки 30-90) используют `.find()` по массиву allocations:

```typescript
// строка 30-34
valueByPair: (state) => (projectId: number, groupId: number): number =>
    state.allocations.find(a => a.projectId === projectId && a.groupId === groupId)?.hours ?? 0,

// строка 77-90
quarterByPair: (state) => (projectId: number, groupId: number) => {
    const a = state.allocations.find(
        x => x.projectId === projectId && x.groupId === groupId,
    );
    // ...
}
```

### Сложность

- `.find()` = O(A) где A — количество аллокаций
- Для таблицы M проектов x N групп: каждый рендер вызывает M x N обращений к `valueByPair`
- Итого: M x N x A операций сравнения на рендер
- При M=50, N=20, A=500: 50 x 20 x 500 = **500 000 операций** на один рендер
- При изменении любой ячейки реактивность пересчитывает все геттеры

## Решение: индекс Map для O(1) доступа

### Реактивный индекс как геттер

```typescript
// В allocationsStore (после декомпозиции стора)
// или в текущем useResourceStore

getters: {
    /** Индекс аллокаций по ключу "projectId:groupId" → Allocation */
    allocationsByPair(state): Map<string, Allocation> {
        const map = new Map<string, Allocation>();
        for (const a of state.allocations) {
            map.set(`${a.projectId}:${a.groupId}`, a);
        }
        return map;
    },

    /** O(1) доступ к часам по паре проект-группа */
    valueByPair(): (projectId: number, groupId: number) => number {
        return (projectId, groupId) =>
            this.allocationsByPair.get(`${projectId}:${groupId}`)?.hours ?? 0;
    },

    /** O(1) доступ к квартальным данным */
    quarterByPair(): (projectId: number, groupId: number) => { q1: number; q2: number; q3: number; q4: number } | null {
        return (projectId, groupId) => {
            const a = this.allocationsByPair.get(`${projectId}:${groupId}`);
            if (!a) return null;
            const q1 = a.q1 ?? 0;
            const q2 = a.q2 ?? 0;
            const q3 = a.q3 ?? 0;
            const q4 = a.q4 ?? 0;
            if (!q1 && !q2 && !q3 && !q4) return null;
            return { q1, q2, q3, q4 };
        };
    },
}
```

### Как это работает

1. `allocationsByPair` — computed-геттер Pinia, который пересчитывается только при изменении `state.allocations`
2. Построение Map = O(A) — один раз при изменении данных
3. Каждый доступ через `valueByPair(projectId, groupId)` = O(1) через `Map.get()`
4. Итого на рендер: O(A) построение + M x N x O(1) доступ = **O(A + M\*N)** вместо O(M*N*A)

### До и после

| Метрика                      | До (find)        | После (Map)    |
| ---------------------------- | ---------------- | -------------- |
| Доступ к одной ячейке        | O(A)             | O(1)           |
| Рендер таблицы MxN           | O(M*N*A)         | O(A + M\*N)    |
| Пример: 50x20, 500 аллокаций | 500 000 операций | 1 500 операций |

### Пересборка индекса

Индекс автоматически пересобирается при любом изменении `state.allocations` благодаря реактивности Pinia. Это происходит в:

- `fetchAll()` — после загрузки всех аллокаций
- `setAllocation()` — после создания/обновления аллокации
- `batchSetAllocationsForGroup()` — после пакетного обновления
- `deleteProject()` / `deleteGroup()` — если удаляются связанные аллокации

## Файлы для изменения

| Файл                           | Действие                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `src/stores/resource/index.ts` | Добавить геттер `allocationsByPair`, переписать `valueByPair` и `quarterByPair` |

Если декомпозиция стора уже выполнена (doc 05):

| Файл                        | Действие                                                          |
| --------------------------- | ----------------------------------------------------------------- |
| `src/stores/allocations.ts` | Добавить `byPairIndex`, переписать `valueByPair`, `quarterByPair` |

## Дополнительные оптимизации (при необходимости)

Если таблица будет расти до сотен проектов:

1. **Virtual scrolling** — рендерить только видимые строки (библиотека `vue-virtual-scroller`)
2. **shallowRef** для массива аллокаций — предотвращает глубокое отслеживание
3. **Мемоизация `colTotals`** — сейчас пересчитывает сумму по всем аллокациям при каждом изменении

Но для текущего масштаба проекта индекс Map решает основную проблему.

## Связанные документы

- [05-store-decomposition.md](05-store-decomposition.md) — индекс переносится в `useAllocationsStore`

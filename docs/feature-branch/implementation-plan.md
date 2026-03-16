# План имплементации задач заказчика

Ветка: `feature-branch`
Все изменения выполняются в ветке `feature-branch`.

**Порядок выполнения:** сначала независимые простые задачи, затем фундаментальная задача 3 и зависимые от неё.

```
Задача 2 (простая, независимая)
Задача 1 (простая, независимая)
Задача 3 ← фундамент для 4, 5, 6
  ├── Задача 4 (зависит от 3)
  ├── Задача 5 (зависит от 3)
  └── Задача 6 (зависит от 3)
Задача 7 (независимая)
Задача 8 (независимая)
Задача 9 (независимая)
```

---

## 1. Задача 2: ResourceType редактируемый только в режиме редактирования

На странице «Группы ресурсов» поле «Тип ресурса» отображается как текст, редактируется только при нажатии «Редактировать».

- [x] В `useGroupInlineEdit.ts` — добавить `editResourceType` ref, инициализировать в `startEdit()`, включить в `saveEdit()`, удалить `onResourceTypeBlur()`
- [x] В `GroupTableRow.vue` — заменить постоянный input на шаблон span/input по условию `editingId === group.id`
- [x] В `GroupTable.vue` — прокинуть `editResourceType`, убрать emit `resourceTypeBlur`
- [x] В `Groups.vue` — передать `editResourceType`, убрать обработчик `resourceTypeBlur`
- [x] Ручная проверка: тип ресурса отображается как текст, редактируется только в режиме редактирования

**Файлы:** `src/pages/Groups/composables/useGroupInlineEdit.ts`, `src/pages/Groups/components/GroupTableRow.vue`, `src/pages/Groups/components/GroupTable.vue`, `src/pages/Groups/Groups.vue`

---

## 2. Задача 1: Sticky-шапка таблицы на ResourcePlan

При прокрутке страницы вниз шапка с группами ресурсов приклеивается к верхней части экрана.

- [x] Добавить `max-height: calc(100vh - 280px)` к `.plan__table-wrapper` в `_plan.scss`
- [x] Добавить `position: sticky; top: 0; z-index: 3` к thead таблицы
- [x] Проверить, что фон шапки непрозрачный при скролле
- [x] Ручная проверка на странице /plan с большим количеством проектов

**Файлы:** `src/pages/ResourcePlan/_plan.scss`

---

## 3. Задача 3: Поля description + headcount, авто-расчёт capacity

Добавить поля «Описание» (текст) и «Количество людей» (int). Ёмкость = кол-во людей × 144 ч/ч (read-only). Миграция: кол-во людей = round(текущая ёмкость / 144).

- [x] В `src/stores/constants.ts` — добавить константу `HOURS_PER_PERSON = 144`
- [x] В `src/types/domain.ts` — добавить в `Group`: `headcount: number`, `description?: string`
- [x] В `src/stores/groups.ts` — изменить `addGroup()` (принимать headcount вместо capacityHours), обновить `updateGroup()` (headcount → capacityHours, поле description)
- [x] Миграция `data/groups.json` — для каждой группы: headcount = round(capacityHours / 144), capacityHours = headcount × 144, description = ""
- [x] Обновить `scripts/seed.mjs` — генерация через headcount
- [x] В `GroupTable.vue` — обновить колонки: Название (20%), Тип (13%), Описание (15%), Кол-во чел (10%), Ёмкость (10%, read-only), % поддержки (12%), Действия (20%)
- [x] В `GroupTableRow.vue` — добавить ячейки description и headcount (span/input), ёмкость всегда span
- [x] В `useGroupInlineEdit.ts` — добавить `editHeadcount`, `editDescription`, обновить `saveEdit()`
- [x] Ручная проверка: ёмкость пересчитывается при изменении кол-ва людей, поле ёмкости нередактируемое

**Файлы:** `src/types/domain.ts`, `src/stores/constants.ts`, `src/stores/groups.ts`, `data/groups.json`, `scripts/seed.mjs`, `src/pages/Groups/components/GroupTable.vue`, `src/pages/Groups/components/GroupTableRow.vue`, `src/pages/Groups/composables/useGroupInlineEdit.ts`, `src/pages/Groups/_groups.scss`

---

## 4. Задача 4: Форма добавления группы — name, headcount, support%

При добавлении новой записи заполняется: название, количество людей, процент в поддержке.

- [x] В `useGroupForm.ts` — заменить `newCap` на `newHeadcount`, вызов `addGroup(name, headcount, sp)`
- [x] В `GroupAddForm.vue` — заменить input ёмкости на input количества людей (type="number", min="1", step="1", placeholder="Кол-во человек")
- [x] Ручная проверка: создание группы с headcount, ёмкость рассчитывается автоматически

**Файлы:** `src/pages/Groups/composables/useGroupForm.ts`, `src/pages/Groups/components/GroupAddForm.vue`

---

## 5. Задача 5: Tooltip описания группы на ResourcePlan

При наведении на название группы ресурсов во всплывающем окне отображается описание.

- [ ] В `ResourcePlan.vue` — расширить функцию `columnHeaderTitle()` (строка 84): добавить description из групп в текст native `title` атрибута
- [ ] Ручная проверка: при наведении на заголовок группы видно описание

**Файлы:** `src/pages/ResourcePlan/ResourcePlan.vue`

---

## 6. Задача 6: Инфо-панель группы на DataManage

При выборе группы ресурсов над списком проектов появляется: описание, кол-во человеко-часов, кол-во людей, часы в поддержке.

- [ ] В `DataManage.vue` — добавить computed `selectedGroup`, вставить блок `.manage__group-info` между controls и ManageTable
- [ ] В `_manage.scss` — стили для инфо-панели (flex, wrap, subtle bg, border)
- [x] Обновить `groupOptions` label — показать headcount
- [ ] Ручная проверка: при выборе группы отображается полная информация

**Файлы:** `src/pages/DataManage/DataManage.vue`, `src/pages/DataManage/_manage.scss`

---

## 7. Задача 7: Иконки ссылок + тултипы проектов на DataManage

В списке проектов добавить иконку перехода по ссылке (как на главной) и tooltip с описанием/заказчиком.

- [ ] В `ManageTable.vue` — добавить обёртку `.manage__project-header` с кнопкой-иконкой (SVG из PlanTableRow) + `<span :title>` с описанием и заказчиком
- [ ] Добавить функции `projectUrl()`, `projectHoverTitle()`, `openProjectUrl()`
- [ ] В `_manage.scss` — стили для `.manage__project-header`, `.manage__project-link`
- [ ] Ручная проверка: иконка кликабельна, tooltip показывает описание и заказчика

**Файлы:** `src/pages/DataManage/components/ManageTable.vue`, `src/pages/DataManage/_manage.scss`

---

## 8. Задача 8: CSV-кнопка → иконка рядом с Filter

Кнопку «Выгрузить в CSV» переместить вправо рядом с кнопкой «Фильтр», сделать в виде иконки.

- [ ] В `PlanToolbar.vue` — удалить текстовую BaseButton (строка 33), добавить кнопку-иконку `.plan__csv-btn` рядом с FilterPanel в `.plan__actions-row`
- [ ] В `_plan.scss` — стили для `.plan__csv-btn` (32×32, круглая, border, SVG иконка)
- [ ] Ручная проверка: иконка CSV рядом с фильтром, экспорт работает

**Файлы:** `src/pages/ResourcePlan/components/PlanToolbar.vue`, `src/pages/ResourcePlan/_plan.scss`

---

## 9. Задача 9: Даты обновления данных в NavHeader

В навбаре справа показать дату актуализации данных. Для /projects — дата проектов, /groups — групп, /manage — allocations. На /plan не показывать.

- [ ] В `src/stores/constants.ts` — ключи localStorage: `UPDATED_AT_PROJECTS`, `UPDATED_AT_GROUPS`, `UPDATED_AT_ALLOCATIONS`
- [ ] В `src/stores/storage.ts` — функции `loadUpdatedAt()`, `saveUpdatedAt()`
- [ ] В `src/stores/ui.ts` — state для 3 дат, actions `touchProjectsDate()`, `touchGroupsDate()`, `touchAllocationsDate()`
- [ ] В `src/stores/projects.ts` — вызвать `touchProjectsDate()` в мутирующих actions
- [ ] В `src/stores/groups.ts` — вызвать `touchGroupsDate()` в мутирующих actions
- [ ] В `src/stores/allocations.ts` — вызвать `touchAllocationsDate()` в мутирующих actions
- [ ] В `NavHeader.vue` — computed по `route.name`: выбрать дату из ui store, отформатировать `toLocaleString('ru-RU')`, показать `<span class="header__updated">`
- [ ] Ручная проверка: даты обновляются при изменениях, отображаются на нужных страницах
- [ ] Проверить, что на /plan дата не показывается

**Файлы:** `src/stores/constants.ts`, `src/stores/storage.ts`, `src/stores/ui.ts`, `src/stores/projects.ts`, `src/stores/groups.ts`, `src/stores/allocations.ts`, `src/components/NavHeader.vue`

---

## Финальная проверка

- [ ] `npm run build` — сборка без ошибок
- [ ] `npm run lint && npm run format` — линтинг и форматирование
- [ ] `npm run test` — unit-тесты
- [ ] `npm run test:e2e` — E2E тесты

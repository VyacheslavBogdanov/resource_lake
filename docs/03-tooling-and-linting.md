# 03. Тулинг и линтинг

**Приоритет:** P0 | **Сложность:** S | **Статус:** Завершено

## Текущее состояние

ESLint и Prettier установлены и настроены. Конфиг — `eslint.config.mjs`.

```js
// eslint.config.mjs
import pluginVue from 'eslint-plugin-vue';
import vueTsEslintConfig from '@vue/eslint-config-typescript';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
```

### Установленные пакеты (devDependencies)

- `eslint`
- `eslint-plugin-vue`
- `@vue/eslint-config-typescript`
- `@vue/eslint-config-prettier`
- `prettier`

### Скрипты

```json
{
	"scripts": {
		"lint": "eslint . --fix",
		"format": "prettier --write src/"
	}
}
```

### Конфигурация Prettier (`.prettierrc.json`)

- Табы, одинарные кавычки, точки с запятой
- `printWidth: 120` (согласно CLAUDE.md)
- `trailingComma: "all"`

### .gitignore

Расширен стандартными паттернами: `.env`, `.env.*`, `.env.local`, `*.local`, `.DS_Store`, `.firebase/`.

## Что было сделано

1. Установлены ESLint-пакеты и Prettier
2. Добавлены скрипты `lint` и `format` в `package.json`
3. `eslint.config.js` переименован в `eslint.config.mjs` (в проекте нет `"type": "module"`)
4. Удалён неиспользуемый пакет `xlsx` из `dependencies`
5. Расширен `.gitignore`
6. Исправлен `printWidth`: 100 → 120
7. Исправлено 19 ошибок ESLint (unused imports, `no-explicit-any`, dead code)

## Файлы изменённые

| Файл                | Действие                                                |
| ------------------- | ------------------------------------------------------- |
| `package.json`      | Добавлены devDependencies, удалён xlsx, добавлены скрипты |
| `.prettierrc.json`  | printWidth 100 → 120                                    |
| `.gitignore`        | Расширен список игнорируемых файлов                     |
| `eslint.config.mjs` | Переименован из .js, добавлены правила                  |

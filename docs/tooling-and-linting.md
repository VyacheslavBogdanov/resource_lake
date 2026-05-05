# Тулинг и линтинг

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

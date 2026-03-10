# 03. Тулинг и линтинг

**Приоритет:** P0 | **Сложность:** S

## Проблема

Файл `eslint.config.js` импортирует три пакета, которых нет в `package.json`:

```js
// eslint.config.js
import pluginVue from 'eslint-plugin-vue'; // не установлен
import vueTsEslintConfig from '@vue/eslint-config-typescript'; // не установлен
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'; // не установлен
```

В `package.json` нет ни `eslint`, ни ESLint-плагинов. Команды `lint` и `format` в `scripts` отсутствуют.

Также: зависимость `xlsx` (^0.18.5) указана в `dependencies`, но нигде не импортируется в `src/`.

## Решение

### 1. Установить ESLint-пакеты

```bash
npm i -D eslint eslint-plugin-vue @vue/eslint-config-typescript @vue/eslint-config-prettier
```

### 2. Добавить скрипты в package.json

```json
{
	"scripts": {
		"lint": "eslint . --fix",
		"format": "prettier --write src/"
	}
}
```

Prettier уже подразумевается конфигом `@vue/eslint-config-prettier/skip-formatting`, но если Prettier не установлен глобально:

```bash
npm i -D prettier
```

### 3. Удалить неиспользуемый xlsx

```bash
npm uninstall xlsx
```

Проверка: `xlsx` нигде не импортируется в `src/` (проверено grep-ом).

### 4. Расширить .gitignore

Текущий `.gitignore`:

```
node_modules
dist
*.log
```

Добавить:

```
.env
.env.*
.firebase/
.DS_Store
*.local
```

### 5. Проверка

```bash
npm run lint     # Должен отработать без критических ошибок
npm run format   # Должен переформатировать файлы
```

## Файлы для изменения

| Файл               | Действие                                                                   |
| ------------------ | -------------------------------------------------------------------------- |
| `package.json`     | Добавить devDependencies (eslint, плагины), удалить xlsx, добавить скрипты |
| `.gitignore`       | Расширить список игнорируемых файлов                                       |
| `eslint.config.js` | Без изменений (конфиг уже корректен, просто пакеты не были установлены)    |

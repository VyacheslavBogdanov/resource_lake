// --- Пулы данных ---

const adjectives = [
	'Цифровой',
	'Стальной',
	'Северный',
	'Облачный',
	'Быстрый',
	'Умный',
	'Глобальный',
	'Новый',
	'Открытый',
	'Точный',
	'Единый',
	'Мобильный',
	'Зелёный',
	'Гибкий',
	'Надёжный',
];

const nouns = [
	'горизонт',
	'мост',
	'портал',
	'маяк',
	'щит',
	'поток',
	'спутник',
	'импульс',
	'контур',
	'вектор',
	'резерв',
	'модуль',
	'кластер',
	'пульс',
	'каскад',
];

const customers = [
	'Технокод',
	'Стилсофт',
	'АльфаБанк',
	'РосТех',
	'Сбер',
	'Яндекс',
	'МТС Digital',
	'Газпром Нефть',
];

const projectTypes = ['Разработка', 'Поддержка', 'Консалтинг', 'Интеграция'];

const managers = [
	'Богданов ВЕ',
	'Константинов АП',
	'Смирнова ОВ',
	'Петров ДА',
	'Иванова ЕС',
	'Козлов МИ',
];

const groupDefinitions = [
	{ name: 'Frontend', resourceType: 'Программист' },
	{ name: 'Backend', resourceType: 'Программист' },
	{ name: 'QA', resourceType: 'Тестировщик' },
	{ name: 'DevOps', resourceType: 'Программист' },
	{ name: 'Mobile', resourceType: 'Программист' },
	{ name: 'UX/UI', resourceType: 'Дизайнер' },
	{ name: 'Data Engineering', resourceType: 'Программист' },
	{ name: 'ML', resourceType: 'Аналитик' },
	{ name: 'Security', resourceType: 'Программист' },
	{ name: 'DBA', resourceType: 'Программист' },
	{ name: 'Infra', resourceType: 'Конструктор' },
	{ name: 'Analytics', resourceType: 'Аналитик' },
	{ name: 'Embedded', resourceType: 'Конструктор' },
	{ name: 'Platform', resourceType: 'Программист' },
	{ name: 'SRE', resourceType: 'Программист' },
];

// --- Утилиты ---

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
	return arr[randomInt(0, arr.length - 1)];
}

function shuffle(arr) {
	const result = [...arr];
	for (let i = result.length - 1; i > 0; i--) {
		const j = randomInt(0, i);
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

function roundToMultiple(value, multiple) {
	return Math.round(value / multiple) * multiple;
}

// --- Генерация проектов ---

function generateProjects() {
	const usedNames = new Set();
	const projects = [];

	for (let i = 0; i < 30; i++) {
		let name;
		do {
			name = `${randomItem(adjectives)} ${randomItem(nouns)}`;
		} while (usedNames.has(name));
		usedNames.add(name);

		projects.push({
			id: i + 1,
			name,
			archived: Math.random() < 0.2,
			order: i,
			customer: randomItem(customers),
			projectType: randomItem(projectTypes),
			projectManager: randomItem(managers),
			description: `Проект «${name}» — ${randomItem(projectTypes).toLowerCase()}`,
			url: '',
		});
	}

	return projects;
}

// --- Генерация групп ---

function generateGroups() {
	return groupDefinitions.map((def, i) => ({
		id: i + 1,
		name: def.name,
		capacityHours: roundToMultiple(randomInt(40, 400), 20),
		supportPercent: randomInt(0, 30),
		resourceType: def.resourceType,
		position: i + 1,
	}));
}

// --- Генерация allocations ---

function generateAllocations(projects, groups) {
	const allocations = [];
	let allocationId = 1;
	const activeProjects = projects.filter((p) => !p.archived);
	const groupIds = groups.map((g) => g.id);

	for (const project of activeProjects) {
		const numGroups = randomInt(3, 8);
		const selectedGroupIds = shuffle(groupIds).slice(0, numGroups);

		for (const groupId of selectedGroupIds) {
			const hours = roundToMultiple(randomInt(10, 200), 5);
			const base = Math.floor(hours / 4);
			const remainder = hours - base * 4;

			allocations.push({
				id: allocationId++,
				projectId: project.id,
				groupId,
				hours,
				q1: base + (remainder >= 1 ? 1 : 0),
				q2: base + (remainder >= 2 ? 1 : 0),
				q3: base + (remainder >= 3 ? 1 : 0),
				q4: base,
			});
		}
	}

	return allocations;
}

// --- Отправка через API ---

const projects = generateProjects();
const groups = generateGroups();
const allocations = generateAllocations(projects, groups);

const API_URL = process.env.API_URL || 'http://localhost:3001';

const res = await fetch(`${API_URL}/__seed`, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ projects, groups, allocations }),
});

if (!res.ok) throw new Error(`Seed failed: ${res.status} ${res.statusText}`);

const result = await res.json();
console.log('Seed complete:');
console.log(`  Projects:    ${result.projects} (archived: ${projects.filter((p) => p.archived).length})`);
console.log(`  Groups:      ${result.groups}`);
console.log(`  Allocations: ${result.allocations}`);

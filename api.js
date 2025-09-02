// Programmatic json-server, монтируем 3 роутера в один сервер.
// Каждый router пишет/читает свой файл: projects.json / groups.json / data.json
const path = require('path');
const jsonServer = require('json-server');

const server = jsonServer.create();
const middlewares = jsonServer.defaults({ logger: true, noCors: false });
server.use(middlewares);

// Роутер для projects
const routerProjects = jsonServer.router(path.join(__dirname, 'data', 'projects.json'));
// Роутер для groups
const routerGroups = jsonServer.router(path.join(__dirname, 'data', 'groups.json'));
// Роутер для allocations (data.json)
const routerAllocations = jsonServer.router(path.join(__dirname, 'data', 'data.json'));

// Переопределим ID как число (json-server сам назначает), CORS уже включён
server.use(jsonServer.bodyParser);

// Порядок важен: три роутера добавляют /projects, /groups, /allocations
server.use(routerProjects);
server.use(routerGroups);
server.use(routerAllocations);

// Запуск
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
	console.log(`JSON Server running on http://localhost:${PORT}`);
	console.log(`Resources: /projects /groups /allocations`);
});

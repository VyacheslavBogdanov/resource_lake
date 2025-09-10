// api.js — json-server с тремя файлами, разведёнными по префиксам
const path = require('path');
const jsonServer = require('json-server');

const server = jsonServer.create();
server.use(jsonServer.defaults({ logger: true }));
server.use(jsonServer.bodyParser);

// Роутеры по файлам
const routerProjects    = jsonServer.router(path.join(__dirname, 'data', 'projects.json'));   // ключ: projects
const routerGroups      = jsonServer.router(path.join(__dirname, 'data', 'groups.json'));     // ключ: groups
const routerAllocations = jsonServer.router(path.join(__dirname, 'data', 'data.json'));       // ключ: allocations

// Переписываем ВНЕШНИЕ пути на подпрефиксы с сохранением сегмента ресурса
server.use(jsonServer.rewriter({
  '/projects'      : '/p/projects',
  '/projects/:id'  : '/p/projects/:id',

  '/groups'        : '/g/groups',
  '/groups/:id'    : '/g/groups/:id',

  '/allocations'   : '/a/allocations',
  '/allocations/:id': '/a/allocations/:id',
}));

// Монтируем каждый роутер под своим префиксом
server.use('/p', routerProjects);
server.use('/g', routerGroups);
server.use('/a', routerAllocations);

// Старт
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`JSON Server running on http://localhost:${PORT}`);
  console.log(`Resources: /projects /groups /allocations`);
});

const fs = require('node:fs');
const path = require('node:path');

function folderFor(actor) {
  return actor === 'support-executive' ? 'customer-support' : actor;
}

module.exports = function portalSource(actor) {
  const root = path.join(__dirname, '../src/apps', folderFor(actor));
  if (actor === 'attendee') return require('./attendee-source.cjs')();
  if (actor === 'landing') return fs.readFileSync(path.join(root, 'app/runtime.js'), 'utf8');
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const readShared = file => fs.readFileSync(path.join(__dirname, '../src/app/runtime', file), 'utf8');
  const api = ['client', 'organizer'].includes(actor)
    ? read('api/portal-api.js')
    : readShared('employee-portal-api.js');
  let source = read('app/runtime.js');
  source = source
    .replace('/* PORTAL_SECTION_api */', () => api)
    .replace('/* PORTAL_SECTION_state */', () => readShared('portal-state.js'));
  const app = read(actor === 'support-executive' ? 'app/SupportExecutiveApp.jsx' : 'app/App.jsx');
  for (const [, name, page] of app.matchAll(/([A-Za-z]+): pageRuntime\(raw([A-Za-z]+)\)/g)) {
    const raw = read(`pages/${page}.jsx`);
    const start = '/* PORTAL_RUNTIME_START */',
      end = '/* PORTAL_RUNTIME_END */';
    const body = raw.slice(raw.indexOf(start) + start.length, raw.indexOf(end));
    source = source.replace(`/* PORTAL_SECTION_${name} */`, body);
  }
  if (source.includes('/* PORTAL_SECTION_')) throw Error(`Incomplete ${actor} runtime`);
  return source;
};
module.exports.folderFor = folderFor;

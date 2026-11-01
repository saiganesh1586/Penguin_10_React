const fs = require('node:fs');
const path = require('node:path');

module.exports = function attendeeSource() {
  const root = path.join(__dirname, '../src/apps/attendee');
  const sections = {
    api: 'api/attendee-api.js', state: 'context/attendee-state.js',
    registration: 'components/RegistrationFlow.jsx',
  };
  let source = fs.readFileSync(path.join(root, 'app/runtime.js'), 'utf8');
  for (const [name, file] of Object.entries(sections)) {
    const marker = `/* ATTENDEE_PAGE_${name} */\n`;
    if (!source.includes(marker)) throw Error(`Missing Attendee section ${name}`);
    const raw = fs.readFileSync(path.join(root, file), 'utf8');
    source = source.replace(marker, raw);
  }
  return source;
};

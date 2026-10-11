'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const order = JSON.parse(fs.readFileSync(path.join(root, 'build-order.json')));
require('./check-modules.cjs')(order);
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const catalogs = {
 protocolos: JSON.parse(read('protocolos_brisanet_v1_9.json')).protocols,
 respostas: JSON.parse(read('respostas_COMPLETAS.json'))
};
for (const [name, items] of Object.entries(catalogs)) {
 if (!Array.isArray(items) || !items.length || items.some(item => typeof item.title !== 'string' || typeof item.text !== 'string')) throw new Error('Invalid or empty catalog: '+name);
}
const readModule = item => read(item.file).replace(/\/\* bundled-defaults:(\w+) \*\/ \[\]/g, (_, name) => JSON.stringify(catalogs[name]));
// Tool factories are independently scoped; only shared core fragments retain lexical scope.
const code = '(function(){ if(window.__AJA_MODULAR_RUNTIME__) return; window.__AJA_MODULAR_RUNTIME__=true;\n' + read('src/core/data-safety.js') + '\n' + read('src/core/module-registry.js') + '\n' + read('src/corretor/services.js') + '\n' + order.modules.map(readModule).join('\n') + '\n' + order.core.map(read).join('\n') + '\n' + order.enhancements.map(read).join('\n') + '\n' + read('src/ui/layout.js') + '\n' + read('src/ui/window-service.js') + '\n})();';
fs.mkdirSync(path.join(root,'runtime'),{recursive:true});
fs.writeFileSync(path.join(root,'runtime/content.bundle.js'),code);
console.log('Bundle built:', Buffer.byteLength(code), 'bytes');

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const order = JSON.parse(fs.readFileSync(path.join(root, 'build-order.json')));
const read = file => fs.readFileSync(path.join(root,file),'utf8');
// Fragments retain the original lexical scope. Tools remain separately editable.
const code = '(function(){ if(window.__AJA_MODULAR_RUNTIME__) return; window.__AJA_MODULAR_RUNTIME__=true;\n' + read('src/corretor/services.js') + '\n' + order.core.map(read).join('\n') + '\n' + order.enhancements.map(read).join('\n') + '\n' + read('src/ui/layout.js') + '\n})();';
fs.mkdirSync(path.join(root,'runtime'),{recursive:true});
fs.writeFileSync(path.join(root,'runtime/content.bundle.js'),code);
console.log('Bundle built:', Buffer.byteLength(code), 'bytes');

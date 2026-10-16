'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

module.exports = async () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/core/analytics.js.inc'), 'utf8');
    const start = source.indexOf('    function parseInteractionUrl(');
    const end = source.indexOf('\n', source.indexOf('    async function getNativeInteractionUrl()', start));
    assert.ok(start >= 0 && end > start);
    const valid = 'https://apps.sae1.pure.cloud/directory/#/analytics/interactions/651e0c76-0b74-4290-9f46-51a1b377bbf8/admin?tabId=2';
    let clipboard = 'texto anterior', clicked = false;
    const ctx = { URL, Promise, setTimeout: fn => fn(), CONFIG: { PURECLOUD_SELECTORS: { NATIVE_COPY_BUTTON: 'native' } }, findEl: () => ({ click() { clicked = true; clipboard = valid; } }), navigator: { clipboard: { readText: async () => clipboard, writeText: async value => { clipboard = value; } } } };
    vm.createContext(ctx);
    vm.runInContext(source.slice(start, source.indexOf('    async function getNativeInteractionUrl()', start)) + '\n' + source.slice(source.indexOf('    async function getNativeInteractionUrl()', start), source.indexOf('\n\n', source.indexOf('    async function getNativeInteractionUrl()', start))), ctx);
    assert.equal(ctx.parseInteractionUrl(valid), valid);
    assert.equal(ctx.parseInteractionUrl('x'.repeat(5000) + valid), null);
    assert.equal(ctx.parseInteractionUrl('javascript:alert(1)'), null);
    assert.equal(ctx.parseInteractionUrl('https://evil.example/interactions/651e0c76-0b74-4290-9f46-51a1b377bbf8'), null);
    assert.equal(await ctx.getNativeInteractionUrl(), valid);
    assert.equal(clicked, true);
    assert.equal(clipboard, 'texto anterior');
    assert.ok(fs.readFileSync(path.join(__dirname, '../src/core/chat.js.inc'), 'utf8').includes('Nada foi copiado.'));
    return ['Copy-link accepts only a short Genesys interaction URL, restores the previous clipboard, and never substitutes arbitrary text'];
};

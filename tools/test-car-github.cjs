'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

module.exports = () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/tools/car.js'), 'utf8');
    const start = source.indexOf('function mergeScriptMaps(');
    const end = source.indexOf('const utf8Base64', start);
    assert.ok(start >= 0 && end > start);
    const merge = vm.runInNewContext(`(${source.slice(start, end).trim()})`);
    const sorted = value => JSON.parse(JSON.stringify(value));
    assert.deepEqual(sorted(merge({ a: 'old' }, { a: 'new' }, { a: 'old', b: 'remote' })), { a: 'new', b: 'remote' });
    assert.deepEqual(sorted(merge({ a: 'old' }, {}, { a: 'old', b: 'remote' })), { b: 'remote' });
    assert.deepEqual(sorted(merge({ a: 'old' }, { a: 'old' }, { a: 'updated remotely' })), { a: 'updated remotely' });
    assert.deepEqual(sorted(merge({}, { emoji: 'Olá 😊' }, {})), { emoji: 'Olá 😊' });
    assert.ok(source.includes('if (!repository.private) throw Error'));
    assert.ok(source.includes('if (window.self !== window.top) return;'));
    return ['CAR GitHub sync merges local and remote edits, preserves deletion and Unicode, and requires a private repository'];
};

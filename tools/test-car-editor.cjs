'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

module.exports = function () {
    const source = fs.readFileSync(path.join(__dirname, '../src/tools/car.js'), 'utf8');
    const start = source.indexOf('function expandShortcut(e) {');
    const end = source.indexOf("document.addEventListener('keydown', expandShortcut, true);", start);
    assert.ok(start >= 0 && end > start);
    const events = [];
    const editor = {
        nodeType: 1, tagName: 'TEXTAREA', value: 'ex1', selectionStart: 3, selectionEnd: 3,
        matches: selector => selector.includes('textarea'), hasAttribute: () => false,
        closest: () => null, disabled: false, readOnly: false,
        setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
        setRangeText(text, start, end) { this.value = this.value.slice(0, start) + text + this.value.slice(end); },
        dispatchEvent: event => events.push(event)
    };
    const doc = { execCommand: () => false, defaultView: { InputEvent: Event } };
    editor.ownerDocument = doc;
    const context = { scripts: { ex1: 'Olá, cliente!' }, isExtension: true, Event };
    vm.runInNewContext(source.slice(start, end) + '\nthis.expandShortcut = expandShortcut;', context);
    let prevented = false;
    context.expandShortcut({
        key: ' ', isComposing: false, repeat: false, ctrlKey: false, altKey: false, metaKey: false,
        composedPath: () => [{ nodeType: 1, matches: () => false }, editor],
        preventDefault: () => { prevented = true; }
    });
    assert.equal(editor.value, 'Olá, cliente!');
    assert.equal(prevented, true);
    assert.equal(events.length, 1, 'fallback must notify the editor framework');
    return ['CAR expands a shortcut inside a nested editor when execCommand is ignored and dispatches input'];
};

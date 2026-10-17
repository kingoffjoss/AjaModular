'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

module.exports = function () {
    const source = fs.readFileSync(path.join(__dirname, '../src/core/toolbar.js.inc'), 'utf8');
    const buttons = [];
    let originalRuns = 0;
    let originalClicks = 0;
    let originalButton = null;
    const toolbar = { dataset: {}, querySelectorAll: () => [], appendChild: button => buttons.push(button) };
    const context = {
        SCRIPT_VERSION: 'test',
        document: {
            createElement: () => ({ setAttribute(name, value) { this[name] = value; } }),
            getElementById: () => originalButton
        },
        window: { AjaModular: { open() {} } },
        runOriginalEndCode: () => {
            originalRuns++;
            originalButton = { style: {}, click: () => originalClicks++ };
        },
        featureDescriptions: { copyInteraction: { title: 'Copiar' }, openSettings: { title: 'Configurações' } },
        actions: { copyInteraction() {}, openSettings() {} }
    };
    vm.runInNewContext(source + '\ncreateToolbarUI(toolbar);', { ...context, toolbar });
    assert.deepEqual(buttons.map(button => button.id), [
        'purecloud-script-btn-copyInteraction', 'purecloud-script-btn-openSettings',
        'purecloud-script-btn-yoda', 'purecloud-script-btn-endCustomer'
    ]);
    const endButton = buttons.at(-1);
    endButton.onclick();
    endButton.onclick();
    assert.equal(originalRuns, 1);
    assert.equal(originalClicks, 2);
    assert.equal(originalButton.style.display, 'none');
    const original = fs.readFileSync(path.join(__dirname, '../presentation/encerrar-sem-avaliacao.bookmarklet.txt'), 'utf8');
    assert.ok(original.startsWith('javascript:void%20%28function'));
    const decoded = decodeURIComponent(original).slice('javascript:'.length);
    const embedded = fs.readFileSync(path.join(__dirname, '../src/core/original-end-code.js.inc'), 'utf8');
    assert.ok(embedded.includes(decoded), 'embedded code must preserve every function of the supplied bookmarklet');
    return ['End button follows settings and Yoda, runs the original bookmarklet and clicks its action without changing the original functions'];
};

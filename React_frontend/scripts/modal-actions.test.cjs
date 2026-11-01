const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const portalSource = require('./portal-source.cjs');
const vm = require('node:vm');

for (const role of [
  'admin',
  'attendee',
  'client',
  'finance-executive',
  'organizer',
  'support-executive',
  'landing',
]) {
  test(`${role} modals render one Cancel and preserve its handler and other actions`, () => {
    const source = portalSource(role);
    const footer = {
      children: [],
      style: {},
      set innerHTML(value) {
        this.children = [];
      },
      appendChild(node) {
        this.children.push(node);
      },
    };
    const classes = new Set(),
      elements = {
        'modal-title': {},
        'modal-body': {},
        'modal-foot': footer,
        'modal-overlay': {
          classList: { add: name => classes.add(name), remove: name => classes.delete(name) },
          style: {},
        },
      };
    let restored = 0;
    const context = vm.createContext({
      g: id => elements[id],
      requestAnimationFrame: callback => callback(),
      restoreDraft: () => restored++,
      closeModal: () => classes.delete('open'),
      document: {
        createElement() {
          return {
            attributes: {},
            setAttribute(key, value) {
              this.attributes[key] = value;
            },
          };
        },
      },
    });
    const start = source.indexOf('function openModal(');
    vm.runInContext(source.slice(start, source.indexOf('function closeModal(', start)), context);
    const customCancel = { lbl: 'Cancel', cls: 'btn-ghost', fn: 'restoreDraft();closeModal()' },
      save = { lbl: 'Save', cls: 'btn-primary', fn: 'save()' };
    context.openModal('Form', '', [customCancel, save]);
    assert.deepEqual(
      footer.children.map(b => b.textContent),
      ['Cancel', 'Save']
    );
    vm.runInContext(footer.children[0].attributes.onclick, context);
    assert.equal(restored, 1);
    assert.equal(classes.has('open'), false);
    context.openModal('Repeated', '', [customCancel, customCancel, save]);
    assert.deepEqual(
      footer.children.map(b => b.textContent),
      ['Cancel', 'Save']
    );
    context.openModal('Default', '', [save]);
    assert.deepEqual(
      footer.children.map(b => b.textContent),
      ['Cancel', 'Save']
    );
    footer.children[0].onclick();
    assert.equal(classes.has('open'), false);
    context.openModal('Explicit only', '', [customCancel, save], false);
    assert.deepEqual(
      footer.children.map(b => b.textContent),
      ['Cancel', 'Save']
    );
    context.openModal('Status', '', [], false);
    assert.equal(footer.children.length, 0);
    assert.equal(footer.style.display, 'none');
  });
}

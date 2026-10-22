const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Drive the real button's confirmation handlers without a browser or a live API.
function setup({
  move = async () => {},
  onMoved = async () => {},
  ...props
} = {}) {
  const confirmations = [];
  const calls = [];
  const messages = [];
  const dependencies = {
    react: {
      useRef: (initial) => ({ current: initial }),
      useState: (initial) => [initial, () => {}],
    },
    'react/jsx-runtime': require('react/jsx-runtime'),
    antd: {
      Button: 'button',
      Tooltip: 'tooltip',
      Modal: { confirm: (options) => confirmations.push(options) },
      message: Object.fromEntries(
        ['success', 'error', 'warning'].map((kind) => [
          kind,
          (value) => messages.push({ kind, value }),
        ])
      ),
    },
    'lucide-react': { Trash2: 'trash-icon' },
    '../../../services/trashService': {
      trashService: {
        move: async (...args) => {
          calls.push(args);
          return move(...args);
        },
      },
    },
  };
  const code = ts.transpileModule(
    fs.readFileSync(
      'src/components/shared/trash/MoveToTrashButton.tsx',
      'utf8'
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }
  ).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    Error,
    require: (name) => {
      if (!(name in dependencies))
        throw new Error(`Unexpected dependency ${name}`);
      return dependencies[name];
    },
  });
  const element = exports.default({
    recordId: 'original-id',
    modelType: 'lead',
    onMoved,
    ...props,
  });
  const button = element.props.children.props.children;
  const click = () => button.props.onClick({ stopPropagation() {} });
  return { button, element, click, confirmations, calls, messages };
}

test('a click requires confirmation; only a confirmed success refreshes the page', async () => {
  let refreshed = 0;
  const result = setup({
    onMoved: () => {
      refreshed += 1;
    },
  });
  result.click();
  assert.equal(result.calls.length, 0);
  assert.equal(refreshed, 0);
  await result.confirmations[0].onOk();
  assert.equal(result.calls[0][0], 'original-id');
  assert.equal(result.calls[0][1], 'lead');
  assert.equal(refreshed, 1);
  assert.equal(result.messages[0].kind, 'success');
});

test('failed moves keep the record and do not show success', async () => {
  let refreshed = 0;
  const result = setup({
    move: async () => {
      throw new Error('Move rejected');
    },
    onMoved: () => {
      refreshed += 1;
    },
  });
  result.click();
  await assert.rejects(result.confirmations[0].onOk(), /Move rejected/);
  assert.equal(refreshed, 0);
  assert.deepEqual(
    result.messages.map((item) => item.kind),
    ['error']
  );
});

test('refresh failure is reported separately after a successful move', async () => {
  const result = setup({
    onMoved: async () => {
      throw new Error('Refresh failed');
    },
  });
  result.click();
  await result.confirmations[0].onOk();
  assert.deepEqual(
    result.messages.map((item) => item.kind),
    ['success', 'warning']
  );
});

test('generated rows without saved IDs and protected rows cannot send delete requests', () => {
  for (const props of [
    { recordId: undefined },
    { disabledReason: 'System role' },
    { disabled: true },
  ]) {
    const result = setup(props);
    assert.equal(result.button.props.disabled, true);
    result.click();
    assert.equal(result.confirmations.length, 0);
    assert.equal(result.calls.length, 0);
  }
});

test('duplicate confirmations cannot move the same record twice while refresh is pending', async () => {
  let release;
  const result = setup({
    onMoved: () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  });
  result.click();
  result.click();
  const pending = result.confirmations[0].onOk();
  await Promise.resolve();
  await Promise.resolve();
  await result.confirmations[1].onOk();
  assert.equal(result.calls.length, 1);
  release();
  await pending;
});

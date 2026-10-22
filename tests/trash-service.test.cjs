const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the real service with a fake HTTP transport; never mutate live CRM data.
function setup(handler, initialContracts = []) {
  const calls = [];
  const values = new Map([
    ['jemini_contracts', JSON.stringify(initialContracts)],
  ]);
  const apiRequest = Object.fromEntries(
    ['get', 'post', 'delete'].map((method) => [
      method,
      async (...args) => {
        calls.push({ method, args });
        return handler(method, ...args);
      },
    ])
  );
  function load(file, dependencies = {}) {
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText;
    const exports = {};
    vm.runInNewContext(
      code,
      {
        exports,
        require: (name) => {
          if (!(name in dependencies))
            throw new Error(`Unexpected import ${name}`);
          return dependencies[name];
        },
        localStorage: {
          getItem: (key) => values.get(key) ?? null,
          setItem: (key, value) => values.set(key, value),
        },
      },
      { filename: file }
    );
    return exports;
  }
  const endpoints = load('src/services/api/endpoints.ts');
  const service = load('src/services/trashService.ts', {
    './api/apiClient': { apiRequest },
    './api/endpoints': endpoints,
  });
  return { ...service, calls, values };
}

test('move resolves the server model and posts the original record ID', async () => {
  const { trashService, calls } = setup((method) =>
    method === 'get'
      ? { success: true, data: { models: ['Lead', 'ProductSubType'] } }
      : { success: true }
  );
  await trashService.move('original-123', 'lead');
  assert.equal(calls[1].method, 'post');
  assert.equal(calls[1].args[0], '/trash/move');
  assert.equal(
    JSON.stringify(calls[1].args[1]),
    JSON.stringify({ id: 'original-123', modelType: 'Lead' })
  );
});

test('unsupported models and API failures cannot report successful moves', async () => {
  const unsupported = setup(() => ({ success: true, data: ['lead'] }));
  await assert.rejects(
    unsupported.trashService.move('id', 'staff'),
    /does not support/
  );
  assert.equal(unsupported.calls.length, 1);
  const failed = setup((method) =>
    method === 'get'
      ? { data: ['lead'] }
      : { success: false, message: 'Move rejected' }
  );
  await assert.rejects(failed.trashService.move('id', 'lead'), /Move rejected/);
});

test('list collects all pages and keeps original IDs separate from trash IDs', async () => {
  const { trashService, calls } = setup((_method, _url, config) => ({
    success: true,
    data: {
      items: [
        {
          _id: `trash-${config.params.page}`,
          modelType: 'lead',
          originalId: 'original',
          data: { name: 'Example' },
        },
      ],
      pagination: { pages: 2 },
    },
  }));
  const rows = await trashService.list();
  assert.equal(rows.length, 2);
  assert.equal(calls.length, 2);
  assert.equal(rows[0]._id, 'trash-1');
  assert.equal(rows[0].originalId, 'original');
  assert.equal(rows[0].name, 'Example');
});

test('duplicate pages and invalid trash IDs are rejected', async () => {
  const repeated = setup(() => ({
    data: { items: [{ _id: 'same' }], pagination: { pages: 2 } },
  }));
  await assert.rejects(repeated.trashService.list(), /duplicate/);
  const invalid = setup(() => ({ data: [{ modelType: 'lead' }] }));
  await assert.rejects(invalid.trashService.list(), /missing a trash ID/);
});

test('restore and permanent delete use trash IDs, correct verbs and bulk payloads', async () => {
  const { trashService, calls } = setup(() => ({ success: true }));
  await trashService.restore(['trash-1']);
  await trashService.restore(['trash-1', 'trash-2']);
  await trashService.permanent(['trash-1']);
  await trashService.permanent(['trash-1', 'trash-2']);
  assert.deepEqual(
    calls.map((call) => [call.method, call.args[0]]),
    [
      ['post', '/trash/restore/trash-1'],
      ['post', '/trash/restore-bulk'],
      ['delete', '/trash/permanent/trash-1'],
      ['post', '/trash/permanent-bulk'],
    ]
  );
  assert.equal(
    JSON.stringify(calls[1].args[1]),
    '{"ids":["trash-1","trash-2"]}'
  );
  assert.equal(
    JSON.stringify(calls[3].args[1]),
    '{"ids":["trash-1","trash-2"]}'
  );
});

test('details and empty use their documented endpoints and trim the model filter', async () => {
  const { trashService, calls } = setup(() => ({
    success: true,
    data: { name: 'Deleted item' },
  }));
  assert.equal((await trashService.get('trash-id')).name, 'Deleted item');
  await trashService.empty('lead ');
  assert.equal(calls[0].args[0], '/trash/trash-id');
  assert.equal(calls[1].method, 'delete');
  assert.equal(calls[1].args[0], '/trash/empty');
  assert.equal(calls[1].args[1].params.modelType, 'lead');
});

test('device contracts restore locally and their IDs never reach bulk APIs', async () => {
  const { trashService, calls, values } = setup(
    () => ({ success: true }),
    [
      { id: 'CT-1', subject: 'Contract', is_trash: true },
      { id: 'CT-2', subject: 'Active', is_trash: false },
    ]
  );
  await trashService.restore(['trash-1', 'device-contract:CT-1']);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].args[0], '/trash/restore/trash-1');
  assert.equal(JSON.parse(values.get('jemini_contracts'))[0].is_trash, false);
  await trashService.permanent(['device-contract:CT-1']);
  assert.equal(calls.length, 1);
  assert.equal(JSON.parse(values.get('jemini_contracts'))[0].id, 'CT-2');
});

test('a failed remote restore leaves device contracts intact', async () => {
  const { trashService, values } = setup(
    () => ({ success: false, message: 'Restore failed' }),
    [{ id: 'CT-1', is_trash: true }]
  );
  await assert.rejects(
    trashService.restore(['trash-1', 'device-contract:CT-1']),
    /Restore failed/
  );
  assert.equal(JSON.parse(values.get('jemini_contracts'))[0].is_trash, true);
});

test('model aliases use the server spelling rather than a guessed type', async () => {
  const { trashService, calls } = setup((method) =>
    method === 'get'
      ? { data: [{ modelType: 'product_sub_type', label: 'Product subtype' }] }
      : { success: true }
  );
  await trashService.move('subtype-id', 'productSubType');
  assert.equal(calls[1].args[1].modelType, 'product_sub_type');
});

test('exact model names take precedence over staff aliases', async () => {
  const { trashService, calls } = setup((method) =>
    method === 'get' ? { data: ['user', 'staff'] } : { success: true }
  );
  await trashService.move('staff-id', 'staff');
  assert.equal(calls[1].args[1].modelType, 'staff');
});

test('deleted task activities retain task permissions and lead activities retain lead permissions', () => {
  const { parseTrashRecord, trashRecordModule } = setup(() => ({}));
  assert.equal(
    trashRecordModule(
      parseTrashRecord({
        _id: '1',
        modelType: 'activityLog',
        data: { taskId: 'task-id' },
      })
    ),
    'tasks'
  );
  assert.equal(
    trashRecordModule(
      parseTrashRecord({
        _id: '2',
        modelType: 'activityLog',
        data: { leadId: 'lead-id' },
      })
    ),
    'leads'
  );
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const code = ts.transpileModule(
  fs.readFileSync('src/components/shared/listing/listing-trash.tsx', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }
).outputText;
const exported = {};
vm.runInNewContext(code, {
  exports: exported,
  require: (name) => {
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'antd')
      return {
        Space: ({ children }) => React.createElement('div', null, children),
      };
    throw new Error(`Unexpected import ${name}`);
  },
});
const { withTrashActions } = exported;
const deleteButton = (row) =>
  React.createElement('button', { 'data-id': row._id }, 'Delete');

test('Orders keeps Edit, View and Delete in a single fixed Actions column', () => {
  const columns = [
    { title: 'Order No', dataIndex: 'quotationNo' },
    {
      title: 'Actions',
      key: 'actions',
      render: () => React.createElement('span', null, 'Edit View'),
    },
  ];
  const result = withTrashActions(columns, deleteButton);
  assert.equal(result.length, 2);
  assert.equal(result[1].fixed, 'right');
  const html = renderToStaticMarkup(
    result[1].render(null, { _id: 'order-123' }, 0)
  );
  assert.match(html, /Edit View/);
  assert.match(html, /Delete/);
  assert.match(html, /data-id="order-123"/);
  assert.equal(columns[1].fixed, undefined, 'original columns are not mutated');
});

test('tables without an Actions column get a visible fixed Delete action', () => {
  const result = withTrashActions(
    [{ title: 'Name', dataIndex: 'name' }],
    deleteButton
  );
  assert.equal(result[1].title, 'Actions');
  assert.equal(result[1].fixed, 'right');
  assert.match(
    renderToStaticMarkup(result[1].render(null, { _id: 'record-1' }, 0)),
    /Delete/
  );
});

test('every sidebar listing always registers its Delete action and permission check', () => {
  const files = [
    'src/pages/Leads/index.tsx',
    'src/pages/customer/index.tsx',
    'src/pages/Call/CallLogs.tsx',
    'src/pages/Products/Products.tsx',
    'src/pages/Quotations/index.tsx',
    'src/pages/Location.tsx',
    'src/HumanResource/Attendance.tsx',
    'src/HumanResource/Leave.tsx',
    'src/HumanResource/SalarySetting.tsx',
    'src/HumanResource/SalarySlip.tsx',
    'src/HumanResource/Candidate.tsx',
    'src/pages/settings/Staff/index.tsx',
    'src/pages/settings/roles/index.tsx',
    'src/pages/Config/index.tsx',
  ];
  let checked = 0;
  for (const file of files) {
    const ast = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );
    let found = 0;
    function visit(node) {
      if (
        (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
        node.tagName.getText(ast) === 'ListingTable'
      ) {
        const attribute = node.attributes.properties.find(
          (item) =>
            ts.isJsxAttribute(item) && item.name.getText(ast) === 'trashConfig'
        );
        assert.ok(attribute, `${file} has a table with no Trash action`);
        const expression = attribute.initializer.expression;
        assert.ok(
          ts.isObjectLiteralExpression(expression),
          `${file} hides its delete column conditionally`
        );
        const properties = expression.properties.map((item) =>
          item.name?.getText(ast)
        );
        for (const name of ['modelType', 'canDelete', 'onComplete'])
          assert.ok(properties.includes(name), `${file} missing ${name}`);
        found += 1;
        checked += 1;
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
    assert.ok(found, `${file} did not contain its expected listing`);
  }
  assert.equal(
    checked,
    16,
    'includes all three product tables and the shared calls/recordings page'
  );
});


test('the fixed Delete column stays after the shared Details column', () => {
  const result = withTrashActions([
    { title: 'Name', key: 'name' }, { title: 'Actions', key: 'actions' },
    { title: 'Details', key: '__view' },
  ], deleteButton);
  assert.equal(result[1].key, '__view');
  assert.equal(result[2].key, 'actions');
  assert.equal(result[2].fixed, 'right');
});

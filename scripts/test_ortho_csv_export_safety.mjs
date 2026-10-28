// Zero-dependency regression for PIGA ORTHO 3D local inventory CSV export.
// Run: node --test scripts/test_ortho_csv_export_safety.mjs
// SOURCE only: no patient data, network, payments, or production changes.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const source = readFileSync(new URL('../piga-ortho-3d/direct.js', import.meta.url), 'utf8');
const csvLines = source.split(/\r?\n/).filter(line => /\bconst csv=rows\.map\(row=>row\.map\(s=>/.test(line));
assert.equal(csvLines.length, 1, 'exactly one inventory CSV encoder must exist');
const encode = new Function('rows', `${csvLines[0]}\nreturn csv;`);
const cell = value => encode([[value]]);

test('neutralizes formula starters without trusting a backslash', () => {
  for (const value of ['=1+1', '+SUM(1,1)', '-2+3', '@SUM(A1)', '\t=2+2', ' \t=2+2', '\r=2+2', '\n=2+2']) {
    assert.equal(cell(value), `"'${value.replaceAll('"', '""')}"`, value);
  }
});

test('preserves ordinary labels and numeric stock values', () => {
  assert.equal(cell('Artikel A'), '"Artikel A"');
  assert.equal(cell(0), '"0"');
  assert.equal(cell(27), '"27"');
});

test('escapes quotes and preserves semicolons inside CSV fields', () => {
  assert.equal(cell('Test "A"; Lager'), '"Test ""A""; Lager"');
});

test('uses semicolon columns and CRLF records', () => {
  assert.equal(encode([['A', 'B', 1], ['C', '=2+2', 0]]), '"A";"B";"1"\r\n"C";"\'=2+2";"0"');
});

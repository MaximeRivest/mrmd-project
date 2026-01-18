import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as Links from '../src/links.js';

describe('Links.parse', () => {
  it('extracts all link types', () => {
    const content = `
See [[installation]] for setup.
Check [[getting-started/config#advanced|advanced config]].
Go to [[next]] or [[prev]].
`;

    const links = Links.parse(content);
    assert.strictEqual(links.length, 4);
    assert.strictEqual(links[0].target, 'installation');
    assert.strictEqual(links[0].display, null);
    assert.strictEqual(links[1].target, 'getting-started/config');
    assert.strictEqual(links[1].anchor, 'advanced');
    assert.strictEqual(links[1].display, 'advanced config');
  });

  it('handles empty content', () => {
    assert.deepStrictEqual(Links.parse(''), []);
  });
});

describe('Links.resolve', () => {
  const files = [
    '01-intro.md',
    '02-getting-started/01-installation.md',
    '02-getting-started/02-configuration.md',
  ];

  it('finds exact filename match', () => {
    const resolved = Links.resolve('installation', '01-intro.md', files);
    assert.strictEqual(resolved, '02-getting-started/01-installation.md');
  });

  it('handles path-based links', () => {
    const resolved = Links.resolve('getting-started/configuration', '01-intro.md', files);
    assert.strictEqual(resolved, '02-getting-started/02-configuration.md');
  });

  it('handles special links', () => {
    const files2 = ['01-intro.md', '02-methods.md', '03-results.md'];
    assert.strictEqual(Links.resolve('next', '01-intro.md', files2), '02-methods.md');
    assert.strictEqual(Links.resolve('prev', '02-methods.md', files2), '01-intro.md');
    assert.strictEqual(Links.resolve('home', '03-results.md', files2), '01-intro.md');
  });

  it('returns null for unresolved', () => {
    assert.strictEqual(Links.resolve('nonexistent', '01-intro.md', files), null);
  });
});

describe('Links.refactor', () => {
  it('updates links for moved files', () => {
    const content = `
See [[installation]] for setup.
Check [[old-name]] for details.
`;

    const updated = Links.refactor(content, [
      { from: '02-getting-started/01-installation.md', to: '02-setup/01-installation.md' },
      { from: 'old-name.md', to: 'new-name.md' },
    ], 'index.md');

    assert.ok(updated.includes('[[installation]]'));
    assert.ok(updated.includes('[[new-name]]'));
  });

  it('handles empty moves', () => {
    const content = 'See [[link]]';
    assert.strictEqual(Links.refactor(content, [], 'doc.md'), content);
  });
});

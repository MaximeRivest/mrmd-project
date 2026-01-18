import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as Assets from '../src/assets.js';

describe('Assets.computeRelativePath', () => {
  it('from root level', () => {
    const rel = Assets.computeRelativePath('01-intro.md', '_assets/screenshot.png');
    assert.strictEqual(rel, '_assets/screenshot.png');
  });

  it('from nested document', () => {
    const rel = Assets.computeRelativePath(
      '02-getting-started/01-installation.md',
      '_assets/screenshot.png'
    );
    assert.strictEqual(rel, '../_assets/screenshot.png');
  });

  it('handles deep nesting', () => {
    const rel = Assets.computeRelativePath(
      '02-section/sub/deep/doc.md',
      '_assets/img.png'
    );
    assert.strictEqual(rel, '../../../_assets/img.png');
  });
});

describe('Assets.refactorPaths', () => {
  it('updates paths when doc moves', () => {
    const content = `
![Screenshot](_assets/screenshot.png)
![Diagram](_assets/diagrams/arch.svg)
`;

    const updated = Assets.refactorPaths(
      content,
      '01-intro.md',
      '02-section/01-intro.md',
      '_assets'
    );

    assert.ok(updated.includes('../_assets/screenshot.png'));
    assert.ok(updated.includes('../_assets/diagrams/arch.svg'));
  });

  it('handles empty content', () => {
    assert.strictEqual(Assets.refactorPaths('', 'a.md', 'b.md', '_assets'), '');
  });
});

describe('Assets.extractPaths', () => {
  it('finds all asset references', () => {
    const content = `
![Alt](../_assets/img.png)
[Download](../_assets/file.pdf)
![Another](_assets/other.jpg)
`;

    const refs = Assets.extractPaths(content);
    assert.strictEqual(refs.length, 3);
    assert.ok(refs.some(r => r.path.includes('img.png')));
    assert.ok(refs.some(r => r.type === 'link'));
    assert.ok(refs.some(r => r.type === 'image'));
  });

  it('handles empty content', () => {
    assert.deepStrictEqual(Assets.extractPaths(''), []);
  });
});

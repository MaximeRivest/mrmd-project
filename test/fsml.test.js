import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as FSML from '../src/fsml.js';

describe('FSML.parsePath', () => {
  it('parses numbered file correctly', () => {
    const p = FSML.parsePath('02-getting-started/01-installation.md');
    assert.strictEqual(p.order, 1);
    assert.strictEqual(p.name, 'installation');
    assert.strictEqual(p.title, 'Installation');
    assert.strictEqual(p.isFolder, false);
    assert.strictEqual(p.isHidden, false);
    assert.strictEqual(p.depth, 1);
    assert.strictEqual(p.parent, '02-getting-started');
  });

  it('handles unnumbered files', () => {
    const p = FSML.parsePath('appendix.md');
    assert.strictEqual(p.order, null);
    assert.strictEqual(p.name, 'appendix');
    assert.strictEqual(p.title, 'Appendix');
    assert.strictEqual(p.depth, 0);
  });

  it('detects hidden folders', () => {
    const p = FSML.parsePath('_assets/images/diagram.png');
    assert.strictEqual(p.isHidden, true);
    assert.strictEqual(p.isSystem, false);
  });

  it('detects system folders', () => {
    const p = FSML.parsePath('.git/config');
    assert.strictEqual(p.isHidden, false);
    assert.strictEqual(p.isSystem, true);
  });

  it('derives titles correctly', () => {
    assert.strictEqual(FSML.parsePath('getting-started.md').title, 'Getting Started');
    assert.strictEqual(FSML.parsePath('getting_started.md').title, 'Getting Started');
    assert.strictEqual(FSML.parsePath('01-my-cool-doc.md').title, 'My Cool Doc');
  });

  it('handles empty path', () => {
    const p = FSML.parsePath('');
    assert.strictEqual(p.name, '');
  });
});

describe('FSML.titleFromFilename', () => {
  it('converts filenames to titles', () => {
    assert.strictEqual(FSML.titleFromFilename('01-getting-started.md'), 'Getting Started');
    assert.strictEqual(FSML.titleFromFilename('my_cool_doc.md'), 'My Cool Doc');
    assert.strictEqual(FSML.titleFromFilename('README.md'), 'README');
    assert.strictEqual(FSML.titleFromFilename('index.md'), 'Index');
  });
});

describe('FSML.sortPaths', () => {
  it('orders by FSML rules', () => {
    const paths = [
      'appendix.md',
      '03-results.md',
      '01-intro.md',
      '02-methods/01-setup.md',
      '02-methods/02-analysis.md',
      'README.md',
    ];

    const sorted = FSML.sortPaths(paths);
    assert.strictEqual(sorted[0], '01-intro.md');
    assert.strictEqual(sorted[1], '02-methods/01-setup.md');
    assert.strictEqual(sorted[2], '02-methods/02-analysis.md');
    assert.strictEqual(sorted[3], '03-results.md');
    assert.strictEqual(sorted[4], 'appendix.md');
    assert.strictEqual(sorted[5], 'README.md');
  });

  it('handles empty array', () => {
    assert.deepStrictEqual(FSML.sortPaths([]), []);
  });
});

describe('FSML.buildNavTree', () => {
  it('creates correct nested structure', () => {
    const paths = [
      'mrmd.md',
      '01-intro.md',
      '02-getting-started/index.md',
      '02-getting-started/01-install.md',
      '02-getting-started/02-config.md',
      '03-tutorials/01-basic.md',
      '_assets/image.png',
    ];

    const tree = FSML.buildNavTree(paths);

    // mrmd.md should be excluded
    assert.strictEqual(tree.find(n => n.path === 'mrmd.md'), undefined);

    // _assets should be excluded
    assert.strictEqual(tree.find(n => n.path === '_assets'), undefined);

    // Check intro
    const intro = tree.find(n => n.path === '01-intro.md');
    assert.strictEqual(intro.title, 'Intro');

    // Check getting-started folder
    const gettingStarted = tree.find(n => n.path === '02-getting-started');
    assert.strictEqual(gettingStarted.isFolder, true);
    assert.strictEqual(gettingStarted.hasIndex, true);
    assert.strictEqual(gettingStarted.children.length, 2);

    // Check tutorials folder
    const tutorials = tree.find(n => n.path === '03-tutorials');
    assert.strictEqual(tutorials.hasIndex, false);
  });

  it('handles empty array', () => {
    assert.deepStrictEqual(FSML.buildNavTree([]), []);
  });
});

describe('FSML.computeNewPath', () => {
  it('computes renames for reordering', () => {
    const result = FSML.computeNewPath('03-results.md', '01-intro.md', 'before');
    assert.strictEqual(result.newPath, '01-results.md');
    assert.ok(result.renames.length >= 1);
  });
});

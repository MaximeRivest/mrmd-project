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

describe('FSML.computeReorder', () => {
  it('shifts siblings when moving UP (before)', () => {
    // Drag 03-results before 01-intro
    // 01-intro should become 02-intro
    // 02-methods should become 03-methods
    // 03-results should become 01-results
    const siblings = ['01-intro.md', '02-methods.md', '03-results.md'];
    const result = FSML.computeReorder('03-results.md', '01-intro.md', 'before', siblings);

    assert.strictEqual(result.newPath, '01-results.md');

    // Should have 3 renames: shift 01->02, shift 02->03, move 03->01
    assert.strictEqual(result.renames.length, 3);

    // Check that shifts are in correct order (highest first for 'up' direction)
    const renameMap = new Map(result.renames.map(r => [r.from, r.to]));
    assert.strictEqual(renameMap.get('01-intro.md'), '02-intro.md');
    assert.strictEqual(renameMap.get('02-methods.md'), '03-methods.md');
    assert.strictEqual(renameMap.get('03-results.md'), '01-results.md');
  });

  it('shifts siblings when moving DOWN (after)', () => {
    // Drag 01-intro after 03-results
    // 02-methods should become 01-methods
    // 03-results should become 02-results
    // 01-intro should become 03-intro
    const siblings = ['01-intro.md', '02-methods.md', '03-results.md'];
    const result = FSML.computeReorder('01-intro.md', '03-results.md', 'after', siblings);

    assert.strictEqual(result.newPath, '03-intro.md');

    // Should have 3 renames
    assert.strictEqual(result.renames.length, 3);

    const renameMap = new Map(result.renames.map(r => [r.from, r.to]));
    assert.strictEqual(renameMap.get('02-methods.md'), '01-methods.md');
    assert.strictEqual(renameMap.get('03-results.md'), '02-results.md');
    assert.strictEqual(renameMap.get('01-intro.md'), '03-intro.md');
  });

  it('shifts siblings when inserting from different directory', () => {
    // Drag external-file.md before 02-methods.md
    // 02-methods should become 03-methods
    // 03-results should become 04-results
    // external-file should become 02-external-file
    const siblings = ['01-intro.md', '02-methods.md', '03-results.md'];
    const result = FSML.computeReorder('other/external-file.md', '02-methods.md', 'before', siblings);

    assert.strictEqual(result.newPath, '02-external-file.md');

    // Should shift 02 and 03, plus insert
    const renameMap = new Map(result.renames.map(r => [r.from, r.to]));
    assert.strictEqual(renameMap.get('02-methods.md'), '03-methods.md');
    assert.strictEqual(renameMap.get('03-results.md'), '04-results.md');
    assert.strictEqual(renameMap.get('other/external-file.md'), '02-external-file.md');
  });

  it('handles moving inside a folder', () => {
    // Drag file.md inside 02-section (which has 01-a.md, 02-b.md)
    const siblings = ['02-section/01-a.md', '02-section/02-b.md'];
    const result = FSML.computeReorder('file.md', '02-section', 'inside', siblings);

    // Should get next available order (03)
    assert.strictEqual(result.newPath, '02-section/03-file.md');

    // No shifts needed when appending to end
    assert.strictEqual(result.renames.length, 1);
    assert.strictEqual(result.renames[0].from, 'file.md');
    assert.strictEqual(result.renames[0].to, '02-section/03-file.md');
  });

  it('returns no changes when position unchanged', () => {
    const siblings = ['01-intro.md', '02-methods.md', '03-results.md'];
    // Moving 02-methods after 01-intro = same position
    const result = FSML.computeReorder('02-methods.md', '01-intro.md', 'after', siblings);

    assert.strictEqual(result.newPath, '02-methods.md');
    assert.strictEqual(result.renames.length, 0);
  });

  it('handles nested paths correctly', () => {
    const siblings = [
      '02-section/01-setup.md',
      '02-section/02-usage.md',
      '02-section/03-advanced.md',
    ];

    // Move 03-advanced before 01-setup
    const result = FSML.computeReorder(
      '02-section/03-advanced.md',
      '02-section/01-setup.md',
      'before',
      siblings
    );

    assert.strictEqual(result.newPath, '02-section/01-advanced.md');

    const renameMap = new Map(result.renames.map(r => [r.from, r.to]));
    assert.strictEqual(renameMap.get('02-section/01-setup.md'), '02-section/02-setup.md');
    assert.strictEqual(renameMap.get('02-section/02-usage.md'), '02-section/03-usage.md');
    assert.strictEqual(renameMap.get('02-section/03-advanced.md'), '02-section/01-advanced.md');
  });

  it('orders renames correctly to avoid collisions (moving UP)', () => {
    const siblings = ['01-a.md', '02-b.md', '03-c.md'];
    const result = FSML.computeReorder('03-c.md', '01-a.md', 'before', siblings);

    // When moving UP (orders increase), highest order should be renamed first
    // Order: 02-b -> 03-b, then 01-a -> 02-a, then 03-c -> 01-c
    const fromOrders = result.renames.map(r => FSML.parsePath(r.from).order);

    // First rename should be for order 2 (to make room for 01->02)
    // Actually the sort is by highest first for 'up' direction
    assert.ok(fromOrders[0] >= fromOrders[fromOrders.length - 1] || fromOrders.length <= 1);
  });
});

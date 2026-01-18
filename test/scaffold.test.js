import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as Scaffold from '../src/scaffold.js';

describe('Scaffold.project', () => {
  it('generates correct structure', () => {
    const scaffold = Scaffold.project('my-research');

    const paths = scaffold.files.map(f => f.path);
    assert.ok(paths.includes('mrmd.md'));
    assert.ok(paths.includes('01-index.md'));
    assert.ok(paths.includes('_assets/.gitkeep'));

    const mrmdMd = scaffold.files.find(f => f.path === 'mrmd.md');
    assert.ok(mrmdMd.content.includes('name: "my-research"'));
    assert.ok(mrmdMd.content.includes('venv: ".venv"'));

    assert.strictEqual(scaffold.venvPath, '.venv');
  });
});

describe('Scaffold.standaloneFrontmatter', () => {
  it('generates valid frontmatter', () => {
    const fm = Scaffold.standaloneFrontmatter({
      venv: '/home/user/.venv',
      cwd: '/home/user/work',
      title: 'Quick Analysis'
    });

    assert.ok(fm.startsWith('---'));
    assert.ok(fm.includes('title: "Quick Analysis"'));
    assert.ok(fm.includes('venv: "/home/user/.venv"'));
    assert.ok(fm.includes('cwd: "/home/user/work"'));
    assert.ok(fm.endsWith('---\n'));
  });

  it('works without title', () => {
    const fm = Scaffold.standaloneFrontmatter({
      venv: '/path/.venv',
      cwd: '/path'
    });

    assert.ok(!fm.includes('title:'));
    assert.ok(fm.includes('venv: "/path/.venv"'));
  });
});

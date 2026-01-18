import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as Project from '../src/project.js';

describe('Project.getDefaults', () => {
  it('returns sensible defaults', () => {
    const defaults = Project.getDefaults();
    assert.strictEqual(defaults.session.python.venv, '.venv');
    assert.strictEqual(defaults.session.python.cwd, '.');
    assert.strictEqual(defaults.session.python.name, 'default');
    assert.strictEqual(defaults.session.python.auto_start, true);
    assert.strictEqual(defaults.assets.directory, '_assets');
  });
});

describe('Project.parseConfig', () => {
  it('extracts single yaml config block', () => {
    const content = `# My Project

Some description.

\`\`\`yaml config
name: "My Thesis"
session:
  python:
    venv: ".venv"
\`\`\`
`;
    const config = Project.parseConfig(content);
    assert.strictEqual(config.name, 'My Thesis');
    assert.strictEqual(config.session.python.venv, '.venv');
  });

  it('deep merges multiple yaml config blocks', () => {
    const content = `# My Project

\`\`\`yaml config
name: "My Thesis"
session:
  python:
    venv: ".venv"
\`\`\`

More prose here.

\`\`\`yaml config
session:
  python:
    name: "default"
    cwd: "."
\`\`\`
`;
    const config = Project.parseConfig(content);
    assert.strictEqual(config.name, 'My Thesis');
    assert.strictEqual(config.session.python.venv, '.venv');
    assert.strictEqual(config.session.python.name, 'default');
    assert.strictEqual(config.session.python.cwd, '.');
  });

  it('ignores yaml blocks without config tag', () => {
    const content = `# Example

\`\`\`yaml
not: "config"
\`\`\`

\`\`\`yaml config
name: "Real Config"
\`\`\`
`;
    const config = Project.parseConfig(content);
    assert.strictEqual(config.name, 'Real Config');
    assert.strictEqual(config.not, undefined);
  });

  it('handles empty content', () => {
    const config = Project.parseConfig('');
    assert.deepStrictEqual(config, {});
  });
});

describe('Project.parseFrontmatter', () => {
  it('extracts YAML frontmatter', () => {
    const content = `---
title: "GPU Experiments"
session:
  python:
    name: "gpu-session"
---

# GPU Experiments

Content here...
`;
    const fm = Project.parseFrontmatter(content);
    assert.strictEqual(fm.title, 'GPU Experiments');
    assert.strictEqual(fm.session.python.name, 'gpu-session');
  });

  it('returns null when no frontmatter', () => {
    const content = `# No Frontmatter

Just content.
`;
    const fm = Project.parseFrontmatter(content);
    assert.strictEqual(fm, null);
  });

  it('handles empty content', () => {
    assert.strictEqual(Project.parseFrontmatter(''), null);
  });
});

describe('Project.mergeConfig', () => {
  it('document overrides project', () => {
    const projectConfig = {
      name: 'My Thesis',
      session: { python: { venv: '.venv', name: 'default', cwd: '.' } }
    };
    const frontmatter = {
      title: 'GPU Chapter',
      session: { python: { name: 'gpu-session' } }
    };

    const merged = Project.mergeConfig(projectConfig, frontmatter);
    assert.strictEqual(merged.session.python.venv, '.venv');
    assert.strictEqual(merged.session.python.name, 'gpu-session');
    assert.strictEqual(merged.session.python.cwd, '.');
  });

  it('handles null frontmatter', () => {
    const config = { name: 'Test' };
    const merged = Project.mergeConfig(config, null);
    assert.deepStrictEqual(merged, config);
  });
});

describe('Project.findRoot', () => {
  it('finds mrmd.md in ancestor', () => {
    const hasFile = (p) => p === '/home/user/thesis';

    const root = Project.findRoot('/home/user/thesis/02-methods/intro.md', hasFile);
    assert.strictEqual(root, '/home/user/thesis');
  });

  it('returns null when no project', () => {
    const root = Project.findRoot('/home/user/random/file.md', () => false);
    assert.strictEqual(root, null);
  });
});

describe('Project.resolveSession', () => {
  it('computes absolute paths and full session name', () => {
    const session = Project.resolveSession(
      '/home/user/thesis/02-methods/intro.md',
      '/home/user/thesis',
      {
        name: 'my-thesis',
        session: { python: { venv: '.venv', cwd: '.', name: 'default', auto_start: true } }
      }
    );

    assert.strictEqual(session.name, 'my-thesis:default');
    assert.strictEqual(session.venv, '/home/user/thesis/.venv');
    assert.strictEqual(session.cwd, '/home/user/thesis');
    assert.strictEqual(session.autoStart, true);
  });

  it('resolves relative paths correctly', () => {
    const session = Project.resolveSession(
      '/home/user/thesis/chapter.md',
      '/home/user/thesis',
      {
        name: 'thesis',
        session: { python: { venv: '../shared-env/.venv', cwd: '.', name: 'shared' } }
      }
    );

    assert.strictEqual(session.venv, '/home/user/shared-env/.venv');
  });
});

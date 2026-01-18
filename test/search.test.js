import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as Search from '../src/search.js';

describe('Search.fuzzyMatch', () => {
  it('matches prefix', () => {
    const result = Search.fuzzyMatch('instal', 'installation');
    assert.ok(result.score > 0);
    assert.strictEqual(result.matches.length, 6);
    assert.strictEqual(result.matches[0], 0);
  });

  it('handles non-consecutive matches', () => {
    const result = Search.fuzzyMatch('ist', 'installation');
    assert.ok(result.score > 0);
  });

  it('returns 0 for no match', () => {
    const result = Search.fuzzyMatch('xyz', 'installation');
    assert.strictEqual(result.score, 0);
    assert.strictEqual(result.matches.length, 0);
  });

  it('handles empty query', () => {
    const result = Search.fuzzyMatch('', 'test');
    assert.strictEqual(result.score, 0);
  });
});

describe('Search.files', () => {
  const paths = [
    '/home/user/thesis/README.md',
    '/home/user/thesis/02-methods/analysis.md',
    '/home/user/work/other/README.md',
  ];

  it('ranks by path match quality', () => {
    const results = Search.files('thesis readme', paths);
    assert.ok(results[0].path.includes('thesis/README'));
  });

  it('returns all for empty query', () => {
    const results = Search.files('', paths);
    assert.strictEqual(results.length, paths.length);
  });

  it('filters non-matching paths', () => {
    const results = Search.files('nonexistent', paths);
    assert.strictEqual(results.length, 0);
  });
});

import { describe, expect, it } from 'vitest';
import { DslError, tokenize } from '../../src/dsl/index.js';

function types(source: string): string[] {
  return tokenize(source)
    .filter((token) => token.type !== 'newline' && token.type !== 'eof')
    .map((token) => token.type);
}

describe('tokenize', () => {
  it('skips comments and whitespace', () => {
    const tokens = tokenize('# a comment\nword # trailing\n');

    expect(tokens.map((token) => [token.type, token.value])).toEqual([
      ['newline', '\n'],
      ['word', 'word'],
      ['newline', '\n'],
      ['eof', ''],
    ]);
  });

  it('lexes punctuation and range operators', () => {
    expect(types('{ } ( ) : / , * -> ..')).toEqual([
      'lbrace',
      'rbrace',
      'lparen',
      'rparen',
      'colon',
      'slash',
      'comma',
      'star',
      'arrow',
      'dotdot',
    ]);
  });

  it('captures bracketed keys verbatim, including dashes', () => {
    const tokens = tokenize('[7b2f1c2e-aaaa-bbbb]');

    expect(tokens[0]).toMatchObject({
      type: 'key',
      value: '7b2f1c2e-aaaa-bbbb',
    });
  });

  it('lexes strings with escapes', () => {
    const tokens = tokenize('"a \\"quoted\\" value"');

    expect(tokens[0]).toMatchObject({ type: 'string', value: 'a "quoted" value' });
  });

  it('tracks line and column positions', () => {
    const tokens = tokenize('a\n  b');
    const b = tokens.find((token) => token.value === 'b');

    expect(b).toMatchObject({ line: 2, column: 3 });
  });

  it('reports unexpected characters', () => {
    expect(() => tokenize('@')).toThrowError(DslError);
  });

  it('reports unterminated keys', () => {
    expect(() => tokenize('[unterminated')).toThrowError(/Unterminated key/);
  });
});

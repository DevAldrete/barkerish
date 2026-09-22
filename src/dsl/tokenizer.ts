import { DslError } from './ast.js';

export type TokenType =
  | 'word'
  | 'string'
  | 'number'
  | 'key'
  | 'lbrace'
  | 'rbrace'
  | 'lparen'
  | 'rparen'
  | 'colon'
  | 'slash'
  | 'comma'
  | 'star'
  | 'arrow'
  | 'dotdot'
  | 'newline'
  | 'eof';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

const SINGLE_CHAR: Record<string, TokenType> = {
  '{': 'lbrace',
  '}': 'rbrace',
  '(': 'lparen',
  ')': 'rparen',
  ':': 'colon',
  '/': 'slash',
  ',': 'comma',
  '*': 'star',
};

function isWordStart(ch: string): boolean {
  return /[A-Za-z_]/.test(ch);
}

function isWordPart(ch: string): boolean {
  return /[A-Za-z0-9_]/.test(ch);
}

/**
 * Convert DSL source into a flat token stream. Newlines are significant: they
 * terminate attribute and relationship statements. Comments (`#`) run to the end
 * of the line. Bracketed keys are lexed as a single token so UUIDs with dashes are
 * captured verbatim.
 */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const length = text.length;
  let index = 0;
  let line = 1;
  let column = 1;

  const push = (type: TokenType, value: string, atLine: number, atColumn: number): void => {
    tokens.push({ type, value, line: atLine, column: atColumn });
  };

  while (index < length) {
    const ch = text[index]!;

    if (ch === '\n') {
      push('newline', '\n', line, column);
      index += 1;
      line += 1;
      column = 1;
      continue;
    }

    if (ch === '\r' || ch === ' ' || ch === '\t') {
      index += 1;
      column += 1;
      continue;
    }

    if (ch === '#') {
      while (index < length && text[index] !== '\n') {
        index += 1;
      }
      continue;
    }

    if (ch === '"') {
      const startLine = line;
      const startColumn = column;
      index += 1;
      column += 1;
      let value = '';
      let closed = false;
      while (index < length) {
        const current = text[index]!;
        if (current === '\\' && index + 1 < length) {
          const escaped = text[index + 1]!;
          value += escaped === 'n' ? '\n' : escaped;
          index += 2;
          column += 2;
          continue;
        }
        if (current === '"') {
          index += 1;
          column += 1;
          closed = true;
          break;
        }
        if (current === '\n') {
          break;
        }
        value += current;
        index += 1;
        column += 1;
      }
      if (!closed) {
        throw new DslError(startLine, startColumn, 'Unterminated string.');
      }
      push('string', value, startLine, startColumn);
      continue;
    }

    if (ch === '[') {
      const startLine = line;
      const startColumn = column;
      index += 1;
      column += 1;
      let value = '';
      let closed = false;
      while (index < length) {
        const current = text[index]!;
        if (current === ']') {
          index += 1;
          column += 1;
          closed = true;
          break;
        }
        if (current === '\n') {
          break;
        }
        value += current;
        index += 1;
        column += 1;
      }
      if (!closed) {
        throw new DslError(startLine, startColumn, 'Unterminated key: missing "]".');
      }
      push('key', value.trim(), startLine, startColumn);
      continue;
    }

    if (ch === '-' && text[index + 1] === '>') {
      push('arrow', '->', line, column);
      index += 2;
      column += 2;
      continue;
    }

    if (ch === '.' && text[index + 1] === '.') {
      push('dotdot', '..', line, column);
      index += 2;
      column += 2;
      continue;
    }

    const single = SINGLE_CHAR[ch];
    if (single) {
      push(single, ch, line, column);
      index += 1;
      column += 1;
      continue;
    }

    if (isWordStart(ch)) {
      const startColumn = column;
      let value = '';
      while (index < length && isWordPart(text[index]!)) {
        value += text[index];
        index += 1;
        column += 1;
      }
      push('word', value, line, startColumn);
      continue;
    }

    if (/[0-9]/.test(ch)) {
      const startColumn = column;
      let value = '';
      while (index < length && /[0-9]/.test(text[index]!)) {
        value += text[index];
        index += 1;
        column += 1;
      }
      push('number', value, line, startColumn);
      continue;
    }

    throw new DslError(line, column, `Unexpected character '${ch}'.`);
  }

  push('eof', '', line, column);
  return tokens;
}

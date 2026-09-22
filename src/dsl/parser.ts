import type { Cardinality, Optionality } from '../domain/types.js';
import { DslError } from './ast.js';
import type {
  ParsedAttribute,
  ParsedDiagram,
  ParsedDocument,
  ParsedEnd,
  ParsedEntity,
  ParsedRelationship,
  ParseResult,
} from './ast.js';
import { tokenize } from './tokenizer.js';
import type { Token, TokenType } from './tokenizer.js';

const FLAG_KEYWORDS = new Set(['pk', 'fk', 'unique', 'null', 'not']);

/** Internal sentinel used to abandon the current statement and recover. */
class ParseAbort extends Error {}

/**
 * Recursive-descent parser for the Barkerish text DSL. It collects errors instead
 * of stopping at the first one: a failed statement is skipped and parsing resumes
 * on the next line, so the editor can show several problems at once.
 */
class Parser {
  #tokens: Token[];
  #index = 0;
  #errors: DslError[] = [];

  constructor(tokens: Token[]) {
    this.#tokens = tokens;
  }

  parse(): ParseResult {
    const diagrams: ParsedDiagram[] = [];

    while (true) {
      this.#skipNewlines();
      const token = this.#peek();
      if (token.type === 'eof') {
        break;
      }
      if (token.type === 'rbrace') {
        this.#next();
        continue;
      }
      if (token.type === 'word' && token.value === 'diagram') {
        try {
          diagrams.push(this.#parseDiagram());
        } catch (error) {
          if (!(error instanceof ParseAbort)) {
            throw error;
          }
          this.#skipLine();
        }
      } else {
        this.#report(token, `Expected 'diagram', found ${describe(token)}.`);
        this.#next();
        this.#skipLine();
      }
    }

    const document: ParsedDocument = { diagrams };
    return { document, errors: this.#errors };
  }

  #parseDiagram(): ParsedDiagram {
    this.#expectWord('diagram');
    const name = this.#parseName();
    const key = this.#optionalKey();
    this.#expect('lbrace', "Expected '{' after the diagram name.");

    const entities: ParsedEntity[] = [];
    const relationships: ParsedRelationship[] = [];

    while (true) {
      this.#skipNewlines();
      const token = this.#peek();
      if (token.type === 'rbrace') {
        this.#next();
        break;
      }
      if (token.type === 'eof') {
        this.#fail(token, 'Unterminated diagram block: missing "}".');
      }
      try {
        if (token.type === 'word' && token.value === 'entity') {
          entities.push(this.#parseEntity());
        } else if (token.type === 'word' && token.value === 'relationship') {
          relationships.push(this.#parseRelationship());
        } else {
          this.#fail(token, `Expected 'entity' or 'relationship', found ${describe(token)}.`);
        }
      } catch (error) {
        if (!(error instanceof ParseAbort)) {
          throw error;
        }
        this.#skipLine();
      }
    }

    return { name, key, entities, relationships };
  }

  #parseEntity(): ParsedEntity {
    this.#expectWord('entity');
    const name = this.#parseName();
    const key = this.#optionalKey();
    this.#expect('lbrace', "Expected '{' after the entity name.");

    const attributes: ParsedAttribute[] = [];
    while (true) {
      this.#skipNewlines();
      const token = this.#peek();
      if (token.type === 'rbrace') {
        this.#next();
        break;
      }
      if (token.type === 'eof') {
        this.#fail(token, 'Unterminated entity block: missing "}".');
      }
      try {
        attributes.push(this.#parseAttribute());
      } catch (error) {
        if (!(error instanceof ParseAbort)) {
          throw error;
        }
        this.#skipLine();
      }
    }

    return { name, key, attributes };
  }

  #parseAttribute(): ParsedAttribute {
    const nameToken = this.#peek();
    if (nameToken.type !== 'word' && nameToken.type !== 'string') {
      this.#fail(nameToken, `Expected an attribute name, found ${describe(nameToken)}.`);
    }
    this.#next();
    this.#expect('colon', "Expected ':' after the attribute name.");

    const typeTokens: Token[] = [];
    while (true) {
      const token = this.#peek();
      if (
        token.type === 'newline' ||
        token.type === 'rbrace' ||
        token.type === 'eof' ||
        (token.type === 'word' && FLAG_KEYWORDS.has(token.value))
      ) {
        break;
      }
      typeTokens.push(this.#next());
    }
    if (typeTokens.length === 0) {
      this.#fail(this.#peek(), 'Expected a data type after ":".');
    }

    let primaryKey = false;
    let foreignKey = false;
    let nullable = true;
    let unique = false;

    while (true) {
      const token = this.#peek();
      if (token.type === 'newline' || token.type === 'rbrace' || token.type === 'eof') {
        break;
      }
      if (token.type !== 'word') {
        this.#fail(token, `Unexpected ${describe(token)} in attribute flags.`);
      }
      switch (token.value) {
        case 'pk':
          primaryKey = true;
          this.#next();
          break;
        case 'fk':
          foreignKey = true;
          this.#next();
          break;
        case 'unique':
          unique = true;
          this.#next();
          break;
        case 'null':
          nullable = true;
          this.#next();
          break;
        case 'not':
          this.#next();
          this.#expectWord('null', "Expected 'null' after 'not'.");
          nullable = false;
          break;
        default:
          this.#fail(token, `Unknown attribute flag '${token.value}'.`);
      }
    }

    return {
      name: nameToken.value,
      dataType: joinType(typeTokens),
      primaryKey,
      foreignKey,
      nullable,
      unique,
    };
  }

  #parseRelationship(): ParsedRelationship {
    this.#expectWord('relationship');
    const key = this.#optionalKey();
    const source = this.#parseEnd();
    this.#expect('arrow', "Expected '->' between relationship ends.");
    const target = this.#parseEnd();

    let sourceLabel = 'relates to';
    let targetLabel = 'relates to';
    if (this.#peek().type === 'colon') {
      this.#next();
      sourceLabel = this.#parseName();
      this.#expect('slash', "Expected '/' between the two perspective labels.");
      targetLabel = this.#parseName();
    }

    let identifying = false;
    if (this.#peek().type === 'word' && this.#peek().value === 'identifying') {
      this.#next();
      identifying = true;
    }

    return { key, source, target, sourceLabel, targetLabel, identifying };
  }

  #parseEnd(): ParsedEnd {
    const entity = this.#parseName();
    this.#expect('lparen', "Expected '(' before the participation range.");
    const min = this.#parseRangeBound();
    this.#expect('dotdot', "Expected '..' inside the participation range.");
    const max = this.#parseRangeBound();
    this.#expect('rparen', "Expected ')' to close the participation range.");

    const optionality: Optionality = min === 0 ? 'optional' : 'mandatory';
    const cardinality: Cardinality = max === '*' || (max !== 0 && max !== 1) ? 'many' : 'one';

    return { entity, optionality, cardinality };
  }

  #parseRangeBound(): number | '*' {
    const token = this.#peek();
    if (token.type === 'star') {
      this.#next();
      return '*';
    }
    if (token.type === 'number') {
      this.#next();
      return Number(token.value);
    }
    this.#fail(token, `Expected a number or '*', found ${describe(token)}.`);
  }

  #parseName(): string {
    const token = this.#peek();
    if (token.type !== 'word' && token.type !== 'string') {
      this.#fail(token, `Expected a name, found ${describe(token)}.`);
    }
    this.#next();
    return token.value;
  }

  #optionalKey(): string | undefined {
    if (this.#peek().type === 'key') {
      return this.#next().value;
    }
    return undefined;
  }

  #peek(offset = 0): Token {
    return this.#tokens[Math.min(this.#index + offset, this.#tokens.length - 1)]!;
  }

  #next(): Token {
    const token = this.#peek();
    if (token.type !== 'eof') {
      this.#index += 1;
    }
    return token;
  }

  #skipNewlines(): void {
    while (this.#peek().type === 'newline') {
      this.#index += 1;
    }
  }

  #skipLine(): void {
    while (true) {
      const token = this.#peek();
      if (token.type === 'newline') {
        this.#index += 1;
        return;
      }
      if (token.type === 'eof' || token.type === 'rbrace') {
        return;
      }
      this.#index += 1;
    }
  }

  #expect(type: TokenType, message: string): Token {
    const token = this.#peek();
    if (token.type !== type) {
      this.#fail(token, message);
    }
    return this.#next();
  }

  #expectWord(value: string, message = `Expected '${value}'.`): Token {
    const token = this.#peek();
    if (token.type !== 'word' || token.value !== value) {
      this.#fail(token, message);
    }
    return this.#next();
  }

  #fail(token: Token, message: string): never {
    this.#report(token, message);
    throw new ParseAbort();
  }

  #report(token: Token, message: string): void {
    this.#errors.push(new DslError(token.line, token.column, message));
  }
}

function describe(token: Token): string {
  if (token.type === 'eof') {
    return 'end of input';
  }
  if (token.type === 'newline') {
    return 'end of line';
  }
  if (token.type === 'string') {
    return `"${token.value}"`;
  }
  return `'${token.value}'`;
}

/** Rebuild a data type string from its tokens, keeping parentheses tight. */
function joinType(tokens: Token[]): string {
  let result = '';
  for (const token of tokens) {
    const value = token.type === 'string' ? `"${token.value}"` : token.value;
    if (result === '') {
      result = value;
    } else if (value === '(' || value === ')' || value === ',') {
      result += value;
    } else if (result.endsWith('(') || result.endsWith(',')) {
      result += value;
    } else {
      result += ` ${value}`;
    }
  }
  return result;
}

/** Parse DSL source into an AST plus any errors encountered. */
export function parseDocument(text: string): ParseResult {
  try {
    return new Parser(tokenize(text)).parse();
  } catch (error) {
    if (error instanceof DslError) {
      return { document: { diagrams: [] }, errors: [error] };
    }
    throw error;
  }
}

import type { Cardinality, Optionality } from '../domain/types.js';

/** Line/column error reported by the tokenizer or parser. */
export class DslError extends Error {
  constructor(
    readonly line: number,
    readonly column: number,
    message: string,
  ) {
    super(message);
    this.name = 'DslError';
  }
}

export interface ParsedDocument {
  diagrams: ParsedDiagram[];
}

export interface ParsedDiagram {
  name: string;
  key?: string;
  entities: ParsedEntity[];
  relationships: ParsedRelationship[];
}

export interface ParsedEntity {
  name: string;
  key?: string;
  attributes: ParsedAttribute[];
}

export interface ParsedAttribute {
  name: string;
  dataType: string;
  primaryKey: boolean;
  foreignKey: boolean;
  nullable: boolean;
  unique: boolean;
}

export interface ParsedEnd {
  entity: string;
  optionality: Optionality;
  cardinality: Cardinality;
}

export interface ParsedRelationship {
  key?: string;
  source: ParsedEnd;
  target: ParsedEnd;
  sourceLabel: string;
  targetLabel: string;
  identifying: boolean;
}

export interface ParseResult {
  document: ParsedDocument;
  errors: DslError[];
}

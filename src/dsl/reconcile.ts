import type { Diagram } from '../domain/types.js';
import { DslError } from './ast.js';
import type { ParsedDiagram, ParsedDocument } from './ast.js';
import { compileDiagram } from './compile.js';

export interface ReconcileResult {
  /** Diagrams built from the parsed document, in source order. */
  diagrams: Diagram[];
  /** Existing diagrams that the document did not mention. */
  removed: Diagram[];
  errors: DslError[];
}

/**
 * Match each parsed diagram to an existing one (by stable key, then by name) and
 * compile it, reusing ids and layout. Diagrams left unmatched are reported as
 * `removed` so the caller can decide whether to delete them.
 */
export function reconcileDocument(
  parsed: ParsedDocument,
  existing: Diagram[],
  now = new Date().toISOString(),
): ReconcileResult {
  const errors: DslError[] = [];
  const usedIds = new Set<string>();
  const diagrams = parsed.diagrams.map((parsedDiagram) => {
    const match = findExisting(parsedDiagram, existing, usedIds);
    if (match) {
      usedIds.add(match.id);
    }
    const result = compileDiagram(parsedDiagram, match, now);
    errors.push(...result.errors);
    return result.diagram;
  });

  return {
    diagrams,
    removed: existing.filter((diagram) => !usedIds.has(diagram.id)),
    errors,
  };
}

function findExisting(
  parsed: ParsedDiagram,
  existing: Diagram[],
  usedIds: Set<string>,
): Diagram | undefined {
  if (parsed.key) {
    const byKey = existing.find((diagram) => diagram.id === parsed.key && !usedIds.has(diagram.id));
    if (byKey) {
      return byKey;
    }
  }
  return existing.find((diagram) => diagram.name === parsed.name && !usedIds.has(diagram.id));
}

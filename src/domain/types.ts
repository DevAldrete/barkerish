import type { Id } from './ids.js';

/**
 * Native format version. Bump whenever the persisted/exported shape changes in a
 * way that requires a migration. Kept on the diagram itself so exported files are
 * self-describing.
 */
export const FORMAT_VERSION = 1;
export type FormatVersion = typeof FORMAT_VERSION;

/** Optionality is a property of an entity's participation in a relationship. */
export type Optionality = 'mandatory' | 'optional';

/** Cardinality is how many instances of an entity relate to one of the other. */
export type Cardinality = 'one' | 'many';

export interface Attribute {
  id: Id;
  name: string;
  dataType: string;
  /** Unique identifier; rendered with a '#' marker. */
  primaryKey: boolean;
  /** Display flag only; relationships remain the source of truth for FKs. */
  foreignKey: boolean;
  /** Optional when true; rendered with an 'o' marker. */
  nullable: boolean;
  unique: boolean;
}

export interface Entity {
  id: Id;
  name: string;
  attributes: Attribute[];
}

/**
 * One end of a binary relationship. Both fields are rendered at this same end:
 * the line half encodes `optionality`, the crow's foot encodes `cardinality`.
 */
export interface RelationshipEnd {
  entityId: Id;
  optionality: Optionality;
  cardinality: Cardinality;
}

export interface Relationship {
  id: Id;
  name: string;
  source: RelationshipEnd;
  target: RelationshipEnd;
  /** Identifying relationship; renders a bar at the child (target) end. */
  identifying: boolean;
}

export interface EntityLayout {
  x: number;
  y: number;
  width: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface GridSettings {
  visible: boolean;
  size: number;
  snap: boolean;
}

/** Visual layout, stored separately from the database model. */
export interface Layout {
  entities: Record<Id, EntityLayout>;
  viewport: Viewport;
  grid: GridSettings;
}

export interface Diagram {
  id: Id;
  name: string;
  formatVersion: FormatVersion;
  entities: Entity[];
  relationships: Relationship[];
  layout: Layout;
  createdAt: string;
  updatedAt: string;
}

export interface DiagramMeta {
  id: Id;
  name: string;
  createdAt: string;
  updatedAt: string;
}

# PRD — Local ERD / Barker Diagram Editor

## 1. Overview

A lightweight, fully local web application for creating and editing **Entity Relationship Diagrams (ERDs)** using Correct and Proper **Barker notation**.

The application runs entirely in the browser. No account, backend, server-side database, or network connection is required for core functionality.

**Primary goal:** make modeling relational database structures fast, clear, and portable.

---

## 2. Goals

### Must have

* Create, rename, move, and delete entities.
* Add, edit, reorder, and delete attributes.
* Mark attributes as:

  * Primary Key
  * Foreign Key
  * Nullable
  * Unique
* Create relationships between entities.
* Represent Barker cardinality and optionality correctly.
* Visually render entities and relationships using Barker notation.
* Pan and zoom the diagram.
* Select entities and relationships.
* Undo/redo editing operations.
* Persist diagrams locally.
* Create multiple diagrams.
* Export/import the application's native diagram format.
* Export the rendered diagram as SVG.

### Nice to have later

* SQL → diagram.
* Diagram → SQL.
* Automatic layout.
* Additional ERD notations.
* PNG/PDF export.
* Database-specific data types.
* Schema validation.
* PWA/offline installation.

### Explicitly out of scope

For the initial version:

* User accounts.
* Cloud synchronization.
* Real-time collaboration.
* Sharing links.
* Server-side storage.
* Generic flowcharts or whiteboards.
* Authentication.
* Online dependencies required for normal operation.

---

## 3. Core Principles

### Local-first

The application must remain fully functional without an internet connection.

User data belongs to the user and is stored locally.

The application must never require a backend merely to create, edit, or view a diagram.

### Model-first

The database model is the source of truth.

Visual layout is separate from database semantics.

```text
Database Model
    ├── Entities
    ├── Attributes
    └── Relationships

Diagram Layout
    ├── Positions
    ├── Sizes
    └── Viewport
```

Rendering must derive from these models rather than becoming the model itself.

### Portable

Users must be able to export a complete diagram to a documented, versioned native format and import it again.

The application must not make IndexedDB the only copy of a user's work.

### Deterministic

The same model and layout should produce the same diagram.

Notation rules should be implemented explicitly rather than being scattered throughout UI components.

---

## 4. Domain Model

The minimum conceptual model is:

```text
Diagram
 ├── Entities
 │    └── Attributes
 ├── Relationships
 └── Layout
```

An entity has:

* ID
* Name
* Attributes

An attribute has:

* ID
* Name
* Data type
* Primary-key status
* Foreign-key status
* Nullable status
* Unique status

A relationship has:

* ID
* Source entity
* Target entity
* Cardinality/optionality on both ends

Layout information must be stored separately from the domain model.

IDs must be stable and independent of display names.

---

## 5. Barker Notation

Barker notation is a semantic requirement, not merely a visual theme.

The implementation must explicitly model:

* Cardinality.
* Optionality.
* Relationship endpoints.
* Identifying/non-identifying semantics where applicable.

The renderer is responsible for translating these semantics into Barker notation.

Notation rules should be isolated so that another notation can potentially be implemented later without changing the database model.

---

## 6. Editing

The editor should support:

* Click to select.
* Drag to move entities.
* Create relationships through an intentional interaction.
* Edit properties through a dedicated UI.
* Delete with keyboard or UI controls.
* Pan and zoom.
* Grid and optional snapping.
* Keyboard shortcuts for common operations.

Editing operations should be represented as commands where practical:

```text
AddEntity
DeleteEntity
MoveEntity
AddAttribute
DeleteAttribute
CreateRelationship
DeleteRelationship
```

This provides a foundation for reliable undo/redo.

---

## 7. Persistence

Use **IndexedDB through Dexie.js**.

Persistence should be abstracted behind a repository/service layer.

The UI must not directly depend on Dexie.

The native diagram format must contain enough information to reconstruct:

* Database model.
* Layout.
* Diagram metadata.
* Format version.

The format must be versioned from the first release to allow future migrations.

---

## 8. Technology

Initial stack:

* **TypeScript**
* **Lit**
* **SVG**
* **CSS**
* **Dexie.js**
* **IndexedDB**

SVG is preferred over Canvas because the application primarily renders structured entities, text, relationships, and notation symbols, while requiring straightforward SVG export and DOM interaction.

Avoid adding framework/library dependencies unless they solve a concrete problem.

---

## 9. Architecture

```text
                 UI / Lit
                    │
                    ▼
            Application Services
                    │
                    ▼
             Domain + Commands
               │           │
               ▼           ▼
          SVG Renderer   Repository
                            │
                            ▼
                          Dexie
                            │
                            ▼
                        IndexedDB
```

Important boundaries:

* UI does not own domain semantics.
* Renderer does not own persistent state.
* Persistence does not dictate the domain model.
* Domain model does not contain visual coordinates.

---

## 10. MVP Acceptance Criteria

The MVP is complete when a user can:

1. Create a diagram.
2. Add two or more entities.
3. Add attributes to entities.
4. Define primary/foreign keys.
5. Create a relationship.
6. Configure its cardinality and optionality.
7. See the relationship rendered correctly in Barker notation.
8. Move and arrange entities.
9. Undo and redo changes.
10. Close and reopen the application without losing the diagram.
11. Export the diagram to the native format.
12. Import that file and recover the model and layout.
13. Export the diagram as SVG.
14. Use all core functionality without a network connection.

---

## 11. Important Design Questions

These should be resolved before implementation becomes extensive:

### Relationship semantics

Exactly which Barker rules will be supported in v1?

Avoid implementing ambiguous notation from memory; establish a precise internal representation and validate it against authoritative references.

### Attribute vs. column terminology

Decide whether the product is database-oriented and therefore uses **columns**, or conceptual-model terminology and uses **attributes**.

Do not mix terminology arbitrarily.

### Foreign keys

Determine whether foreign keys are:

* properties of attributes only,
* explicitly modeled as constraints,
* or both.

Prefer a representation that can later support composite foreign keys.

### Many-to-many relationships

Determine whether many-to-many relationships are represented directly or whether the application models an associative entity.

This decision affects both the domain model and SQL generation later.

### Layout

Do not introduce automatic layout into the MVP unless it becomes necessary.

Manual layout is substantially simpler and gives users predictable control.

---

## 12. Non-Goals / Constraints

The project should resist becoming a general-purpose diagram editor.

The domain is intentionally constrained to relational database modeling.

Every new feature should answer:

> Does this materially improve relational database modeling?

If not, it should probably not belong in the core product.

---

## 13. Success Criteria

The project succeeds if a user can model a moderately sized relational schema **quickly, accurately, locally, and without fighting the editor**.

Technical success means the application has:

* A clean domain model.
* Correct Barker rendering.
* Reliable persistence.
* Portable files.
* Predictable editing behavior.
* Minimal architectural coupling.
* No backend dependency.

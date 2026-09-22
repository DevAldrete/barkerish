# barkerish

A local-first web application for creating and editing **Entity Relationship Diagrams (ERDs)** using Barker notation. Runs entirely in the browser; no account, backend, or network connection is required.

## Features

- Create, rename, move and delete entities.
- Add, edit, reorder and delete attributes with primary-key, foreign-key, nullable and unique flags.
- Create relationships with per-end optionality (mandatory/optional) and cardinality (one/many), plus identifying relationships.
- Barker rendering: `#` unique identifiers, `*` mandatory / `o` optional attributes, solid/dotted line halves, crow's feet and identifying bars.
- Pan, zoom, grid and optional snapping; select, drag and keyboard shortcuts.
- Double-click an entity or relationship to edit it; use the zoom slider, `−`/`+` and Fit controls in the bottom-right.
- The sidebar lists the diagram's entities so you can select, zoom to, edit or delete each one directly.
- Undo/redo for every editing operation.
- Multiple diagrams persisted in IndexedDB (via Dexie).
- Export/import the native, versioned diagram format; export the diagram as SVG.
- Author the whole document as text with a Barkerish DSL and apply it in one undoable step.
- Themes: Light, Dark Grey, Ashen, Tokyo Night, Catppuccin, Gruvbox and Nord. The selected theme is remembered and is embedded in exported SVGs.

## Text DSL

The **Text** button in the toolbar opens a dock where the whole document can be written as text. It is a full mirror of the saved diagrams: applying creates and updates the diagrams named in the text and deletes any that are missing (with a confirmation first). Only the currently open diagram participates in undo/redo; other diagrams are saved directly.

```text
diagram "Sales" [<id>] {
  entity Customer [<id>] {
    id:        integer   pk
    name:      text      not null
    email:     text      unique
    countryId: integer   fk
  }

  entity Order [<id>] {
    id:       integer    pk
    placedAt: timestamp  not null
  }

  relationship [<id>] Customer (0..*) -> Order (1..1) : "places" / "placed by"
  relationship Order (1..1) -> Customer (0..*) identifying
}
```

- `entity Name { name: type pk fk unique not null }` declares an entity and its attributes. Attributes are optional (nullable) by default; `not null` makes them mandatory.
- `relationship A (min..max) -> B (min..max)` describes each entity's own participation: `min` 0 = optional, 1 = mandatory; `max` 1 = one, `*` = many. Add `identifying` for an identifying relationship, and `: "source" / "target"` for the perspective labels.
- `[...]` after a diagram, entity or relationship is an optional stable key. The serializer always writes it, so the text round-trips across renames; hand-written files may omit it and match by name.
- Names that are not simple identifiers, or that collide with keywords, are quoted.
- **Apply** (`Ctrl/Cmd + Enter`) parses and validates; errors are listed with line numbers and clicking one jumps to it. **From diagram** regenerates the text, and **Load**/**Save** move it to and from a plain-text file.

## Themes

Pick a theme from the toolbar; the choice is stored in `localStorage` and applied as CSS custom properties on the document root, so it reaches every shadow root. Colours are defined once in `src/theme/themes.ts` and are also written into exported SVGs.

## Commands

| Command              | Description                     |
| -------------------- | ------------------------------- |
| `npm run dev`        | Start the Vite dev server       |
| `npm run build`      | Type-check and build to `dist/` |
| `npm run preview`    | Preview the production build    |
| `npm run typecheck`  | Run `tsc --noEmit`              |
| `npm run lint`       | Lint with ESLint                |
| `npm run format`     | Format with Prettier            |
| `npm test`           | Run the test suite once         |
| `npm run test:watch` | Run tests in watch mode         |

## Keyboard shortcuts

| Keys                   | Action                                               |
| ---------------------- | ---------------------------------------------------- |
| `Ctrl/Cmd + Z`         | Undo                                                 |
| `Shift + Ctrl/Cmd + Z` | Redo                                                 |
| `Delete` / `Backspace` | Delete the selected entity or relationship           |
| `Escape`               | Clear the selection, or cancel relationship creation |

Shortcuts are ignored while typing in a field. Double-clicking an entity or relationship selects it and focuses its editor.

## Architecture

```
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
               Dexie → IndexedDB
```

Key boundaries:

- UI does not own domain semantics.
- Renderer does not own persistent state.
- Persistence does not dictate the domain model.
- Domain model does not contain visual coordinates.

The database model is the source of truth; layout is stored separately and rendering derives from both. Editing flows through serializable commands applied by a pure reducer, with snapshot-based undo/redo.

## Native format

Diagrams export to a self-describing JSON document. The `formatVersion` allows future migrations; the parser validates the structure and drops references to missing entities.

```json
{
  "format": "barkerish",
  "formatVersion": 1,
  "diagram": {
    "id": "…",
    "name": "Sales",
    "formatVersion": 1,
    "entities": [{ "id": "…", "name": "Customer", "attributes": [] }],
    "relationships": [
      {
        "id": "…",
        "sourceLabel": "places",
        "targetLabel": "placed by",
        "source": { "entityId": "…", "optionality": "mandatory", "cardinality": "one" },
        "target": { "entityId": "…", "optionality": "optional", "cardinality": "many" },
        "identifying": false
      }
    ],
    "layout": {
      "entities": { "…": { "x": 0, "y": 0, "width": 220 } },
      "viewport": { "x": 0, "y": 0, "zoom": 1 },
      "grid": { "visible": true, "size": 20, "snap": false }
    },
    "createdAt": "…",
    "updatedAt": "…"
  }
}
```

See `PRD.md` for the full requirements.

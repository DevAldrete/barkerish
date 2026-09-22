# barkerish

A local-first web application for creating and editing **Entity Relationship Diagrams (ERDs)** using Barker notation. Runs entirely in the browser; no account, backend, or network connection is required.

## Features

- Create, rename, move and delete entities.
- Add, edit, reorder and delete attributes with primary-key, foreign-key, nullable and unique flags.
- Create relationships with per-end optionality (mandatory/optional) and cardinality (one/many), plus identifying relationships.
- Barker rendering: `#` unique identifiers, `*` mandatory / `o` optional attributes, solid/dotted line halves, crow's feet and identifying bars.
- Pan, zoom, grid and optional snapping; select, drag and keyboard shortcuts.
- Double-click an entity or relationship to edit it; use the zoom slider, `−`/`+` and Fit controls in the bottom-right.
- Undo/redo for every editing operation.
- Multiple diagrams persisted in IndexedDB (via Dexie).
- Export/import the native, versioned diagram format; export the diagram as SVG.

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

# barkerish

A local-first web application for creating and editing **Entity Relationship Diagrams (ERDs)** using Barker notation. Runs entirely in the browser; no account, backend, or network connection is required.

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

The database model is the source of truth; layout is stored separately and rendering derives from both. See `PRD.md` for the full requirements.

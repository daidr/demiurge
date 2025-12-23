# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/claude-code) when working with code in this repository.

## Project Overview

**Demiurge** is a frontend JSON processing tool built as a Progressive Web App (PWA). It provides workspace-based JSON editing with schema validation, instant tools, and interactive tools.

### Core Concepts

- **SchemaManager**: Configure and name JSON schemas for validation
- **Workspace**: A collection of workspace tabs
- **Workspace Tab**: Contains JSON data, can be associated with a JSON schema, and can open tool tabs
- **Tools**: Two types:
  - **Instant Tools**: Button-triggered, immediately process JSON (e.g., sort JSON alphabetically)
  - **Interactive Tools**: Tab-based with UI (e.g., JSON size viewer, JSON playground)

## Tech Stack

- **Framework**: Vue 3 + TypeScript (Composition API with `<script setup>`)
- **Build Tool**: Vite 8 (beta)
- **Package Manager**: bun (pnpm lockfile compatible)
- **State Management**: Pinia
- **Styling**: UnoCSS + Tailwind preset + Shadcn preset
- **UI Components**: Reka UI (headless) + Shadcn-style components
- **Editor**: Monaco Editor
- **Storage**: OPFS (Origin Private File System) with Web Workers (Comlink)
- **i18n**: Vue I18n (en-US, zh-CN)
- **Icons**: Mingcute (via UnoCSS icons preset)

## Common Commands

```bash
bun run dev       # Start dev server
bun run build     # Type-check and build for production
bun run type-check # Run vue-tsc type checking
bun run test      # Run vitest tests
bun run lint      # Run oxlint + eslint
bun run lint:fix  # Fix linting issues
bun run preview   # Preview production build
```

## Project Structure

```
src/
├── components/
│   ├── base/              # Low-level components
│   │   ├── MonacoEditor.vue      # Monaco code editor wrapper with overflow support
│   │   ├── MonacoDiffEditor.vue  # Monaco diff editor wrapper with overflow support
│   │   └── JsonTree/             # JSON size tree with virtualization (Reka UI Tree)
│   ├── ui/                # Shadcn-style UI components (Reka UI based)
│   │   ├── tabs/          # Tabs component
│   │   └── toggle-group/  # ToggleGroup component
│   ├── tools/             # Tool panel components
│   │   ├── ToolPanel.vue  # Main tool panel container
│   │   ├── ToolHeader.vue # Tool header with instant tools
│   │   ├── instant/       # Instant tool buttons
│   │   │   └── SortJsonButton.vue
│   │   └── interactive/   # Interactive tool tabs
│   │       ├── JsonSizeViewer.vue
│   │       └── JsonPlayground.vue
│   ├── App.vue
│   ├── MainLayout.vue     # Main application layout
│   ├── MainHeader.vue     # Application header
│   ├── LayoutSidebar.vue  # Workspace sidebar
│   └── LayoutSchemaEditor.vue  # JSON Schema editor panel
├── stores/
│   ├── workspace.ts       # Workspace & file system state
│   ├── layout.ts          # UI layout state
│   └── tools.ts           # Tool state (active tab, playground, size tree)
├── composables/           # Vue composition functions
├── utils/
│   ├── persist.ts         # Web Worker wrapper for storage
│   └── persist_worker.ts  # Storage manager worker
├── lib/
│   └── utils.ts           # Tailwind/class utilities (cn function)
├── assets/                # Styles and icons
└── main.ts                # App entry point

locales/                   # i18n translation files
config/                    # PWA manifest config
```

## Architecture Notes

### State Management

- `useWorkspaceStore()`: Manages workspaces, tabs, snippets, and OPFS persistence
- `useLayoutStore()`: UI state (sidebar visibility, panel states)
- `useToolsStore()`: Tool state (active tool tab, playground expression/result, size tree)

### Storage Structure (OPFS)

```
/workspace/
├── __draft__/             # Default draft workspace
│   ├── __metadata.json    # {id, schema, title, desc, icon}
│   ├── tabs/              # Tab JSON files
│   └── snippets/          # Snippet files
└── {workspaceId}/         # User-created workspaces
    ├── __metadata.json
    ├── tabs/
    └── snippets/
```

### Key Classes

- `WorkspaceItem`: Manages single workspace with OPFS integration
- `WorkspaceStatus`: Enum for workspace lifecycle (Uninitialized → Loading → Done/Failed)

### Monaco Editor Integration

Both `MonacoEditor.vue` and `MonacoDiffEditor.vue` handle overflow widgets (autocomplete, hover tooltips, etc.) to prevent clipping by `overflow: hidden` containers:

- **Overflow Container**: Uses `<Teleport>` to mount a container on `<body>`
- **Position Tracking**: Uses `useElementBounding` to track editor position and sync with the overflow container via `transform`
- **Configuration**: Sets `overflowWidgetsDomNode` option to redirect Monaco's overlay widgets to the body-mounted container

This ensures autocomplete dropdowns, hover tooltips, and other overlays are never clipped by parent containers with `overflow: hidden`.

### Component Patterns

- Use Reka UI primitives as base
- Style with CVA (class-variance-authority) for variants
- Use `cn()` from `@/lib/utils` for class merging
- Forward props with `delegatedProps` pattern from Reka UI

## Code Style

- ESLint + Oxlint for linting
- Conventional commits (commitlint enforced via git hooks)
- Vue Composition API with `<script setup lang="ts">`
- Path alias: `@/` → `src/`

## Verification

When verifying code changes, use `bun run build` instead of `bun run dev`. The build command includes type-checking and will catch errors that the dev server might miss.

## Browser Requirements

Requires modern browser with OPFS support (FileSystemDirectoryHandle API).

## Keyboard Shortcuts

- `Cmd/Ctrl + B`: Toggle sidebar
- `Cmd/Ctrl + S`: Toggle schema panel
- `Cmd/Ctrl + T`: Toggle tool panel
- `Cmd/Ctrl + Shift + S`: Sort JSON keys

## Tools System

### Instant Tools
- **Sort JSON**: Recursively sorts all object keys alphabetically

### Interactive Tools
- **Size Viewer**: TreeView showing JSON structure with size (bytes) and percentage for each node
- **Playground**: Expression evaluator supporting:
  - **JavaScript mode**: Use `$` or `data` to reference the JSON object (e.g., `$.users.filter(u => u.age > 18)`). Both variables provide IDE type hints based on the current JSON structure.
  - **JSONPath mode**: Standard JSONPath syntax (e.g., `$.store.book[*].author`) using `jsonpath-plus` library
  - **Auto Run**: Automatically execute expression when JSON or expression changes
  - **Execution Time**: Shows execution duration in milliseconds

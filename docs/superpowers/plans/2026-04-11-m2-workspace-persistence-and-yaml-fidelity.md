# M2 Workspace Persistence And YAML Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add default local workspace auto-save and restore while upgrading the editing pipeline to preserve comments and formatting for the core imported/exported YAML files.

**Architecture:** Introduce a serializable workspace snapshot layer and a runtime source-artifact layer. Keep `RimeProject` as the UI-facing model, but stop treating it as the only source of truth for YAML fidelity. Persist raw file contents to local storage, rebuild runtime documents on load, and route form-mode and YAML-mode edits back through those file artifacts.

**Tech Stack:** Zustand, TypeScript, browser `localStorage`, `yaml` package `Document` API, existing import/export/share flows, Vitest.

**Design Spec:** `docs/superpowers/specs/2026-04-11-post-batch-roadmap-design.md`

---

### Task 1: Introduce serializable workspace snapshot types and storage helpers

**Files:**
- Create: `src/lib/workspace/types.ts`
- Create: `src/lib/workspace/storage.ts`
- Create: `src/lib/workspace/storage.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/workspace/storage.test.ts` with:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadWorkspaceSnapshot, saveWorkspaceSnapshot, clearWorkspaceSnapshot } from './storage'
import type { WorkspaceSnapshot } from './types'

const STORAGE_KEY = 'rime-craft.workspace.v1'

const snapshot: WorkspaceSnapshot = {
  version: 1,
  savedAt: '2026-04-11T00:00:00.000Z',
  project: {
    targetPlatform: 'macos',
    defaultConfig: {
      schemaList: [{ schema: 'rime_ice' }],
      pageSize: 9,
      selectKeys: '1234567890',
      asciiComposer: {
        goodOldCapsLock: true,
        switchKey: {
          shiftL: 'inline_ascii',
          shiftR: 'commit_text',
          controlL: 'noop',
          controlR: 'noop',
          capsLock: 'clear',
        },
      },
      keyBinder: { bindings: [] },
    },
    platformConfig: { platform: 'macos', appOptions: {} },
    schemaConfigs: {},
    customPhrases: [],
    preserved: {},
  },
  editorUI: {
    activeModule: 'schema-manager',
    viewMode: 'panel',
    tutorialCollapsed: false,
  },
  sourceFiles: {},
}

describe('workspace storage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('round-trips a workspace snapshot through localStorage', () => {
    saveWorkspaceSnapshot(snapshot)
    expect(loadWorkspaceSnapshot()).toEqual(snapshot)
  })

  it('returns null for invalid payloads', () => {
    localStorage.setItem(STORAGE_KEY, '{"version":999}')
    expect(loadWorkspaceSnapshot()).toBeNull()
  })

  it('clears the stored snapshot', () => {
    saveWorkspaceSnapshot(snapshot)
    clearWorkspaceSnapshot()
    expect(loadWorkspaceSnapshot()).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- src/lib/workspace/storage.test.ts
```

Expected: FAIL because the workspace modules do not exist yet.

- [ ] **Step 3: Implement the types and storage helpers**

Create `src/lib/workspace/types.ts` with:

```ts
import type { EditorModule, EditorUIState, RimeProject } from '@/types/config'

export interface PersistedSourceFile {
  id: string
  fileName: string
  kind: 'default' | 'platform' | 'schema' | 'custom_phrase'
  content: string
  platform?: 'macos' | 'windows'
  schemaId?: string
  updatedAt: string
}

export interface WorkspaceSnapshot {
  version: 1
  savedAt: string
  project: RimeProject
  editorUI: Pick<EditorUIState, 'viewMode' | 'tutorialCollapsed'> & {
    activeModule: EditorModule
  }
  sourceFiles: Record<string, PersistedSourceFile>
}
```

Create `src/lib/workspace/storage.ts` with:

```ts
import type { WorkspaceSnapshot } from './types'

const STORAGE_KEY = 'rime-craft.workspace.v1'

export function saveWorkspaceSnapshot(snapshot: WorkspaceSnapshot): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

export function loadWorkspaceSnapshot(): WorkspaceSnapshot | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as WorkspaceSnapshot
    if (parsed.version !== 1) return null
    if (!parsed.project || !parsed.editorUI || !parsed.sourceFiles) return null
    return parsed
  } catch {
    return null
  }
}

export function clearWorkspaceSnapshot(): void {
  localStorage.removeItem(STORAGE_KEY)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npm test -- src/lib/workspace/storage.test.ts
```

Expected: PASS, 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/workspace/types.ts src/lib/workspace/storage.ts src/lib/workspace/storage.test.ts
git commit -m "feat: add serializable workspace snapshot storage"
```

### Task 2: Add source-file artifact construction and runtime hydration helpers

**Files:**
- Create: `src/lib/workspace/source-files.ts`
- Create: `src/lib/workspace/source-files.test.ts`
- Modify: `src/features/share/importer.ts`
- Modify: `src/features/wizard/steps/ExportStep.tsx`
- Modify: `src/features/share/ShareDialog.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/workspace/source-files.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import { createSourceFilesFromImport, createSourceFilesFromProject } from './source-files'
import { createEmptyProject } from '@/lib/config/defaults'

describe('source file helpers', () => {
  it('captures imported YAML files as persisted source files', () => {
    const files = createSourceFilesFromImport([
      { name: 'default.custom.yaml', content: 'patch:\\n  menu/page_size: 9\\n' },
      { name: 'squirrel.custom.yaml', content: 'patch:\\n  style:\\n    color_scheme: test\\n' },
    ])

    expect(Object.values(files).map((f) => f.fileName)).toEqual([
      'default.custom.yaml',
      'squirrel.custom.yaml',
    ])
  })

  it('can synthesize baseline source files from a project when no imported sources exist', () => {
    const project = createEmptyProject()
    project.defaultConfig.schemaList = [{ schema: 'rime_ice' }]
    const files = createSourceFilesFromProject(project)

    expect(Object.values(files).some((f) => f.fileName === 'default.custom.yaml')).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- src/lib/workspace/source-files.test.ts
```

Expected: FAIL because the source-file helper module does not exist.

- [ ] **Step 3: Implement artifact creation helpers**

Create `src/lib/workspace/source-files.ts` with:

```ts
import type { RimeProject } from '@/types/config'
import type { PersistedSourceFile } from './types'
import { buildCustomYaml, serializeDefaultConfig, serializePlatformConfig, serializeSchemaConfig } from '@/lib/yaml/serializer'
import { serializeCustomPhrases } from '@/lib/config/custom-phrase'

function stamp(): string {
  return new Date().toISOString()
}

function makeId(fileName: string): string {
  return fileName
}

export function createSourceFilesFromImport(
  files: { name: string; content: string }[],
): Record<string, PersistedSourceFile> {
  return Object.fromEntries(
    files.map((file) => [
      makeId(file.name),
      {
        id: makeId(file.name),
        fileName: file.name,
        kind: file.name.includes('custom_phrase')
          ? 'custom_phrase'
          : file.name.includes('default')
            ? 'default'
            : file.name.includes('squirrel') || file.name.includes('weasel')
              ? 'platform'
              : 'schema',
        content: file.content,
        platform: file.name.includes('squirrel')
          ? 'macos'
          : file.name.includes('weasel')
            ? 'windows'
            : undefined,
        schemaId: file.name.endsWith('.custom.yaml')
          && !file.name.includes('default')
          && !file.name.includes('squirrel')
          && !file.name.includes('weasel')
            ? file.name.replace('.custom.yaml', '')
            : undefined,
        updatedAt: stamp(),
      },
    ]),
  )
}

export function createSourceFilesFromProject(
  project: RimeProject,
): Record<string, PersistedSourceFile> {
  const files: PersistedSourceFile[] = []

  files.push({
    id: 'default.custom.yaml',
    fileName: 'default.custom.yaml',
    kind: 'default',
    content: buildCustomYaml(serializeDefaultConfig(project.defaultConfig), project.preserved['default.custom.yaml']),
    updatedAt: stamp(),
  })

  const platformFile = project.targetPlatform === 'windows' ? 'weasel.custom.yaml' : 'squirrel.custom.yaml'
  files.push({
    id: platformFile,
    fileName: platformFile,
    kind: 'platform',
    platform: project.targetPlatform === 'windows' ? 'windows' : 'macos',
    content: buildCustomYaml(serializePlatformConfig(project.platformConfig), project.preserved[platformFile]),
    updatedAt: stamp(),
  })

  for (const [schemaId, schemaConfig] of Object.entries(project.schemaConfigs)) {
    files.push({
      id: `${schemaId}.custom.yaml`,
      fileName: `${schemaId}.custom.yaml`,
      kind: 'schema',
      schemaId,
      content: buildCustomYaml(serializeSchemaConfig(schemaConfig), project.preserved[`${schemaId}.custom.yaml`]),
      updatedAt: stamp(),
    })
  }

  if (project.customPhrases.length > 0) {
    files.push({
      id: 'custom_phrase.txt',
      fileName: 'custom_phrase.txt',
      kind: 'custom_phrase',
      content: serializeCustomPhrases(project.customPhrases),
      updatedAt: stamp(),
    })
  }

  return Object.fromEntries(files.map((file) => [file.id, file]))
}
```

Update import and generated-entry flows so they can return or construct source-file maps instead of only plain `RimeProject`.

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npm test -- src/lib/workspace/source-files.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/workspace/source-files.ts src/lib/workspace/source-files.test.ts src/features/share/importer.ts src/features/wizard/steps/ExportStep.tsx src/features/share/ShareDialog.tsx
git commit -m "feat: add persisted source file helpers for workspace hydration"
```

### Task 3: Extend the store to hydrate, persist, and clear workspace snapshots

**Files:**
- Modify: `src/stores/config-store.ts`
- Modify: `src/stores/config-store.test.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write the failing store tests**

Append to `src/stores/config-store.test.ts`:

```ts
it('hydrates project and editor state from a workspace snapshot', () => {
  const snapshot = {
    version: 1 as const,
    savedAt: '2026-04-11T00:00:00.000Z',
    project: createEmptyProject(),
    editorUI: {
      activeModule: 'key-bindings' as const,
      viewMode: 'panel' as const,
      tutorialCollapsed: true,
    },
    sourceFiles: {},
  }

  useConfigStore.getState().hydrateWorkspace(snapshot)

  expect(useConfigStore.getState().activeModule).toBe('key-bindings')
  expect(useConfigStore.getState().editorUI.tutorialCollapsed).toBe(true)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- src/stores/config-store.test.ts
```

Expected: FAIL because `hydrateWorkspace` does not exist.

- [ ] **Step 3: Implement store-level workspace support**

Extend `src/stores/config-store.ts` with:

```ts
import type { WorkspaceSnapshot, PersistedSourceFile } from '@/lib/workspace/types'
import { loadWorkspaceSnapshot, saveWorkspaceSnapshot, clearWorkspaceSnapshot } from '@/lib/workspace/storage'
import { createSourceFilesFromProject } from '@/lib/workspace/source-files'

interface ConfigState {
  // existing fields...
  sourceFiles: Record<string, PersistedSourceFile>
  hydrateWorkspace: (snapshot: WorkspaceSnapshot) => void
  restorePersistedWorkspace: () => void
  clearWorkspace: () => void
}
```

Add helper actions:

```ts
hydrateWorkspace: (snapshot) =>
  set({
    project: snapshot.project,
    activeModule: snapshot.editorUI.activeModule,
    editorUI: {
      viewMode: snapshot.editorUI.viewMode,
      tutorialCollapsed: snapshot.editorUI.tutorialCollapsed,
      activeSection: undefined,
    },
    sourceFiles: snapshot.sourceFiles,
    isDirty: false,
  }),

restorePersistedWorkspace: () => {
  const snapshot = loadWorkspaceSnapshot()
  if (!snapshot) return
  useConfigStore.getState().hydrateWorkspace(snapshot)
},

clearWorkspace: () =>
  set(() => {
    clearWorkspaceSnapshot()
    return {
      project: createEmptyProject(),
      activeModule: 'schema-manager',
      editorUI: { viewMode: 'panel', tutorialCollapsed: false, activeSection: undefined },
      sourceFiles: {},
      isDirty: false,
    }
  }),
```

After every state-changing action that changes the project or editor contract, rebuild and save a snapshot:

```ts
function persistCurrentState(project: RimeProject, activeModule: EditorModule, editorUI: EditorUIState, sourceFiles: Record<string, PersistedSourceFile>) {
  saveWorkspaceSnapshot({
    version: 1,
    savedAt: new Date().toISOString(),
    project,
    editorUI: {
      activeModule,
      viewMode: editorUI.viewMode,
      tutorialCollapsed: editorUI.tutorialCollapsed,
    },
    sourceFiles,
  })
}
```

Call `restorePersistedWorkspace()` once in `src/App.tsx` from a startup `useEffect`.

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npm test -- src/stores/config-store.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/config-store.ts src/stores/config-store.test.ts src/App.tsx
git commit -m "feat: persist and restore workspace snapshots in the config store"
```

### Task 4: Route imports, generated projects, and share/gist loads through the workspace snapshot model

**Files:**
- Modify: `src/features/share/ImportDialog.tsx`
- Modify: `src/features/share/GistDialog.tsx`
- Modify: `src/features/share/ShareDialog.tsx`
- Modify: `src/features/share/useShareUrl.ts`
- Modify: `src/app/editor/EditorPage.tsx`
- Modify: `src/features/wizard/steps/ExportStep.tsx`

- [ ] **Step 1: Add a shared store action for replacing the whole workspace**

Add to `src/stores/config-store.ts`:

```ts
replaceWorkspace: (project, sourceFiles) =>
  set((s) => {
    const next = {
      project,
      sourceFiles,
      isDirty: false,
    }
    persistCurrentState(project, s.activeModule, s.editorUI, sourceFiles)
    return next
  }),
```

- [ ] **Step 2: Update all full-project entry points to use the new action**

Replace direct `loadProject(...)` calls in:
- `src/features/share/ImportDialog.tsx`
- `src/features/share/GistDialog.tsx`
- `src/features/share/useShareUrl.ts`
- `src/app/editor/EditorPage.tsx`
- `src/features/wizard/steps/ExportStep.tsx`
- `src/features/share/ShareDialog.tsx`

with:

```ts
// ImportDialog
replaceWorkspace(result.project, createSourceFilesFromImport(files))

// GistDialog / ShareDialog JSON import / useShareUrl
replaceWorkspace(project, createSourceFilesFromProject(project))

// EditorPage preset load / ExportStep "continue editing"
replaceWorkspace(project, createSourceFilesFromProject(project))
```

Use imported file contents when available; otherwise synthesize source files from the generated project.

- [ ] **Step 3: Add a smoke test for workspace replacement**

Create or extend a test with:

```ts
it('replaces the full workspace when importing a new project', () => {
  const project = createEmptyProject()
  project.defaultConfig.pageSize = 9

  useConfigStore.getState().replaceWorkspace(project, {})

  expect(useConfigStore.getState().project.defaultConfig.pageSize).toBe(9)
  expect(useConfigStore.getState().isDirty).toBe(false)
})
```

- [ ] **Step 4: Run the verification stack**

Run:

```bash
npm test -- src/stores/config-store.test.ts
npx tsc -b
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/stores/config-store.ts src/stores/config-store.test.ts src/features/share/ImportDialog.tsx src/features/share/GistDialog.tsx src/features/share/ShareDialog.tsx src/features/share/useShareUrl.ts src/app/editor/EditorPage.tsx src/features/wizard/steps/ExportStep.tsx
git commit -m "feat: route project entry points through workspace replacement"
```

### Task 5: Upgrade YAML editing to patch source artifacts and preserve formatting/comments in the core file set

**Files:**
- Modify: `src/lib/yaml/module-yaml.ts`
- Modify: `src/features/editor/ModuleWrapper.tsx`
- Modify: `src/features/share/ExportButton.tsx`
- Create: `src/lib/yaml/roundtrip-artifacts.test.ts`

- [ ] **Step 1: Write the failing round-trip artifact test**

Create `src/lib/yaml/roundtrip-artifacts.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import { Document, parseDocument } from 'yaml'

describe('artifact-backed module edits', () => {
  it('preserves comments around edited menu config', () => {
    const raw = [
      'patch:',
      '  # page size for candidates',
      '  menu/page_size: 5',
      '',
      '  # keep this comment',
      '  ascii_composer/good_old_caps_lock: true',
      '',
    ].join('\n')

    const doc = parseDocument(raw)
    doc.setIn(['patch', 'menu/page_size'], 9)

    const out = doc.toString()

    expect(out).toContain('# page size for candidates')
    expect(out).toContain('# keep this comment')
    expect(out).toContain('menu/page_size: 9')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails or proves the missing path**

Run:

```bash
npm test -- src/lib/yaml/roundtrip-artifacts.test.ts
```

Expected: initial failure or an obviously incomplete result showing that the current edit path is not yet artifact-backed.

- [ ] **Step 3: Implement artifact-backed YAML extraction and application for the core file set**

Refactor `src/lib/yaml/module-yaml.ts`:

```ts
import { parseDocument } from 'yaml'
import type { PersistedSourceFile } from '@/lib/workspace/types'

export function extractModuleYamlFromSourceFile(module: EditorModule, sourceFile: PersistedSourceFile): string {
  // prefer slicing from artifact-backed raw content instead of regenerating from project
}

export function applyModuleYamlToSourceFile(module: EditorModule, yamlString: string, sourceFile: PersistedSourceFile): { sourceFile: PersistedSourceFile; error?: string } {
  const doc = parseDocument(sourceFile.content)
  // update only the module-owned patch paths, preserve the rest of the document
}
```

Update `src/features/editor/ModuleWrapper.tsx` to:

```ts
const sourceFiles = useConfigStore((s) => s.sourceFiles)
const replaceWorkspace = useConfigStore((s) => s.replaceWorkspace)

// on yaml open: read from the relevant source file artifact first
// on yaml apply: patch the artifact, then project, then persist the snapshot
```

Update `src/features/share/ExportButton.tsx` so export prefers `sourceFiles[fileName].content` when present.

- [ ] **Step 4: Run the verification stack**

Run:

```bash
npm test -- src/lib/yaml/roundtrip-artifacts.test.ts src/lib/yaml/parser.test.ts src/lib/yaml/serializer.test.ts
npx tsc -b
npm run build
```

Expected: all commands pass, and the new round-trip test demonstrates comment retention for the core edit path.

- [ ] **Step 5: Run a manual restoration audit**

Manually verify:
- import a real `default.custom.yaml` with comments
- change a value in form mode
- switch to YAML mode and confirm comments still exist
- refresh the page and confirm the workspace restores
- export and confirm the edited file still contains the original comments where untouched

- [ ] **Step 6: Commit**

```bash
git add src/lib/yaml/module-yaml.ts src/features/editor/ModuleWrapper.tsx src/features/share/ExportButton.tsx src/lib/yaml/roundtrip-artifacts.test.ts
git commit -m "feat: preserve core YAML artifacts through editor round-trip"
```

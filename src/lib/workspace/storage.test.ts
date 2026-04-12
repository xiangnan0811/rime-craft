import type { EditorModule, EditorUIState, RimeProject } from '@/types/config';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { WorkspaceSnapshot } from './types';
import {
  clearWorkspaceSnapshot,
  loadWorkspaceSnapshot,
  saveWorkspaceSnapshot,
} from './storage';

const STORAGE_KEY = 'rime-craft.workspace.v1';

const createSnapshot = (): WorkspaceSnapshot => ({
  version: 1,
  savedAt: '2026-04-12T00:00:00.000Z',
  project: {
    targetPlatform: 'macos',
    defaultConfig: {} as RimeProject['defaultConfig'],
    platformConfig: {} as RimeProject['platformConfig'],
    schemaConfigs: {},
    customPhrases: [],
    preserved: {},
  } as RimeProject,
  editorUI: {
    activeModule: 'schema-manager' as EditorModule,
    viewMode: 'panel' as EditorUIState['viewMode'],
    tutorialCollapsed: false,
  },
  sourceFiles: {},
});

describe('workspace storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    clearWorkspaceSnapshot();
  });

  it('round-trips a workspace snapshot through localStorage', () => {
    const snapshot = createSnapshot();

    saveWorkspaceSnapshot(snapshot);

    expect(loadWorkspaceSnapshot()).toEqual(snapshot);
  });

  it('returns null for invalid payloads', () => {
    const snapshot = createSnapshot();

    window.localStorage.setItem(STORAGE_KEY, '{not-json');
    expect(loadWorkspaceSnapshot()).toBeNull();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...snapshot,
        version: 2,
      }),
    );
    expect(loadWorkspaceSnapshot()).toBeNull();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        savedAt: '2026-04-12T00:00:00.000Z',
        editorUI: snapshot.editorUI,
        sourceFiles: {},
      }),
    );
    expect(loadWorkspaceSnapshot()).toBeNull();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        savedAt: '2026-04-12T00:00:00.000Z',
        project: snapshot.project,
        sourceFiles: {},
      }),
    );
    expect(loadWorkspaceSnapshot()).toBeNull();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        savedAt: '2026-04-12T00:00:00.000Z',
        project: snapshot.project,
        editorUI: snapshot.editorUI,
      }),
    );
    expect(loadWorkspaceSnapshot()).toBeNull();
  });

  it('removes stored data when cleared', () => {
    saveWorkspaceSnapshot(createSnapshot());

    clearWorkspaceSnapshot();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(loadWorkspaceSnapshot()).toBeNull();
  });
});

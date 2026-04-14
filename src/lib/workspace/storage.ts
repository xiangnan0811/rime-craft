import type { EditorModule } from '@/types/config';
import type { WorkspaceSnapshot } from './types';
import { isRecord, isValidSourceFile, isValidProject } from './validators';

const STORAGE_KEY = 'rime-craft.workspace.v1';

const VALID_MODULES: Set<string> = new Set<EditorModule>([
  'schema-manager', 'candidate-settings', 'key-bindings', 'switches',
  'fuzzy-pinyin', 'spelling-scheme', 'auxiliary-code', 'reverse-lookup',
  'punctuation', 'dictionary', 'lua-extensions', 'ascii-mode',
  'candidate-display', 'comment-hints',
]);

const isValidEditorUI = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.activeModule === 'string' &&
    VALID_MODULES.has(value.activeModule) &&
    typeof value.viewMode === 'string' &&
    typeof value.tutorialCollapsed === 'boolean'
  );
};

const isWorkspaceSnapshot = (value: unknown): value is WorkspaceSnapshot => {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.version !== 1 ||
    typeof value.savedAt !== 'string' ||
    !isValidProject(value.project) ||
    !isValidEditorUI(value.editorUI) ||
    !isRecord(value.sourceFiles)
  ) {
    return false;
  }

  return Object.values(value.sourceFiles).every(isValidSourceFile);
};

const getStorage = (): Storage | null => {
  try {
    return typeof globalThis.localStorage === 'undefined'
      ? null
      : globalThis.localStorage;
  } catch {
    return null;
  }
};

export const saveWorkspaceSnapshot = (snapshot: WorkspaceSnapshot): void => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
};

export const loadWorkspaceSnapshot = (): WorkspaceSnapshot | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const rawSnapshot = storage.getItem(STORAGE_KEY);
  if (!rawSnapshot) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSnapshot);
    return isWorkspaceSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const clearWorkspaceSnapshot = (): void => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(STORAGE_KEY);
};

import type { WorkspaceSnapshot } from './types';

const STORAGE_KEY = 'rime-craft.workspace.v1';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasRequiredKey = (
  value: Record<string, unknown>,
  key: string,
): boolean => Object.prototype.hasOwnProperty.call(value, key);

const isValidProject = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.targetPlatform === 'string' &&
    hasRequiredKey(value, 'defaultConfig') &&
    hasRequiredKey(value, 'platformConfig') &&
    value.defaultConfig !== null &&
    value.defaultConfig !== undefined &&
    value.platformConfig !== null &&
    value.platformConfig !== undefined &&
    isRecord(value.schemaConfigs) &&
    Array.isArray(value.customPhrases) &&
    isRecord(value.preserved)
  );
};

const isValidEditorUI = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.activeModule === 'string' &&
    typeof value.viewMode === 'string' &&
    typeof value.tutorialCollapsed === 'boolean'
  );
};

const isValidSourceFile = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.fileName === 'string' &&
    typeof value.kind === 'string' &&
    typeof value.content === 'string' &&
    typeof value.updatedAt === 'string' &&
    (value.platform === undefined || typeof value.platform === 'string') &&
    (value.schemaId === undefined || typeof value.schemaId === 'string')
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

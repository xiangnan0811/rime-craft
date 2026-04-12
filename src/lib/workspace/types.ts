import type { EditorModule, EditorUIState, RimeProject } from '@/types/config';

export interface PersistedSourceFile {
  id: string;
  fileName: string;
  kind: string;
  content: string;
  platform?: RimeProject['targetPlatform'];
  schemaId?: string;
  updatedAt: string;
}

export interface WorkspaceSnapshot {
  version: 1;
  savedAt: string;
  project: RimeProject;
  editorUI: Pick<EditorUIState, 'viewMode' | 'tutorialCollapsed'> & {
    activeModule: EditorModule;
  };
  sourceFiles: Record<string, PersistedSourceFile>;
}

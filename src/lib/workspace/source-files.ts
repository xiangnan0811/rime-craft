import { serializeCustomPhrases } from '@/lib/config/custom-phrase';
import {
  getFormalPlatformFileName,
  isFormalEditorPlatform,
} from '@/lib/product/support-contract';
import type { RimeProject } from '@/types/config';
import {
  KNOWN_DEFAULT_KEYS,
  KNOWN_PLATFORM_KEYS,
  KNOWN_SCHEMA_KEYS,
} from '@/lib/yaml/parser';
import {
  buildCustomYaml,
  serializeDefaultConfig,
  serializePlatformConfig,
  serializeSchemaConfig,
} from '@/lib/yaml/serializer';
import { parseDocument } from 'yaml';

import type { PersistedSourceFile } from './types';

type SourceFileMap = Record<string, PersistedSourceFile>;
type ImportedFile = { name: string; content: string };

interface SourceFileMetadata {
  fileName: string;
  kind: PersistedSourceFile['kind'];
  platform?: PersistedSourceFile['platform'];
  schemaId?: string;
}

interface YamlSyncSpec {
  metadata: SourceFileMetadata;
  previousPatch: Record<string, unknown>;
  nextPatch: Record<string, unknown>;
  preserved?: Record<string, unknown>;
  knownBaseKeys: string[];
}

const isYamlFile = (fileName: string): boolean => /\.ya?ml$/i.test(fileName);

const createPersistedSourceFile = (
  metadata: SourceFileMetadata,
  content: string,
  updatedAt: string,
): PersistedSourceFile => ({
  id: metadata.fileName,
  fileName: metadata.fileName,
  kind: metadata.kind,
  content,
  updatedAt,
  ...(metadata.platform ? { platform: metadata.platform } : {}),
  ...(metadata.schemaId ? { schemaId: metadata.schemaId } : {}),
});

const getSourceFileMetadata = (fileName: string): SourceFileMetadata | null => {
  const normalizedFileName = fileName.toLowerCase();

  if (normalizedFileName.includes('custom_phrase') && !isYamlFile(fileName)) {
    return {
      fileName,
      kind: 'custom_phrase',
    };
  }

  if (!isYamlFile(fileName)) {
    return null;
  }

  if (normalizedFileName.includes('default')) {
    return {
      fileName,
      kind: 'default',
    };
  }

  if (normalizedFileName.includes('squirrel')) {
    return {
      fileName,
      kind: 'platform',
      platform: 'macos',
    };
  }

  if (normalizedFileName.includes('weasel')) {
    return {
      fileName,
      kind: 'platform',
      platform: 'windows',
    };
  }

  return {
    fileName,
    kind: 'schema',
    schemaId: fileName
      .replace(/\.custom\.ya?ml$/i, '')
      .replace(/\.ya?ml$/i, ''),
  };
};

const hasEntries = (value?: Record<string, unknown>): boolean =>
  Boolean(value && Object.keys(value).length > 0);

const hasPatchEntries = (value: Record<string, unknown>): boolean =>
  Object.keys(value).length > 0;

const flattenPatchEntries = (
  value: Record<string, unknown>,
  path: string[] = [],
): Array<{ path: string[]; value: unknown }> => {
  const entries: Array<{ path: string[]; value: unknown }> = [];

  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...path, key];

    if (
      child &&
      typeof child === 'object' &&
      !Array.isArray(child) &&
      Object.keys(child as Record<string, unknown>).length > 0
    ) {
      entries.push(
        ...flattenPatchEntries(child as Record<string, unknown>, nextPath),
      );
      continue;
    }

    entries.push({ path: nextPath, value: child });
  }

  return entries;
};

const normalizePathSegment = (segment: string): string =>
  segment.replace(/^['"]|['"]$/g, '');

const normalizePatchPath = (path: string[]): string[] =>
  path.flatMap((segment) => normalizePathSegment(segment).split('/'));

const normalizedPathKey = (path: string[]): string =>
  normalizePatchPath(path).join('\u0000');

const getBasePathKey = (path: string[]): string =>
  normalizePatchPath(path)[0] ?? '';

const isYamlMapNodeEmpty = (node: unknown): node is { items: unknown[] } =>
  typeof node === 'object' &&
  node !== null &&
  'items' in node &&
  Array.isArray((node as { items: unknown[] }).items) &&
  (node as { items: unknown[] }).items.length === 0;

const pruneEmptyParents = (
  doc: ReturnType<typeof parseDocument>,
  path: string[],
): void => {
  for (let depth = path.length - 1; depth > 0; depth -= 1) {
    const currentPath = ['patch', ...path.slice(0, depth)];
    const node = doc.getIn(currentPath, true);
    if (!isYamlMapNodeEmpty(node)) {
      break;
    }
    doc.deleteIn(currentPath);
  }
};

const addYamlSourceFile = (
  sourceFiles: SourceFileMap,
  metadata: SourceFileMetadata,
  patch: Record<string, unknown>,
  preserved: Record<string, unknown> | undefined,
  updatedAt: string,
): void => {
  if (Object.keys(patch).length === 0 && !hasEntries(preserved)) {
    return;
  }

  sourceFiles[metadata.fileName] = createPersistedSourceFile(
    metadata,
    buildCustomYaml(patch, preserved),
    updatedAt,
  );
};

const patchYamlSourceFile = (
  sourceFile: PersistedSourceFile,
  spec: YamlSyncSpec,
  updatedAt: string,
): PersistedSourceFile | undefined => {
  const doc = parseDocument(sourceFile.content);
  if (doc.errors.length > 0) {
    if (!hasPatchEntries(spec.nextPatch) && !hasEntries(spec.preserved)) {
      return sourceFile;
    }

    return createPersistedSourceFile(
      spec.metadata,
      buildCustomYaml(spec.nextPatch, spec.preserved),
      updatedAt,
    );
  }

  if (doc.get('patch') === undefined) {
    doc.set('patch', {});
  }

  const currentPatch = (() => {
    const patch = doc.get('patch');
    if (!patch || typeof patch !== 'object') {
      return {};
    }

    if (typeof (patch as { toJSON?: () => unknown }).toJSON === 'function') {
      const json = (patch as { toJSON: () => unknown }).toJSON();
      return json && typeof json === 'object' && !Array.isArray(json)
        ? (json as Record<string, unknown>)
        : {};
    }

    return patch as Record<string, unknown>;
  })();

  const previousEntries = flattenPatchEntries(spec.previousPatch).filter((entry) =>
    spec.knownBaseKeys.includes(getBasePathKey(entry.path)),
  );
  const nextEntries = flattenPatchEntries(spec.nextPatch).filter((entry) =>
    spec.knownBaseKeys.includes(getBasePathKey(entry.path)),
  );
  const currentEntries = flattenPatchEntries(currentPatch).filter((entry) =>
    spec.knownBaseKeys.includes(getBasePathKey(entry.path)),
  );

  const currentEntriesByNormalizedPath = new Map(
    currentEntries.map((entry) => [normalizedPathKey(entry.path), entry.path]),
  );
  const previousPathKeys = new Set(
    previousEntries.map((entry) => normalizedPathKey(entry.path)),
  );
  const nextPathKeys = new Set(
    nextEntries.map((entry) => normalizedPathKey(entry.path)),
  );

  for (const entry of currentEntries) {
    const entryKey = normalizedPathKey(entry.path);
    if (!previousPathKeys.has(entryKey) || nextPathKeys.has(entryKey)) {
      continue;
    }

    doc.deleteIn(['patch', ...entry.path]);
    pruneEmptyParents(doc, entry.path);
  }

  for (const entry of nextEntries) {
    const normalizedPath = normalizedPathKey(entry.path);
    const targetPath =
      currentEntriesByNormalizedPath.get(normalizedPath) ?? entry.path;
    doc.setIn(['patch', ...targetPath], entry.value);
  }

  const content = doc.toString({ lineWidth: 0 });
  if (content === sourceFile.content) {
    return sourceFile;
  }

  return {
    ...sourceFile,
    content,
    updatedAt,
  };
};

const addOrPatchYamlSourceFile = (
  sourceFiles: SourceFileMap,
  currentSourceFiles: SourceFileMap,
  spec: YamlSyncSpec,
  updatedAt: string,
): void => {
  const currentSourceFile = currentSourceFiles[spec.metadata.fileName];
  if (currentSourceFile) {
    const patched = patchYamlSourceFile(currentSourceFile, spec, updatedAt);
    if (patched) {
      sourceFiles[spec.metadata.fileName] = patched;
    }
    return;
  }

  addYamlSourceFile(
    sourceFiles,
    spec.metadata,
    spec.nextPatch,
    spec.preserved,
    updatedAt,
  );
};

const createSchemaFileSpec = (
  fileName: string,
  project: RimeProject,
): { metadata: SourceFileMetadata; patch: Record<string, unknown> } => {
  const metadata = getSourceFileMetadata(fileName);
  if (!metadata || metadata.kind !== 'schema') {
    throw new Error(`Invalid schema source file: ${fileName}`);
  }

  return {
    metadata,
    patch: metadata.schemaId
      ? serializeSchemaConfig(
          project.schemaConfigs[metadata.schemaId] ?? {
            schemaId: metadata.schemaId,
            fuzzyRules: [],
          },
        )
      : {},
  };
};

const collectSchemaFileNames = (
  project: RimeProject,
  currentSourceFiles: SourceFileMap,
): Set<string> => {
  const fileNames = new Set<string>();

  for (const schemaId of Object.keys(project.schemaConfigs)) {
    fileNames.add(`${schemaId}.custom.yaml`);
  }

  for (const fileName of Object.keys(project.preserved)) {
    const metadata = getSourceFileMetadata(fileName);
    if (metadata?.kind === 'schema') {
      fileNames.add(fileName);
    }
  }

  for (const sourceFile of Object.values(currentSourceFiles)) {
    if (sourceFile.kind === 'schema') {
      fileNames.add(sourceFile.fileName);
    }
  }

  return fileNames;
};

export function createSourceFilesFromImport(files: ImportedFile[]): SourceFileMap {
  const updatedAt = new Date().toISOString();
  const sourceFiles: SourceFileMap = {};

  for (const file of files) {
    const metadata = getSourceFileMetadata(file.name);
    if (!metadata) {
      continue;
    }

    sourceFiles[file.name] = createPersistedSourceFile(
      metadata,
      file.content,
      updatedAt,
    );
  }

  return sourceFiles;
}

export function createSourceFilesFromProject(project: RimeProject): SourceFileMap {
  const updatedAt = new Date().toISOString();
  const sourceFiles: SourceFileMap = {};

  addYamlSourceFile(
    sourceFiles,
    {
      fileName: 'default.custom.yaml',
      kind: 'default',
    },
    serializeDefaultConfig(project.defaultConfig),
    project.preserved['default.custom.yaml'],
    updatedAt,
  );

  if (isFormalEditorPlatform(project.targetPlatform)) {
    const platformFileName = getFormalPlatformFileName(project.targetPlatform);
    addYamlSourceFile(
      sourceFiles,
      {
        fileName: platformFileName,
        kind: 'platform',
        platform: project.targetPlatform,
      },
      serializePlatformConfig(project.platformConfig),
      project.preserved[platformFileName],
      updatedAt,
    );
  }

  for (const [schemaId, schemaConfig] of Object.entries(project.schemaConfigs)) {
    const fileName = `${schemaId}.custom.yaml`;
    addYamlSourceFile(
      sourceFiles,
      {
        fileName,
        kind: 'schema',
        schemaId,
      },
      serializeSchemaConfig(schemaConfig),
      project.preserved[fileName],
      updatedAt,
    );
  }

  for (const [fileName, preserved] of Object.entries(project.preserved)) {
    if (fileName in sourceFiles) {
      continue;
    }

    const metadata = getSourceFileMetadata(fileName);
    if (!metadata || metadata.kind === 'custom_phrase') {
      continue;
    }

    addYamlSourceFile(sourceFiles, metadata, {}, preserved, updatedAt);
  }

  if (project.customPhrases.length > 0) {
    sourceFiles['custom_phrase.txt'] = createPersistedSourceFile(
      {
        fileName: 'custom_phrase.txt',
        kind: 'custom_phrase',
      },
      serializeCustomPhrases(project.customPhrases),
      updatedAt,
    );
  }

  return sourceFiles;
}

export function syncSourceFilesWithProject(
  previousProject: RimeProject,
  nextProject: RimeProject,
  currentSourceFiles: SourceFileMap,
): SourceFileMap {
  const updatedAt = new Date().toISOString();
  const sourceFiles: SourceFileMap = {};

  addOrPatchYamlSourceFile(
    sourceFiles,
    currentSourceFiles,
    {
      metadata: {
        fileName: 'default.custom.yaml',
        kind: 'default',
      },
      previousPatch: serializeDefaultConfig(previousProject.defaultConfig),
      nextPatch: serializeDefaultConfig(nextProject.defaultConfig),
      preserved: nextProject.preserved['default.custom.yaml'],
      knownBaseKeys: KNOWN_DEFAULT_KEYS,
    },
    updatedAt,
  );

  if (isFormalEditorPlatform(nextProject.targetPlatform)) {
    const platformFileName = getFormalPlatformFileName(nextProject.targetPlatform);
    addOrPatchYamlSourceFile(
      sourceFiles,
      currentSourceFiles,
      {
        metadata: {
          fileName: platformFileName,
          kind: 'platform',
          platform: nextProject.targetPlatform,
        },
        previousPatch:
          previousProject.targetPlatform === nextProject.targetPlatform &&
          isFormalEditorPlatform(previousProject.targetPlatform)
            ? serializePlatformConfig(previousProject.platformConfig)
            : {},
        nextPatch: serializePlatformConfig(nextProject.platformConfig),
        preserved: nextProject.preserved[platformFileName],
        knownBaseKeys: KNOWN_PLATFORM_KEYS,
      },
      updatedAt,
    );
  }

  const schemaFileNames = new Set<string>([
    ...collectSchemaFileNames(previousProject, currentSourceFiles),
    ...collectSchemaFileNames(nextProject, currentSourceFiles),
  ]);

  for (const fileName of schemaFileNames) {
    const previousSpec = createSchemaFileSpec(fileName, previousProject);
    const nextSpec = createSchemaFileSpec(fileName, nextProject);

    addOrPatchYamlSourceFile(
      sourceFiles,
      currentSourceFiles,
      {
        metadata: nextSpec.metadata,
        previousPatch: previousSpec.patch,
        nextPatch: nextSpec.patch,
        preserved: nextProject.preserved[fileName],
        knownBaseKeys: KNOWN_SCHEMA_KEYS,
      },
      updatedAt,
    );
  }

  if (nextProject.customPhrases.length > 0) {
    const currentSourceFile = currentSourceFiles['custom_phrase.txt'];
    const content = serializeCustomPhrases(nextProject.customPhrases);
    sourceFiles['custom_phrase.txt'] = currentSourceFile
      ? {
          ...currentSourceFile,
          content,
          updatedAt,
        }
      : createPersistedSourceFile(
          {
            fileName: 'custom_phrase.txt',
            kind: 'custom_phrase',
          },
          content,
          updatedAt,
        );
  }

  return sourceFiles;
}

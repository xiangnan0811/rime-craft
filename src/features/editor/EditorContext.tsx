import { createContext, useContext } from 'react'

interface EditorContextValue {
  isImmersive: boolean;
}

export const EditorContext = createContext<EditorContextValue>({
  isImmersive: false,
})

export function useEditorContext() {
  return useContext(EditorContext)
}

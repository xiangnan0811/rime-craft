import { EditorSidebar } from '@/features/editor/EditorSidebar'
import { EditorContent } from '@/features/editor/EditorContent'

export function EditorPage() {
  return (
    <div className="flex h-[calc(100vh-57px)]">
      <EditorSidebar />
      <EditorContent />
    </div>
  )
}

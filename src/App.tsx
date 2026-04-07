import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { HomePage } from '@/app/home/HomePage'
import { EditorPage } from '@/app/editor/EditorPage'
import { useShareUrl } from '@/features/share/useShareUrl'

const ThemePage = lazy(() =>
  import('@/app/theme/ThemePage').then((m) => ({ default: m.ThemePage }))
)
const ComparePage = lazy(() =>
  import('@/app/compare/ComparePage').then((m) => ({ default: m.ComparePage }))
)
const DocsLayout = lazy(() =>
  import('@/app/docs/DocsLayout').then((m) => ({ default: m.DocsLayout }))
)
const DocsPage = lazy(() =>
  import('@/app/docs/DocsPage').then((m) => ({ default: m.DocsPage }))
)
const GalleryPage = lazy(() =>
  import('@/app/gallery/GalleryPage').then((m) => ({ default: m.GalleryPage }))
)

export function App() {
  useShareUrl()

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="editor" element={<EditorPage />} />
          <Route
            path="theme"
            element={
              <Suspense fallback={<div className="p-8 text-gray-400">加载中...</div>}>
                <ThemePage />
              </Suspense>
            }
          />
          <Route
            path="compare"
            element={
              <Suspense fallback={<div className="p-8 text-gray-400">加载中...</div>}>
                <ComparePage />
              </Suspense>
            }
          />
          <Route
            path="gallery"
            element={
              <Suspense fallback={<div className="p-8 text-gray-400">加载中...</div>}>
                <GalleryPage />
              </Suspense>
            }
          />
          <Route
            path="docs"
            element={
              <Suspense fallback={<div className="p-8 text-gray-400">加载中...</div>}>
                <DocsLayout />
              </Suspense>
            }
          >
            <Route index element={<Suspense fallback={null}><DocsPage /></Suspense>} />
            <Route path=":slug" element={<Suspense fallback={null}><DocsPage /></Suspense>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

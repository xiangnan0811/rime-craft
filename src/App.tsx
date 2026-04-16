import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { HomePage } from '@/app/home/HomePage'
import { EditorPage } from '@/app/editor/EditorPage'
import { RouteLoading } from '@/components/shared/RouteLoading'
import { useShareUrl } from '@/features/share/useShareUrl'
import { useConfigStore } from '@/stores/config-store'

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
const WizardPage = lazy(() =>
  import('@/features/wizard/WizardPage').then((m) => ({ default: m.WizardPage }))
)
const SchemaDetailPage = lazy(() =>
  import('@/features/schema-detail/SchemaDetailPage').then((m) => ({
    default: m.SchemaDetailPage,
  }))
)

export function App() {
  const restorePersistedWorkspace = useConfigStore((s) => s.restorePersistedWorkspace)

  useEffect(() => {
    restorePersistedWorkspace()
  }, [restorePersistedWorkspace])
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
              <Suspense fallback={<RouteLoading />}>
                <ThemePage />
              </Suspense>
            }
          />
          <Route
            path="compare"
            element={
              <Suspense fallback={<RouteLoading />}>
                <ComparePage />
              </Suspense>
            }
          />
          <Route
            path="wizard"
            element={
              <Suspense fallback={<RouteLoading />}>
                <WizardPage />
              </Suspense>
            }
          />
          <Route
            path="gallery"
            element={
              <Suspense fallback={<RouteLoading />}>
                <GalleryPage />
              </Suspense>
            }
          />
          <Route
            path="schema/:id"
            element={
              <Suspense fallback={<RouteLoading />}>
                <SchemaDetailPage />
              </Suspense>
            }
          />
          <Route
            path="docs"
            element={
              <Suspense fallback={<RouteLoading />}>
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

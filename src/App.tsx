import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { HomePage } from '@/app/home/HomePage'
import { EditorPage } from '@/app/editor/EditorPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="editor" element={<EditorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

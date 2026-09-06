import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ToastProvider } from './components/ui/Toast'
import { RequireAdmin } from './components/RequireAdmin'
import { AdminLayout } from './components/AdminLayout'
import Register from './pages/Register'
import Success from './pages/Success'
import Privacy from './pages/Privacy'
import NotFound from './pages/NotFound'
import { PageLoader } from './components/ui/Spinner'

// O painel administrativo é carregado sob demanda, para o formulário
// público ficar leve no celular.
const Login = lazy(() => import('./pages/admin/Login'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const People = lazy(() => import('./pages/admin/People'))
const Person = lazy(() => import('./pages/admin/Person'))
const Ranking = lazy(() => import('./pages/admin/Ranking'))
const Network = lazy(() => import('./pages/admin/Network'))

// O GitHub Pages publica em /<repositorio>/, então o router precisa
// conhecer esse prefixo.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter basename={basename || '/'}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Área pública */}
              <Route path="/" element={<Register />} />
              <Route path="/meu-link" element={<Success />} />
              <Route path="/privacidade" element={<Privacy />} />

              {/* Área administrativa */}
              <Route path="/admin/login" element={<Login />} />
              <Route
                element={
                  <RequireAdmin>
                    <AdminLayout />
                  </RequireAdmin>
                }
              >
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/cadastros" element={<People />} />
                <Route path="/admin/pessoa/:id" element={<Person />} />
                <Route path="/admin/ranking" element={<Ranking />} />
                <Route path="/admin/rede" element={<Network />} />
              </Route>

              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}

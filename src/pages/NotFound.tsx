import { Link } from 'react-router-dom'
import { PublicLayout } from '../components/PublicLayout'

export default function NotFound() {
  return (
    <PublicLayout>
      <div className="card p-8 text-center">
        <p className="text-5xl font-bold text-brand-600">404</p>
        <h1 className="mt-3 text-xl font-semibold">Página não encontrada</h1>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
          O endereço acessado não existe ou foi movido.
        </p>
        <Link to="/" className="btn-primary btn-md mt-6 inline-flex">
          Ir para o cadastro
        </Link>
      </div>
    </PublicLayout>
  )
}

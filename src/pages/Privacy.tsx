import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PublicLayout } from '../components/PublicLayout'
import { site } from '../config/site'

export default function Privacy() {
  return (
    <PublicLayout>
      <div className="card p-6 sm:p-8">
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Voltar ao cadastro
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">Política de Privacidade</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Tratamento de dados pessoais conforme a Lei n. 13.709/2018 (LGPD).
        </p>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-ink-700 dark:text-ink-300">
          <section>
            <h2 className="mb-1.5 font-semibold text-ink-900 dark:text-ink-100">
              1. Quais dados coletamos
            </h2>
            <p>
              Coletamos apenas <strong>nome completo</strong>, <strong>data de nascimento</strong> e{' '}
              <strong>telefone/WhatsApp</strong>, informados voluntariamente por você no formulário
              de cadastro. Registramos também a data do cadastro e, quando aplicável, o código de
              indicação de quem lhe convidou.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-semibold text-ink-900 dark:text-ink-100">
              2. Para que usamos
            </h2>
            <p>
              Os dados são usados exclusivamente para manter o cadastro e permitir contato. O código
              de indicação serve apenas para identificar quem convidou cada participante.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-semibold text-ink-900 dark:text-ink-100">
              3. Quem tem acesso
            </h2>
            <p>
              A lista de cadastrados <strong>não é pública</strong>. O acesso é restrito a
              administradores autenticados. Não vendemos, alugamos nem compartilhamos seus dados com
              terceiros para fins comerciais.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-semibold text-ink-900 dark:text-ink-100">4. Segurança</h2>
            <p>
              Os dados ficam em banco de dados com criptografia em trânsito (HTTPS) e regras de
              acesso por linha (Row Level Security), que bloqueiam qualquer leitura por visitantes
              não autenticados.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-semibold text-ink-900 dark:text-ink-100">
              5. Seus direitos
            </h2>
            <p>
              Você pode solicitar a qualquer momento a confirmação, a correção, a portabilidade ou a{' '}
              <strong>exclusão</strong> dos seus dados, bem como revogar o consentimento. Basta
              entrar em contato pelo e-mail abaixo.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-semibold text-ink-900 dark:text-ink-100">
              6. Responsável pelo tratamento
            </h2>
            <p>
              {site.controller}
              <br />
              Contato:{' '}
              <a
                href={`mailto:${site.privacyEmail}`}
                className="font-medium text-brand-600 underline underline-offset-4"
              >
                {site.privacyEmail}
              </a>
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  )
}

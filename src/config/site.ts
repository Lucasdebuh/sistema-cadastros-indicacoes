/**
 * ============================================================
 *  PERSONALIZAÇÃO DO SITE
 *  Altere este arquivo para mudar nome, textos, logo e cores.
 *  (as cores ficam em src/index.css)
 * ============================================================
 */
export const site = {
  /** Nome curto que aparece no cabeçalho e no título da aba */
  name: 'Cadastro',

  /** Frase de apoio na página pública */
  tagline: 'Preencha seus dados e receba seu link de indicação exclusivo.',

  /** Título grande do formulário */
  formTitle: 'Faça seu cadastro',

  /** Nome do responsável pelos dados (aparece na Política de Privacidade) */
  controller: 'Responsável pelo cadastro',

  /** E-mail de contato para assuntos de privacidade (LGPD) */
  privacyEmail: 'contato@exemplo.com',

  /** Iniciais mostradas no logo quadrado. Deixe vazio para usar o ícone padrão. */
  logoInitials: '',

  /** Mensagem pronta do botão "Compartilhar no WhatsApp". {link} é substituído. */
  whatsappMessage: 'Olá! Faça seu cadastro através do meu link:\n{link}',

  /** Texto do aceite LGPD no formulário */
  consentText:
    'Autorizo o armazenamento dos dados informados para fins de cadastro e contato, conforme a Política de Privacidade.',
} as const

export type SiteConfig = typeof site

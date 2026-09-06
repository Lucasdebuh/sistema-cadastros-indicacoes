# Sistema de Cadastros com Indicações

Sistema web para cadastro de pessoas com **link de indicação exclusivo**, painel
administrativo protegido, ranking de indicadores e rede de indicações.

Frontend estático publicado no **GitHub Pages**, banco de dados e autenticação no
**Supabase**. Custo zero.

---

## Índice

- [O que o sistema faz](#o-que-o-sistema-faz)
- [Tecnologias](#tecnologias)
- [Como funciona a indicação](#como-funciona-a-indicação)
- [Segurança](#segurança)
- [Instalação do zero](#instalação-do-zero)
- [Rodando na sua máquina](#rodando-na-sua-máquina)
- [Publicação automática](#publicação-automática)
- [Personalização](#personalização)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Perguntas frequentes](#perguntas-frequentes)

---

## O que o sistema faz

### Página pública (`/`)

- Formulário com **nome completo**, **data de nascimento** e **telefone/WhatsApp**
- Máscara brasileira automática: `(22) 99999-9999`
- Validação de DDD, de celular com 9 e de idade mínima
- Bloqueio de telefone duplicado
- Aceite de consentimento LGPD obrigatório
- Detecta `?ref=CODIGO` na URL e guarda a indicação por 30 dias
- Após concluir: tela de sucesso com o **link de indicação**, botão **copiar** e
  botão **compartilhar no WhatsApp**

### Painel administrativo (`/admin`)

| Página | O que traz |
|---|---|
| **Dashboard** | Total de cadastros, hoje, últimos 7 dias, mês atual, total de indicações e indicadores ativos. Gráficos por dia, por mês e top indicadores. |
| **Cadastros** | Tabela completa com busca por nome/telefone/código, filtros por período e por indicador, exportação CSV e Excel, edição e exclusão com confirmação. |
| **Ranking** | Classificação completa de quem mais indicou, com gráfico dos 10 primeiros. |
| **Rede** | Árvore de indicações — quem trouxe quem, em vários níveis. |
| **Perfil** | Dados da pessoa, link de indicação e lista de quem ela indicou. |

---

## Tecnologias

| Camada | Escolha | Por quê |
|---|---|---|
| Interface | React 19 + TypeScript | Componentes tipados, menos erro em produção |
| Build | Vite 8 | Build rápido e saída estática, que é o que o GitHub Pages aceita |
| Estilo | Tailwind CSS 4 | Design responsivo consistente, tema claro e escuro |
| Ícones | Lucide | Leve e moderno |
| Gráficos | Recharts | Gráficos em SVG, sem dependência externa |
| Rotas | React Router 7 | Rotas reais, com fallback de SPA para o GitHub Pages |
| Excel | write-excel-file | Só escrita, sem as vulnerabilidades conhecidas do SheetJS |
| Banco e login | Supabase (PostgreSQL) | Plano gratuito, RLS por linha e autenticação pronta |
| Hospedagem | GitHub Pages | Gratuito, HTTPS e publicação automática |

### Por que Supabase

É PostgreSQL de verdade com **Row Level Security**, o que permite manter o
frontend estático sem servidor próprio e ainda assim impedir que um visitante
leia a lista de cadastrados. O plano gratuito cobre o caso de uso com folga.

> **Atenção ao plano gratuito:** projetos sem nenhuma requisição por cerca de
> **7 dias** entram em pausa e precisam ser reativados no painel do Supabase.
> Um acesso por semana já evita isso.

---

## Como funciona a indicação

```
1. João se cadastra          →  o banco gera o código ABC123
2. João compartilha          →  https://usuario.github.io/repo/?ref=ABC123
3. Maria abre o link         →  o código fica salvo no navegador dela (30 dias)
4. Maria navega pelo site    →  a indicação não se perde
5. Maria conclui o cadastro  →  referred_by aponta para o registro de João
6. No painel                 →  "Maria — indicada por João" e João sobe no ranking
```

Detalhes:

- O código tem 6 caracteres de um alfabeto **sem `O`, `0`, `I` e `1`**, para não
  confundir na hora de digitar ou ditar por telefone.
- Código inexistente é ignorado em silêncio: a pessoa se cadastra normalmente,
  apenas sem indicador.
- A indicação fica no `localStorage` e expira em 30 dias.

---

## Segurança

O visitante **nunca** fala direto com as tabelas. Toda a área pública passa por
duas funções `SECURITY DEFINER`:

| Função | Quem pode chamar | O que devolve |
|---|---|---|
| `public_register(...)` | anônimo | apenas o código de indicação do próprio cadastro |
| `validate_ref(codigo)` | anônimo | apenas o **primeiro nome** de quem indicou |

As políticas de RLS liberam `SELECT`, `UPDATE` e `DELETE` na tabela
`registrations` somente para usuários autenticados que estejam na tabela
`admins`. Criar conta no Supabase Auth, sozinho, **não** dá acesso a nada.

### Sobre a chave que aparece no site

A `anon key` fica visível no JavaScript — isso é esperado e seguro. Ela apenas
identifica o projeto; quem decide o que pode ser lido ou escrito são as políticas
de RLS.

> A **`service_role key` nunca deve entrar neste repositório nem no frontend.**
> Ela ignora todas as políticas de segurança.

---

## Instalação do zero

### 1. Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta (plano gratuito).
2. **New project** → escolha um nome, gere uma senha de banco e **guarde-a**.
3. Região sugerida: **South America (São Paulo)**.
4. Aguarde alguns minutos até o projeto ficar pronto.

### 2. Criar as tabelas

1. No menu lateral: **SQL Editor** → **New query**.
2. Cole todo o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
3. Clique em **Run**. O script pode ser executado mais de uma vez sem problema.

### 3. Criar o administrador

1. **Authentication → Users → Add user**
2. Preencha e-mail e senha e marque **Auto Confirm User**.
3. Volte ao **SQL Editor** e rode, trocando pelo seu e-mail:

   ```sql
   select public.grant_admin('seu-email@exemplo.com');
   ```

4. Recomendado: em **Authentication → Sign In / Providers**, desative
   **Allow new users to sign up**.

### 4. Pegar as chaves

Em **Project Settings → API**, copie:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** → `VITE_SUPABASE_ANON_KEY`

### 5. Configurar os segredos do repositório

No GitHub: **Settings → Secrets and variables → Actions → New repository secret**

| Nome | Valor |
|---|---|
| `VITE_SUPABASE_URL` | a Project URL |
| `VITE_SUPABASE_ANON_KEY` | a chave anon public |

### 6. Ligar o GitHub Pages

**Settings → Pages → Source: GitHub Actions**

Pronto. A cada envio para a branch `main` o site é publicado de novo sozinho.

---

## Rodando na sua máquina

```bash
git clone https://github.com/Lucasdebuh/sistema-cadastros-indicacoes.git
cd sistema-cadastros-indicacoes

npm install
cp .env.example .env      # preencha com as chaves do seu Supabase

npm run dev               # http://localhost:5173
```

Outros comandos:

```bash
npm run build       # verifica os tipos e gera o site em dist/
npm run typecheck   # só a verificação de tipos
npm run preview     # serve o build local para conferência
```

As versões das dependências estão **fixas** no `package.json`, então o build sai
igual hoje e daqui a um ano.

---

## Publicação automática

O arquivo [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) faz,
a cada push na `main`:

1. Instala as dependências
2. Verifica os tipos
3. Gera o site com o caminho base correto (`/nome-do-repositorio/`)
4. Publica no GitHub Pages

Também dá para publicar manualmente em **Actions → Publicar no GitHub Pages →
Run workflow**.

### Rotas e o GitHub Pages

O GitHub Pages não conhece rotas de aplicações de página única. O arquivo
[`public/404.html`](public/404.html) converte o endereço em querystring e o
`index.html` devolve a rota original para o React Router. Por isso
`/admin/cadastros` funciona ao ser aberto direto ou recarregado.

---

## Personalização

### Nome, textos e mensagem do WhatsApp

Tudo em [`src/config/site.ts`](src/config/site.ts):

```ts
export const site = {
  name: 'Cadastro',
  tagline: 'Preencha seus dados e receba seu link de indicação exclusivo.',
  formTitle: 'Faça seu cadastro',
  controller: 'Responsável pelo cadastro',
  privacyEmail: 'contato@exemplo.com',
  logoInitials: '',          // ex.: 'RO' para um logo com iniciais
  whatsappMessage: 'Olá! Faça seu cadastro através do meu link:\n{link}',
  consentText: '...',
}
```

### Cores

Em [`src/index.css`](src/index.css), no bloco `@theme`. Troque a escala
`--color-brand-*` pela sua paleta — o site inteiro acompanha, nos dois temas.

### Logo

- **Iniciais:** preencha `logoInitials` em `src/config/site.ts`.
- **Imagem:** troque o conteúdo do componente `Logo` em
  [`src/components/PublicLayout.tsx`](src/components/PublicLayout.tsx).
- **Ícone da aba:** a tag `<link rel="icon">` em `index.html`.

### Idade mínima

Está em dois lugares, e os dois precisam mudar juntos:

- `c_min_age` em `supabase/schema.sql` (função `public_register`)
- `MIN_AGE` em `src/lib/format.ts`

### Novos campos no cadastro

1. `alter table public.registrations add column ...`
2. Adicione o parâmetro na função `public_register`
3. Inclua o campo na view `registrations_view`
4. Acrescente em `src/types.ts`, no formulário e na exportação

---

## Estrutura do projeto

```
.
├── .github/workflows/deploy.yml   Publicação automática
├── public/404.html                Fallback de rotas do GitHub Pages
├── supabase/schema.sql            Banco completo: tabelas, RLS e funções
└── src/
    ├── config/site.ts             Textos, nome e mensagem do WhatsApp
    ├── index.css                  Tema, cores e componentes de estilo
    ├── types.ts                   Tipos compartilhados
    ├── lib/
    │   ├── supabase.ts            Cliente do Supabase
    │   ├── format.ts              Máscaras, validações e datas
    │   ├── referral.ts            Captura e guarda do ?ref=
    │   ├── stats.ts               Totais, séries e ranking
    │   └── export.ts              Exportação CSV e Excel
    ├── hooks/
    │   ├── useAuth.tsx            Sessão e verificação de administrador
    │   ├── useRegistrations.ts    Carga paginada dos cadastros
    │   ├── useTheme.ts            Tema claro/escuro
    │   └── useIsDark.ts           Cores dos gráficos por tema
    ├── components/                Layouts, tabela, gráficos e UI
    └── pages/
        ├── Register.tsx           Formulário público
        ├── Success.tsx            Link de indicação
        ├── Privacy.tsx            Política de Privacidade
        └── admin/                 Login, Dashboard, Cadastros, Perfil,
                                   Ranking e Rede
```

---

## Perguntas frequentes

**Como faço login como administrador?**
Acesse `/admin` e use o e-mail e a senha criados no passo 3 da instalação.

**Como exporto os cadastros?**
Painel → **Cadastros** → botões **CSV** ou **Excel**. A exportação respeita a
busca e os filtros ativos na tela.

**Como vejo quem indicou quem?**
Três caminhos: a coluna *Quem indicou* na tabela, a página **Rede** com a árvore
completa, ou o perfil de cada pessoa.

**Alguém consegue ver a lista de cadastrados sem login?**
Não. O papel anônimo não tem permissão nas tabelas — só pode chamar as duas
funções públicas, que não devolvem listas.

**Posso usar um domínio próprio?**
Sim. **Settings → Pages → Custom domain**. Depois ajuste `VITE_BASE_PATH` para
`/` no workflow, já que o site passa a ficar na raiz.

**Excluí uma pessoa que tinha indicações. O que acontece?**
Os indicados continuam cadastrados, apenas ficam sem indicador
(`on delete set null`).

---

## Licença

MIT — veja [LICENSE](LICENSE).

# PODER OPERACIONAL — GBM (Next.js + Vercel + Upstash Redis)

Sistema web para os GBMs preencherem seus dados operacionais e para o Comandante/Diretor
acompanharem tudo num painel. **Sem Supabase**: os dados ficam no Upstash Redis (integrado
ao Vercel) e o login é feito com e-mail e senha guardados nas variáveis de ambiente.

- **Formulário** (`/`): aberto — a pessoa coloca o nome, escolhe o GBM e preenche os campos.
- **Login** (`/login`): restrito ao Comandante e ao Diretor.
- **Painel** (`/dashboard`): KPIs, gráficos, status por unidade, tabela filtrável e exportação em PDF.

Não há nenhum banco para configurar à mão nem SQL para rodar: os registros são criados
sozinhos no primeiro envio do formulário.

---

## Passo a passo (tudo pelo site do Vercel)

### 1) Subir o projeto para o GitHub
Crie um repositório no GitHub e envie estes arquivos (pode arrastá-los pelo site do GitHub).

### 2) Importar no Vercel
Em https://vercel.com → **Add New… → Project** → importe o repositório.
Ainda **não** clique em Deploy — antes configure o banco e as variáveis (passos 3 e 4).

### 3) Criar o banco (Upstash Redis) — 2 cliques
No projeto, abra a aba **Storage** → **Create Database** → escolha **Upstash for Redis**
→ **Continue** e conecte. O Vercel cria o banco e adiciona sozinho as variáveis
`UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` ao projeto.

### 4) Cadastrar o login e o segredo
Em **Settings → Environment Variables**, adicione:

| Nome | Valor |
|------|-------|
| `COMANDANTE_EMAIL` | e-mail do Comandante |
| `COMANDANTE_SENHA` | senha do Comandante |
| `DIRETOR_EMAIL` | e-mail do Diretor |
| `DIRETOR_SENHA` | senha do Diretor |
| `AUTH_SECRET` | um texto aleatório longo (veja abaixo) |

Para gerar o `AUTH_SECRET`, rode no terminal `openssl rand -base64 32` **ou** use qualquer
sequência longa e aleatória de letras e números.

### 5) Publicar
Clique em **Deploy**. Ao final, o Vercel te dá o link do site. Pronto.

> Se você conectou o banco depois de já ter feito o primeiro deploy, faça um
> **Redeploy** (aba Deployments → menu … → Redeploy) para o app enxergar as variáveis.

---

## Rodar no seu computador (opcional, para testar)

```bash
npm install
cp .env.local.example .env.local   # e preencha as variaveis
npm run dev
# abra http://localhost:3000
```
Para testar localmente você precisa de um banco Upstash (crie grátis em https://upstash.com
e copie a REST URL e o REST TOKEN para o `.env.local`).

---

## Como usar

- **GBMs:** entram no link, colocam o nome, escolhem o GBM e preenchem. Ao salvar, os dados
  são gravados/atualizados (um registro por GBM). Se já houver dados, o formulário vem
  pré-preenchido.
- **Comandante/Diretor:** clicam em **Entrar**, fazem login com e-mail e senha e veem o painel.

## Trocar quem acessa o painel ou as senhas
Basta editar as variáveis `COMANDANTE_*` / `DIRETOR_*` em **Settings → Environment Variables**
no Vercel e fazer um **Redeploy**. (Quer um terceiro acesso? Me avise que eu adiciono.)

## Estrutura do projeto

```
poder-operacional/
├─ src/lib/config.js            → lista de GBMs e campos
├─ src/lib/redis.js             → conexao com o Upstash Redis
├─ src/lib/auth.js              → login e sessao (JWT em cookie)
├─ src/middleware.js            → protege o /dashboard
├─ src/app/page.js              → formulario publico
├─ src/app/login/page.js        → login
├─ src/app/dashboard/page.js    → painel protegido
└─ src/app/api/
   ├─ submit/route.js           → grava e le os dados do formulario
   ├─ login/route.js            → valida e cria a sessao
   ├─ logout/route.js           → encerra a sessao
   └─ dados/route.js            → entrega os dados ao painel (exige sessao)
```

## Segurança (resumo)

- O login confere e-mail e senha contra as variáveis de ambiente (que nunca aparecem no
  navegador) e cria um cookie de sessão assinado, que expira em 8 horas.
- O `/dashboard` e a rota `/api/dados` só respondem com uma sessão válida.
- As senhas e o `AUTH_SECRET` ficam apenas nas variáveis do Vercel — nunca no GitHub
  (o `.gitignore` já protege o `.env.local`).

# PODER OPERACIONAL — GBM (Next.js + Vercel + Upstash Redis)

Sistema do Corpo de Bombeiros para registrar, por GBM, os recursos e equipamentos, e
acompanhar o panorama da corporação num painel.

**Como funciona o acesso (novo):**
- Tudo fica atrás de login. Quem não tem conta clica em **Faça seu cadastro** e cria o acesso.
- Não há cargos: **todo usuário cadastrado vê tudo** — preenche o formulário e vê o painel.
- O formulário é diário (cada dia é guardado separado). Não há restrição de horário.

Páginas: `/login`, `/cadastro`, `/` (formulário) e `/dashboard` (painel).

---

## Publicar no Vercel

### 1) Subir o projeto para o GitHub
Crie um repositório e envie estes arquivos (a pasta `src` e os arquivos da raiz).

### 2) Importar no Vercel
vercel.com → **Add New… → Project** → importe o repositório.

### 3) Criar o banco (Upstash Redis) — 2 cliques
Aba **Storage** → **Create Database** → **Upstash for Redis** → conecte ao projeto.
As variáveis do banco entram sozinhas.

### 4) Definir o segredo da sessão
Em **Settings → Environment Variables**, adicione:

| Nome | Valor |
|------|-------|
| `AUTH_SECRET` | um texto aleatório longo (ex.: `openssl rand -base64 32`) |

> As variáveis antigas `COMANDANTE_*` e `DIRETOR_*` não são mais usadas — pode removê-las.

### 5) Publicar
Clique em **Deploy**. Se você já tinha publicado antes, faça um **Redeploy** após conectar o
banco e definir o `AUTH_SECRET`.

---

## Rodar no seu computador (opcional)

```bash
npm install
cp .env.local.example .env.local   # preencha UPSTASH_* e AUTH_SECRET
npm run dev
# http://localhost:3000
```

---

## Uso

1. A primeira pessoa acessa o site, é levada ao **login** e clica em **Faça seu cadastro**.
2. Cria a conta (nome, e-mail, senha) e já entra.
3. No **formulário**, escolhe o GBM e preenche os dados do dia (é salvo com o nome da conta).
4. No **painel** (botão *Painel*), vê indicadores, gráficos, situação por unidade, quantitativo
   e o detalhamento — com seletor de **dia** e filtro por **unidade**.

## Segurança / observações
- As senhas são guardadas com **hash + salt** (não ficam em texto puro).
- A sessão é um cookie assinado que dura 30 dias.
- **O cadastro é aberto:** qualquer pessoa com o link pode criar conta e ver os dados.
  Se quiser restringir (ex.: código de convite ou apenas e-mails de um domínio), dá para
  adicionar — é só pedir.

## Estrutura

```
src/lib/config.js        → GBMs, campos e categorias
src/lib/redis.js         → conexão Upstash (dados por dia)
src/lib/usuarios.js      → cadastro/validação de usuários (hash de senha)
src/lib/auth.js          → sessão (JWT em cookie)
src/lib/tempo.js         → data do dia (fuso de Brasília)
src/middleware.js        → protege / e /dashboard
src/app/page.js          → formulário (logado)
src/app/login/page.js    → login
src/app/cadastro/page.js → criar conta
src/app/dashboard/page.js→ painel
src/app/api/…            → login, cadastro, logout, me, submit, dados, status
```

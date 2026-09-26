# Planner de Demandas

Quadro com três tipos de demanda (**Diárias**, **Urgentes** e **Mensais**) para a professora cadastrar e o aluno marcar como concluídas.
Feito em Next.js e hospedado de graça no Vercel, com o banco Postgres (Neon) que o próprio Vercel oferece.

## Como funciona

| Tipo | Comportamento do check |
|---|---|
| Diárias | Zera sozinho à meia-noite (horário de Belém) |
| Urgentes | Fica marcado; some do quadro 7 dias depois de concluída. Pode ter prazo, com aviso de "Vence hoje" e "Atrasada" |
| Mensais | Zera sozinho no dia 1º. Pode ter "até o dia X" |

- **Subtemas:** as demandas podem ser agrupadas (ex.: "Cerimônia de posse – 01/10"), com barra de progresso própria. Os subtemas concluídos se recolhem sozinhos.
- **Colar do WhatsApp:** cole a mensagem da professora como veio. Linhas terminadas em `:` viram subtema, linhas que começam com ação ("Verificar…", "Tenho q pegar…") viram itens marcados, e a conversa fica desmarcada. Abreviações como q, vc, msm e pq são corrigidas. Você revisa e edita antes de salvar.
  Também aceita o formato pronto: `## Nome do subtema – 01/10` e `- item`. Uma data dd/mm no título vira o prazo; `(diária)` ou `(mensal)` no título escolhe a coluna.
- **Duplicar subtema:** repete o mesmo checklist para outro evento ou curso (ex.: Pedagogia e Gestão no mesmo dia), com novo nome e prazo e com tudo desmarcado.
- **Multiplataforma:** funciona em qualquer navegador e pode ser instalado como app (PWA):
  - Android/Chrome/Edge: botão **Instalar app** no topo, ou menu ⋮ → *Instalar app*
  - iPhone/iPad: Safari → Compartilhar → *Adicionar à Tela de Início*
  - Windows/Mac: Chrome ou Edge → ícone de instalar na barra de endereço
- **Sem login:** quem tiver o link usa direto. Na primeira vez, cada aparelho escolhe quem está usando (professora ou aluno), só para o quadro mostrar quem criou ("por Prof. Luana") e quem marcou ("✓ Nerd · 14:32"). Dá para trocar no topo a qualquer momento. **Não divulgue o link**: qualquer pessoa com ele consegue editar.
- **Data do evento:** em cada subtema das Urgentes, o botão 📅 define a data do evento para todos os itens de uma vez. Ela mostra "Hoje" e fica vermelha quando passa.
- As duas pessoas podem criar, editar, excluir e marcar.
- O quadro se atualiza sozinho a cada 30 segundos e sempre que a aba volta ao foco.
- No celular, as colunas viram abas.
- As tabelas do banco são criadas automaticamente no primeiro acesso, sem precisar rodar SQL.

## Deploy no Vercel (cerca de 10 minutos)

### 1. Suba o código para o GitHub
Crie um repositório (pode ser privado) e envie esta pasta:
```bash
cd planner-demandas
git init && git add . && git commit -m "Planner de demandas"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/planner-demandas.git
git push -u origin main
```

### 2. Importe no Vercel
1. Acesse **vercel.com**, entre com o GitHub e clique em **Add New… → Project**.
2. Escolha o repositório `planner-demandas`. O Vercel reconhece o Next.js sozinho.
3. Clique em **Deploy**. O primeiro deploy sobe, mas ainda sem banco. Isso é normal.

### 3. Crie o banco (grátis)
1. No projeto, abra a aba **Storage** e clique em **Create Database**.
2. Escolha **Neon (Serverless Postgres)**, plano **Free**, região **Washington (iad1)** ou **São Paulo** se aparecer.
3. Conecte ao projeto. O Vercel cria a variável `DATABASE_URL` automaticamente.

### 4. Configure os nomes
Em **Settings → Environment Variables**, adicione:

| Nome | Exemplo |
|---|---|
| `NOME_PROFESSORA` | `Prof. Luana` |
| `NOME_ALUNO` | seu nome |

### 5. Publique de novo
Vá em **Deployments**, clique nos três pontinhos do último deploy e depois em **Redeploy**. Pronto!
Mande para a professora o link `https://planner-demandas.vercel.app` (ou o que o Vercel gerar) 

> Dica: no celular, abra o link e use "Adicionar à tela inicial" para ele virar um app.

## Rodar localmente (opcional)
```bash
npm install
cp .env.example .env.local   # preencha DATABASE_URL com a connection string do Neon
npm run dev
```

## Estrutura
```
app/page.js                     interface (quadro, formulários, importação)
app/globals.css                 visual (cores da Estácio, tema claro)
app/api/tasks/route.js          listar e criar demandas
app/api/tasks/[id]/route.js     editar e excluir
app/api/tasks/[id]/check/route.js  marcar e desmarcar
app/api/lote/route.js           importar vários itens (Colar do WhatsApp)
app/api/grupos/route.js         duplicar, renomear e excluir subtema
lib/parser.js                   leitura da mensagem do WhatsApp
app/manifest.js, public/sw.js   instalação como app
lib/db.js                       conexão Neon e criação das tabelas
lib/auth.js                     nomes de quem está usando
lib/periodo.js                  regra do "zera todo dia/mês"
```

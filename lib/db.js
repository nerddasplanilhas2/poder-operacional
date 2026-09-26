import { neon } from '@neondatabase/serverless';

let sql = null;
let pronto = null;

function conexao() {
  if (!sql) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error('Banco não configurado: variável DATABASE_URL ausente.');
    sql = neon(url);
  }
  return sql;
}

// Cria as tabelas automaticamente na primeira requisição.
export async function db() {
  const s = conexao();
  if (!pronto) {
    pronto = (async () => {
      await s`
        CREATE TABLE IF NOT EXISTS tarefas (
          id          SERIAL PRIMARY KEY,
          titulo      TEXT NOT NULL,
          descricao   TEXT,
          tipo        TEXT NOT NULL CHECK (tipo IN ('diaria','urgente','mensal')),
          prazo       DATE,
          dia_mes     SMALLINT CHECK (dia_mes BETWEEN 1 AND 31),
          criado_por  TEXT,
          criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
      await s`
        CREATE TABLE IF NOT EXISTS conclusoes (
          tarefa_id     INTEGER NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
          periodo       TEXT NOT NULL,
          concluido_por TEXT,
          concluido_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (tarefa_id, periodo)
        )`;
      await s`ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS grupo TEXT`;
    })().catch((e) => {
      pronto = null;
      throw e;
    });
  }
  await pronto;
  return s;
}

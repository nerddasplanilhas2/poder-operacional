import { Redis } from '@upstash/redis';

// Cliente do Upstash Redis (banco de dados).
// A integracao Upstash no Vercel injeta as variaveis automaticamente.
// Aceita os dois nomes possiveis (UPSTASH_* ou KV_*).
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

// Cada dia tem sua propria chave: um campo por GBM.
// Ex.: poder_operacional:2026-08-21
export function chaveDia(data) {
  return `poder_operacional:${data}`;
}

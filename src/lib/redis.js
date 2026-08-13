import { Redis } from '@upstash/redis';

// Cliente do Upstash Redis (banco de dados).
// A integracao Upstash no Vercel injeta as variaveis automaticamente.
// Aceita os dois nomes possiveis (UPSTASH_* ou KV_*).
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

// Chave onde ficam todos os registros (um campo por GBM).
export const CHAVE = 'poder_operacional';

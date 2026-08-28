import { NextResponse } from 'next/server';
import { agoraBR } from '../../../lib/tempo';

export const dynamic = 'force-dynamic';

// GET /api/status -> data atual (fuso de Brasília). O envio está sempre aberto.
export async function GET() {
  return NextResponse.json({ ok: true, data: agoraBR().data });
}

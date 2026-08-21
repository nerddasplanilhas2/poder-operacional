import { NextResponse } from 'next/server';
import { agoraBR, janelaAberta } from '../../../lib/tempo';
import { ABRE_HORA, FECHA_HORA } from '../../../lib/config';

export const dynamic = 'force-dynamic';

// GET /api/status -> informa se o envio está aberto agora (fuso de Brasília)
export async function GET() {
  const t = agoraBR();
  return NextResponse.json({
    ok: true,
    aberto: janelaAberta(t),
    data: t.data,
    hora: t.horaStr,
    abre: ABRE_HORA,
    fecha: FECHA_HORA,
  });
}

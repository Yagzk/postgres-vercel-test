import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, customUrl } = body;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Lütfen çalıştırılacak bir SQL sorgusu girin.' },
        { status: 400 }
      );
    }

    const trimmed = query.trim();

    const start = performance.now();
    const result = await executeQuery(trimmed, [], customUrl);
    const durationMs = Math.round((performance.now() - start) * 100) / 100;

    return NextResponse.json({
      success: true,
      query: trimmed,
      rowCount: result.rowCount,
      durationMs,
      rows: result.rows,
      columns: result.rows.length > 0 ? Object.keys(result.rows[0]) : [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Sorgu çalıştırılırken hata oluştu.',
        code: error.code || null,
        detail: error.detail || null,
      },
      { status: 500 }
    );
  }
}

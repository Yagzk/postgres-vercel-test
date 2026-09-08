import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const customUrl = searchParams.get('customUrl') || undefined;

    const start = performance.now();
    const result = await executeQuery(
      `SELECT id, title, category, payload, latency_ms, created_at 
       FROM test_records 
       ORDER BY created_at DESC 
       LIMIT $1;`,
      [limit],
      customUrl
    );

    const totalDuration = Math.round((performance.now() - start) * 100) / 100;

    return NextResponse.json({
      success: true,
      records: result.rows,
      count: result.rows.length,
      durationMs: totalDuration,
      queryMs: result.durationMs,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Kayıtlar listelenirken hata oluştu.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, payload, customUrl } = body;

    const recordTitle = title || `Test Kaydı #${Math.floor(Math.random() * 10000)}`;
    const recordCategory = category || 'benchmark';
    const recordPayload = payload || {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || 'Vercel-Client',
      randomValue: Math.random(),
      status: 'verified',
    };

    const start = performance.now();
    const result = await executeQuery(
      `INSERT INTO test_records (title, category, payload, latency_ms) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *;`,
      [recordTitle, recordCategory, JSON.stringify(recordPayload), 0],
      customUrl
    );

    const insertDuration = Math.round((performance.now() - start) * 100) / 100;

    // Update with exact insert latency
    if (result.rows[0]?.id) {
      await executeQuery(
        `UPDATE test_records SET latency_ms = $1 WHERE id = $2;`,
        [insertDuration, result.rows[0].id],
        customUrl
      );
      result.rows[0].latency_ms = insertDuration;
    }

    return NextResponse.json({
      success: true,
      message: 'Test kaydı başarıyla eklendi.',
      record: result.rows[0],
      durationMs: insertDuration,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Kayıt eklenirken hata oluştu.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, action, customUrl } = body;

    const start = performance.now();

    if (action === 'truncate' || action === 'clear_all') {
      await executeQuery('TRUNCATE TABLE test_records RESTART IDENTITY;', [], customUrl);
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      return NextResponse.json({
        success: true,
        message: 'Tüm test kayıtları temizlendi.',
        durationMs,
      });
    }

    if (id) {
      const result = await executeQuery('DELETE FROM test_records WHERE id = $1 RETURNING id;', [id], customUrl);
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      return NextResponse.json({
        success: true,
        message: `ID ${id} olan kayıt silindi.`,
        rowCount: result.rowCount,
        durationMs,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Geçerli bir kayıt ID veya silme eylemi belirtilmedi.',
      },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Kayıt silinirken hata oluştu.',
      },
      { status: 500 }
    );
  }
}

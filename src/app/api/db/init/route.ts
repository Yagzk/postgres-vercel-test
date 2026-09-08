import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const customUrl = body.customUrl as string | undefined;

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS test_records (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'general',
        payload JSONB,
        latency_ms NUMERIC(8, 2),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_test_records_created_at ON test_records(created_at DESC);
    `;

    const tableResult = await executeQuery(createTableQuery, [], customUrl);
    await executeQuery(createIndexQuery, [], customUrl);

    // Get count of existing records
    const countResult = await executeQuery<{ count: string }>(
      'SELECT COUNT(*)::text as count FROM test_records;',
      [],
      customUrl
    );

    return NextResponse.json({
      success: true,
      message: '`test_records` tablosu başarıyla oluşturuldu ve hazırlandı!',
      durationMs: tableResult.durationMs,
      recordCount: parseInt(countResult.rows[0]?.count || '0', 10),
    });
  } catch (error: any) {
    console.error('Table Init Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Tablo oluşturulurken hata meydana geldi.',
        code: error.code || null,
      },
      { status: 500 }
    );
  }
}

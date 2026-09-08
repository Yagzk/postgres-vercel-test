import { NextResponse } from 'next/server';
import { executeQuery, getConnectionString } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const customUrl = body.customUrl as string | undefined;

    const connectionString = getConnectionString(customUrl);
    if (!connectionString) {
      return NextResponse.json(
        {
          success: false,
          error:
            'DATABASE_URL veya bağlantı dizesi bulunamadı. Lütfen .env.local dosyasını kontrol edin veya arayüzden bir URL girin.',
        },
        { status: 400 }
      );
    }

    const startTotal = performance.now();

    // 1. Basic Ping and Version
    const versionResult = await executeQuery<{
      version: string;
      server_time: string;
      current_database: string;
      current_user: string;
    }>(
      'SELECT version(), NOW() as server_time, current_database(), current_user;',
      [],
      customUrl
    );

    // 2. Active connection statistics
    const statsResult = await executeQuery<{ active_connections: string; max_connections: string }>(
      `SELECT 
        (SELECT count(*) FROM pg_stat_activity)::text as active_connections,
        current_setting('max_connections') as max_connections;`,
      [],
      customUrl
    );

    // 3. Database size
    let dbSize = 'Bilinmiyor';
    try {
      const sizeResult = await executeQuery<{ size: string }>(
        `SELECT pg_size_pretty(pg_database_size(current_database())) as size;`,
        [],
        customUrl
      );
      if (sizeResult.rows.length > 0) {
        dbSize = sizeResult.rows[0].size;
      }
    } catch {
      // Some serverless environments restrict pg_database_size
    }

    // 4. List user tables
    const tablesResult = await executeQuery<{ table_name: string }>(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       ORDER BY table_name ASC;`,
      [],
      customUrl
    );

    const totalDurationMs = Math.round((performance.now() - startTotal) * 100) / 100;

    // Mask the connection string for security
    let maskedUrl = '***';
    try {
      const parsed = new URL(connectionString);
      parsed.password = '******';
      maskedUrl = parsed.toString();
    } catch {
      maskedUrl = connectionString.substring(0, 15) + '...******';
    }

    const firstRow = versionResult.rows[0];

    return NextResponse.json({
      success: true,
      message: 'PostgreSQL veritabanına başarıyla bağlanıldı!',
      durationMs: totalDurationMs,
      pingMs: versionResult.durationMs,
      connectionInfo: {
        maskedUrl,
        database: firstRow.current_database,
        user: firstRow.current_user,
        serverTime: firstRow.server_time,
        version: firstRow.version,
        activeConnections: statsResult.rows[0]?.active_connections || '1',
        maxConnections: statsResult.rows[0]?.max_connections || '100',
        dbSize,
        tables: tablesResult.rows.map((r) => r.table_name),
        tableCount: tablesResult.rowCount || 0,
      },
      environment: {
        nodeVersion: process.version,
        region: process.env.VERCEL_REGION || 'Local / Self-hosted',
        vercelEnv: process.env.VERCEL_ENV || 'development',
      },
    });
  } catch (error: any) {
    console.error('PostgreSQL Test Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Veritabanı bağlantı hatası oluştu.',
        code: error.code || null,
        detail: error.detail || null,
        hint: error.hint || null,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST(new Request('http://localhost/api/db/test', { method: 'POST', body: '{}' }));
}

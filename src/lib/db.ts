import { Pool, PoolConfig } from 'pg';

let globalPool: Pool | null = null;

export function getConnectionString(customUrl?: string): string {
  if (customUrl && customUrl.trim() !== '') {
    return customUrl.trim();
  }
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ''
  );
}

export function createPool(connectionString?: string): Pool {
  const connStr = getConnectionString(connectionString);
  if (!connStr) {
    throw new Error('DATABASE_URL veya bağlantı dizesi tanımlı değil.');
  }

  const isLocalhost = connStr.includes('localhost') || connStr.includes('127.0.0.1');

  const config: PoolConfig = {
    connectionString: connStr,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
    ssl: isLocalhost
      ? false
      : {
          rejectUnauthorized: false,
        },
  };

  return new Pool(config);
}

export function getPool(customUrl?: string): Pool {
  if (customUrl) {
    return createPool(customUrl);
  }

  if (!globalPool) {
    globalPool = createPool();
  }

  return globalPool;
}

export interface QueryResultInfo<T = any> {
  rows: T[];
  rowCount: number | null;
  durationMs: number;
}

export async function executeQuery<T = any>(
  text: string,
  params?: any[],
  customUrl?: string
): Promise<QueryResultInfo<T>> {
  const pool = getPool(customUrl);
  const start = performance.now();
  
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    return {
      rows: res.rows,
      rowCount: res.rowCount,
      durationMs,
    };
  } finally {
    client.release();
    if (customUrl) {
      await pool.end().catch(() => {});
    }
  }
}

import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const iterations = Math.min(Math.max(parseInt(body.iterations || '5', 10), 1), 20);
    const customUrl = body.customUrl as string | undefined;

    const latencies: number[] = [];
    const individualResults: Array<{ index: number; durationMs: number; success: boolean; error?: string }> = [];

    const totalStart = performance.now();

    for (let i = 1; i <= iterations; i++) {
      const stepStart = performance.now();
      try {
        const queryRes = await executeQuery<{ num: number }>(
          `SELECT $1::int as iteration, NOW() as ping_time;`,
          [i],
          customUrl
        );
        const duration = Math.round((performance.now() - stepStart) * 100) / 100;
        latencies.push(duration);
        individualResults.push({
          index: i,
          durationMs: duration,
          success: true,
        });
      } catch (err: any) {
        const duration = Math.round((performance.now() - stepStart) * 100) / 100;
        individualResults.push({
          index: i,
          durationMs: duration,
          success: false,
          error: err.message,
        });
      }
    }

    const totalDurationMs = Math.round((performance.now() - totalStart) * 100) / 100;

    const successfulLatencies = latencies.filter((l) => typeof l === 'number' && !isNaN(l));
    const minLatency = successfulLatencies.length > 0 ? Math.min(...successfulLatencies) : 0;
    const maxLatency = successfulLatencies.length > 0 ? Math.max(...successfulLatencies) : 0;
    const avgLatency =
      successfulLatencies.length > 0
        ? Math.round((successfulLatencies.reduce((a, b) => a + b, 0) / successfulLatencies.length) * 100) / 100
        : 0;

    return NextResponse.json({
      success: true,
      iterations,
      stats: {
        totalDurationMs,
        avgLatencyMs: avgLatency,
        minLatencyMs: minLatency,
        maxLatencyMs: maxLatency,
        firstQueryColdStartMs: latencies[0] || 0,
        subsequentAvgMs:
          latencies.length > 1
            ? Math.round((latencies.slice(1).reduce((a, b) => a + b, 0) / (latencies.length - 1)) * 100) / 100
            : latencies[0] || 0,
        successRate: `${((successfulLatencies.length / iterations) * 100).toFixed(0)}%`,
      },
      results: individualResults,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Benchmark testi sırasında hata oluştu.',
      },
      { status: 500 }
    );
  }
}

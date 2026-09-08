'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Activity,
  Server,
  Zap,
  Play,
  PlusCircle,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Terminal,
  Layers,
  Clock,
  Gauge,
  Cpu,
  Code,
  Globe,
  Info,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface DbInfo {
  maskedUrl: string;
  database: string;
  user: string;
  serverTime: string;
  version: string;
  activeConnections: string;
  maxConnections: string;
  dbSize: string;
  tables: string[];
  tableCount: number;
}

interface TestRecord {
  id: number;
  title: string;
  category: string;
  payload: any;
  latency_ms: number;
  created_at: string;
}

interface BenchmarkStats {
  totalDurationMs: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  firstQueryColdStartMs: number;
  subsequentAvgMs: number;
  successRate: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  title: string;
  durationMs?: number;
  detail?: string;
}

export default function Home() {
  // Connection states
  const [customUrl, setCustomUrl] = useState('');
  const [useCustomUrl, setUseCustomUrl] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'health' | 'crud' | 'benchmark' | 'sql' | 'guide'>('health');

  // CRUD state
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [isRecordsLoading, setIsRecordsLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('benchmark');

  // Benchmark state
  const [benchmarkIterations, setBenchmarkIterations] = useState(5);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkStats, setBenchmarkStats] = useState<BenchmarkStats | null>(null);
  const [benchmarkList, setBenchmarkList] = useState<any[]>([]);

  // SQL Query state
  const [sqlQuery, setSqlQuery] = useState('SELECT table_name, table_type FROM information_schema.tables WHERE table_schema=\'public\';');
  const [isQueryRunning, setIsQueryRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<{ rows: any[]; columns: string[]; rowCount: number; durationMs: number } | null>(null);

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (type: LogEntry['type'], title: string, detail?: string, durationMs?: number) => {
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      title,
      detail,
      durationMs,
    };
    setLogs((prev) => [newEntry, ...prev].slice(0, 50));
  };

  const getEffectiveUrl = () => {
    return useCustomUrl && customUrl.trim() !== '' ? customUrl.trim() : undefined;
  };

  // Run initial test on mount
  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setIsTesting(true);
    setErrorMessage(null);
    const activeUrl = getEffectiveUrl();
    addLog('info', 'Veritabanı bağlantı testi başlatılıyor...', activeUrl ? 'Özel URL kullanılıyor' : 'Ortam değişkeni (DATABASE_URL) kullanılıyor');

    try {
      const res = await fetch('/api/db/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customUrl: activeUrl }),
      });

      const data = await res.json();

      if (data.success) {
        setConnectionStatus('connected');
        setDbInfo(data.connectionInfo);
        setLastLatency(data.pingMs);
        addLog('success', 'Veritabanına başarıyla bağlanıldı!', `${data.connectionInfo.database} (${data.connectionInfo.version.split(' ')[0]})`, data.durationMs);
      } else {
        setConnectionStatus('error');
        setErrorMessage(data.error || 'Bağlantı başarısız.');
        addLog('error', 'Veritabanı bağlantı hatası!', data.error);
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setErrorMessage(err.message || 'Sunucuya ulaşılamadı.');
      addLog('error', 'API İsteği Başarısız Oldu', err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const initTable = async () => {
    addLog('info', '`test_records` tablosu kontrol ediliyor / oluşturuluyor...');
    try {
      const res = await fetch('/api/db/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customUrl: getEffectiveUrl() }),
      });
      const data = await res.json();
      if (data.success) {
        addLog('success', data.message, `Mevcut Kayıt Sayısı: ${data.recordCount}`, data.durationMs);
        fetchRecords();
        testConnection();
      } else {
        addLog('error', 'Tablo oluşturulamadı', data.error);
      }
    } catch (err: any) {
      addLog('error', 'Tablo oluşturma isteği başarısız', err.message);
    }
  };

  const fetchRecords = async () => {
    setIsRecordsLoading(true);
    try {
      const activeUrl = getEffectiveUrl();
      const url = activeUrl ? `/api/db/records?customUrl=${encodeURIComponent(activeUrl)}` : '/api/db/records';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records);
        addLog('info', `${data.records.length} adet kayıt listelendi`, undefined, data.durationMs);
      } else {
        addLog('warning', 'Kayıtlar listelenirken uyarı', data.error);
      }
    } catch (err: any) {
      addLog('error', 'Kayıtları çekme hatası', err.message);
    } finally {
      setIsRecordsLoading(false);
    }
  };

  const insertRecord = async () => {
    const title = newTitle.trim() || `Test Kaydı #${Math.floor(Math.random() * 1000)}`;
    addLog('info', `Kayıt ekleniyor: "${title}"...`);
    try {
      const res = await fetch('/api/db/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category: newCategory,
          customUrl: getEffectiveUrl(),
          payload: {
            createdVia: 'Vercel Postgres Tester UI',
            randomId: Math.random().toString(36).substring(7),
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        addLog('success', `Kayıt başarıyla eklendi (ID: ${data.record.id})`, `Gecikme: ${data.durationMs}ms`, data.durationMs);
        setNewTitle('');
        fetchRecords();
      } else {
        addLog('error', 'Kayıt eklenemedi', data.error);
      }
    } catch (err: any) {
      addLog('error', 'Kayıt ekleme isteği hatası', err.message);
    }
  };

  const deleteRecord = async (id: number) => {
    try {
      const res = await fetch('/api/db/records', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, customUrl: getEffectiveUrl() }),
      });
      const data = await res.json();
      if (data.success) {
        addLog('info', `ID ${id} olan kayıt silindi`, undefined, data.durationMs);
        fetchRecords();
      } else {
        addLog('error', 'Kayıt silinemedi', data.error);
      }
    } catch (err: any) {
      addLog('error', 'Silme isteği hatası', err.message);
    }
  };

  const truncateRecords = async () => {
    if (!confirm('Tüm test kayıtlarını silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch('/api/db/records', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'truncate', customUrl: getEffectiveUrl() }),
      });
      const data = await res.json();
      if (data.success) {
        addLog('success', 'Tüm test kayıtları temizlendi!', undefined, data.durationMs);
        fetchRecords();
      } else {
        addLog('error', 'Temizleme başarısız', data.error);
      }
    } catch (err: any) {
      addLog('error', 'Temizleme hatası', err.message);
    }
  };

  const runBenchmark = async () => {
    setIsBenchmarking(true);
    setBenchmarkStats(null);
    setBenchmarkList([]);
    addLog('info', `${benchmarkIterations} adımlı Benchmark başlatılıyor...`);

    try {
      const res = await fetch('/api/db/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iterations: benchmarkIterations, customUrl: getEffectiveUrl() }),
      });
      const data = await res.json();
      if (data.success) {
        setBenchmarkStats(data.stats);
        setBenchmarkList(data.results);
        addLog(
          'success',
          `Benchmark tamamlandı! Ort: ${data.stats.avgLatencyMs}ms (Min: ${data.stats.minLatencyMs}ms / Max: ${data.stats.maxLatencyMs}ms)`,
          `Toplam Süre: ${data.stats.totalDurationMs}ms, Başarı Oranı: ${data.stats.successRate}`,
          data.stats.totalDurationMs
        );
      } else {
        addLog('error', 'Benchmark testi başarısız oldu', data.error);
      }
    } catch (err: any) {
      addLog('error', 'Benchmark API isteği hatası', err.message);
    } finally {
      setIsBenchmarking(false);
    }
  };

  const executeCustomSql = async () => {
    if (!sqlQuery.trim()) return;
    setIsQueryRunning(true);
    setQueryResult(null);
    addLog('info', `SQL Sorgusu çalıştırılıyor: ${sqlQuery.substring(0, 45)}...`);

    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery, customUrl: getEffectiveUrl() }),
      });
      const data = await res.json();
      if (data.success) {
        setQueryResult({
          rows: data.rows,
          columns: data.columns,
          rowCount: data.rowCount,
          durationMs: data.durationMs,
        });
        addLog('success', `SQL başarıyla tamamlandı (${data.rows.length} satır)`, `Süre: ${data.durationMs}ms`, data.durationMs);
      } else {
        addLog('error', 'SQL Çalıştırma Hatası', data.error);
        setQueryResult({
          rows: [],
          columns: [],
          rowCount: 0,
          durationMs: 0,
        });
      }
    } catch (err: any) {
      addLog('error', 'SQL Sorgusu API hatası', err.message);
    } finally {
      setIsQueryRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-16">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">PostgreSQL Test Suite</h1>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Vercel Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">Canlı Bağlantı, CRUD, Gecikme ve Performans Test Aracı</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium backdrop-blur-sm transition-all ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/20'
                  : connectionStatus === 'error'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Test Ediliyor...</span>
                </>
              ) : connectionStatus === 'connected' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Bağlantı Aktif ({lastLatency} ms)</span>
                </>
              ) : connectionStatus === 'error' ? (
                <>
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Bağlantı Hatası</span>
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test Bekleniyor</span>
                </>
              )}
            </div>

            <button
              onClick={testConnection}
              disabled={isTesting}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>Yeniden Test Et</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Connection Config Bar */}
        <section className="bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Server className="w-4 h-4 text-indigo-400" />
              <span>Veritabanı Bağlantı Kaynağı</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useCustomUrl}
                  onChange={(e) => setUseCustomUrl(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500/50"
                />
                <span>Özel Connection String Kullan (Test için)</span>
              </label>
            </div>
          </div>

          {useCustomUrl ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="postgres://user:password@host:5432/dbname?sslmode=require"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={testConnection}
                disabled={isTesting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all whitespace-nowrap"
              >
                Bu URL'i Dene
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-mono truncate">
                <span className="text-slate-500 font-semibold">DATABASE_URL:</span>
                <span className="text-slate-400 truncate">{dbInfo?.maskedUrl || 'Sunucu ortam değişkeni (.env.local veya Vercel env)'}</span>
              </div>
              <span className="text-[11px] text-indigo-400/80 font-mono bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/40 shrink-0 ml-2">
                Env Mode
              </span>
            </div>
          )}

          {/* Error Banner if connection failed */}
          {connectionStatus === 'error' && errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Bağlantı Hatası Detayı:</p>
                <p className="font-mono text-[11px] text-rose-200/90">{errorMessage}</p>
                <p className="text-slate-400 text-[11px] pt-1">
                  İpucu: Eğer Vercel, Supabase, Neon veya Render kullanıyorsanız URL sonuna <code className="text-indigo-300">?sslmode=require</code> eklemeyi veya .env.local dosyasında geçerli bir <code className="text-indigo-300">DATABASE_URL</code> tanımlamayı kontrol edin.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Database Metric Overview Cards */}
        {dbInfo && connectionStatus === 'connected' && (
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Ping Gecikmesi</span>
                <Gauge className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-2">
                <span className="text-xl font-bold text-white font-mono">{lastLatency}</span>
                <span className="text-xs text-slate-400 ml-1">ms</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Veritabanı</span>
                <Database className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-2 truncate" title={dbInfo.database}>
                <span className="text-base font-bold text-white truncate font-mono">{dbInfo.database}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Postgres Sürüm</span>
                <Cpu className="w-4 h-4 text-violet-400" />
              </div>
              <div className="mt-2 truncate" title={dbInfo.version}>
                <span className="text-sm font-bold text-white truncate font-mono">{dbInfo.version.split(' ')[0]} {dbInfo.version.split(' ')[1]}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Kullanıcı</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 truncate">
                <span className="text-sm font-bold text-white truncate font-mono">{dbInfo.user}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Aktif Havuz</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 font-mono">
                <span className="text-lg font-bold text-white">{dbInfo.activeConnections}</span>
                <span className="text-xs text-slate-500"> / {dbInfo.maxConnections}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Tablo Sayısı</span>
                <Layers className="w-4 h-4 text-pink-400" />
              </div>
              <div className="mt-2 font-mono">
                <span className="text-xl font-bold text-white">{dbInfo.tableCount}</span>
                <span className="text-xs text-slate-500"> adet</span>
              </div>
            </div>
          </section>
        )}

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1.5 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'health'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>1. Sağlık & Tablolar</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('crud');
              fetchRecords();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'crud'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. CRUD Testi (Yaz/Oku/Sil)</span>
          </button>

          <button
            onClick={() => setActiveTab('benchmark')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'benchmark'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>3. Gecikme & Benchmark</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'sql'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>4. SQL Konsolu</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'guide'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>5. Vercel Kurulum Rehberi</span>
          </button>
        </nav>

        {/* Tab 1: Health & Tables */}
        {activeTab === 'health' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-400" />
                  <span>Sunucu & Bağlantı Detayları</span>
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Online
                </span>
              </div>

              {dbInfo ? (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">PostgreSQL Tam Sürüm</span>
                    <span className="text-slate-200 font-mono text-right max-w-[280px] truncate" title={dbInfo.version}>
                      {dbInfo.version}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Sunucu Zamanı (Server Time)</span>
                    <span className="text-slate-200 font-mono">{new Date(dbInfo.serverTime).toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Veritabanı Boyutu (Tahmini)</span>
                    <span className="text-slate-200 font-mono">{dbInfo.dbSize}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Bağlantı Havuzu (Pool) Kapasitesi</span>
                    <span className="text-slate-200 font-mono">{dbInfo.activeConnections} / {dbInfo.maxConnections} max</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">SSL Durumu</span>
                    <span className="text-emerald-400 font-semibold">Aktif (rejectUnauthorized: false)</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Henüz veri yüklenmedi. Yukarıdaki "Yeniden Test Et" butonuna tıklayın.
                </div>
              )}
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-pink-400" />
                  <span>Public Şemasındaki Tablolar ({dbInfo?.tableCount || 0})</span>
                </h3>
                <button
                  onClick={initTable}
                  className="text-xs px-3 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium transition-colors"
                >
                  Test Tablosu Oluştur (`test_records`)
                </button>
              </div>

              {dbInfo?.tables && dbInfo.tables.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {dbInfo.tables.map((t) => (
                    <div
                      key={t}
                      className={`p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between ${
                        t === 'test_records'
                          ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300 font-semibold'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <span className="truncate">{t}</span>
                      {t === 'test_records' && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded ml-1">
                          Test
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
                  <p className="text-xs text-slate-400">Veritabanında henüz bir kullanıcı tablosu bulunmuyor.</p>
                  <button
                    onClick={initTable}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Otomatik Test Tablosu Oluştur</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: CRUD Operations */}
        {activeTab === 'crud' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-emerald-400" />
                    <span>PostgreSQL Test Tablosuna Kayıt Ekle</span>
                  </h3>
                  <p className="text-xs text-slate-400">Her ekleme işlemi milisaniye bazlı yazma süresini (insert latency) ölçer.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={initTable}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                  >
                    Tabloyu Sıfırla / Kur
                  </button>
                  <button
                    onClick={truncateRecords}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs font-medium border border-rose-800/40"
                  >
                    Tümünü Sil (Truncate)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <input
                  type="text"
                  placeholder="Kayıt başlığı (örn: Vercel Serverless Test #1)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="sm:col-span-7 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="sm:col-span-3 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="benchmark">Benchmark</option>
                  <option value="user_action">User Action</option>
                  <option value="system_log">System Log</option>
                  <option value="ecommerce_order">Order Payload</option>
                </select>
                <button
                  onClick={insertRecord}
                  className="sm:col-span-2 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Kayıt Ekle</span>
                </button>
              </div>
            </div>

            {/* Records List Table */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Son Kayıtlar ({records.length})
                  </h3>
                  {isRecordsLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />}
                </div>
                <button
                  onClick={fetchRecords}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Listeyi Yenile</span>
                </button>
              </div>

              {records.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Başlık</th>
                        <th className="px-4 py-3">Kategori</th>
                        <th className="px-4 py-3">JSONB Veri</th>
                        <th className="px-4 py-3">Yazma Süresi</th>
                        <th className="px-4 py-3">Tarih</th>
                        <th className="px-4 py-3 text-right">Eylem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 text-indigo-400 font-bold">#{r.id}</td>
                          <td className="px-4 py-3 font-sans text-slate-200 font-medium">{r.title}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-sans">
                              {r.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-[200px] truncate text-[11px] text-slate-400" title={JSON.stringify(r.payload)}>
                            {JSON.stringify(r.payload)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-emerald-400 font-semibold">{r.latency_ms} ms</span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-[11px] font-sans">
                            {new Date(r.created_at).toLocaleTimeString('tr-TR')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => deleteRecord(r.id)}
                              className="p-1 rounded hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Kaydı Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Kayıt bulunamadı. Yukarıdan yeni bir test kaydı ekleyebilirsiniz.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Benchmark & Latency */}
        {activeTab === 'benchmark' && (
          <div className="space-y-6">
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Serverless Bağlantı & Gecikme Benchmark Testi</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Vercel Function ortamında ardışık veritabanı sorguları yaparak Cold Start ve Warm Connection gecikmesini ölçer.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span>Tekrar Sayısı:</span>
                    <select
                      value={benchmarkIterations}
                      onChange={(e) => setBenchmarkIterations(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                    >
                      <option value="3">3 Kez</option>
                      <option value="5">5 Kez</option>
                      <option value="10">10 Kez</option>
                      <option value="20">20 Kez</option>
                    </select>
                  </div>
                  <button
                    onClick={runBenchmark}
                    disabled={isBenchmarking}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all"
                  >
                    <Play className={`w-3.5 h-3.5 ${isBenchmarking ? 'animate-spin' : ''}`} />
                    <span>{isBenchmarking ? 'Test Ediliyor...' : 'Benchmark Başlat'}</span>
                  </button>
                </div>
              </div>

              {/* Benchmark Result Stats */}
              {benchmarkStats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
                    <span className="text-[11px] text-slate-400">Ortalama Gecikme</span>
                    <span className="text-xl font-bold text-indigo-400 font-mono mt-1">{benchmarkStats.avgLatencyMs} ms</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
                    <span className="text-[11px] text-slate-400">En Hızlı (Min)</span>
                    <span className="text-xl font-bold text-emerald-400 font-mono mt-1">{benchmarkStats.minLatencyMs} ms</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
                    <span className="text-[11px] text-slate-400">En Yavaş (Max)</span>
                    <span className="text-xl font-bold text-rose-400 font-mono mt-1">{benchmarkStats.maxLatencyMs} ms</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
                    <span className="text-[11px] text-slate-400">İlk Sorgu (Cold)</span>
                    <span className="text-xl font-bold text-amber-400 font-mono mt-1">{benchmarkStats.firstQueryColdStartMs} ms</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
                    <span className="text-[11px] text-slate-400">Başarı Oranı</span>
                    <span className="text-xl font-bold text-cyan-400 font-mono mt-1">{benchmarkStats.successRate}</span>
                  </div>
                </div>
              )}

              {/* Benchmark Iterations Timeline */}
              {benchmarkList.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold text-slate-300">Ardışık Sorgu Zaman Çizelgesi:</h4>
                  <div className="space-y-1.5">
                    {benchmarkList.map((item) => (
                      <div
                        key={item.index}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Sorgu #{item.index}</span>
                          {item.success ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 sm:w-48 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full rounded-full"
                              style={{ width: `${Math.min((item.durationMs / 300) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-slate-200 font-semibold w-16 text-right">{item.durationMs} ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: SQL Runner */}
        {activeTab === 'sql' && (
          <div className="space-y-4">
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-cyan-400" />
                  <span>Canlı SQL Konsolu</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSqlQuery('SELECT current_database(), current_user, version();')}
                    className="text-[11px] text-slate-400 hover:text-indigo-300 font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800"
                  >
                    Sürüm Sorgusu
                  </button>
                  <button
                    onClick={() => setSqlQuery('SELECT * FROM test_records ORDER BY id DESC LIMIT 10;')}
                    className="text-[11px] text-slate-400 hover:text-indigo-300 font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800"
                  >
                    Test Tablosunu Listele
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <textarea
                  rows={4}
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="SELECT * FROM information_schema.tables WHERE table_schema='public';"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex justify-end">
                  <button
                    onClick={executeCustomSql}
                    disabled={isQueryRunning}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition-all"
                  >
                    <Play className={`w-3.5 h-3.5 ${isQueryRunning ? 'animate-spin' : ''}`} />
                    <span>{isQueryRunning ? 'Çalıştırılıyor...' : 'Sorguyu Çalıştır'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SQL Results */}
            {queryResult && (
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden">
                <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold font-mono">
                    Sonuç: {queryResult.rowCount} satır döndü
                  </span>
                  <span className="text-emerald-400 font-mono">{queryResult.durationMs} ms</span>
                </div>

                {queryResult.rows.length > 0 ? (
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider sticky top-0">
                        <tr>
                          {queryResult.columns.map((col) => (
                            <th key={col} className="px-3.5 py-2.5 border-b border-slate-800">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {queryResult.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            {queryResult.columns.map((col) => (
                              <td key={col} className="px-3.5 py-2 text-xs max-w-[250px] truncate" title={String(row[col])}>
                                {row[col] !== null ? String(row[col]) : <span className="text-slate-600">NULL</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 text-xs">Sorgu sonucu satır dönmedi veya 0 satır etkilendi.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Deployment Guide */}
        {activeTab === 'guide' && (
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                <span>Vercel'e Dağıtım (Deploy) ve PostgreSQL Bağlantı Rehberi</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Bu projeyi Vercel'e yükleyerek üretim ortamında gerçek serverless veritabanı testlerini gerçekleştirebilirsiniz.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 inline-flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>GitHub'a Yükleyin</span>
                </div>
                <p className="text-xs text-slate-400">
                  Bu projeyi GitHub / GitLab deponuza push edin veya doğrudan Vercel CLI (<code className="text-indigo-300 font-mono">vercel</code>) ile deploy edin.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 inline-flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Environment Variable Ekleyin</span>
                </div>
                <p className="text-xs text-slate-400">
                  Vercel Proje Ayarları &rarr; <strong>Environment Variables</strong> kısmına <code className="text-emerald-300 font-mono">DATABASE_URL</code> ekleyin.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 inline-flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>SSL Modunu Açın</span>
                </div>
                <p className="text-xs text-slate-400">
                  Bağlantı dizesinin sonuna mutlaka <code className="text-indigo-300 font-mono">?sslmode=require</code> ekleyin (Neon / Supabase / Render zorunlu kılar).
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Popüler PostgreSQL Sağlayıcıları İçin Connection String Formatları
              </h4>
              <div className="space-y-2 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-indigo-400 font-bold block mb-1">Neon (Serverless Postgres):</span>
                  <code className="text-slate-300 break-all select-all">
                    postgres://user:pass@ep-cool-fog-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
                  </code>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-emerald-400 font-bold block mb-1">Supabase:</span>
                  <code className="text-slate-300 break-all select-all">
                    postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
                  </code>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-cyan-400 font-bold block mb-1">Render / Railway / Tembo:</span>
                  <code className="text-slate-300 break-all select-all">
                    postgresql://postgres:password@junction.proxy.rlwy.net:5432/railway?sslmode=require
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Activity Terminal Log */}
        <section className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
                Canlı İşlem & Bağlantı Günlüğü (Live Logs)
              </span>
            </div>
            <button
              onClick={() => setLogs([])}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              Günlüğü Temizle
            </button>
          </div>

          <div className="p-3 font-mono text-xs max-h-48 overflow-y-auto space-y-1.5 bg-slate-950/60">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 text-[11px] leading-relaxed">
                  <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                  <span
                    className={`font-semibold shrink-0 ${
                      log.type === 'success'
                        ? 'text-emerald-400'
                        : log.type === 'error'
                        ? 'text-rose-400'
                        : log.type === 'warning'
                        ? 'text-amber-400'
                        : 'text-indigo-400'
                    }`}
                  >
                    [{log.type.toUpperCase()}]
                  </span>
                  <span className="text-slate-200">{log.title}</span>
                  {log.durationMs !== undefined && (
                    <span className="text-slate-400 text-[10px]">({log.durationMs}ms)</span>
                  )}
                  {log.detail && <span className="text-slate-500 truncate max-w-md">&rarr; {log.detail}</span>}
                </div>
              ))
            ) : (
              <div className="text-slate-600 text-center py-3">Henüz işlem kaydı yok.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

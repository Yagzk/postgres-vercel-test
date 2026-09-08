-- ==============================================================================
-- PostgreSQL Test Tablosu Şeması (Schema)
-- Bu dosyayı pgAdmin, DBeaver, Supabase SQL Editor veya Neon Console üzerinde çalıştırabilirsiniz.
-- ==============================================================================

-- 1. Test tablosunu oluştur
CREATE TABLE IF NOT EXISTS test_records (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    payload JSONB,
    latency_ms NUMERIC(8, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tarih bazlı hızlı sorgular ve sıralama için indeks
CREATE INDEX IF NOT EXISTS idx_test_records_created_at ON test_records(created_at DESC);

-- 3. Kategori filtreleme indeksi
CREATE INDEX IF NOT EXISTS idx_test_records_category ON test_records(category);

-- 4. JSONB içi sorguları hızlandırmak için GIN indeksi (Opsiyonel)
CREATE INDEX IF NOT EXISTS idx_test_records_payload ON test_records USING GIN (payload);

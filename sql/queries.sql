-- ==============================================================================
-- PostgreSQL Tanı, Performans ve Test Sorguları (Diagnostic Queries)
-- ==============================================================================

-- 1. Veritabanı ve Sürüm Bilgisi
SELECT 
    current_database() AS veritabani,
    current_user AS kullanici,
    version() AS postgres_surumu,
    NOW() AS sunucu_zamani;

-- 2. Aktif Bağlantı Sayısı ve Maksimum Kapasite
SELECT 
    (SELECT count(*) FROM pg_stat_activity) AS aktif_baglanti_sayisi,
    current_setting('max_connections') AS maksimum_baglanti_limiti;

-- 3. Veritabanı Boyutu
SELECT pg_size_pretty(pg_database_size(current_database())) AS veritabani_boyutu;

-- 4. Tabloların Boyutları ve Satır Sayıları
SELECT 
    relname AS tablo_adi,
    pg_size_pretty(pg_total_relation_size(relid)) AS toplam_boyut,
    n_live_tup AS tahmini_satir_sayisi
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- 5. Test Kayıtlarını Listeleme (En Yeni 20 Kayıt)
SELECT 
    id,
    title,
    category,
    payload,
    latency_ms,
    created_at
FROM test_records
ORDER BY created_at DESC
LIMIT 20;

-- 6. Kategoriye Göre Ortalama Gecikme (ms) İstatistiği
SELECT 
    category,
    COUNT(*) AS kayit_sayisi,
    ROUND(AVG(latency_ms), 2) AS ortalama_gecikme_ms,
    MIN(latency_ms) AS en_hizli_ms,
    MAX(latency_ms) AS en_yavas_ms
FROM test_records
GROUP BY category
ORDER BY ortalama_gecikme_ms ASC;

-- 7. JSONB İçindeki Belirli Bir Alanı Sorgulama (Örn: runtime)
SELECT 
    id, 
    title, 
    payload->>'runtime' AS calisma_zamani,
    latency_ms
FROM test_records
WHERE payload ? 'runtime';

-- 8. Test Tablosunu Temizleme (Truncate)
-- TRUNCATE TABLE test_records RESTART IDENTITY;

-- 9. Test Tablosunu Tamamen Kaldırma (Drop)
-- DROP TABLE IF EXISTS test_records;

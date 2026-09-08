-- ==============================================================================
-- PostgreSQL Test Verisi Ekleme (Seed Data)
-- Test amacıyla örnek kayıtlar ekler.
-- ==============================================================================

INSERT INTO test_records (title, category, payload, latency_ms) VALUES
('Vercel Cold Start Testi', 'benchmark', '{"region": "fra1", "status": "success", "runtime": "nodejs22.x", "isCold": true}'::jsonb, 42.50),
('Kullanıcı Giriş Denemesi', 'user_action', '{"userId": "usr_991", "action": "LOGIN", "ip": "192.168.1.1"}'::jsonb, 18.20),
('Örnek Sipariş Kaydı', 'ecommerce_order', '{"orderId": "ord_5521", "amount": 149.90, "currency": "TRY", "items": ["Next.js Kitap", "Sticker"]}'::jsonb, 24.10),
('Sistem Sağlık Kontrolü', 'system_log', '{"memoryUsage": "64MB", "activeConnections": 3, "poolSize": 10}'::jsonb, 12.80),
('Warm Query Performansı', 'benchmark', '{"region": "fra1", "status": "success", "runtime": "nodejs22.x", "isCold": false}'::jsonb, 15.40);

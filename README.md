# 🐘 PostgreSQL Test & Benchmark Suite (Vercel Ready)

Vercel ve serverless ortamlarda PostgreSQL veritabanınızın bağlantısını, gecikme süresini (latency), yazma/okuma (CRUD) performansını ve sağlığını test etmek için özel olarak tasarlanmış modern bir test projesidir.

---

## 🚀 Özellikler

1. **🏥 Sağlık ve Metadata Testi**:
   - PostgreSQL sürümü, sunucu saati, kullanıcı adı, veritabanı adı.
   - Aktif bağlantı havuzu (pool) kullanımı ve sınırları.
   - Mevcut tüm public tabloların listesi.

2. **📝 Canlı CRUD Testi**:
   - Tek tıkla `test_records` tablosunu oluşturma/sıfırlama.
   - JSONB payload içeren gerçek test verisi yazma ve **yazma gecikmesini (ms)** ölçme.
   - Kayıtları listeleme, filtreleme ve tek tek/toplu silme.

3. **⚡ Serverless Benchmark & Gecikme Analizi**:
   - 3x, 5x, 10x veya 20x ardışık sorgu testi.
   - **Cold Start** vs **Warm Connection** karşılaştırması.
   - Min, Max, Ortalama gecikme ve Başarı Oranı istatistikleri.

4. **💻 Canlı SQL Konsolu**:
   - İstediğiniz özel `SELECT` veya yönetim sorgularını tarayıcıdan doğrudan çalıştırma.

5. **🛡️ SSL & Serverless Uyumlu**:
   - Neon, Supabase, Railway, Render, AWS RDS, Aiven gibi tüm bulut PostgreSQL sağlayıcıları ile tak-çalıştır uyumlu.

---

## 🛠️ Yerel Geliştirme (Local Setup)

1. Proje dizinine gidin:
   ```bash
   cd C:\Users\misil\postgres-vercel-test
   ```

2. `.env.local` dosyasını açın ve veritabanı bağlantı dizesini ekleyin:
   ```env
   DATABASE_URL="postgres://kullanici:sifre@host:5432/veritabani_adi?sslmode=require"
   ```

3. Geliştirici sunucusunu başlatın:
   ```bash
   npm run dev
   ```

4. Tarayıcınızda açın: **[http://localhost:3000](http://localhost:3000)**

---

## ☁️ Vercel'e Dağıtım (Deploy to Vercel)

### Yöntem 1: GitHub ile (Önerilen)
1. Bu projeyi bir GitHub/GitLab reposuna aktarın.
2. [Vercel Dashboard](https://vercel.com/new) üzerinden repoyu içeri aktarın (Import).
3. **Environment Variables** bölümüne:
   - **Name:** `DATABASE_URL`
   - **Value:** `postgresql://...`
4. **Deploy** butonuna basın.

### Yöntem 2: Vercel CLI ile
```bash
npm i -g vercel
vercel
```

---

## 📌 Popüler Sağlayıcılar İçin Bağlantı Formatları

- **Neon:** `postgres://user:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require`
- **Supabase:** `postgresql://postgres.xxx:sifre@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require`
- **Render / Railway:** `postgresql://postgres:sifre@host:5432/dbname?sslmode=require`

# Application Catalog

Sistem manajemen katalog aplikasi internal untuk mengelola data aplikasi, grup aplikasi, backlog pengembangan, dan deployment. Dibangun dengan stack modern menggunakan React (Frontend) dan Node.js Express (Backend).

## Struktur Proyek

- `/frontend`: Aplikasi React + Vite dengan antarmuka premium.
- `/backend`: API server menggunakan Express.js, Sequelize (PostgreSQL), dan Google Cloud Storage.

## Persiapan Lokal

### Prerequisites
- Node.js (v18 atau lebih baru)
- PostgreSQL
- Akun Google Cloud (untuk GCS dan OAuth)

### Menjalankan Backend
1. Masuk ke direktori `backend`.
2. Install dependensi: `npm install`.
3. Salin `.env.example` ke `.env` dan lengkapi variabelnya.
4. Jalankan server: `npm run dev`.

### Menjalankan Frontend
1. Masuk ke direktori `frontend`.
2. Install dependensi: `npm install`.
3. Buat file `.env` dan tambahkan `VITE_API_URL=http://localhost:5050/api`.
4. Jalankan aplikasi: `npm run dev`.

---

## Panduan Deployment ke Cloud Run

Aplikasi ini dirancang untuk dideploy sebagai dua layanan terpisah di Google Cloud Run.

### 1. Persiapan Variabel Lingkungan
Gunakan file `backend/env.yaml` untuk mengonfigurasi variabel lingkungan backend. Jangan lupa mengganti nilai placeholder dengan nilai yang sebenarnya.

### 2. Deployment Backend
Jalankan perintah berikut di dalam direktori `backend`:
```bash
gcloud run deploy application-catalog-api \
  --source . \
  --env-vars-file env.yaml \
  --region asia-southeast2 \
  --allow-unauthenticated
```

### 3. Deployment Frontend
Jalankan perintah berikut di dalam direktori `frontend`:
```bash
# Ganti [BACKEND_URL] dengan URL backend yang didapat dari langkah sebelumnya
gcloud run deploy application-catalog-web \
  --source . \
  --set-env-vars VITE_API_URL=[BACKEND_URL]/api \
  --region asia-southeast2 \
  --allow-unauthenticated
```

---

## Otomatisasi CI/CD (GitHub Actions)

Proyek ini menyertakan workflow GitHub Actions untuk deployment otomatis.

### Setup GitHub Secrets
Anda perlu menambahkan Secret berikut di repository GitHub:
- `GCP_PROJECT_ID`: ID Proyek Google Cloud Anda.
- `GCP_SA_KEY`: Kunci Service Account (JSON format) dengan peran `Cloud Run Admin` dan `Storage Admin`.

Workflow dapat ditemukan di `.github/workflows/deploy.yml`.

## Lisensi
[ISC](LICENSE)

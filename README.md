## Laundry Management & Client App

Monorepo berisi Backend (Node.js + Express + PostgreSQL) dan Frontend (React + Vite + TailwindCSS).

### Struktur Folder
- `backend/`: API server (port 3000)
- `frontend/`: Web app (port 5173)

### Prasyarat
- Node.js 18+
- PostgreSQL (atau Koyeb PostgreSQL)

### Konfigurasi Environment
Backend: salin `backend/.env.example` menjadi `backend/.env` lalu isi:
```
PORT=3000
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME
PGSSL=true
JWT_SECRET=supersecretjwt
```

Frontend: salin `frontend/.env.example` menjadi `frontend/.env` (opsional jika API bukan di localhost):
```
VITE_API_URL=http://localhost:3000
```

### Menjalankan Proyek (Single Server)
Backend akan sekaligus melayani Frontend (static build) pada port 3000.

1) Build Frontend ke Backend
```
cd backend
npm install
npm run build
```

2) Jalankan Backend
```
cd backend
npm run dev
```
App akan tersedia di `http://localhost:3000`.

### Mode Dev Terpisah (opsional)
Jika ingin hot reload Frontend:
```
# Terminal 1
cd backend && npm run dev
# Terminal 2
cd frontend && npm install && npm run dev
```
Set `frontend/.env`:
```
VITE_API_URL=http://localhost:3000
```

### Fitur Utama
- Auth: Register Owner/Customer dan Login (JWT)
- Laundry (owner): kelola profil (nama, alamat, foto upload), hapus
- Daftar laundry publik (foto, alamat, rating) + pagination
- Orders: Customer membuat order ke Owner; Owner kelola status
- Ratings: Customer memberi rating (1-5) pada order yang sudah selesai; rata-rata rating otomatis

### Catatan
- Folder upload disajikan dari `backend/uploads` dan diakses via `/uploads/<filename>`
- Pastikan `DATABASE_URL` valid (Koyeb butuh `PGSSL=true`).

### Docker (opsional)
Siapkan environment pada host (variabel diekspor atau `.env` di root yang memuat DATABASE_URL, JWT_SECRET, dll), lalu jalankan:
```
docker compose up --build
```
- Backend akan berjalan di `http://localhost:3000`
- Frontend akan berjalan di `http://localhost:5173`



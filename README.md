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

### Menjalankan Proyek
1) Backend
```
cd backend
npm install
npm run dev
```
API akan tersedia di `http://localhost:3000`.

2) Frontend
```
cd frontend
npm install
npm run dev
```
App akan tersedia di `http://localhost:5173`.

### Fitur Utama
- Auth: Register Owner/Customer dan Login (JWT)
- Laundry (owner): kelola profil (nama, alamat, foto upload), hapus
- Daftar laundry publik (foto, alamat, rating)
- Orders: Customer membuat order ke Owner; Owner kelola status

### Catatan
- Folder upload disajikan dari `backend/uploads` dan diakses via `/uploads/<filename>`
- Pastikan `DATABASE_URL` valid (Koyeb butuh `PGSSL=true`).


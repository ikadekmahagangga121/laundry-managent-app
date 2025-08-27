import { useEffect, useState } from 'react'
import api, { setAuthToken } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function OwnerDashboard() {
  const { token } = useAuth()
  const [profile, setProfile] = useState(null)
  const [incoming, setIncoming] = useState([])
  const [nama_laundry, setNamaLaundry] = useState('')
  const [alamat, setAlamat] = useState('')
  const [file, setFile] = useState(null)

  useEffect(() => { setAuthToken(token) }, [token])

  useEffect(() => {
    api.get('/laundries').then(({ data }) => {
      const mine = data.find(d => d.id === parseJwt(token)?.id)
      if (mine) {
        setProfile(mine)
        setNamaLaundry(mine.nama_laundry)
        setAlamat(mine.alamat)
      }
    })
    api.get('/orders/incoming').then(r => setIncoming(r.data))
  }, [token])

  const saveProfile = async () => {
    const { data } = await api.put('/laundries/me', { nama_laundry, alamat })
    setProfile(data)
  }

  const updateStatus = async (id, status) => {
    const { data } = await api.patch(`/orders/${id}/status`, { status })
    setIncoming(prev => prev.map(o => o.id === id ? data : o))
  }

  const uploadFoto = async () => {
    if (!file) return
    const formData = new FormData()
    formData.append('foto', file)
    const { data } = await api.post('/laundries/me/foto', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    setProfile(data)
    setFile(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded p-4 border">
        <h3 className="font-semibold mb-3">Profil Laundry</h3>
        <div className="space-y-2">
          <input className="w-full border rounded p-2" value={nama_laundry} onChange={e=>setNamaLaundry(e.target.value)} />
          <input className="w-full border rounded p-2" value={alamat} onChange={e=>setAlamat(e.target.value)} />
          <button className="bg-blue-600 text-white rounded px-4 py-2" onClick={saveProfile}>Simpan</button>
          <div className="pt-3">
            {profile?.foto && <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${profile.foto}`} className="h-32 rounded mb-2" />}
            <input type="file" onChange={e=>setFile(e.target.files?.[0] || null)} className="w-full border rounded p-2" />
            <button className="mt-2 border rounded px-4 py-2" onClick={uploadFoto} disabled={!file}>Upload Foto</button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded p-4 border">
        <h3 className="font-semibold mb-3">Pesanan Masuk</h3>
        <div className="space-y-3">
          {incoming.map(o => (
            <div key={o.id} className="border rounded p-3">
              <div className="text-sm text-gray-700">Customer: {o.customer_nama}</div>
              <div className="text-sm">Status: {o.status}</div>
              <div className="flex gap-2 mt-2 text-sm">
                {['accepted','processing','completed','cancelled'].map(s => (
                  <button key={s} onClick={() => updateStatus(o.id, s)} className="px-3 py-1 border rounded">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function parseJwt(token) {
  if (!token) return null
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''))
  return JSON.parse(jsonPayload)
}


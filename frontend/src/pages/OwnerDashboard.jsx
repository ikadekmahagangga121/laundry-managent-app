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
  const [billing, setBilling] = useState({ plan: 'free', plan_expiry: null, wallet_balance: 0 })
  const [topupAmount, setTopupAmount] = useState('')
  const [topupQR, setTopupQR] = useState(null)

  useEffect(() => { setAuthToken(token) }, [token])

  useEffect(() => {
    const me = parseJwt(token)
    if (me?.id) {
      api.get(`/laundries/${me.id}`).then(({ data }) => {
        setProfile(data)
        setNamaLaundry(data.nama_laundry)
        setAlamat(data.alamat)
      }).catch(()=>{})
    }
    api.get('/orders/incoming').then(r => setIncoming(r.data))
    api.get('/billing/me').then(r => setBilling(r.data))
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

  const doTopup = async () => {
    const amt = parseInt(topupAmount || '0', 10)
    if (!amt || amt < 1000) return
    const { data } = await api.post('/billing/topup', { amount: amt, method: 'qris' })
    setTopupQR(data.qrUrl)
  }

  const confirmTopup = async () => {
    // Simplify: confirm by the latest created topup? Better approach: store id from doTopup
    // For demo: re-initiate and immediately confirm (not ideal for prod)
    const amt = parseInt(topupAmount || '0', 10)
    const { data } = await api.post('/billing/topup', { amount: amt, method: 'qris' })
    await api.post(`/billing/topup/${data.id}/confirm`)
    const meBilling = await api.get('/billing/me')
    setBilling(meBilling.data)
    setTopupQR(null)
    setTopupAmount('')
  }

  const changePlan = async (plan) => {
    await api.post('/billing/plan', { plan })
    const meBilling = await api.get('/billing/me')
    setBilling(meBilling.data)
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
            {profile?.foto && <img src={`${import.meta.env.VITE_API_URL || ''}${profile.foto}`} className="h-32 rounded mb-2" />}
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

      <div className="bg-white rounded p-4 border md:col-span-2">
        <h3 className="font-semibold mb-3">Billing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm">Plan: {billing.plan}</div>
            <div className="text-sm">Saldo: Rp {Number(billing.wallet_balance || 0).toLocaleString('id-ID')}</div>
            {billing.plan_expiry && <div className="text-xs text-gray-500">Berlaku hingga: {new Date(billing.plan_expiry).toLocaleString()}</div>}
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Top-up Saldo</div>
            <input className="border rounded p-2 w-full" placeholder="Jumlah (>=1000)" value={topupAmount} onChange={e=>setTopupAmount(e.target.value)} />
            <div className="flex gap-2 mt-2">
              <button className="border px-3 py-1 rounded" onClick={doTopup}>Buat QR</button>
              <button className="border px-3 py-1 rounded" onClick={confirmTopup}>Simulasikan Lunas</button>
            </div>
            {topupQR && <img src={topupQR} className="mt-2 h-40" />}
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Ganti Plan</div>
            <div className="flex gap-2 flex-wrap">
              {['free','pro','professional'].map(p => (
                <button key={p} className={`border px-3 py-1 rounded ${billing.plan===p?'bg-blue-50':''}`} onClick={()=>changePlan(p)}>{p}</button>
              ))}
            </div>
          </div>
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


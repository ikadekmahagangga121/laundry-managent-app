import { useEffect, useState } from 'react'
import api, { setAuthToken } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function CustomerDashboard() {
  const { token } = useAuth()
  const [laundries, setLaundries] = useState([])
  const [orders, setOrders] = useState([])
  const [ownerId, setOwnerId] = useState('')
  const [catatan, setCatatan] = useState('')
  const [ratingMap, setRatingMap] = useState({})

  useEffect(() => { setAuthToken(token) }, [token])

  useEffect(() => {
    api.get('/laundries').then(r => setLaundries(r.data))
    api.get('/orders/me').then(r => setOrders(r.data))
  }, [token])

  const createOrder = async () => {
    const { data } = await api.post('/orders', { owner_id: ownerId, catatan })
    setOrders(prev => [data, ...prev])
    setOwnerId(''); setCatatan('')
  }

  const submitRating = async (orderId) => {
    const rating = Number(ratingMap[orderId]?.rating || 0)
    const comment = ratingMap[orderId]?.comment || ''
    if (!rating) return
    await api.post(`/orders/${orderId}/rating`, { rating, comment })
    // refresh list
    const { data } = await api.get('/orders/me')
    setOrders(data)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded p-4 border">
        <h3 className="font-semibold mb-3">Buat Order</h3>
        <select value={ownerId} onChange={e=>setOwnerId(e.target.value)} className="w-full border rounded p-2">
          <option value="">Pilih Laundry</option>
          {laundries.map(l => <option key={l.id} value={l.id}>{l.nama_laundry}</option>)}
        </select>
        <input className="w-full border rounded p-2 mt-2" placeholder="Catatan" value={catatan} onChange={e=>setCatatan(e.target.value)} />
        <button className="bg-blue-600 text-white rounded px-4 py-2 mt-2" onClick={createOrder} disabled={!ownerId}>Kirim</button>
      </div>

      <div className="bg-white rounded p-4 border">
        <h3 className="font-semibold mb-3">Riwayat & Tracking</h3>
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="border rounded p-3">
              <div className="text-sm">Laundry: {o.nama_laundry}</div>
              <div className="text-sm">Status: {o.status}</div>
              <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString()}</div>
              {o.status === 'completed' && (
                <div className="mt-2 flex items-center gap-2">
                  <select className="border rounded p-1 text-sm" value={ratingMap[o.id]?.rating || ''} onChange={e=>setRatingMap(prev=>({ ...prev, [o.id]: { ...prev[o.id], rating: e.target.value } }))}>
                    <option value="">Rate</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <input className="border rounded p-1 text-sm" placeholder="Komentar" value={ratingMap[o.id]?.comment || ''} onChange={e=>setRatingMap(prev=>({ ...prev, [o.id]: { ...prev[o.id], comment: e.target.value } }))} />
                  <button className="px-3 py-1 border rounded text-sm" onClick={()=>submitRating(o.id)} disabled={!ratingMap[o.id]?.rating}>Kirim</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


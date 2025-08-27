import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function Home() {
  const [laundries, setLaundries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/laundries').then(r => setLaundries(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading...</div>
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {laundries.map(l => (
        <div key={l.id} className="bg-white rounded-lg p-4 shadow-sm border">
          {l.foto && <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${l.foto}`} className="h-40 w-full object-cover rounded" />}
          <div className="mt-2">
            <div className="font-semibold">{l.nama_laundry}</div>
            <div className="text-sm text-gray-600">{l.alamat}</div>
            <div className="text-sm">Rating: {l.rating ?? 0}</div>
          </div>
        </div>
      ))}
    </div>
  )
}


import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function Home() {
  const [laundries, setLaundries] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    api.get('/laundries', { params: { page, limit: 9 } })
      .then(r => {
        setLaundries(r.data.data)
        setTotalPages(r.data.meta.totalPages)
      })
      .finally(() => setLoading(false))
  }, [page])

  if (loading) return <div>Loading...</div>
  return (
    <>
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
      <div className="flex items-center justify-center gap-2 mt-4">
        <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=>Math.max(1, p-1))} disabled={page<=1}>Prev</button>
        <div className="text-sm">Page {page} / {totalPages}</div>
        <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=>Math.min(totalPages, p+1))} disabled={page>=totalPages}>Next</button>
      </div>
    </>
  )
}


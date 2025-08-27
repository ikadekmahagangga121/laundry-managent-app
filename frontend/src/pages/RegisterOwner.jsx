import { useState } from 'react'
import api from '../lib/api'

export default function RegisterOwner() {
  const [form, setForm] = useState({ nama_laundry: '', alamat: '', email: '', password: '', foto: '' })
  const [ok, setOk] = useState(null)
  const [err, setErr] = useState(null)
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setOk(null); setErr(null)
    try {
      await api.post('/auth/register-owner', form)
      setOk('Registrasi berhasil. Silakan login sebagai owner.')
    } catch (e) {
      setErr(e.response?.data?.message || 'Gagal registrasi')
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow border">
      <h2 className="text-lg font-semibold mb-4">Register Owner</h2>
      <form className="space-y-3" onSubmit={submit}>
        <input name="nama_laundry" value={form.nama_laundry} onChange={onChange} placeholder="Nama Laundry" className="w-full border rounded p-2" />
        <input name="alamat" value={form.alamat} onChange={onChange} placeholder="Alamat" className="w-full border rounded p-2" />
        <input name="email" value={form.email} onChange={onChange} placeholder="Email" className="w-full border rounded p-2" />
        <input type="password" name="password" value={form.password} onChange={onChange} placeholder="Password" className="w-full border rounded p-2" />
        <input name="foto" value={form.foto} onChange={onChange} placeholder="URL Foto (opsional)" className="w-full border rounded p-2" />
        {ok && <div className="text-green-600 text-sm">{ok}</div>}
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="bg-blue-600 text-white rounded px-4 py-2">Register</button>
      </form>
    </div>
  )
}


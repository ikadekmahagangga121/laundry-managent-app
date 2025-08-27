import { useState } from 'react'
import api from '../lib/api'

export default function RegisterCustomer() {
  const [form, setForm] = useState({ nama: '', email: '', password: '', no_hp: '', alamat: '' })
  const [ok, setOk] = useState(null)
  const [err, setErr] = useState(null)
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setOk(null); setErr(null)
    try {
      await api.post('/auth/register-customer', form)
      setOk('Registrasi berhasil. Silakan login sebagai customer.')
    } catch (e) {
      setErr(e.response?.data?.message || 'Gagal registrasi')
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow border">
      <h2 className="text-lg font-semibold mb-4">Register Customer</h2>
      <form className="space-y-3" onSubmit={submit}>
        <input name="nama" value={form.nama} onChange={onChange} placeholder="Nama" className="w-full border rounded p-2" />
        <input name="email" value={form.email} onChange={onChange} placeholder="Email" className="w-full border rounded p-2" />
        <input type="password" name="password" value={form.password} onChange={onChange} placeholder="Password" className="w-full border rounded p-2" />
        <input name="no_hp" value={form.no_hp} onChange={onChange} placeholder="No HP" className="w-full border rounded p-2" />
        <input name="alamat" value={form.alamat} onChange={onChange} placeholder="Alamat" className="w-full border rounded p-2" />
        {ok && <div className="text-green-600 text-sm">{ok}</div>}
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="bg-blue-600 text-white rounded px-4 py-2">Register</button>
      </form>
    </div>
  )
}


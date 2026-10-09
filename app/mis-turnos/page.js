'use client'

import { useState } from 'react'
import { supabase } from '../supabase'

export default function MisTurnosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [appointments, setAppointments] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchTerm) return

    setLoading(true)
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_time,
        status,
        client_name,
        client_ci,
        client_phone,
        shops ( name, whatsapp_number ),
        barbers ( name ),
        services ( name, price )
      `)
      .or(`client_phone.eq.${searchTerm},client_ci.eq.${searchTerm}`)
      .order('appointment_time', { ascending: true })

    if (!error && data) {
      setAppointments(data)
    }
    setSearched(true)
    setLoading(false)
  }

  const handleCancel = async (id) => {
    if (!confirm('¿Estás seguro de que deseas cancelar este turno?')) return

    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (error) {
      alert('Error al cancelar el turno: ' + error.message)
    } else {
      alert('Turno cancelado con éxito.')
      setAppointments(appointments.map(item => 
        item.id === id ? { ...item, status: 'cancelled' } : item
      ))
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6">
        <h1 className="text-xl font-black text-amber-400 tracking-wider uppercase mb-2 text-center">Mis Turnos</h1>
        <p className="text-zinc-400 text-xs text-center mb-6">Ingresa tu número de Cédula (CI) o Teléfono para ver o cancelar tus citas.</p>

        <form onSubmit={handleSearch} className="space-y-4 mb-6">
          <div>
            <input
              type="text"
              required
              placeholder="Ej. 1234567 o 0981123456"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 text-zinc-950 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-amber-300 transition-all"
          >
            {loading ? 'Buscando...' : 'Buscar mis turnos'}
          </button>
        </form>

        {searched && (
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <p className="text-center text-xs text-zinc-500 py-4">No encontramos turnos con ese dato.</p>
            ) : (
              appointments.map((item) => {
                const isCancelled = item.status === 'cancelled'
                const dateFormatted = new Date(item.appointment_time).toLocaleString('es-PY')

                return (
                  <div key={item.id} className={`p-4 rounded-2xl border ${isCancelled ? 'bg-zinc-950/40 border-zinc-900 opacity-50' : 'bg-zinc-950 border-zinc-800'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-sm text-zinc-200">{item.shops?.name}</p>
                        <p className="text-xs text-amber-400">{item.services?.name} con {item.barbers?.name}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${isCancelled ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {isCancelled ? 'Cancelado' : 'Confirmado'}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 mb-1">👤 {item.client_name} (CI: {item.client_ci || 'N/D'})</p>
                    <p className="text-xs text-zinc-400 mb-3">📅 {dateFormatted}</p>

                    {!isCancelled && (
                      <button
                        onClick={() => handleCancel(item.id)}
                        className="w-full bg-red-500/10 border border-red-500/20 text-red-400 py-2 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all"
                      >
                        Cancelar este Turno
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="/central" className="text-xs text-zinc-500 hover:text-amber-400 underline">
            ← Volver a la barbería
          </a>
        </div>
      </div>
    </main>
  )
}
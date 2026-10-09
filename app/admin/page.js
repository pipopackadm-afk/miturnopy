'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function AdminPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAppointments() {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          client_name,
          client_phone,
          appointment_time,
          status,
          shops ( name ),
          barbers ( name ),
          services ( name, price )
        `)
        .order('appointment_time', { ascending: true })

      if (!error && data) {
        setAppointments(data)
      }
      setLoading(false)
    }

    fetchAppointments()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Cargando turnos...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Panel de Administración - Turnos</h1>

        <div className="bg-white rounded-xl shadow border divide-y">
          {appointments.length === 0 ? (
            <p className="p-4 text-gray-500 text-center">No hay turnos registrados.</p>
          ) : (
            appointments.map((item) => (
              <div key={item.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900">{item.client_name} ({item.client_phone})</p>
                  <p className="text-xs text-gray-500">
                    Barbería: <span className="font-medium text-gray-700">{item.shops?.name}</span> | 
                    Barbero: <span className="font-medium text-gray-700">{item.barbers?.name}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Servicio: <span className="font-medium text-gray-700">{item.services?.name}</span> (Gs. {Number(item.services?.price || 0).toLocaleString('es-PY')})
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-emerald-600">
                    {new Date(item.appointment_time).toLocaleString('es-PY')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '../supabase'

export default function ShopPage({ params }) {
  const { slug } = use(params)
  
  const [shop, setShop] = useState(null)
  const [services, setServices] = useState([])
  const [barbers, setBarbers] = useState([])
  const [loading, setLoading] = useState(true)

  const [step, setStep] = useState('home')
  const [selectedService, setSelectedService] = useState('')
  const [selectedBarber, setSelectedBarber] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientCi, setClientCi] = useState('')
  
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  
  const [selectedTime, setSelectedTime] = useState('')
  const [bookedTimes, setBookedTimes] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadData() {
      const { data: shopData } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', slug)
        .single()

      if (shopData) {
        setShop(shopData)

        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('shop_id', shopData.id)
        setServices(servicesData || [])

        const { data: barbersData } = await supabase
          .from('barbers')
          .select('*')
          .eq('shop_id', shopData.id)
        setBarbers(barbersData || [])
      }
      setLoading(false)
    }

    loadData()
  }, [slug])

  useEffect(() => {
    async function fetchBookedAppointments() {
      if (!appointmentDate || !selectedBarber) {
        setBookedTimes([])
        return
      }

      const startOfDay = `${appointmentDate}T00:00:00`
      const endOfDay = `${appointmentDate}T23:59:59`

      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('barber_id', selectedBarber)
        .gte('appointment_time', startOfDay)
        .lte('appointment_time', endOfDay)
        .neq('status', 'cancelled')

      if (!error && data) {
        const times = data.map((item) => {
          const dateObj = new Date(item.appointment_time)
          return dateObj.toTimeString().slice(0, 5)
        })
        setBookedTimes(times)
      }
    }

    fetchBookedAppointments()
  }, [appointmentDate, selectedBarber])

  const getNextDays = () => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      const dateString = d.toISOString().split('T')[0]
      const dayName = d.toLocaleDateString('es-PY', { weekday: 'short' }).toUpperCase()
      const dayNumber = d.getDate()
      days.push({ dateString, dayName, dayNumber })
    }
    return days
  }

  const weekDays = getNextDays()

  const morningSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00']
  const afternoonSlots = ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!shop || !selectedTime) return

    setSubmitting(true)

    const dateTime = new Date(`${appointmentDate}T${selectedTime}:00`)

    const { error } = await supabase.from('appointments').insert({
      shop_id: shop.id,
      service_id: selectedService,
      barber_id: selectedBarber,
      client_name: clientName,
      client_phone: clientPhone,
      client_ci: clientCi,
      appointment_time: dateTime.toISOString(),
      status: 'pending',
    })

    setSubmitting(false)

    if (error) {
      alert('Error al agendar el turno: ' + error.message)
    } else {
      setSuccess(true)

      const serviceObj = services.find((s) => s.id === selectedService)
      const barberObj = barbers.find((b) => b.id === selectedBarber)

      const serviceName = serviceObj ? serviceObj.name : 'Servicio'
      const barberName = barberObj ? barberObj.name : 'Cualquiera'

      const text = `¡Hola *${shop.name}*! 👋\n` +
        `Acabo de agendar un turno:\n\n` +
        `👤 *Cliente:* ${clientName}\n` +
        `🪪 *Cédula:* ${clientCi}\n` +
        `📱 *Teléfono:* ${clientPhone}\n` +
        `💈 *Servicio:* ${serviceName}\n` +
        `✂️ *Barbero:* ${barberName}\n` +
        `📅 *Fecha:* ${appointmentDate}\n` +
        `⏰ *Hora:* ${selectedTime}\n\n` +
        `¡Muchas gracias!`

      const cleanPhone = (shop.whatsapp_number || '').replace(/[^0-9]/g, '')
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      
      window.open(waUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <p>Cargando barbería...</p>
      </main>
    )
  }

  if (!shop) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <h1 className="text-xl font-bold">Barbería no encontrada</h1>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
        
        {step === 'home' && (
          <div className="text-center py-6">
            <div className="w-20 h-20 mx-auto bg-amber-400/10 border border-amber-400/20 rounded-full flex items-center justify-center mb-4 text-amber-400 text-2xl font-black">
              {shop.name.slice(0, 2).toUpperCase()}
            </div>

            <h1 className="text-2xl font-black text-amber-400 tracking-wider uppercase mb-1">{shop.name}</h1>
            <p className="text-zinc-400 text-xs mb-8 uppercase tracking-widest">Barbería Profesional</p>

            <div className="space-y-3">
              <button
                onClick={() => setStep(1)}
                className="w-full bg-amber-400 text-zinc-950 py-4 rounded-2xl font-black text-sm tracking-wider uppercase hover:bg-amber-300 shadow-lg shadow-amber-400/10 transition-all flex items-center justify-center gap-2"
              >
                📅 Reservar Turno
              </button>

              <a
                href="/mis-turnos"
                className="w-full block bg-zinc-950 border border-zinc-800 text-amber-400 py-3.5 rounded-2xl font-bold text-sm hover:border-zinc-700 transition-all text-center"
              >
                🔍 Ver / Cancelar mis turnos
              </a>

              {shop.whatsapp_number && (
                <a
                  href={`https://wa.me/${shop.whatsapp_number.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full block bg-zinc-950 border border-zinc-800 text-zinc-200 py-3.5 rounded-2xl font-bold text-sm hover:border-zinc-700 transition-all text-center"
                >
                  💬 WhatsApp
                </a>
              )}

              {shop.google_maps_url && (
                <a
                  href={shop.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full block bg-zinc-950 border border-zinc-800 text-zinc-200 py-3.5 rounded-2xl font-bold text-sm hover:border-zinc-700 transition-all text-center"
                >
                  📍 Ubicación
                </a>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800 text-zinc-500 text-xs uppercase tracking-widest mb-2">
              Seguinos
            </div>
            <div className="flex justify-center gap-4">
              {shop.instagram_handle && (
                <a
                  href={`https://instagram.com/${shop.instagram_handle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-pink-400 hover:border-zinc-700"
                >
                  📷
                </a>
              )}
            </div>
          </div>
        )}

        {step !== 'home' && !success && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  if (step === 1) setStep('home')
                  else setStep(step - 1)
                }}
                className="text-xs bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl text-zinc-400 hover:text-white"
              >
                ← Volver
              </button>
              <h2 className="text-sm font-bold tracking-widest text-amber-400 uppercase">Reservar Turno</h2>
            </div>

            <div className="grid grid-cols-4 gap-1 mb-6 text-center">
              {['Servicio', 'Barbero', 'Fecha', 'Datos'].map((name, index) => {
                const stepNum = index + 1
                const isActive = step === stepNum
                const isPassed = step > stepNum
                return (
                  <div key={name} className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive ? 'bg-amber-400 text-zinc-950' : isPassed ? 'bg-zinc-800 text-amber-400' : 'bg-zinc-950 border border-zinc-800 text-zinc-600'
                    }`}>
                      {stepNum}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1">{name}</span>
                  </div>
                )
              })}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-black text-zinc-100">Elegí tu Servicio</h3>
                <div className="space-y-2">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedService(s.id)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center ${
                        selectedService === s.id
                          ? 'bg-amber-400/10 border-amber-400 text-amber-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm">{s.name}</p>
                      </div>
                      <p className="font-black text-sm">Gs. {Number(s.price).toLocaleString('es-PY')}</p>
                    </button>
                  ))}
                </div>

                <button
                  disabled={!selectedService}
                  onClick={() => setStep(2)}
                  className="w-full bg-amber-400 text-zinc-950 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider mt-6 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-300 transition-all"
                >
                  Siguiente
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-black text-zinc-100">Elegí tu Barbero</h3>
                <div className="grid grid-cols-2 gap-3">
                  {barbers.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBarber(b.id)}
                      className={`p-4 rounded-2xl border text-center transition-all ${
                        selectedBarber === b.id
                          ? 'bg-amber-400/10 border-amber-400 text-amber-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="w-12 h-12 mx-auto bg-zinc-800 rounded-full mb-2 flex items-center justify-center font-bold text-lg text-amber-400">
                        {b.name[0]}
                      </div>
                      <p className="font-bold text-sm">{b.name}</p>
                    </button>
                  ))}
                </div>

                <button
                  disabled={!selectedBarber}
                  onClick={() => setStep(3)}
                  className="w-full bg-amber-400 text-zinc-950 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider mt-6 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-300 transition-all"
                >
                  Siguiente
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-black text-zinc-100">Fecha y Horario</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Día</label>
                  <div className="grid grid-cols-4 gap-2">
                    {weekDays.map((d) => {
                      const isSelected = appointmentDate === d.dateString
                      return (
                        <button
                          key={d.dateString}
                          type="button"
                          onClick={() => {
                            setAppointmentDate(d.dateString)
                            setSelectedTime('')
                          }}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'bg-amber-400 text-zinc-950 border-amber-400 font-bold'
                              : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="text-[10px] uppercase opacity-75">{d.dayName}</div>
                          <div className="text-base font-black">{d.dayNumber}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider">Horarios Disponibles</label>
                  
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Mañana</p>
                    <div className="grid grid-cols-3 gap-2">
                      {morningSlots.map((time) => {
                        const isBooked = bookedTimes.includes(time)
                        const isSelected = selectedTime === time
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={isBooked}
                            onClick={() => setSelectedTime(time)}
                            className={`p-2.5 text-xs font-bold rounded-xl border transition-all ${
                              isBooked
                                ? 'bg-zinc-900 text-zinc-600 border-zinc-800 line-through cursor-not-allowed'
                                : isSelected
                                ? 'bg-amber-400 text-zinc-950 border-amber-400'
                                : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Tarde</p>
                    <div className="grid grid-cols-3 gap-2">
                      {afternoonSlots.map((time) => {
                        const isBooked = bookedTimes.includes(time)
                        const isSelected = selectedTime === time
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={isBooked}
                            onClick={() => setSelectedTime(time)}
                            className={`p-2.5 text-xs font-bold rounded-xl border transition-all ${
                              isBooked
                                ? 'bg-zinc-900 text-zinc-600 border-zinc-800 line-through cursor-not-allowed'
                                : isSelected
                                ? 'bg-amber-400 text-zinc-950 border-amber-400'
                                : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <button
                  disabled={!selectedTime}
                  onClick={() => setStep(4)}
                  className="w-full bg-amber-400 text-zinc-950 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider mt-4 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-300 transition-all"
                >
                  Siguiente
                </button>
              </div>
            )}

            {step === 4 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-black text-zinc-100">Tus Datos</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Nro. de Cédula (CI)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1234567"
                    value={clientCi}
                    onChange={(e) => setClientCi(e.target.value)}
                    className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Teléfono</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 0981123456"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-amber-400 text-zinc-950 py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-amber-300 disabled:opacity-50 transition-all mt-6 shadow-lg shadow-amber-400/10"
                >
                  {submitting ? 'Confirmando...' : 'Confirmar y Enviar a WhatsApp'}
                </button>
              </form>
            )}
          </div>
        )}

        {success && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 p-6 rounded-2xl text-center">
            <h3 className="font-bold text-xl mb-2 text-emerald-400">¡Turno Agendado!</h3>
            <p className="text-xs text-zinc-300 mb-6">Tu cita se registró con éxito y se abrió WhatsApp.</p>
            <button
              onClick={() => {
                setSuccess(false)
                setStep('home')
                setSelectedService('')
                setSelectedBarber('')
                setClientName('')
                setClientPhone('')
                setClientCi('')
                setSelectedTime('')
              }}
              className="w-full bg-emerald-500 text-zinc-950 py-3 rounded-xl font-bold text-sm hover:bg-emerald-400 transition-all"
            >
              Volver al inicio
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
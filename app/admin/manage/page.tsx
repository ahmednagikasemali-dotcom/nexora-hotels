'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// خلفيات سفر فخمة متغيرة كل 7 ثواني
const travelBackgrounds = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1920&auto=format&fit=crop'
]

export default function NexoraDashboard() {
  const [currentBgIndex, setCurrentBgIndex] = useState(0)
  const [session, setSession] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)

  // أضفنا تاب 'users' للتنقل لإدارة الصلاحيات
  const [activeTab, setActiveTab] = useState<'bookings' | 'inventory' | 'booking-flow' | 'users'>('booking-flow')
  const [bookings, setBookings] = useState<any[]>([])
  const [hotels, setHotels] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  
  // حقول إضافة مستخدم جديد مباشرة من لوحة التحكم
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newRole, setNewRole] = useState('client')
  const [submittingUser, setSubmittingUser] = useState(false)

  const [clientSearchHotel, setClientSearchHotel] = useState('')
  const [clientGlobalCheckIn, setClientGlobalCheckIn] = useState('')
  const [clientGlobalCheckOut, setClientGlobalCheckOut] = useState('')
  const [clientGuestsCount, setClientGuestsCount] = useState('1')

  const [searchTerm, setSearchTerm] = useState('')
  const [dates, setDates] = useState<{ [key: string]: { checkIn: string; checkOut: string } }>({})

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % travelBackgrounds.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
      if (session) {
        fetchAllData()
        fetchProfiles()
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchAllData()
        fetchProfiles()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })

    if (error) {
      setAuthError('خطأ في تسجيل الدخول: تأكد من البريد أو كلمة المرور.')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setSession(null)
  }

  async function fetchAllData() {
    try {
      setLoading(true)
      const [bookingsRes, hotelsRes, suppliersRes] = await Promise.all([
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('hotels').select('*, hotel_offers(*, suppliers(name))'),
        supabase.from('suppliers').select('*')
      ])

      if (bookingsRes.error) throw bookingsRes.error
      if (hotelsRes.error) throw hotelsRes.error
      if (suppliersRes.error) throw suppliersRes.error

      setBookings(bookingsRes.data || [])
      setHotels(hotelsRes.data || [])
      setSuppliers(suppliersRes.data || [])
    } catch (err: any) {
      console.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error) setProfiles(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  // إضافة مستخدم جديد وتحديد دوره مباشرة من السيستم
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail || !newPassword) {
      alert('الرجاء إدخال البريد الإلكتروني وكلمة المرور.')
      return
    }

    setSubmittingUser(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
      })

      if (authError) throw authError

      const userId = authData.user?.id
      if (userId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            full_name: newFullName || 'مستخدم جديد',
            role: newRole,
          })

        if (profileError) throw profileError
      }

      setSuccessMsg('تم إنشاء المستخدم وتحديد صلاحيته بنجاح!')
      setNewEmail('')
      setNewPassword('')
      setNewFullName('')
      setNewRole('client')
      fetchProfiles()
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch (err: any) {
      alert('خطأ أثناء إنشاء المستخدم: ' + err.message)
    } finally {
      setSubmittingUser(false)
    }
  }

  // تحديث صلاحية مستخدم قائم
  async function handleRoleChange(userId: string, newRoleValue: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRoleValue })
        .eq('id', userId)

      if (error) throw error

      setSuccessMsg('تم تحديث صلاحية المستخدم بنجاح!')
      setProfiles(profiles.map(p => p.id === userId ? { ...p, role: newRoleValue } : p))
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: any) {
      alert('خطأ أثناء التحديث: ' + err.message)
    }
  }

  function calculateStay(checkIn: string, checkOut: string, pricePerNight: number) {
    if (!checkIn || !checkOut) return { nights: 0, total: 0 }
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const nights = diffDays > 0 ? diffDays : 0
    return { nights, total: nights * pricePerNight }
  }

  async function handleBooking(e: React.FormEvent<HTMLFormElement>, offerId: string, pricePerNight: number, checkInOverride?: string, checkOutOverride?: string) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const customerName = formData.get('customerName') as string
    const customerEmail = formData.get('customerEmail') as string
    const checkIn = checkInOverride || (formData.get('checkIn') as string)
    const checkOut = checkOutOverride || (formData.get('checkOut') as string)

    if (!customerName || !checkIn || !checkOut) {
      alert('الرجاء إدخال اسم العميل وتواريخ الوصول والمغادرة.')
      return
    }

    const { nights, total } = calculateStay(checkIn, checkOut, pricePerNight)
    if (nights <= 0) {
      alert('تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول.')
      return
    }

    const bookingReference = 'NX-' + Math.floor(100000 + Math.random() * 900000)

    const { error } = await supabase.from('bookings').insert([
      {
        hotel_offer_id: offerId,
        customer_name: customerName,
        customer_email: customerEmail,
        booking_reference: bookingReference,
        check_in: checkIn,
        check_out: checkOut,
        status: 'confirmed'
      }
    ])

    if (error) {
      alert('خطأ أثناء الحجز: ' + error.message)
    } else {
      setSuccessMsg(`تم حجز الغرفة بنجاح! الإجمالي (${nights} ليالي): $${total} - المرجع: ${bookingReference}`)
      e.currentTarget.reset()
      fetchAllData()
      setTimeout(() => setSuccessMsg(null), 6000)
    }
  }

  async function handleDeleteBooking(bookingId: string) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الحجز نهائياً؟')) return
    const { error } = await supabase.from('bookings').delete().eq('id', bookingId)
    if (error) {
      alert('خطأ أثناء الحذف: ' + error.message)
    } else {
      setSuccessMsg('تم حذف الحجز بنجاح.')
      setSelectedBooking(null)
      fetchAllData()
      setTimeout(() => setSuccessMsg(null), 4000)
    }
  }

  async function handleAddHotel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const location = formData.get('location') as string
    const rating = Number(formData.get('rating')) || 5

    const { error } = await supabase.from('hotels').insert([{ name, location, rating }])
    if (error) {
      alert('خطأ: ' + error.message)
    } else {
      setSuccessMsg('تم إضافة الفندق بنجاح!')
      e.currentTarget.reset()
      fetchAllData()
      setTimeout(() => setSuccessMsg(null), 4000)
    }
  }

  async function handleDeleteHotel(hotelId: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الفندق وجميع عروضه؟')) return
    const { error } = await supabase.from('hotels').delete().eq('id', hotelId)
    if (error) {
      alert('خطأ أثناء الحذف: ' + error.message)
    } else {
      setSuccessMsg('تم حذف الفندق بنجاح.')
      fetchAllData()
      setTimeout(() => setSuccessMsg(null), 4000)
    }
  }

  async function handleAddOffer(e: React.FormEvent<HTMLFormElement>, hotelId: string) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const roomType = formData.get('roomType') as string
    const pricePerNight = Number(formData.get('pricePerNight'))
    const availableRooms = Number(formData.get('availableRooms'))
    const supplierId = formData.get('supplierId') as string

    const { error } = await supabase.from('hotel_offers').insert([
      { hotel_id: hotelId, supplier_id: supplierId, room_type: roomType, price_per_night: pricePerNight, available_rooms: availableRooms }
    ])

    if (error) {
      alert('خطأ: ' + error.message)
    } else {
      setSuccessMsg('تم إضافة العرض بنجاح!')
      e.currentTarget.reset()
      fetchAllData()
      setTimeout(() => setSuccessMsg(null), 4000)
    }
  }

  async function handleDeleteOffer(offerId: string) {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return
    const { error } = await supabase.from('hotel_offers').delete().eq('id', offerId)
    if (error) {
      alert('خطأ أثناء الحذف: ' + error.message)
    } else {
      setSuccessMsg('تم حذف عرض الغرفة بنجاح.')
      fetchAllData()
      setTimeout(() => setSuccessMsg(null), 4000)
    }
  }

  function exportBookingsCSV() {
    if (bookings.length === 0) {
      alert('لا توجد حجوزات لتصديرها.')
      return
    }
    const headers = ['Reference,Customer Name,Email,Check In,Check Out,Status']
    const rows = bookings.map(b => `"${b.booking_reference}","${b.customer_name}","${b.customer_email || ''}","${b.check_in}","${b.check_out}","${b.status}"`)
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'nexora_bookings_report.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredBookings = bookings.filter(b => 
    b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.booking_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredClientHotels = hotels.filter(hotel => {
    if (!clientSearchHotel) return true
    return hotel.id === clientSearchHotel || hotel.name.toLowerCase().includes(clientSearchHotel.toLowerCase())
  })

  if (authLoading) {
    return <div className="min-h-screen bg-teal-950 text-teal-300 flex items-center justify-center text-xs">جاري التحقق من صلاحيات الأمان...</div>
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-cyan-900 to-sky-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
        <div className="absolute inset-0 z-0 overflow-hidden opacity-30">
          {travelBackgrounds.map((bg, index) => (
            <div
              key={bg}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
                index === currentBgIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
              }`}
              style={{ backgroundImage: `url(${bg})`, transition: 'opacity 1.5s ease-in-out, transform 7s ease-out' }}
            />
          ))}
          <div className="absolute inset-0 bg-teal-950/80" />
        </div>

        <div className="relative z-10 bg-teal-950/90 backdrop-blur-xl border border-teal-400/40 rounded-3xl max-w-md w-full p-8 shadow-2xl shadow-cyan-950">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-400 to-cyan-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-teal-400/40">
              NX
            </div>
            <div>
              <h1 className="text-base font-bold text-white">تسجيل دخول الإدارة</h1>
              <p className="text-xs text-teal-300">Nexora Hotels Enterprise Hub</p>
            </div>
          </div>

          {authError && (
            <div className="bg-red-950/80 border border-red-500/40 text-red-300 p-3 rounded-xl mb-4 text-xs font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="text-teal-200 font-medium">البريد الإلكتروني للأدمن:</label>
              <input 
                type="email" 
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@nexorahotels.com"
                className="bg-teal-900/80 border border-teal-500/40 text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-300 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-teal-200 font-medium">كلمة المرور:</label>
              <input 
                type="password" 
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-teal-900/80 border border-teal-500/40 text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-300 transition"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-bold py-3 rounded-xl transition cursor-pointer shadow-lg shadow-teal-400/30 mt-2"
            >
              تسجيل الدخول للنظام
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="min-h-screen bg-teal-950 text-teal-300 flex items-center justify-center">جاري تحميل بيانات لوحة التحكم الفاخرة...</div>
  }

  const totalBookings = bookings.length
  const totalHotels = hotels.length
  const totalSuppliers = suppliers.length
  const totalOffers = hotels.reduce((acc, h) => acc + (h.hotel_offers?.length || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-950 via-cyan-950 to-sky-950 text-slate-100 font-sans relative pb-12 overflow-x-hidden" dir="rtl">
      
      {/* خلفية السفر المتحركة في الأعلى */}
      <div className="absolute inset-0 z-0 overflow-hidden h-[380px]">
        {travelBackgrounds.map((bg, index) => (
          <div
            key={bg}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              index === currentBgIndex ? 'opacity-35 scale-105' : 'opacity-0 scale-100'
            }`}
            style={{ backgroundImage: `url(${bg})`, transition: 'opacity 1.5s ease-in-out, transform 7s ease-out' }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-teal-950/60 via-teal-950/90 to-teal-950" />
      </div>

      {/* المحتوى الرئيسي */}
      <div className="relative z-10">
        <header className="bg-teal-900/70 backdrop-blur-md border-b border-teal-500/30 px-6 py-4 shadow-xl">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-400 to-cyan-400 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-teal-400/30">
                NX
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Nexora Hotels <span className="text-xs bg-teal-400/20 text-teal-300 px-2.5 py-0.5 rounded-full border border-teal-400/40 font-semibold">Enterprise Hub</span>
                </h1>
                <p className="text-xs text-teal-200/80">منظومة الإدارة المركزية لحجوزات الفنادق والعمليات</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-wrap bg-teal-950/80 p-1.5 rounded-2xl border border-teal-500/30 text-xs font-medium shadow-xl gap-1">
                <button 
                  onClick={() => setActiveTab('booking-flow')}
                  className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${activeTab === 'booking-flow' ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-bold shadow-md shadow-teal-400/30' : 'text-teal-200 hover:text-white'}`}
                >
                  🛒 حجز العملاء
                </button>
                <button 
                  onClick={() => setActiveTab('bookings')}
                  className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${activeTab === 'bookings' ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-bold shadow-md shadow-teal-400/30' : 'text-teal-200 hover:text-white'}`}
                >
                  📊 الحجوزات ({totalBookings})
                </button>
                <button 
                  onClick={() => setActiveTab('inventory')}
                  className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${activeTab === 'inventory' ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-bold shadow-md shadow-teal-400/30' : 'text-teal-200 hover:text-white'}`}
                >
                  🏨 الفنادق والمخزون
                </button>
                <button 
                  onClick={() => setActiveTab('users')}
                  className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${activeTab === 'users' ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-bold shadow-md shadow-teal-400/30' : 'text-teal-200 hover:text-white'}`}
                >
                  👥 إدارة المستخدمين والصلاحيات
                </button>
              </div>

              <button 
                onClick={handleLogout}
                className="bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/40 px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md font-medium"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 mt-8">
          {successMsg && (
            <div className="bg-teal-900/90 border border-teal-400/40 text-teal-100 p-4 rounded-xl mb-6 text-xs font-medium flex items-center gap-2 shadow-2xl backdrop-blur-md">
              ✨ {successMsg}
            </div>
          )}

          {/* بطاقات الإحصائيات الحية */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-teal-900/60 backdrop-blur-md border border-teal-500/30 p-5 rounded-2xl shadow-xl">
              <span className="text-teal-200/80 text-xs block font-medium">إجمالي الحجوزات</span>
              <span className="text-3xl font-black text-cyan-300 mt-1 block">{totalBookings}</span>
            </div>
            <div className="bg-teal-900/60 backdrop-blur-md border border-teal-500/30 p-5 rounded-2xl shadow-xl">
              <span className="text-teal-200/80 text-xs block font-medium">الفنادق المسجلة</span>
              <span className="text-3xl font-black text-emerald-300 mt-1 block">{totalHotels}</span>
            </div>
            <div className="bg-teal-900/60 backdrop-blur-md border border-teal-500/30 p-5 rounded-2xl shadow-xl">
              <span className="text-teal-200/80 text-xs block font-medium">الموردين النشطين</span>
              <span className="text-3xl font-black text-amber-300 mt-1 block">{totalSuppliers}</span>
            </div>
            <div className="bg-teal-900/60 backdrop-blur-md border border-teal-500/30 p-5 rounded-2xl shadow-xl">
              <span className="text-teal-200/80 text-xs block font-medium">عروض الغرف المتاحة</span>
              <span className="text-3xl font-black text-sky-300 mt-1 block">{totalOffers}</span>
            </div>
          </div>

          {/* التبويب الأول: نافذة حجز العملاء */}
          {activeTab === 'booking-flow' && (
            <div className="space-y-6">
              <div className="bg-teal-900/60 backdrop-blur-md border border-teal-500/30 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-base font-bold text-white mb-2">🛒 محرك بحث وحجز الفنادق (للعملاء)</h2>
                <p className="text-xs text-teal-200/80 mb-4">حدد الوجهة، تاريخ الوصول والمغادرة، وعدد العملاء لتصفية العروض المتاحة فوراً.</p>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-teal-950/80 p-4 rounded-xl border border-teal-500/30 text-xs">
                  <div className="flex flex-col gap-1">
                    <label className="text-teal-200 font-medium">الفندق / الوجهة:</label>
                    <select 
                      value={clientSearchHotel}
                      onChange={(e) => setClientSearchHotel(e.target.value)}
                      className="bg-teal-900/90 border border-teal-500/40 text-white rounded-xl px-3 py-2.5 outline-none focus:border-cyan-300 transition"
                    >
                      <option value="">جميع الفنادق المتاحة</option>
                      {hotels.map(h => (
                        <option key={h.id} value={h.id}>{h.name} ({h.location})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-teal-200 font-medium">تاريخ الوصول:</label>
                    <input 
                      type="date" 
                      value={clientGlobalCheckIn}
                      onChange={(e) => setClientGlobalCheckIn(e.target.value)}
                      className="bg-teal-900/90 border border-teal-500/40 text-white rounded-xl px-3 py-2.5 outline-none focus:border-cyan-300 transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-teal-200 font-medium">تاريخ المغادرة:</label>
                    <input 
                      type="date" 
                      value={clientGlobalCheckOut}
                      onChange={(e) => setClientGlobalCheckOut(e.target.value)}
                      className="bg-teal-900/90 border border-teal-500/40 text-white rounded-xl px-3 py-2.5 outline-none focus:border-cyan-300 transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-teal-200 font-medium">عدد العملاء / الأفراد:</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="10" 
                      value={clientGuestsCount}
                      onChange={(e) => setClientGuestsCount(e.target.value)}
                      className="bg-teal-900/90 border border-teal-500/40 text-white rounded-xl px-3 py-2.5 outline-none focus:border-cyan-300 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {filteredClientHotels.length > 0 ? (
                  filteredClientHotels.map((hotel) => (
                    <div key={hotel.id} className="bg-teal-900/60 backdrop-blur-md border border-teal-500/30 rounded-2xl p-6 shadow-2xl">
                      <h3 className="text-lg font-bold text-white">{hotel.name}</h3>
                      <p className="text-xs text-teal-200 mt-1">📍 {hotel.location} | تقييم: <span className="text-amber-300 font-bold">⭐ {hotel.rating} نجوم</span></p>

                      <div className="mt-4 border-t border-teal-500/20 pt-4 space-y-3">
                        {hotel.hotel_offers?.length > 0 ? (
                          hotel.hotel_offers.map((offer: any) => {
                            const currentOfferDates = dates[offer.id] || { checkIn: '', checkOut: '' }
                            const finalCheckIn = clientGlobalCheckIn || currentOfferDates.checkIn
                            const finalCheckOut = clientGlobalCheckOut || currentOfferDates.checkOut
                            const { nights, total } = calculateStay(finalCheckIn, finalCheckOut, Number(offer.price_per_night))

                            return (
                              <div key={offer.id} className="bg-teal-950/80 border border-teal-500/30 rounded-xl p-4 flex flex-col gap-3 text-xs shadow-inner">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="font-bold text-white text-sm">{offer.room_type}</span>
                                    <p className="text-teal-200/80 mt-0.5">المورد: <span className="text-cyan-300 font-medium">{offer.suppliers?.name}</span> | المتاح: <span className="text-emerald-300 font-bold">{offer.available_rooms} غرف</span></p>
                                  </div>
                                  <span className="text-cyan-300 font-bold text-base">${offer.price_per_night} <span className="text-xs text-teal-300/70 font-normal">/ ليلة</span></span>
                                </div>

                                <form onSubmit={(e) => handleBooking(e, offer.id, Number(offer.price_per_night), finalCheckIn, finalCheckOut)} className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-center pt-3 border-t border-teal-500/20">
                                  <input 
                                    type="text" 
                                    name="customerName" 
                                    placeholder="اسم العميل الثلاثي" 
                                    required 
                                    className="bg-teal-900/80 border border-teal-500/40 text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-300 transition"
                                  />
                                  <input 
                                    type="email" 
                                    name="customerEmail" 
                                    placeholder="البريد الإلكتروني" 
                                    className="bg-teal-900/80 border border-teal-500/40 text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-300 transition"
                                  />
                                  <div className="flex flex-col">
                                    <label className="text-[10px] text-teal-200 font-medium mb-1">تاريخ الوصول:</label>
                                    <input 
                                      type="date" 
                                      name="checkIn" 
                                      defaultValue={finalCheckIn}
                                      required
                                      className="bg-teal-900/80 border border-teal-500/40 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-cyan-300 transition"
                                    />
                                  </div>
                                  <div className="flex flex-col">
                                    <label className="text-[10px] text-teal-200 font-medium mb-1">تاريخ المغادرة:</label>
                                    <input 
                                      type="date" 
                                      name="checkOut" 
                                      defaultValue={finalCheckOut}
                                      required
                                      className="bg-teal-900/80 border border-teal-500/40 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-cyan-300 transition"
                                    />
                                  </div>
                                  
                                  <button 
                                    type="submit" 
                                    className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-teal-400/25 text-xs sm:col-span-5 text-center cursor-pointer mt-1"
                                  >
                                    {nights > 0 ? `تأكيد الحجز الفوري (${nights} ليالي - الإجمالي: $${total})` : 'تأكيد الحجز الفوري'}
                                  </button>
                                </form>
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-xs text-teal-200/70 italic">لا توجد عروض غرف متاحة لهذه اللحظة.</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-teal-900/60 border border-teal-500/30 rounded-2xl p-12 text-center text-teal-200 text-sm shadow-xl">
                    لا توجد فنادق مطابقة لمعايير البحث.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* التبويب الثاني: لوحة الحجوزات */}
          {activeTab === 'bookings' && (
            <div className="bg-teal-900/60 backdrop-blur-md border border-teal-500/30 rounded-2xl p-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-teal-500/20 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white">سجل الحجوزات الفورية الواردة</h2>
                  <p className="text-xs text-teal-200/80">ابحث، تابع، أو صدر تقارير الحجوزات لحظياً.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <input 
                    type="text" 
                    placeholder="بحث برقم الحجز أو اسم العميل..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-teal-950/90 border border-teal-500/40 text-white rounded-xl px-3.5 py-2 text-xs outline-none focus:border-cyan-300 transition w-full sm:w-64 shadow-inner"
                  />
                  <button 
                    onClick={exportBookingsCSV}
                    className="bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap shadow-md"
                  >
                    📥 تصدير CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-teal-950/90 text-cyan-300 border-b border-teal-500/30 font-semibold">
                    <tr>
                      <th className="p-3">الرقم المرجعي</th>
                      <th className="p-3">اسم العميل</th>
                      <th className="p-3">البريد الإلكتروني</th>
                      <th className="p-3">تاريخ الوصول</th>
                      <th className="p-3">تاريخ المغادرة</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-500/20 text-teal-100">
                    {filteredBookings.length > 0 ? (
                      filteredBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-teal-800/40 transition cursor-pointer" onClick={() => setSelectedBooking(booking)}>
                          <td className="p-3 font-mono font-bold text-cyan-300">{booking.booking_reference}</td>
                          <td className="p-3 font-semibold text-white">{booking.customer_name}</td>
                          <td className="p-3 text-teal-200/70">{booking.customer_email || '---'}</td>
                          <td className="p-3">{booking.check_in || '---'}</td>
                          <td className="p-3">{booking.check_out || '---'}</td>
                          <td className="p-3">
                            <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full font-semibold text-[10px]">
                              {booking.status}
                            </span>
                          </td>
                          <td className="p-3 text-center flex items-center justify-center gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); }}
                              className="bg-teal-600/30 hover:bg-teal-600/50 text-teal-200 border border-teal-500/40 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer font-medium"
                            >
                              التفاصيل
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteBooking(booking.id); }}
                              className="bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer font-medium"
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-teal-300/70">
                          لا توجد حجوزات مسجلة أو مطابقة للبحث.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* التبويب الثالث: إدارة الفنادق والموردين والمخزون */}
          {activeTab === 'inventory' && (
            <div className="space-y-8">
              {/* نموذج إضافة فندق جديد */}
              <div className="bg-teal-900/60 backdrop-blur-md border border-teal-500/30 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-base font-bold text-white mb-4">➕ إضافة فندق جديد لشبكة Nexora</h2>
                <form onSubmit={handleAddHotel} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <input 
                    type="text" 
                    name="name" 
                    placeholder="اسم الفندق" 
                    required 
                    className="bg-teal-950/90 border border-teal-500/40 text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-300 transition"
                  />
                  <input 
                    type="text" 
                    name="location" 
                    placeholder="المدينة / الموقع (مثل: القاهرة، مصر)" 
                    required 
                    className="bg-teal-950/90 border border-teal-500/40 text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-300 transition"
                  />
                  <input 
                    type="number" 
                    name="rating" 
                    min="1" 
                    max="5" 
                    defaultValue="5" 
                    placeholder="التقييم (1-5)" 
                    required 
                    className="bg-teal-950/90 border border-teal-500/40 text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-300 transition"
                  />
                  <button 
                    type="submit" 
                    className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-teal-400/25 cursor-pointer"
                  >
                    حفظ الفندق
                  </button>
                </form>
              </div>

              {/* قائمة الفنادق وإدارة عروضها ومورديه */}
              <div className="space-y-6">
                {hotels.map((hotel) => (
                  <div key={hotel.id} className="bg-teal-900/60 backdrop-blur-md border border-teal-500/30 rounded-2xl p-6 shadow-2xl">
                    <div className="flex justify-between items-start gap-4 border-b border-teal-500/20 pb-4 mb-4">
                      <div>
                        <h3 className="text-base font-bold text-white">{hotel.name} <span className="text-xs text-teal-300 font-normal">({hotel.location})</span></h3>
                        <p className="text-xs text-amber-300 mt-0.5">⭐ التقييم: {hotel.rating} نجوم</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteHotel(hotel.id)}
                        className="bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
                      >
                        حذف الفندق
                      </button>
                    </div>

                    <div className="space-y-3 mb-6">
                      <h4 className="text-xs font-bold text-teal-200">عروض الغرف المتاحة:</h4>
                      {hotel.hotel_offers?.length > 0 ? (
                        hotel.hotel_offers.map((offer: any) => (
                          <div key={offer.id} className="bg-teal-950/80 border border-teal-500/30 rounded-xl p-3 flex justify-between items-center text-xs shadow-inner">
                            <div>
                              <span className="font-bold text-white">{offer.room_type}</span>
                              <span className="text-teal-200/80 mr-3">السعر: <strong className="text-cyan-300">${offer.price_per_night}</strong> / ليلة</span>
                              <span className="text-teal-200/80 mr-3">المتاعب: <strong className="text-emerald-300">{offer.available_rooms}</strong> غرف</span>
                              <span className="text-teal-300/80 mr-3 font-medium">المورد: {offer.suppliers?.name || 'غير معروف'}</span>
                            </div>
                            <button 
                              onClick={() => handleDeleteOffer(offer.id)}
                              className="bg-red-600/20 hover:bg-red-600/40 text-red-200 border border-red-500/30 px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer"
                            >
                              حذف العرض
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-teal-300/70 italic">لا توجد عروض غرف لهذا الفندق حتى الآن.</p>
                      )}
                    </div>

                    {/* نموذج إضافة عرض غرفة */}
                    <form onSubmit={(e) => handleAddOffer(e, hotel.id)} className="bg-teal-950/90 border border-teal-500/30 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs items-center">
                      <input 
                        type="text" 
                        name="roomType" 
                        placeholder="نوع الغرفة (مثل: Deluxe Nile View)" 
                        required 
                        className="bg-teal-900/80 border border-teal-500/40 text-white rounded-xl px-3 py-2 outline-none focus:border-cyan-300"
                      />
                      <input 
                        type="number" 
                        name="pricePerNight" 
                        placeholder="السعر / ليلة ($)" 
                        required 
                        className="bg-teal-900/80 border border-teal-500/40 text-white rounded-xl px-3 py-2 outline-none focus:border-cyan-300"
                      />
                      <input 
                        type="number" 
                        name="availableRooms" 
                        placeholder="عدد الغرف المتاحة" 
                        required 
                        className="bg-teal-900/80 border border-teal-500/40 text-white rounded-xl px-3 py-2 outline-none focus:border-cyan-300"
                      />
                      <select 
                        name="supplierId" 
                        required 
                        className="bg-teal-900/80 border border-teal-500/40 text-white rounded-xl px-3 py-2 outline-none focus:border-cyan-300"
                      >
                        <option value="">اختر المورد...</option>
                        {suppliers.map(sup => (
                          <option key={sup.id} value={sup.id}>{sup.name}</option>
                        ))}
                      </select>
                      <button 
                        type="submit" 
                        className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-bold px-4 py-2 rounded-xl transition shadow-md shadow-teal-400/20 cursor-pointer"
                      >
                        إضافة العرض
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* التبويب الرابع: إدارة المستخدمين والصلاحيات (RBAC) */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* نموذج إضافة مستخدم جديد وتحديد دوره */}
              <div className="bg-teal-900/60 backdrop-blur-md border border-teal-500/30 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-base font-bold text-white mb-2">➕ إضافة مستخدم جديد وتحديد الصلاحية (RBAC)</h2>
                <p className="text-xs text-teal-200/80 mb-4">أنشئ حساباً جديداً للموظفين أو العملاء وحدد دوره (Client, Staff, Admin) مباشرة.</p>

                <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex flex-col gap-1">
                    <label className="text-teal-200 font-medium">البريد الإلكتروني:</label>
                    <input 
                      type="email" 
                      placeholder="user@nexora.com" 
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                      className="bg-teal-950/90 border border-teal-500/40 text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-300 transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-teal-200 font-medium">كلمة المرور:</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="bg-teal-950/90 border border-teal-500/40 text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-300 transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-teal-200 font-medium">الاسم بالكامل:</label>
                    <input 
                      type="text" 
                      placeholder="اسم المستخدم" 
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="bg-teal-950/90 border border-teal-500/40 text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-300 transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-teal-200 font-medium">الدور (Role):</label>
                    <select 
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="bg-teal-950/90 border border-teal-500/40 text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-300 transition cursor-pointer"
                    >
                      <option value="client">Client (عميل)</option>
                      <option value="staff">Staff (موظف / عمليات)</option>
                      <option value="admin">Admin (مدير النظام)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 mt-2">
                    <button 
                      type="submit"
                      disabled={submittingUser}
                      className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-teal-400/30 cursor-pointer disabled:opacity-50"
                    >
                      {submittingUser ? 'جاري الإنشاء والحفظ...' : 'حفظ وإنشاء المستخدم الجديد'}
                    </button>
                  </div>
                </form>
              </div>

              {/* جدول عرض المستخدمين وصلاحياتهم مع إمكانية تعديلها */}
              <div className="bg-teal-900/60 backdrop-blur-md border border-teal-500/30 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-base font-bold text-white mb-4">قائمة المستخدمين وصلاحياتهم الحالية</h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-teal-950/90 text-cyan-300 border-b border-teal-500/30 font-semibold">
                      <tr>
                        <th className="p-3">معرف المستخدم (ID)</th>
                        <th className="p-3">الاسم بالكامل</th>
                        <th className="p-3">الدور الحالي (Role)</th>
                        <th className="p-3 text-center">تغيير الصلاحية فوراً</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-500/20 text-teal-100">
                      {profiles.length > 0 ? (
                        profiles.map((profile) => (
                          <tr key={profile.id} className="hover:bg-teal-800/40 transition">
                            <td className="p-3 font-mono text-teal-300 text-[11px]">{profile.id}</td>
                            <td className="p-3 font-semibold text-white">{profile.full_name || 'بدون اسم'}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-1 rounded-full font-semibold text-[10px] border ${
                                profile.role === 'admin' 
                                  ? 'bg-rose-950/80 text-rose-300 border-rose-500/40' 
                                  : profile.role === 'staff'
                                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                                  : 'bg-teal-950/80 text-teal-300 border-teal-500/40'
                              }`}>
                                {profile.role || 'client'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <select 
                                value={profile.role || 'client'}
                                onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                                className="bg-teal-950 border border-teal-500/40 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-cyan-300 cursor-pointer"
                              >
                                <option value="client">Client (عميل)</option>
                                <option value="staff">Staff (موظف)</option>
                                <option value="admin">Admin (مدير)</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-teal-300/70">
                            لا توجد ملفات مستخدمين مسجلة حتى الآن.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* نافذة تفاصيل الحجز المنبثقة */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-teal-950 border border-teal-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-xs" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b border-teal-500/30 pb-3">
              <h3 className="text-base font-bold text-white">تفاصيل الحجز الشاملة</h3>
              <button onClick={() => setSelectedBooking(null)} className="text-teal-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-teal-100">
              <p><strong>الرقم المرجعي:</strong> <span className="font-mono text-cyan-300">{selectedBooking.booking_reference}</span></p>
              <p><strong>اسم العميل:</strong> {selectedBooking.customer_name}</p>
              <p><strong>البريد الإلكتروني:</strong> {selectedBooking.customer_email || 'غير متوفر'}</p>
              <p><strong>تاريخ الوصول:</strong> {selectedBooking.check_in}</p>
              <p><strong>تاريخ المغادرة:</strong> {selectedBooking.check_out}</p>
              <p><strong>الحالة:</strong> <span className="text-emerald-300 font-semibold">{selectedBooking.status}</span></p>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-teal-500/30 pt-4">
              <button 
                onClick={() => handleDeleteBooking(selectedBooking.id)}
                className="bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 px-4 py-2 rounded-xl text-xs transition cursor-pointer font-medium"
              >
                حذف الحجز
              </button>
              <button 
                onClick={() => setSelectedBooking(null)}
                className="bg-teal-800 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs transition cursor-pointer font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
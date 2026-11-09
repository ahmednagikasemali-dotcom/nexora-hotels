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
  const [language, setLanguage] = useState<'en' | 'ar'>('en')
  const [currentBgIndex, setCurrentBgIndex] = useState(0)
  const [session, setSession] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('client')
  const [authLoading, setAuthLoading] = useState(true)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)

  // التابات المتاحة في النظام
  const [activeTab, setActiveTab] = useState<'booking-flow' | 'client-bookings' | 'client-invoices' | 'bookings' | 'inventory' | 'users' | 'requests' | 'profit-analytics'>('booking-flow')
  
  const [bookings, setBookings] = useState<any[]>([])
  const [hotels, setHotels] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [editingBooking, setEditingBooking] = useState<any | null>(null)

  // طلبات العملاء والردود
  const [requests, setRequests] = useState<any[]>([])
  const [requestSubject, setRequestSubject] = useState('')
  const [requestCategory, setRequestCategory] = useState('booking')
  const [requestMessage, setRequestMessage] = useState('')
  const [replyText, setReplyText] = useState('')
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [submittingRequest, setSubmittingRequest] = useState(false)
  
  // بيانات مستخدم جديد لإدارة الصلاحيات
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

  // UI language support. English is the default; Arabic restores the original labels and RTL layout.
  const translations: Record<string, string> = {
    'منظومة الإدارة المركزية وحجوزات الفنادق': 'Hotel Booking & Management Portal',
    'حدد الوجهة وتواريخ الإقامة لتصفية العروض المتاحة فوراً.': 'Choose your destination and stay dates to find available offers.',
    'تأكيد الحجز الفوري (${nights} ليالي - الإجمالي: $${total})': 'Confirm Booking (${nights} nights - Total: $${total})',
    'متابعة وتعديل وحذف جميع حجوزات النظام.': 'Review, edit, and manage all system bookings.',
    'بحث برقم الحجز أو اسم العميل...': 'Search by booking reference or customer name...',
    'اكتب طلبك وسيقوم فريق العمل بمراجعته والرد عليك من هنا.': 'Submit a request and our team will review and reply here.',
    'راجع طلبات العملاء وافتح الطلب لإرسال رد.': 'Review customer requests and open one to reply.',
    'إدارة المستخدمين والصلاحيات (RBAC)': 'User & Role Management (RBAC)',
    'إنشاء مستخدمين جدد وتحديد صلاحياتهم (Client, Staff, Admin).': 'Create users and assign roles (Client, Staff, Admin).',
    'انتهت جلسة الدخول. سجل الدخول مرة أخرى.': 'Your session has expired. Please sign in again.',
    'اكتب عنوان الطلب وتفاصيله أولاً.': 'Please enter a request subject and description.',
    'الرجاء إدخال البريد الإلكتروني وكلمة المرور.': 'Please enter an email address and password.',
    'الرجاء إدخال اسم العميل وتواريخ الوصول والمغادرة.': 'Please enter the customer name and stay dates.',
    'تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول.': 'Check-out must be later than check-in.',
    'لا توجد حجوزات لتصديرها.': 'There are no bookings to export.',
    'هل أنت متأكد من رغبتك في حذف هذا الحجز نهائياً؟': 'Are you sure you want to permanently delete this booking?',
    'هل أنت متأكد من حذف هذا الفندق وجميع عروضه؟': 'Are you sure you want to delete this hotel and all its offers?',
    'هل أنت متأكد من حذف هذا العرض؟': 'Are you sure you want to delete this offer?',
    'تم إرسال الرد وتحديث حالة الطلب.': 'Reply sent and request status updated.',
    'تم إرسال طلبك بنجاح. يمكنك متابعة الرد من نفس الصفحة.': 'Your request was submitted. You can track the reply on this page.',
    'تم إنشاء المستخدم وتحديد صلاحيته بنجاح!': 'User created and role assigned successfully!',
  }

  useEffect(() => {
    const reverseTranslations = Object.fromEntries(Object.entries(translations).map(([ar, en]) => [en, ar]))
    const activeDictionary = language === 'en' ? translations : reverseTranslations
    const translatePage = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      const nodes: Text[] = []
      while (walker.nextNode()) nodes.push(walker.currentNode as Text)
      nodes.forEach(node => {
        const original = node.nodeValue || ''
        const trimmed = original.trim()
        if (!trimmed) return
        const translated = activeDictionary[trimmed]
        if (translated) node.nodeValue = original.replace(trimmed, translated)
      })
      document.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(el => {
        const value = (el as HTMLInputElement).placeholder
        if (activeDictionary[value]) (el as HTMLInputElement).placeholder = activeDictionary[value]
      })
    }
    translatePage()
    const observer = new MutationObserver(translatePage)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [language])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % travelBackgrounds.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        getUserRole(session.user.id)
        fetchAllData()
      } else {
        setAuthLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        getUserRole(session.user.id)
        fetchAllData()
      } else {
        setAuthLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function getUserRole(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) throw error

      const role = data?.role || 'client'
      setUserRole(role)
      setActiveTab(role === 'staff' ? 'bookings' : 'booking-flow')

      if (role === 'admin') {
        await fetchProfiles()
      } else {
        setProfiles([])
      }

      await fetchRequests()
    } catch (err) {
      console.error('Error fetching role:', err)
      setUserRole('client')
      setActiveTab('booking-flow')
    } finally {
      setAuthLoading(false)
    }
  }

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
    setUserRole('client')
    setRequests([])
    setActiveTab('booking-flow')
  }

  async function fetchAllData() {
    try {
      const [bookingsRes, hotelsRes, suppliersRes] = await Promise.all([
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('hotels').select('*, hotel_offers(*, suppliers(name))'),
        supabase.from('suppliers').select('*')
      ])

      if (bookingsRes.data) setBookings(bookingsRes.data)
      if (hotelsRes.data) setHotels(hotelsRes.data)
      if (suppliersRes.data) setSuppliers(suppliersRes.data)
    } catch (err: any) {
      console.error(err.message)
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

  // جلب الطلبات: سيعرض Supabase للعميل طلباته فقط، وللموظف/الأدمن كل الطلبات حسب RLS
  async function fetchRequests() {
    const { data, error } = await supabase
      .from('client_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching client requests:', error.message)
      return
    }

    setRequests(data || [])
  }

  async function handleCreateRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!session?.user?.id || !session?.user?.email) {
      alert('انتهت جلسة الدخول. سجل الدخول مرة أخرى.')
      return
    }

    if (!requestSubject.trim() || !requestMessage.trim()) {
      alert('اكتب عنوان الطلب وتفاصيله أولاً.')
      return
    }

    setSubmittingRequest(true)
    try {
      const { error } = await supabase.from('client_requests').insert({
        client_id: session.user.id,
        client_email: session.user.email,
        subject: requestSubject.trim(),
        category: requestCategory,
        message: requestMessage.trim()
      })

      if (error) throw error

      setRequestSubject('')
      setRequestCategory('booking')
      setRequestMessage('')
      setSuccessMsg('تم إرسال طلبك بنجاح. يمكنك متابعة الرد من نفس الصفحة.')
      await fetchRequests()
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch (err: any) {
      alert('تعذر إرسال الطلب: ' + err.message)
    } finally {
      setSubmittingRequest(false)
    }
  }

  async function handleRequestReply(e: React.FormEvent<HTMLFormElement>, requestId: string) {
    e.preventDefault()
    if (!replyText.trim() || !session?.user?.id) return

    try {
      const { error } = await supabase
        .from('client_requests')
        .update({
          staff_reply: replyText.trim(),
          status: 'replied',
          responded_by: session.user.id,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      setReplyText('')
      setSelectedRequestId(null)
      setSuccessMsg('تم إرسال الرد وتحديث حالة الطلب.')
      await fetchRequests()
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch (err: any) {
      alert('تعذر إرسال الرد: ' + err.message)
    }
  }

  async function handleUpdateBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingBooking) return
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          customer_name: editingBooking.customer_name,
          check_in: editingBooking.check_in,
          check_out: editingBooking.check_out,
          status: editingBooking.status
        })
        .eq('id', editingBooking.id)

      if (error) throw error
      setSuccessMsg('تم تعديل بيانات الحجز بنجاح!')
      setEditingBooking(null)
      fetchAllData()
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: any) {
      alert('خطأ أثناء التعديل: ' + err.message)
    }
  }

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

  const myClientBookings = bookings.filter(b => b.customer_email === session?.user?.email)

  const filteredClientHotels = hotels.filter(hotel => {
    if (!clientSearchHotel) return true
    return hotel.id === clientSearchHotel || hotel.name.toLowerCase().includes(clientSearchHotel.toLowerCase())
  })

  if (authLoading) {
    return <div className="min-h-screen bg-slate-950 text-emerald-400 flex items-center justify-center text-xs">جاري التحقق من الصلاحيات...</div>
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="absolute inset-0 z-0 overflow-hidden opacity-40">
          {travelBackgrounds.map((bg, index) => (
            <div
              key={bg}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
                index === currentBgIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
              }`}
              style={{ backgroundImage: `url(${bg})`, transition: 'opacity 1.5s ease-in-out, transform 7s ease-out' }}
            />
          ))}
          <div className="absolute inset-0 bg-slate-950/60" />
        </div>

        <div className="relative z-10 bg-slate-900/60 backdrop-blur-xl border border-emerald-500/30 rounded-3xl max-w-md w-full p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg">
              NX
            </div>
            <div>
              <div className="flex justify-end mb-3"><button type="button" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="rounded-lg border border-emerald-500/40 bg-slate-900/70 px-3 py-1.5 text-xs font-bold text-emerald-300">{language === 'en' ? 'AR | العربية' : 'EN | English'}</button></div>
              <h1 className="text-base font-bold text-white">تسجيل الدخول للنظام</h1>
              <p className="text-xs text-emerald-300">Nexora Enterprise Hub</p>
            </div>
          </div>

          {authError && (
            <div className="bg-red-950/80 border border-red-500/40 text-red-300 p-3 rounded-xl mb-4 text-xs font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="text-emerald-200 font-medium">البريد الإلكتروني:</label>
              <input 
                type="email" 
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="bg-slate-950/50 border border-emerald-500/30 text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-emerald-200 font-medium">كلمة المرور:</label>
              <input 
                type="password" 
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="bg-slate-950/50 border border-emerald-500/30 text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-400"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg cursor-pointer mt-2"
            >
              تسجيل الدخول
            </button>
          </form>
        </div>
      </div>
    )
  }

  const totalBookings = bookings.length
  const totalHotels = hotels.length
  const totalSuppliers = suppliers.length
  const totalOffers = hotels.reduce((acc, h) => acc + (h.hotel_offers?.length || 0), 0)
  const allOffers = hotels.flatMap((hotel: any) => (hotel.hotel_offers || []).map((offer: any) => ({ ...offer, hotel_name: hotel.name })))
  const analyticsRows = bookings
    .filter((booking: any) => String(booking.status || '').toLowerCase() !== 'cancelled')
    .map((booking: any) => {
      const offer = allOffers.find((item: any) => String(item.id) === String(booking.hotel_offer_id))
      const nights = calculateStay(booking.check_in, booking.check_out, 0).nights
      const sellingPrice = Number(offer?.price_per_night)
      const supplierCost = offer?.supplier_cost_per_night == null ? null : Number(offer.supplier_cost_per_night)
      const sales = Number.isFinite(sellingPrice) ? sellingPrice * nights : 0
      const profit = supplierCost != null && Number.isFinite(supplierCost) ? (sellingPrice - supplierCost) * nights : null
      return { ...booking, nights, sales, profit }
    })
  const estimatedSales = analyticsRows.reduce((sum: number, row: any) => sum + row.sales, 0)
  const knownProfitRows = analyticsRows.filter((row: any) => row.profit !== null)
  const estimatedGrossProfit = knownProfitRows.reduce((sum: number, row: any) => sum + row.profit, 0)
  const missingCostCount = analyticsRows.filter((row: any) => row.profit === null).length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative pb-12 overflow-x-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* خلفية السفر المتحركة والشفافة بالكامل */}
      <div className="absolute inset-0 z-0 overflow-hidden h-[450px]">
        {travelBackgrounds.map((bg, index) => (
          <div
            key={bg}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              index === currentBgIndex ? 'opacity-50 scale-105' : 'opacity-0 scale-100'
            }`}
            style={{ backgroundImage: `url(${bg})`, transition: 'opacity 1.5s ease-in-out, transform 7s ease-out' }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/25 via-emerald-50/75 to-emerald-50" />
      </div>

      <div className="relative z-10">
        <header className="bg-slate-900/40 backdrop-blur-xl border-b border-emerald-500/20 px-6 py-4 shadow-xl">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg">
                NX
              </div>
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-2">
                  Nexora Hotels <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold uppercase">Portal ({userRole})</span>
                </h1>
                <p className="text-xs text-slate-300">منظومة الإدارة المركزية وحجوزات الفنادق</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* شريط التابات الموحد والشامل لكل الأدوار وبخاصة الأدمن */}
              <div className="flex flex-wrap bg-slate-900/50 backdrop-blur-xl p-1.5 rounded-2xl border border-emerald-500/20 text-xs font-medium gap-1">
                
                {(userRole === 'client' || userRole === 'admin') && (
                  <>
                    <button
                      onClick={() => setActiveTab('booking-flow')}
                      className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${activeTab === 'booking-flow' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md' : 'text-slate-300 hover:text-white'}`}
                    >
                      🛒 محرك الحجز
                    </button>

                    <button
                      onClick={() => setActiveTab('client-bookings')}
                      className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${activeTab === 'client-bookings' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md' : 'text-slate-300 hover:text-white'}`}
                    >
                      📋 حجوزاتي ({userRole === 'admin' ? totalBookings : myClientBookings.length})
                    </button>

                    <button
                      onClick={() => setActiveTab('client-invoices')}
                      className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${activeTab === 'client-invoices' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md' : 'text-slate-300 hover:text-white'}`}
                    >
                      💰 الفواتير
                    </button>
                  </>
                )}

                {(userRole === 'staff' || userRole === 'admin') && (
                  <button 
                    onClick={() => setActiveTab('bookings')}
                    className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${activeTab === 'bookings' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md' : 'text-slate-300 hover:text-white'}`}
                  >
                    📊 سجل الحجوزات ({totalBookings})
                  </button>
                )}

                {(userRole === 'staff' || userRole === 'admin') && (
                  <button 
                    onClick={() => setActiveTab('inventory')}
                    className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${activeTab === 'inventory' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md' : 'text-slate-300 hover:text-white'}`}
                  >
                    🏨 المخزون
                  </button>
                )}

                <button
                  onClick={() => { setActiveTab('requests'); fetchRequests() }}
                  className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${activeTab === 'requests' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md' : 'text-slate-300 hover:text-white'}`}
                >
                  🎫 {userRole === 'client' ? 'طلباتي' : 'طلبات العملاء'} ({requests.filter(r => r.status === 'new').length})
                </button>

                {userRole === 'admin' && (
                  <button
                    onClick={() => setActiveTab('profit-analytics')}
                    className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${activeTab === 'profit-analytics' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md' : 'text-slate-600 hover:text-white'}`}
                  >
                    📈 Profit Analytics
                  </button>
                )}

                {userRole === 'admin' && (
                  <button 
                    onClick={() => setActiveTab('users')}
                    className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${activeTab === 'users' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md' : 'text-slate-300 hover:text-white'}`}
                  >
                    👥 المستخدمين (RBAC)
                  </button>
                )}
              </div>

              <button
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="bg-slate-900/70 hover:bg-slate-800/30 text-emerald-300 border border-emerald-500/40 px-3.5 py-2.5 rounded-xl text-xs font-bold transition"
                type="button"
              >
                {language === 'en' ? 'AR | العربية' : 'EN | English'}
              </button>
              <button 
                onClick={handleLogout}
                className="bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/30 px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer font-medium"
              >
                خروج
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 mt-8">
          {successMsg && (
            <div className="bg-slate-900/70 backdrop-blur-xl border border-emerald-500/40 text-emerald-300 p-4 rounded-xl mb-6 text-xs font-medium text-center shadow-xl">
              ✨ {successMsg}
            </div>
          )}

          {/* محرك حجز الفنادق */}
          {activeTab === 'booking-flow' && (
            <div className="space-y-6">
              <div className="bg-slate-900/40 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-base font-bold text-white mb-2">🛒 محرك بحث وحجز الفنادق</h2>
                <p className="text-xs text-slate-300 mb-4">حدد الوجهة وتواريخ الإقامة لتصفية العروض المتاحة فوراً.</p>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/50 p-4 rounded-xl border border-emerald-500/20 text-xs">
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-300 font-medium">الفندق / الوجهة:</label>
                    <select 
                      value={clientSearchHotel}
                      onChange={(e) => setClientSearchHotel(e.target.value)}
                      className="bg-slate-900/80 border border-emerald-500/30 text-white rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400"
                    >
                      <option value="">جميع الفنادق المتاحة</option>
                      {hotels.map(h => (
                        <option key={h.id} value={h.id}>{h.name} ({h.location})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-slate-300 font-medium">تاريخ الوصول:</label>
                    <input 
                      type="date" 
                      value={clientGlobalCheckIn}
                      onChange={(e) => setClientGlobalCheckIn(e.target.value)}
                      className="bg-slate-900/80 border border-emerald-500/30 text-white rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-slate-300 font-medium">تاريخ المغادرة:</label>
                    <input 
                      type="date" 
                      value={clientGlobalCheckOut}
                      onChange={(e) => setClientGlobalCheckOut(e.target.value)}
                      className="bg-slate-900/80 border border-emerald-500/30 text-white rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-slate-300 font-medium">عدد الأفراد:</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="10" 
                      value={clientGuestsCount}
                      onChange={(e) => setClientGuestsCount(e.target.value)}
                      className="bg-slate-900/80 border border-emerald-500/30 text-white rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {filteredClientHotels.length > 0 ? (
                  filteredClientHotels.map((hotel) => (
                    <div key={hotel.id} className="bg-slate-900/40 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-2xl">
                      <h3 className="text-lg font-bold text-white">{hotel.name}</h3>
                      <p className="text-xs text-slate-300 mt-1">📍 {hotel.location} | تقييم: <span className="text-amber-400 font-bold">⭐ {hotel.rating} نجوم</span></p>

                      <div className="mt-4 border-t border-emerald-500/20 pt-4 space-y-3">
                        {hotel.hotel_offers?.length > 0 ? (
                          hotel.hotel_offers.map((offer: any) => {
                            const currentOfferDates = dates[offer.id] || { checkIn: '', checkOut: '' }
                            const finalCheckIn = clientGlobalCheckIn || currentOfferDates.checkIn
                            const finalCheckOut = clientGlobalCheckOut || currentOfferDates.checkOut
                            const { nights, total } = calculateStay(finalCheckIn, finalCheckOut, Number(offer.price_per_night))

                            return (
                              <div key={offer.id} className="bg-slate-950/60 border border-emerald-500/20 rounded-xl p-4 flex flex-col gap-3 text-xs">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="font-bold text-white text-sm">{offer.room_type}</span>
                                    <p className="text-slate-300 mt-0.5">المورد: <span className="text-cyan-400 font-medium">{offer.suppliers?.name}</span> | المتاح: <span className="text-emerald-400 font-bold">{offer.available_rooms} غرف</span></p>
                                  </div>
                                  <span className="text-emerald-400 font-bold text-base">${offer.price_per_night} <span className="text-xs text-slate-300 font-normal">/ ليلة</span></span>
                                </div>

                                <form onSubmit={(e) => handleBooking(e, offer.id, Number(offer.price_per_night), finalCheckIn, finalCheckOut)} className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-center pt-3 border-t border-emerald-500/20">
                                  <input 
                                    type="text" 
                                    name="customerName" 
                                    placeholder="اسم العميل الثلاثي" 
                                    defaultValue={session?.user?.email?.split('@')[0]}
                                    required 
                                    className="bg-slate-900/80 border border-emerald-500/30 text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-400"
                                  />
                                  <input 
                                    type="email" 
                                    name="customerEmail" 
                                    placeholder="البريد الإلكتروني" 
                                    defaultValue={session?.user?.email}
                                    required 
                                    className="bg-slate-900/80 border border-emerald-500/30 text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-400"
                                  />
                                  <div className="flex flex-col">
                                    <label className="text-[10px] text-slate-300 font-medium mb-1">الوصول:</label>
                                    <input 
                                      type="date" 
                                      name="checkIn" 
                                      defaultValue={finalCheckIn}
                                      required
                                      className="bg-slate-900/80 border border-emerald-500/30 text-white rounded-xl px-3 py-2 text-xs outline-none"
                                    />
                                  </div>
                                  <div className="flex flex-col">
                                    <label className="text-[10px] text-slate-300 font-medium mb-1">المغادرة:</label>
                                    <input 
                                      type="date" 
                                      name="checkOut" 
                                      defaultValue={finalCheckOut}
                                      required
                                      className="bg-slate-900/80 border border-emerald-500/30 text-white rounded-xl px-3 py-2 text-xs outline-none"
                                    />
                                  </div>
                                  
                                  <button 
                                    type="submit" 
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition shadow-lg text-xs sm:col-span-5 text-center cursor-pointer mt-1"
                                  >
                                    {nights > 0 ? `تأكيد الحجز الفوري (${nights} ليالي - الإجمالي: $${total})` : 'تأكيد الحجز الفوري'}
                                  </button>
                                </form>
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-xs text-slate-300 italic">لا توجد عروض غرف متاحة حالياً.</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-900/40 border border-emerald-500/20 rounded-2xl p-12 text-center text-slate-300 text-sm shadow-xl">
                    لا توجد فنادق مطابقة لمعايير البحث.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* نافذة حجوزاتي */}
          {activeTab === 'client-bookings' && (
            <div className="bg-slate-900/40 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-2xl space-y-4">
              <h2 className="text-base font-bold text-white">📋 الحجوزات النشطة</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/60 text-emerald-400 border-b border-emerald-500/20 font-semibold">
                    <tr>
                      <th className="p-3">المرجع</th>
                      <th className="p-3">اسم العميل</th>
                      <th className="p-3">الوصول</th>
                      <th className="p-3">المغادرة</th>
                      <th className="p-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-500/10 text-slate-100">
                    {(userRole === 'admin' ? bookings : myClientBookings).length > 0 ? (
                      (userRole === 'admin' ? bookings : myClientBookings).map((b) => (
                        <tr key={b.id} className="hover:bg-slate-800/30">
                          <td className="p-3 font-mono font-bold text-emerald-400">{b.booking_reference}</td>
                          <td className="p-3 font-semibold">{b.customer_name}</td>
                          <td className="p-3">{b.check_in}</td>
                          <td className="p-3">{b.check_out}</td>
                          <td className="p-3">
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px]">
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-300 italic">لا توجد حجوزات مسجلة حالياً.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* نافذة الفواتير */}
          {activeTab === 'client-invoices' && (
            <div className="bg-slate-900/40 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-2xl space-y-4">
              <h2 className="text-base font-bold text-white">💰 فواتير الحجوزات والمدفوعات</h2>
              <p className="text-xs text-slate-300">عرض تفاصيل الفواتير وحالة الدفع لكل حجز.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/60 text-emerald-400 border-b border-emerald-500/20 font-semibold">
                    <tr>
                      <th className="p-3">رقم المرجع</th>
                      <th className="p-3">اسم العميل</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3">الفاتورة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-500/10 text-slate-100">
                    {(userRole === 'admin' ? bookings : myClientBookings).length > 0 ? (
                      (userRole === 'admin' ? bookings : myClientBookings).map((b) => (
                        <tr key={b.id} className="hover:bg-slate-800/30">
                          <td className="p-3 font-mono font-bold text-emerald-400">{b.booking_reference}</td>
                          <td className="p-3 font-semibold">{b.customer_name}</td>
                          <td className="p-3">
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px]">
                              مدفوع / مؤكد
                            </span>
                          </td>
                          <td className="p-3">
                            <button 
                              onClick={() => alert(`فاتورة الحجز رقم: ${b.booking_reference}\nالعميل: ${b.customer_name}\nالتاريخ: ${b.check_in} إلى ${b.check_out}`)}
                              className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-lg text-xs transition cursor-pointer"
                            >
                              📄 عرض الفاتورة
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-300 italic">لا توجد فواتير متاحة.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* سجل الحجوزات الشامل (للأدمن والموظف) */}
          {activeTab === 'bookings' && (userRole === 'staff' || userRole === 'admin') && (
            <div className="bg-slate-900/40 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-emerald-500/20 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white">📊 سجل الحجوزات الشامل</h2>
                  <p className="text-xs text-slate-300">متابعة وتعديل وحذف جميع حجوزات النظام.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <input 
                    type="text" 
                    placeholder="بحث برقم الحجز أو اسم العميل..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-950/60 border border-emerald-500/30 text-white rounded-xl px-3.5 py-2 text-xs outline-none focus:border-emerald-400 w-full sm:w-64"
                  />
                  <button 
                    onClick={exportBookingsCSV}
                    className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap"
                  >
                    تصدير CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/60 text-emerald-400 border-b border-emerald-500/20 font-semibold">
                    <tr>
                      <th className="p-3">المرجع</th>
                      <th className="p-3">اسم العميل</th>
                      <th className="p-3">البريد</th>
                      <th className="p-3">الوصول</th>
                      <th className="p-3">المغادرة</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-500/10 text-slate-100">
                    {filteredBookings.length > 0 ? (
                      filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-800/30">
                          <td className="p-3 font-mono font-bold text-emerald-400">{b.booking_reference}</td>
                          <td className="p-3 font-semibold">{b.customer_name}</td>
                          <td className="p-3 text-slate-300">{b.customer_email || 'غير متوفر'}</td>
                          <td className="p-3">{b.check_in}</td>
                          <td className="p-3">{b.check_out}</td>
                          <td className="p-3">
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px]">
                              {b.status}
                            </span>
                          </td>
                          <td className="p-3 text-center flex justify-center gap-2">
                            <button 
                              onClick={() => setEditingBooking(b)}
                              className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-lg text-xs transition cursor-pointer"
                            >
                              ✏️ تعديل
                            </button>
                            {userRole === 'admin' && (
                              <button 
                                onClick={() => handleDeleteBooking(b.id)}
                                className="bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/30 px-3 py-1 rounded-lg text-xs transition cursor-pointer"
                              >
                                حذف
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-300 italic">لا توجد حجوزات مطابقة.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* إدارة الفنادق والمخزون */}
          {activeTab === 'inventory' && (userRole === 'staff' || userRole === 'admin') && (
            <div className="space-y-6">
              <div className="bg-slate-900/40 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-base font-bold text-white mb-4">➕ إضافة فندق جديد للمخزون</h2>
                <form onSubmit={handleAddHotel} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <input 
                    type="text" 
                    name="name" 
                    placeholder="اسم الفندق" 
                    required 
                    className="bg-slate-950/50 border border-emerald-500/30 text-white rounded-xl px-3 py-2.5 outline-none"
                  />
                  <input 
                    type="text" 
                    name="location" 
                    placeholder="الموقع" 
                    required 
                    className="bg-slate-950/50 border border-emerald-500/30 text-white rounded-xl px-3 py-2.5 outline-none"
                  />
                  <input 
                    type="number" 
                    name="rating" 
                    placeholder="التقييم (1-5)" 
                    min="1" 
                    max="5" 
                    defaultValue="5" 
                    required 
                    className="bg-slate-950/50 border border-emerald-500/30 text-white rounded-xl px-3 py-2.5 outline-none"
                  />
                  <button 
                    type="submit" 
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    حفظ الفندق
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                {hotels.map((hotel) => (
                  <div key={hotel.id} className="bg-slate-900/40 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-emerald-500/20 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-white">{hotel.name}</h3>
                        <p className="text-xs text-slate-300">📍 {hotel.location} | التقييم: ⭐ {hotel.rating}</p>
                      </div>
                      {userRole === 'admin' && (
                        <button 
                          onClick={() => handleDeleteHotel(hotel.id)}
                          className="bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/30 px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                        >
                          حذف الفندق
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-emerald-400">عروض الغرف المتاحة:</h4>
                      {hotel.hotel_offers?.length > 0 ? (
                        hotel.hotel_offers.map((offer: any) => (
                          <div key={offer.id} className="bg-slate-950/50 border border-emerald-500/10 p-3 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-white">{offer.room_type}</span>
                              <span className="text-slate-300 mx-2">| السعر: <strong className="text-emerald-400">${offer.price_per_night}/ليلة</strong></span>
                              <span className="text-slate-300">| المتاح: <strong className="text-cyan-400">{offer.available_rooms} غرف</strong></span>
                              <span className="text-slate-400 text-[11px] block mt-0.5">المورد: {offer.suppliers?.name}</span>
                            </div>
                            <button 
                              onClick={() => handleDeleteOffer(offer.id)}
                              className="bg-red-500/20 text-red-200 border border-red-500/30 px-2.5 py-1 rounded-lg text-[10px] transition cursor-pointer"
                            >
                              حذف العرض
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-300 italic">لا توجد عروض غرف مضافة لهذا الفندق.</p>
                      )}
                    </div>

                    <form onSubmit={(e) => handleAddOffer(e, hotel.id)} className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-3 border-t border-emerald-500/20 text-xs">
                      <input type="text" name="roomType" placeholder="نوع الغرفة" required className="bg-slate-950/50 border border-emerald-500/30 text-white rounded-xl px-3 py-2 outline-none" />
                      <input type="number" name="pricePerNight" placeholder="السعر ($)" required className="bg-slate-950/50 border border-emerald-500/30 text-white rounded-xl px-3 py-2 outline-none" />
                      <input type="number" name="availableRooms" placeholder="عدد الغرف" required className="bg-slate-950/50 border border-emerald-500/30 text-white rounded-xl px-3 py-2 outline-none" />
                      <select name="supplierId" required className="bg-slate-950/50 border border-emerald-500/30 text-white rounded-xl px-3 py-2 outline-none">
                        <option value="">اختر المورد...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-2 rounded-xl transition cursor-pointer">إضافة عرض</button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* طلبات العملاء والردود */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              {userRole === 'client' && (
                <div className="bg-slate-900/40 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-2xl">
                  <h2 className="text-base font-bold text-white mb-2">🎫 إرسال طلب جديد</h2>
                  <p className="text-xs text-slate-300 mb-5">اكتب طلبك وسيقوم فريق العمل بمراجعته والرد عليك من هنا.</p>

                  <form onSubmit={handleCreateRequest} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <input
                      type="text"
                      value={requestSubject}
                      onChange={(e) => setRequestSubject(e.target.value)}
                      placeholder="عنوان الطلب"
                      required
                      className="bg-slate-950/60 border border-emerald-500/30 text-white rounded-xl px-3 py-3 outline-none focus:border-emerald-400"
                    />
                    <select
                      value={requestCategory}
                      onChange={(e) => setRequestCategory(e.target.value)}
                      className="bg-slate-950/60 border border-emerald-500/30 text-white rounded-xl px-3 py-3 outline-none"
                    >
                      <option value="booking">استفسار عن حجز</option>
                      <option value="modification">تعديل حجز</option>
                      <option value="cancellation">إلغاء حجز</option>
                      <option value="payment">دفع / فاتورة</option>
                      <option value="hotel">استفسار عن فندق</option>
                      <option value="other">طلب آخر</option>
                    </select>
                    <textarea
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="اكتب تفاصيل طلبك هنا..."
                      required
                      rows={4}
                      className="sm:col-span-2 bg-slate-950/60 border border-emerald-500/30 text-white rounded-xl px-3 py-3 outline-none focus:border-emerald-400 resize-y"
                    />
                    <button
                      type="submit"
                      disabled={submittingRequest}
                      className="sm:col-span-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-3 rounded-xl transition cursor-pointer"
                    >
                      {submittingRequest ? 'جاري إرسال الطلب...' : 'إرسال الطلب'}
                    </button>
                  </form>
                </div>
              )}

              <div className="bg-slate-900/40 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex justify-between items-center gap-3">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      {userRole === 'client' ? '📨 طلباتي ومتابعة الردود' : '📨 صندوق طلبات العملاء'}
                    </h2>
                    <p className="text-xs text-slate-300 mt-1">
                      {userRole === 'client' ? 'تابع حالة كل طلب ورد فريق العمل.' : 'راجع طلبات العملاء وافتح الطلب لإرسال رد.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchRequests}
                    className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs"
                  >
                    تحديث
                  </button>
                </div>

                {requests.length === 0 ? (
                  <div className="text-center py-10 text-slate-300 text-xs">لا توجد طلبات حتى الآن.</div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((request) => (
                      <div key={request.id} className="bg-slate-950/60 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-white">{request.subject}</h3>
                            <p className="text-[11px] text-slate-400 mt-1">
                              {userRole !== 'client' ? `${request.client_email} • ` : ''}
                              {request.category} • {new Date(request.created_at).toLocaleString('ar-EG')}
                            </p>
                          </div>
                          <span className={`self-start px-3 py-1 rounded-full text-[10px] border ${
                            request.status === 'replied'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : request.status === 'in_progress'
                              ? 'bg-amber-500/200/20 text-amber-300 border-amber-500/30'
                              : request.status === 'closed'
                              ? 'bg-slate-700/40 text-slate-300 border-slate-600'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          }`}>
                            {request.status === 'replied' ? 'تم الرد' : request.status === 'in_progress' ? 'قيد المراجعة' : request.status === 'closed' ? 'مغلق' : 'جديد'}
                          </span>
                        </div>

                        <div className="bg-slate-900/70 rounded-lg p-3 text-xs text-slate-200 whitespace-pre-wrap">
                          {request.message}
                        </div>

                        {request.staff_reply && (
                          <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-lg p-3">
                            <p className="text-[11px] font-bold text-emerald-300 mb-2">رد فريق Nexora</p>
                            <p className="text-xs text-slate-100 whitespace-pre-wrap">{request.staff_reply}</p>
                            {request.responded_at && (
                              <p className="text-[10px] text-slate-400 mt-2">{new Date(request.responded_at).toLocaleString('ar-EG')}</p>
                            )}
                          </div>
                        )}

                        {(userRole === 'staff' || userRole === 'admin') && (
                          <div className="pt-2 border-t border-emerald-500/10">
                            {selectedRequestId === request.id ? (
                              <form onSubmit={(e) => handleRequestReply(e, request.id)} className="space-y-2">
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="اكتب ردك للعميل..."
                                  rows={3}
                                  required
                                  className="w-full bg-slate-900 border border-emerald-500/30 text-white rounded-xl px-3 py-3 text-xs outline-none focus:border-emerald-400"
                                />
                                <div className="flex gap-2">
                                  <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs">
                                    إرسال الرد
                                  </button>
                                  <button type="button" onClick={() => { setSelectedRequestId(null); setReplyText('') }} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs">
                                    إلغاء
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <button
                                type="button"
                                onClick={() => { setSelectedRequestId(request.id); setReplyText(request.staff_reply || '') }}
                                className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 px-4 py-2 rounded-lg text-xs"
                              >
                                {request.staff_reply ? 'تحديث الرد' : 'الرد على العميل'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profit-analytics' && userRole === 'admin' && (
            <section className="space-y-5">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-slate-950">📈 Profit Analytics</h2>
                <p className="text-sm text-slate-300 mt-1">Estimated values based on confirmed, non-cancelled bookings. These are not collected-payment figures.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                  <div className="rounded-2xl bg-emerald-500/20 border border-emerald-500/20 p-5"><p className="text-sm text-emerald-300">Estimated Sales</p><p className="text-2xl font-black text-slate-950 mt-2">${estimatedSales.toLocaleString()}</p></div>
                  <div className="rounded-2xl bg-slate-900/70 border border-emerald-500/20 p-5"><p className="text-sm text-slate-300">Estimated Gross Profit</p><p className="text-2xl font-black text-slate-100 mt-2">{missingCostCount === analyticsRows.length && analyticsRows.length > 0 ? 'N/A' : `$${estimatedGrossProfit.toLocaleString()}`}</p></div>
                  <div className="rounded-2xl bg-slate-900/70 border border-emerald-500/20 p-5"><p className="text-sm text-slate-300">Bookings Missing Supplier Cost</p><p className="text-2xl font-black text-slate-100 mt-2">{missingCostCount}</p></div>
                </div>
                <div className="mt-5 rounded-xl bg-amber-500/20 border border-amber-500/30 p-4 text-sm text-amber-300">
                  Profit is calculated only when the linked hotel offer has a <code>supplier_cost_per_night</code> value. Existing offers without supplier cost are excluded from profit calculations. <code>price_per_night</code> remains the customer selling price.
                </div>
              </div>
              <div className="overflow-x-auto bg-slate-900/50 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-5">
                <h3 className="font-bold text-slate-100 mb-4">Booking-level Estimate</h3>
                <table className="w-full text-left text-sm"><thead><tr className="border-b border-emerald-500/20 text-emerald-300"><th className="p-3">Reference</th><th className="p-3">Customer</th><th className="p-3">Nights</th><th className="p-3">Estimated Sales</th><th className="p-3">Estimated Profit</th></tr></thead><tbody>
                  {analyticsRows.map((row: any) => <tr key={row.id} className="border-b border-emerald-500/20"><td className="p-3">{row.booking_reference}</td><td className="p-3">{row.customer_name}</td><td className="p-3">{row.nights}</td><td className="p-3">${row.sales.toLocaleString()}</td><td className="p-3">{row.profit === null ? 'Missing supplier cost' : `$${row.profit.toLocaleString()}`}</td></tr>)}
                  {analyticsRows.length === 0 && <tr><td className="p-3 text-slate-400" colSpan={5}>No eligible bookings yet.</td></tr>}
                </tbody></table>
              </div>
            </section>
          )}

          {/* إدارة المستخدمين والصلاحيات RBAC */}
          {activeTab === 'users' && userRole === 'admin' && (
            <div className="bg-slate-900/40 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-2xl space-y-6">
              <div>
                <h2 className="text-base font-bold text-white">👥 إدارة المستخدمين والصلاحيات (RBAC)</h2>
                <p className="text-xs text-slate-300 mt-0.5">إنشاء مستخدمين جدد وتحديد صلاحياتهم (Client, Staff, Admin).</p>
              </div>

              <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-950/50 p-5 rounded-2xl border border-emerald-500/20">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-300 font-medium">البريد الإلكتروني:</label>
                  <input 
                    type="email" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="bg-slate-900/80 border border-emerald-500/30 text-white rounded-xl px-3 py-2.5 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-300 font-medium">كلمة المرور:</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="bg-slate-900/80 border border-emerald-500/30 text-white rounded-xl px-3 py-2.5 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-300 font-medium">الاسم بالكامل:</label>
                  <input 
                    type="text" 
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="bg-slate-900/80 border border-emerald-500/30 text-white rounded-xl px-3 py-2.5 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-300 font-medium">الدور (الصلاحية):</label>
                  <select 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="bg-slate-900/80 border border-emerald-500/30 text-white rounded-xl px-3 py-2.5 outline-none"
                  >
                    <option value="client">Client (عميل)</option>
                    <option value="staff">Staff (موظف)</option>
                    <option value="admin">Admin (أدمن)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button 
                    type="submit" 
                    disabled={submittingUser}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-lg"
                  >
                    {submittingUser ? 'جاري الإنشاء...' : 'إنشاء المستخدم وتعيين الصلاحية'}
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto mt-6">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/60 text-emerald-400 border-b border-emerald-500/20 font-semibold">
                    <tr>
                      <th className="p-3">اسم المستخدم</th>
                      <th className="p-3">الدور الحالي</th>
                      <th className="p-3 text-center">تحديث الصلاحية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-500/10 text-slate-100">
                    {profiles.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/30">
                        <td className="p-3 font-semibold">{p.full_name || 'بدون اسم'}</td>
                        <td className="p-3">
                          <span className="text-emerald-400 font-bold uppercase">{p.role || 'client'}</span>
                        </td>
                        <td className="p-3 text-center">
                          <select 
                            value={p.role || 'client'}
                            onChange={(e) => handleRoleChange(p.id, e.target.value)}
                            className="bg-slate-950 border border-emerald-500/30 text-white rounded-lg px-2.5 py-1 text-xs outline-none"
                          >
                            <option value="client">Client</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* نافذة منبثقة لتعديل الحجز */}
      {editingBooking && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setEditingBooking(null)}>
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-xs" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-white mb-4">تعديل بيانات الحجز</h3>
            <form onSubmit={handleUpdateBooking} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-slate-300">اسم العميل:</label>
                <input 
                  type="text" 
                  value={editingBooking.customer_name} 
                  onChange={(e) => setEditingBooking({...editingBooking, customer_name: e.target.value})} 
                  required 
                  className="w-full bg-slate-950 border border-emerald-500/30 text-white rounded-xl px-3 py-2 outline-none" 
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-300">الوصول:</label>
                  <input 
                    type="date" 
                    value={editingBooking.check_in} 
                    onChange={(e) => setEditingBooking({...editingBooking, check_in: e.target.value})} 
                    required 
                    className="w-full bg-slate-950 border border-emerald-500/30 text-white rounded-xl px-3 py-2 outline-none" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-300">المغادرة:</label>
                  <input 
                    type="date" 
                    value={editingBooking.check_out} 
                    onChange={(e) => setEditingBooking({...editingBooking, check_out: e.target.value})} 
                    required 
                    className="w-full bg-slate-950 border border-emerald-500/30 text-white rounded-xl px-3 py-2 outline-none" 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-300">حالة الحجز:</label>
                <select 
                  value={editingBooking.status} 
                  onChange={(e) => setEditingBooking({...editingBooking, status: e.target.value})} 
                  className="w-full bg-slate-950 border border-emerald-500/30 text-white rounded-xl px-3 py-2 outline-none"
                >
                  <option value="confirmed">مؤكد (Confirmed)</option>
                  <option value="pending">قيد المعالجة (Pending)</option>
                  <option value="cancelled">ملغي (Cancelled)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-emerald-500/20">
                <button type="submit" className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl cursor-pointer">حفظ التعديلات</button>
                <button type="button" onClick={() => setEditingBooking(null)} className="bg-slate-800 text-white px-4 py-2 rounded-xl cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
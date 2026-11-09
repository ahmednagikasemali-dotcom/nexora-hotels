'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// خلفيات سفر فخمة جداً بتتغير كل 7 ثواني
const travelBackgrounds = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1920&auto=format&fit=crop'
]

export default function BookingsPage() {
  const [currentBgIndex, setCurrentBgIndex] = useState(0)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // سلايدر الخلفيات المتحركة
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % travelBackgrounds.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [])

  async function fetchBookings() {
    try {
      setLoading(true)
      // جلب البيانات مباشرة من الجدول للتأكد من ظهورها دون أخطاء تعارض العلاقات
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Raw Bookings Data:', data)
      console.log('Fetch Error if any:', error)

      if (error) throw error
      setBookings(data || [])
    } catch (err) {
      console.error('Fetch exception:', err)
    } finally {
      setLoading(false)
    }
  }

  // حذف الحجز
  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الحجز؟')) return
    const { error } = await supabase.from('bookings').delete().eq('id', id)
    if (error) {
      alert('خطأ أثناء الحذف: ' + error.message)
    } else {
      setBookings(bookings.filter(b => b.id !== id))
    }
  }

  const filteredBookings = bookings.filter(b => 
    (b.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.booking_reference || b.reference || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-lg">
        جاري تحميل لوحة التحكم الفاخرة...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden" dir="rtl">
      
      {/* الخلفيات المتحركة للخلفية مع التعتيم */}
      <div className="absolute inset-0 z-0 overflow-hidden h-[350px]">
        {travelBackgrounds.map((bg, index) => (
          <div
            key={bg}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              index === currentBgIndex ? 'opacity-30 scale-105' : 'opacity-0 scale-100'
            }`}
            style={{ backgroundImage: `url(${bg})`, transition: 'opacity 1.5s ease-in-out, transform 7s ease-out' }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950" />
      </div>

      {/* المحتوى */}
      <div className="relative z-10 max-w-6xl mx-auto p-6 pt-8">
        
        {/* الهيدر الفخم */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-slate-900/65 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-2xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-500/20 text-indigo-400 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-500/30">
                Enterprise Hub
              </span>
              <span className="text-xs text-slate-400">منظومة الإدارة المركزية لحجوزات الفنادق والعمليات</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Nexora Hotels</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link 
              href="/" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
            >
              🏨 نافذة حجز العملاء
            </Link>
            <Link 
              href="/admin/manage" 
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5"
            >
              ⚙️ إدارة الفنادق والموردين
            </Link>
            <button 
              onClick={() => { supabase.auth.signOut(); window.location.href = '/login'; }}
              className="bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-lg cursor-pointer"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>

        {/* الكروت الإحصائية */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl">
            <p className="text-xs text-slate-400 font-medium">إجمالي الحجوزات</p>
            <h3 className="text-3xl font-black text-indigo-400 mt-2">{bookings.length}</h3>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl">
            <p className="text-xs text-slate-400 font-medium">الفنادق المسجلة</p>
            <h3 className="text-3xl font-black text-emerald-400 mt-2">2</h3>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl">
            <p className="text-xs text-slate-400 font-medium">الموردين النشطين</p>
            <h3 className="text-3xl font-black text-amber-400 mt-2">2</h3>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl">
            <p className="text-xs text-slate-400 font-medium">عروض الغرف المتاحة</p>
            <h3 className="text-3xl font-black text-cyan-400 mt-2">1</h3>
          </div>
        </div>

        {/* قسم الجدول والبحث */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">سجل الحجوزات الفورية الواردة</h2>
              <p className="text-xs text-slate-400 mt-0.5">ابحث، تابع، أو صدر تقارير الحجوزات لحظياً.</p>
            </div>
            
            <div className="w-full md:w-72">
              <input 
                type="text" 
                placeholder="بحث برقم الحجز أو اسم العميل..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition shadow-inner"
              />
            </div>
          </div>

          {/* الجدول */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="pb-3 px-3">الرقم المرجعي</th>
                  <th className="pb-3 px-3">اسم العميل</th>
                  <th className="pb-3 px-3">البريد الإلكتروني</th>
                  <th className="pb-3 px-3">تاريخ الوصول</th>
                  <th className="pb-3 px-3">تاريخ المغادرة</th>
                  <th className="pb-3 px-3">الحالة</th>
                  <th className="pb-3 px-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-3 font-mono font-bold text-indigo-400">{booking.booking_reference || booking.reference || booking.id.slice(0, 8)}</td>
                      <td className="py-4 px-3 font-medium text-white">{booking.customer_name || 'عميل غير مسجل'}</td>
                      <td className="py-4 px-3 text-slate-300">{booking.customer_email || 'غير متوفر'}</td>
                      <td className="py-4 px-3 text-slate-300">{booking.check_in || 'غير محدد'}</td>
                      <td className="py-4 px-3 text-slate-300">{booking.check_out || 'غير محدد'}</td>
                      <td className="py-4 px-3">
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-semibold">
                          {booking.status || 'معلق'}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center flex items-center justify-center gap-2">
                        <button 
                          onClick={() => alert(`تفاصيل الحجز:\nرقم: ${booking.booking_reference || booking.reference}\nالعميل: ${booking.customer_name}`)}
                          className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 px-3 py.5 rounded-lg transition cursor-pointer"
                        >
                          التفاصيل
                        </button>
                        <button 
                          onClick={() => handleDelete(booking.id)}
                          className="bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 px-3 py.5 rounded-lg transition cursor-pointer"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      لا توجد حجوزات مسجلة أو مطابقة للبحث حالياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
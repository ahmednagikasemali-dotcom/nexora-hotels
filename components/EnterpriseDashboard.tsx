'use client'
import React, { useState } from 'react'

type Role = 'client' | 'staff' | 'supplier' | 'admin'

export default function EnterpriseDashboard() {
  const [role, setRole] = useState<Role>('client')
  const [paymentMethod, setPaymentMethod] = useState<'vcc' | 'card' | 'link'>('link')
  const [loading, setLoading] = useState(false)

  // محاكاة جلب الإتاحة أونلاين من المورد (Live Supplier API)
  const [liveRate, setLiveRate] = useState({ hotel: 'Steigenberger Cairo', price: 140, available: true })

  const handleCreatePaymentLink = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: liveRate.price, bookingRef: 'NX-8821', customerEmail: 'client@example.com' })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (e) {
      alert('خطأ في إرسال رابط الدفع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 relative overflow-hidden font-sans">
      {/* Background Animated Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[160px] pointer-events-none" />

      {/* Header & Role Selector */}
      <header className="relative z-10 flex flex-wrap justify-between items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Nexora Enterprise Hub
          </h1>
          <p className="text-xs text-slate-400">Live Supplier & Payment Integration Platform</p>
        </div>

        {/* Dynamic Role Switcher */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
          {(['client', 'staff', 'supplier', 'admin'] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                role === r ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              {r} Portal
            </button>
          ))}
        </div>
      </header>

      <main className="relative z-10 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* 1. CLIENT PORTAL */}
        {(role === 'client' || role === 'admin') && (
          <section className="md:col-span-2 rounded-2xl bg-slate-900/40 p-6 backdrop-blur-xl border border-slate-800 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-indigo-400">Client Booking Engine</h2>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                Live Supplier API Connected
              </span>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl mb-6 border border-slate-700/50 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">{liveRate.hotel}</p>
                <p className="text-xs text-slate-400">Deluxe Room - Instant Confirmation</p>
              </div>
              <p className="text-xl font-extrabold text-indigo-300">${liveRate.price}/night</p>
            </div>

            {/* Payment Options */}
            <h3 className="text-sm font-semibold mb-3 text-slate-300">وسيلة السداد:</h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { id: 'link', label: 'Payment Link (Stripe/Paymob)' },
                { id: 'vcc', label: 'Virtual Credit Card (VCC)' },
                { id: 'card', label: 'Credit Card Direct' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`p-3 rounded-xl border text-xs font-medium transition-all text-center ${
                    paymentMethod === m.id
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {paymentMethod === 'link' ? (
              <button
                onClick={handleCreatePaymentLink}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all"
              >
                {loading ? 'جاري إنشاء الرابط...' : 'إرسال رابط الدفع وإتمام الحجز أوتوماتيكياً'}
              </button>
            ) : (
              <div className="space-y-3">
                <input placeholder="Card / VCC Number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="MM/YY" className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500" />
                  <input placeholder="CVV" className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500" />
                </div>
                <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold">
                  تأكيد الحجز وخصم المبلغ
                </button>
              </div>
            )}
          </section>
        )}

        {/* 2. STAFF & ADMIN PORTAL */}
        {(role === 'staff' || role === 'admin') && (
          <section className="rounded-2xl bg-slate-900/40 p-6 backdrop-blur-xl border border-slate-800 shadow-xl">
            <h2 className="text-lg font-bold text-cyan-400 mb-4">Staff Operations & VCC POS</h2>
            <div className="space-y-3">
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-indigo-400">Booking #NX-8821</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">Pending POS Charge</span>
                </div>
                <p className="text-xs text-slate-300">VCC: **** **** **** 4242</p>
                <p className="text-xs text-slate-400 mb-3">Exp: 12/28 | CVV: ***</p>
                <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-all">
                  خصم يدوي عبر ماكينة POS
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 3. SUPPLIER PORTAL */}
        {(role === 'supplier' || role === 'admin') && (
          <section className="rounded-2xl bg-slate-900/40 p-6 backdrop-blur-xl border border-slate-800 shadow-xl">
            <h2 className="text-lg font-bold text-emerald-400 mb-4">Supplier Portal (B2B Settlement)</h2>
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <p className="text-xs text-slate-300">الفندق: Steigenberger Cairo</p>
              <p className="text-xs text-slate-400">الحالة: متاح لحظياً (Live API Active)</p>
              <div className="pt-2 flex justify-between items-center border-t border-slate-800">
                <span className="text-xs text-slate-400">تسوية B2B VCC:</span>
                <span className="text-xs text-emerald-400 font-bold">$120.00 Auto-Issued</span>
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
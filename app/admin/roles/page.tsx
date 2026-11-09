'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function RolesManagementPage() {
  const [userId, setUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('client')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleUpdateRole(e: React.FormEvent) {
    e.preventDefault()
    if (!userId.trim()) {
      alert('يرجى إدخال معرف المستخدم (User ID)')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // تحديث الصلاحية في جدول profiles
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', userId.trim())

      if (error) throw error

      setMessage(`تم تحديث صلاحية المستخدم بنجاح إلى: ${selectedRole.toUpperCase()}`)
      setUserId('')
    } catch (err: any) {
      setMessage(`خطأ أثناء التحديث: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8" dir="rtl">
      <div className="max-w-xl mx-auto">
        
        {/* زر العودة */}
        <div className="mb-6">
          <Link 
            href="/bookings" 
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl border border-slate-700 transition"
          >
            ← العودة لسجل الحجوزات
          </Link>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <h1 className="text-xl font-bold text-white mb-2">إدارة وتعديل الصلاحيات (RBAC)</h1>
          <p className="text-xs text-slate-400 mb-6">قم بتعيين الأدوار والصلاحيات للمستخدمين (Client, Staff, Admin) مباشرة.</p>

          <form onSubmit={handleUpdateRole} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">معرف المستخدم (User UUID)</label>
              <input 
                type="text" 
                placeholder="مثال: c5a2b1c3-..." 
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">الصلاحية الجديدة</label>
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500 transition"
              >
                <option value="client">Client (عميل)</option>
                <option value="staff">Staff (موظف / عمليات)</option>
                <option value="admin">Admin (مدير النظام)</option>
              </select>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'جاري التحديث...' : 'تحديث الصلاحية فوراً'}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-xl text-xs text-center border ${
              message.includes('خطأ') 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              {message}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
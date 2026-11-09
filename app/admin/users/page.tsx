'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  // حقول نموذج إضافة مستخدم جديد
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('client')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchProfiles()
  }, [])

  async function fetchProfiles() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (err: any) {
      console.error('Error fetching profiles:', err.message)
    } finally {
      setLoading(false)
    }
  }

  // دالة إضافة المستخدم الجديد وحفظه في الـ Auth والـ Profiles
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      alert('يرجى إدخال البريد الإلكتروني وكلمة المرور على الأقل.')
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      // 1. إنشاء المستخدم في جدول مصادقة Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      const userId = authData.user?.id

      if (userId) {
        // 2. إدخال أو تحديث بيانات الـ Profile وتحديد الدور المطلوب
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            full_name: fullName || 'مستخدم جديد',
            role: role,
          })

        if (profileError) throw profileError
      }

      setMessage('تم إنشاء المستخدم وتحديد صلاحيته بنجاح!')
      setEmail('')
      setPassword('')
      setFullName('')
      setRole('client')
      fetchProfiles() // تحديث القائمة
    } catch (err: any) {
      alert('خطأ أثناء الإنشاء: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // دالة تحديث الصلاحية من الجدول
  async function handleRoleChange(userId: string, newRole: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      setMessage('تم تحديث الصلاحية بنجاح!')
      setProfiles(profiles.map(p => p.id === userId ? { ...p, role: newRole } : p))
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      alert('خطأ أثناء التحديث: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        
        {/* الهيدر وزر العودة */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">إدارة المستخدمين والصلاحيات (RBAC)</h1>
            <p className="text-xs text-slate-400 mt-1">إضافة مستخدمين جدد والتحكم في أدوارهم داخل النظام لحظياً</p>
          </div>
          <Link 
            href="/bookings" 
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl border border-slate-700 transition"
          >
            ← العودة للحجوزات
          </Link>
        </div>

        {message && (
          <div className="mb-6 p-3 rounded-xl text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-center">
            {message}
          </div>
        )}

        {/* نموذج إضافة مستخدم جديد */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl mb-8">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span>➕</span> إضافة مستخدم جديد للنظام
          </h2>

          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">البريد الإلكتروني</label>
              <input 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">كلمة المرور</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">الاسم بالكامل</label>
              <input 
                type="text" 
                placeholder="اسم المستخدم" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">الدور (Role)</label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="client">Client (عميل)</option>
                <option value="staff">Staff (موظف / عمليات)</option>
                <option value="admin">Admin (مدير النظام)</option>
              </select>
            </div>

            <div className="md:col-span-2 mt-2">
              <button 
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'جاري الإضافة...' : 'حفظ وإنشاء المستخدم'}
              </button>
            </div>
          </form>
        </div>

        {/* جدول المستخدمين الحاليين */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-sm font-bold text-white mb-4">قائمة المستخدمين والصلاحيات الحالية</h2>
          
          {loading ? (
            <div className="text-center py-10 text-slate-500 text-xs">جاري تحميل قائمة المستخدمين...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="pb-3 px-3">معرف المستخدم (ID)</th>
                    <th className="pb-3 px-3">الاسم بالكامل</th>
                    <th className="pb-3 px-3">الدور الحالي (Role)</th>
                    <th className="pb-3 px-3 text-center">تغيير الصلاحية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {profiles.length > 0 ? (
                    profiles.map((profile) => (
                      <tr key={profile.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-4 px-3 font-mono text-slate-400 text-[11px]">{profile.id}</td>
                        <td className="py-4 px-3 font-medium text-white">{profile.full_name || 'بدون اسم'}</td>
                        <td className="py-4 px-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                            profile.role === 'admin' 
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                              : profile.role === 'staff'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          }`}>
                            {profile.role || 'client'}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <select 
                            value={profile.role || 'client'}
                            onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                            className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 transition cursor-pointer"
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
                      <td colSpan={4} className="text-center py-8 text-slate-500">
                        لا توجد ملفات مستخدمين مسجلة حتى الآن.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
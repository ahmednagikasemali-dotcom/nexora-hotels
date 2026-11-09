import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const event = JSON.parse(body)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const bookingRef = session.metadata.bookingRef
    const paymentIntent = session.payment_intent
    const customerEmail = session.customer_email

    // 1. تحديث حالة الحجز إلى مؤكد ومدفوع
    await supabaseAdmin
      .from('bookings')
      .update({ status: 'confirmed', payment_status: 'paid' })
      .eq('reference', bookingRef)

    // 2. حفظ تفاصيل الدفع في جدول payment_details
    await supabaseAdmin
      .from('payment_details')
      .insert({
        booking_id: bookingRef,
        card_number: `Stripe Session: ${session.id.slice(-8)}`, // حفظ مرجع آمن
        exp_date: 'Active',
        cvv: 'Verified'
      })
  }

  return NextResponse.json({ received: true })
}
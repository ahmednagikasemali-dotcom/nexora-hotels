import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { amount, bookingRef, customerEmail, customerPhone, customerName } = await request.json()

    // 1. الخطوة الأولى: طلب المصادقة (Auth Token) من بايموب
    const authResponse = await fetch('https://accept.paymob.com/api/auth/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY })
    })
    const authData = await authResponse.json()
    const token = authData.token

    if (!token) throw new Error('فشل الاتصال ببوابة بايموب')

    // 2. الخطوة الثانية: تسجيل الطلب (Order Registration)
    const orderResponse = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: token,
        delivery_needed: false,
        amount_cents: Math.round(amount * 100), // المبلغ بالقروش (مثلاً 100 دولار = 10000)
        currency: 'EGP', // أو العملة المتاحة في الحساب
        items: [{ name: `Booking ${bookingRef}`, amount_cents: Math.round(amount * 100), quantity: 1 }]
      })
    })
    const orderData = await orderResponse.json()
    const orderId = orderData.id

    // 3. الخطوة الثالثة: طلب مفتاح الدفع (Payment Key)
    const paymentKeyResponse = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: token,
        amount_cents: Math.round(amount * 100),
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          apartment: 'NA',
          email: customerEmail || 'client@nexora.com',
          floor: 'NA',
          first_name: customerName || 'Client',
          last_name: 'Nez',
          street: 'NA',
          building: 'NA',
          phone_number: customerPhone || '+201000000000',
          shipping_method: 'NA',
          postal_code: 'NA',
          city: 'Cairo',
          country: 'EG',
          state: 'Cairo'
        },
        currency: 'EGP',
        integration_id: Number(process.env.PAYMOB_INTEGRATION_ID)
      })
    })
    const paymentKeyData = await paymentKeyResponse.json()
    const paymentToken = paymentKeyData.token

    // رابط صفحة الدفع المباشرة من Paymob
    const iframeId = process.env.PAYMOB_IFRAME_ID
    const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`

    return NextResponse.json({ url: paymentUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
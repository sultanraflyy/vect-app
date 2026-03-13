import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Wajib ditambahkan: Beritahu Next.js agar tidak merender file ini saat proses build
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Pindahkan inisialisasi Supabase ke DALAM fungsi POST agar hanya berjalan saat ada request masuk
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! 
    );

    const rawBody = await req.text();
    const signature = req.headers.get('x-signature') || '';
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!;

    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;

    if (eventName === 'order_created') {
      const customData = payload.meta.custom_data;
      const userId = customData?.user_id; 
      const variantId = payload.data.attributes.first_order_item.variant_id; 

      if (!userId) throw new Error("Tidak ada user_id di data custom");

      let newTier = 'free';
      let newCreditLimit = 150;

      // VARIANT ID dari link Lemon Squeezy kamu
      if (variantId === 636338 || payload.data.attributes.first_order_item.variant_id === 'af545a44-fb71-4103-8b63-45d654101370') { 
        newTier = 'pro';
        newCreditLimit = 1500;
      } else if (variantId === 636340 || payload.data.attributes.first_order_item.variant_id === '58765470-a57d-4803-8e79-7fcfcaeb2bb5') { 
        newTier = 'business';
        newCreditLimit = 5000;
      }

      await supabaseAdmin
        .from('profiles')
        .update({ tier: newTier, credits_limit: newCreditLimit })
        .eq('id', userId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

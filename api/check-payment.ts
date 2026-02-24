
import Stripe from 'stripe';
import crypto from 'crypto';

function hash(val: string | undefined): string | undefined {
  if (!val) return undefined;
  return crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { paymentId, gateway, pixelId, accessToken, amount, campaignTitle, email, originUrl } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    
    const cookies = req.headers.cookie || '';
    const fbp = cookies.split('; ').find((row: string) => row.startsWith('_fbp='))?.split('=')[1];
    const fbc = cookies.split('; ').find((row: string) => row.startsWith('_fbc='))?.split('=')[1];

    let isPaid = false;

    if (gateway === 'asaas') {
      const asaasApiKey = process.env.ASAAS_API_KEY;
      if (asaasApiKey && paymentId) {
        const response = await fetch(`https://api.asaas.com/v3/payments/${paymentId}`, {
          headers: { 'access_token': asaasApiKey }
        });
        if (response.ok) {
          try {
            const data = await response.json();
            isPaid = data.status === 'RECEIVED' || data.status === 'CONFIRMED';
          } catch(e) {}
        }
      }
    } 
    else if (gateway === 'simpay') {
      const simpayToken = process.env.SIMPAY_TOKEN;
      const simpayEmail = process.env.SIMPAY_EMAIL;
      if (simpayToken && simpayEmail && paymentId) {
        const response = await fetch(`https://somossimpay.com.br/api/v1/pix/status/${paymentId}`, {
          headers: { 
            'app-email': simpayEmail,
            'app-token': simpayToken
          }
        });
        if (response.ok) {
          try {
            const data = await response.json();
            // Status PAID ou similar
            isPaid = data.status === 'PAID' || data.status === 'paid' || data.paid === true || data.data?.status === 'PAID';
          } catch(e) {}
        }
      }
    }
    else if (gateway === 'pagbank') {
      const pagbankToken = process.env.PAGBANK_TOKEN;
      if (pagbankToken && paymentId) {
        const response = await fetch(`https://api.pagseguro.com/orders/${paymentId}`, {
          headers: { 'Authorization': `Bearer ${pagbankToken}` }
        });
        if (response.ok) {
          try {
            const data = await response.json();
            // Status PAID ou PAID_OUT
            isPaid = data.status === 'PAID' || data.status === 'PAID_OUT';
          } catch(e) {}
        }
      }
    }
    else if (gateway === 'braip') {
      const braipToken = process.env.BRAIP_TOKEN;
      if (braipToken && paymentId) {
        const response = await fetch(`https://ev.braip.com/api/v1/transactions/${paymentId}?token=${braipToken}`);
        if (response.ok) {
          try {
            const data = await response.json();
            // Status 2 = Pago na Braip
            isPaid = data.status === 2 || data.data?.status === 2;
          } catch(e) {}
        }
      }
    }
    else if (gateway === 'stone') {
      const stoneApiKey = process.env.STONE_API_KEY;
      if (stoneApiKey && paymentId) {
        const auth = Buffer.from(`${stoneApiKey}:`).toString('base64');
        const response = await fetch(`https://api.pagar.me/core/v5/orders/${paymentId}`, {
          headers: { 'Authorization': `Basic ${auth}` }
        });
        if (response.ok) {
          try {
            const data = await response.json();
            isPaid = data.status === 'paid';
          } catch(e) {}
        }
      }
    }
    else if (gateway === 'mercadopago') {
      const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      if (mpToken && paymentId) {
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { 'Authorization': `Bearer ${mpToken}` }
        });
        if (response.ok) {
          try {
            const data = await response.json();
            isPaid = data.status === 'approved';
          } catch(e) {}
        }
      }
    }
    else if (gateway === 'stripe') {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (stripeKey && paymentId) {
        const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' as any });
        const intent = await stripe.paymentIntents.retrieve(paymentId);
        isPaid = intent.status === 'succeeded';
      }
    }
    else if (gateway === 'pixup') {
       const pixupApiKey = process.env.PIXUP_API_KEY;
       if (pixupApiKey && paymentId) {
         const response = await fetch(`https://api.pixup.com/v1/payments/${paymentId}`, {
           headers: { 'Authorization': `Bearer ${pixupApiKey}` }
         });
         if (response.ok) {
           const text = await response.text();
           try {
             const data = JSON.parse(text);
             const status = (data.status || data.data?.status || '').toUpperCase();
             isPaid = ['PAID', 'SETTLED', 'RECEIVED', 'APPROVED', 'CONFIRMED'].includes(status);
           } catch(e) {}
         }
       }
    }

    if (isPaid && pixelId && accessToken) {
      const event = {
        event_name: 'Purchase',
        event_id: paymentId,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: originUrl,
        user_data: { 
          client_user_agent: userAgent, 
          em: email ? [hash(email)] : undefined,
          fbp: fbp,
          fbc: fbc
        },
        custom_data: { 
          currency: 'BRL', 
          value: Number(amount) || 0, 
          content_name: campaignTitle,
          content_type: 'product'
        }
      };

      await fetch(`https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [event] })
      }).catch(() => {});
    }

    return res.status(200).json({ paid: isPaid });
  } catch (err: any) {
    return res.status(200).json({ paid: false, error: err.message });
  }
}

import Stripe from 'stripe';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { paymentId, gateway, pixelId, accessToken, amount, campaignTitle, email, originUrl } = req.body;
    const userAgent = req.headers['user-agent'] || '';

    let isPaid = false;

    // 1. Verificação por Gateway
    if (gateway === 'asaas') {
      const asaasApiKey = process.env.ASAAS_API_KEY;
      const response = await fetch(`https://api.asaas.com/v3/payments/${paymentId}`, {
        headers: { 'access_token': asaasApiKey || '' }
      });
      const data = await response.json();
      isPaid = data.status === 'RECEIVED' || data.status === 'CONFIRMED';
    } 
    else if (gateway === 'mercadopago') {
      const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${mpToken}` }
      });
      const data = await response.json();
      isPaid = data.status === 'approved';
    }
    else if (gateway === 'stripe') {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      const stripe = new Stripe(stripeKey || '', { apiVersion: '2025-02-24.acacia' as any });
      const intent = await stripe.paymentIntents.retrieve(paymentId);
      isPaid = intent.status === 'succeeded';
    }
    else if (gateway === 'pixup') {
       // Simulação para demo ou integração PixUp via Status
       isPaid = false; // PixUp geralmente requer webhook, mas simulamos consulta se disponível
    }

    // 2. Se pago, dispara Purchase via CAPI (Server-side)
    if (isPaid && pixelId && accessToken) {
      const event = {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: originUrl,
        user_data: { client_user_agent: userAgent, em: email ? [email] : undefined },
        custom_data: { currency: 'BRL', value: Number(amount), content_name: campaignTitle }
      };

      fetch(`https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [event] })
      }).catch(() => {});
    }

    return res.status(200).json({ paid: isPaid });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

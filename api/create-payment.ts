
import Stripe from 'stripe';
import crypto from 'crypto';

function hash(val: string | undefined): string | undefined {
  if (!val) return undefined;
  return crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { amount, name, email, cpfCnpj, campaignTitle, gateway, pixelId, accessToken, originUrl } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    
    // Captura tracking cookies para CAPI
    const cookies = req.headers.cookie || '';
    const fbp = cookies.split('; ').find((row: string) => row.startsWith('_fbp='))?.split('=')[1];
    const fbc = cookies.split('; ').find((row: string) => row.startsWith('_fbc='))?.split('=')[1];

    // CAPI: Intent de Pagamento
    if (pixelId && accessToken) {
      const hashedEmail = email ? hash(email) : undefined;
      const events = [
        {
          event_name: 'InitiateCheckout',
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: originUrl,
          user_data: { 
            client_user_agent: userAgent, 
            em: hashedEmail ? [hashedEmail] : undefined,
            fbp, fbc 
          },
          custom_data: { currency: 'BRL', value: Number(amount), content_name: campaignTitle }
        },
        {
          event_name: 'AddPaymentInfo',
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: originUrl,
          user_data: { 
            client_user_agent: userAgent, 
            em: hashedEmail ? [hashedEmail] : undefined,
            fbp, fbc 
          },
          custom_data: { currency: 'BRL', value: Number(amount), content_name: campaignTitle }
        }
      ];
      fetch(`https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: events })
      }).catch(() => {});
    }

    if (gateway === 'pixup') {
      const pixupApiKey = process.env.PIXUP_API_KEY;
      const response = await fetch('https://api.pixup.com/v1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pixupApiKey}` },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          description: `Doação: ${campaignTitle}`,
          payer: { name: name || 'Doador', email: email || 'doador@exemplo.com', document: cpfCnpj }
        })
      });
      const data = await response.json();
      return res.status(200).json({ 
        provider: 'pixup', 
        id: data.id || data.data?.id,
        next_action: { pix_display_qr_code: { image_url_svg: data.qr_code_url || data.data?.qrcode_url, data: data.pix_payload || data.data?.pix_payload } } 
      });
    }

    if (gateway === 'asaas') {
      const asaasApiKey = process.env.ASAAS_API_KEY;
      const baseUrl = 'https://api.asaas.com/v3';
      
      // Armazena dados do pixel no externalReference para o webhook (limite 255 chars)
      // Formato: pixelId|||accessToken|||campaignTitle
      const pixelMeta = `${pixelId}|||${accessToken}|||${campaignTitle.substring(0, 40)}`;

      const custRes = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey! },
        body: JSON.stringify({ name: name || 'Doador', email: email || 'doador@exemplo.com', cpfCnpj })
      });
      const custData = await custRes.json();
      
      const payRes = await fetch(`${baseUrl}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey! },
        body: JSON.stringify({ 
          customer: custData.id, 
          billingType: 'PIX', 
          value: amount, 
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
          description: `Doação: ${campaignTitle}`,
          externalReference: pixelMeta
        })
      });
      const payData = await payRes.json();
      const qrRes = await fetch(`${baseUrl}/payments/${payData.id}/pixQrCode`, { method: 'GET', headers: { 'access_token': asaasApiKey! } });
      const qrData = await qrRes.json();
      return res.status(200).json({ provider: 'asaas', id: payData.id, pix: { encodedImage: qrData.encodedImage, payload: qrData.payload } });
    }

    if (gateway === 'mercadopago') {
      const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mpToken}`, 'X-Idempotency-Key': `v-${Date.now()}` },
        body: JSON.stringify({ transaction_amount: Number(amount), description: `Doação: ${campaignTitle}`, payment_method_id: 'pix', payer: { email: email || 'doador@exemplo.com', identification: { type: cpfCnpj?.length > 11 ? 'CNPJ' : 'CPF', number: cpfCnpj } } })
      });
      const data = await response.json();
      return res.status(200).json({ id: data.id, ...data });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const stripe = new Stripe(stripeKey!, { apiVersion: '2025-02-24.acacia' as any });
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'brl',
      payment_method_types: ['pix'],
      description: `Doação: ${campaignTitle}`,
    });
    return res.status(200).json({ id: paymentIntent.id, next_action: paymentIntent.next_action });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

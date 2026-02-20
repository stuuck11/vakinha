
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
          event_id: `init-${Date.now()}`,
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
          event_id: `add-${Date.now()}`,
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
      if (!pixupApiKey) throw new Error("PIXUP_API_KEY não configurada no servidor.");

      const response = await fetch('https://api.pixup.com/v1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pixupApiKey}` },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          description: `Doação: ${campaignTitle}`,
          payer: { name: name || 'Doador', email: email || 'doador@exemplo.com', document: cpfCnpj }
        })
      });
      
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { throw new Error(`Resposta não-JSON da PixUp: ${text.substring(0, 100)}`); }

      if (!response.ok) throw new Error(data.message || data.error || 'Erro na PixUp');

      return res.status(200).json({ 
        provider: 'pixup', 
        id: data.id || data.data?.id,
        next_action: { pix_display_qr_code: { image_url_svg: data.qr_code_url || data.data?.qrcode_url, data: data.pix_payload || data.data?.pix_payload } } 
      });
    }

    if (gateway === 'asaas') {
      const asaasApiKey = process.env.ASAAS_API_KEY;
      if (!asaasApiKey) throw new Error("ASAAS_API_KEY não configurada no servidor.");

      const baseUrl = 'https://api.asaas.com/v3';
      const pixelMeta = `${pixelId}|||${accessToken}|||${campaignTitle.substring(0, 40)}`;

      const custRes = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
        body: JSON.stringify({ name: name || 'Doador', email: email || 'doador@exemplo.com', cpfCnpj })
      });
      
      const custText = await custRes.text();
      let custData;
      try { custData = JSON.parse(custText); } catch(e) { throw new Error(`Resposta não-JSON do Asaas (Clientes): ${custText.substring(0, 100)}`); }
      if (!custRes.ok) throw new Error(custData.errors?.[0]?.description || 'Erro ao criar cliente no Asaas. Verifique seu Token.');

      const payRes = await fetch(`${baseUrl}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
        body: JSON.stringify({ 
          customer: custData.id, 
          billingType: 'PIX', 
          value: amount, 
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
          description: `Doação: ${campaignTitle}`,
          externalReference: pixelMeta
        })
      });
      
      const payText = await payRes.text();
      let payData;
      try { payData = JSON.parse(payText); } catch(e) { throw new Error(`Resposta não-JSON do Asaas (Pagamentos): ${payText.substring(0, 100)}`); }
      if (!payRes.ok) throw new Error(payData.errors?.[0]?.description || 'Erro ao criar pagamento no Asaas.');

      const qrRes = await fetch(`${baseUrl}/payments/${payData.id}/pixQrCode`, { method: 'GET', headers: { 'access_token': asaasApiKey } });
      const qrText = await qrRes.text();
      let qrData;
      try { qrData = JSON.parse(qrText); } catch(e) { throw new Error(`Resposta não-JSON do Asaas (QR Code): ${qrText.substring(0, 100)}`); }
      if (!qrRes.ok) throw new Error('Erro ao gerar QR Code no Asaas.');

      return res.status(200).json({ provider: 'asaas', id: payData.id, pix: { encodedImage: qrData.encodedImage, payload: qrData.payload } });
    }

    if (gateway === 'mercadopago') {
      const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      if (!mpToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurada no servidor.");

      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mpToken}`, 'X-Idempotency-Key': `v-${Date.now()}` },
        body: JSON.stringify({ transaction_amount: Number(amount), description: `Doação: ${campaignTitle}`, payment_method_id: 'pix', payer: { email: email || 'doador@exemplo.com', identification: { type: cpfCnpj?.length > 11 ? 'CNPJ' : 'CPF', number: cpfCnpj } } })
      });
      
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { throw new Error(`Resposta não-JSON do Mercado Pago: ${text.substring(0, 100)}`); }
      if (!response.ok) throw new Error(data.message || 'Erro no Mercado Pago. Verifique seu Token.');

      return res.status(200).json({ id: data.id, ...data });
    }

    // Default to Stripe
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY não configurada no servidor.");
    
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' as any });
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'brl',
      payment_method_types: ['pix'],
      description: `Doação: ${campaignTitle}`,
    });
    return res.status(200).json({ id: paymentIntent.id, next_action: paymentIntent.next_action });

  } catch (err: any) {
    console.error("Payment API Error:", err);
    return res.status(500).json({ error: err.message || 'Erro interno no servidor' });
  }
}

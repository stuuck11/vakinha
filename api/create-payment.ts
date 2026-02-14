
import Stripe from 'stripe';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { amount, name, email, cpfCnpj, campaignTitle, gateway, pixelId, accessToken, originUrl } = req.body;
    const userAgent = req.headers['user-agent'] || '';

    // Lógica da API de Conversões do Facebook (CAPI)
    // Implementando InitiateCheckout e Purchase server-side conforme imagem
    if (pixelId && accessToken) {
      try {
        const events = [
          {
            event_name: 'InitiateCheckout',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            event_source_url: originUrl,
            user_data: {
              client_user_agent: userAgent,
              em: email ? [email] : undefined,
              ph: undefined, // Poderia ser extraído do CPF ou campo extra
              external_id: undefined
            },
            custom_data: {
              currency: 'BRL',
              value: Number(amount),
              content_name: campaignTitle
            }
          },
          {
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            event_source_url: originUrl,
            user_data: {
              client_user_agent: userAgent,
              em: email ? [email] : undefined
            },
            custom_data: {
              currency: 'BRL',
              value: Number(amount),
              content_name: campaignTitle,
              content_type: 'product'
            }
          }
        ];

        fetch(`https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: events })
        }).catch(e => console.error('FB CAPI Error:', e));
      } catch (e) {
        console.error('CAPI Preparation Error:', e);
      }
    }

    // Lógica PixUp
    if (gateway === 'pixup') {
      const pixupApiKey = process.env.PIXUP_API_KEY;
      if (!pixupApiKey) {
        throw new Error('Configuração de servidor ausente: PIXUP_API_KEY não configurada.');
      }

      const pixupResponse = await fetch('https://api.pixup.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pixupApiKey}`
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          description: `Doação: ${campaignTitle}`,
          payer: {
            name: name || 'Doador',
            email: email || 'doador@exemplo.com',
            document: cpfCnpj
          }
        })
      });

      const pixupData = await pixupResponse.json();
      if (!pixupResponse.ok) throw new Error(pixupData.message || 'Erro na PixUp');

      return res.status(200).json({
        provider: 'pixup',
        next_action: {
          pix_display_qr_code: {
            image_url_svg: pixupData.qr_code_url || pixupData.data?.qrcode_url,
            data: pixupData.pix_payload || pixupData.data?.pix_payload
          }
        }
      });
    }

    // Lógica ASAAS
    if (gateway === 'asaas') {
      const asaasApiKey = process.env.ASAAS_API_KEY;
      if (!asaasApiKey) throw new Error('Configuração de servidor ausente: ASAAS_API_KEY não encontrada.');
      const baseUrl = 'https://api.asaas.com/v3';
      const customerResponse = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
        body: JSON.stringify({ name: name || 'Doador', email: email || 'doador@exemplo.com', cpfCnpj: cpfCnpj })
      });
      const customerData = await customerResponse.json();
      if (!customerResponse.ok) throw new Error(customerData.errors?.[0]?.description || 'Erro no Asaas (Cliente)');
      const paymentResponse = await fetch(`${baseUrl}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
        body: JSON.stringify({
          customer: customerData.id,
          billingType: 'PIX',
          value: amount,
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          description: `Doação: ${campaignTitle}`
        })
      });
      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(paymentData.errors?.[0]?.description || 'Erro no Asaas (Pagamento)');
      const qrCodeResponse = await fetch(`${baseUrl}/payments/${paymentData.id}/pixQrCode`, {
        method: 'GET',
        headers: { 'access_token': asaasApiKey }
      });
      const qrCodeData = await qrCodeResponse.json();
      return res.status(200).json({ provider: 'asaas', id: paymentData.id, pix: { encodedImage: qrCodeData.encodedImage, payload: qrCodeData.payload } });
    }

    if (gateway === 'mercadopago') {
      const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      if (!mpToken) throw new Error('Configuração de servidor ausente: MERCADO_PAGO_ACCESS_TOKEN não configurado.');
      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mpToken}`, 'X-Idempotency-Key': `vaquinha-${Date.now()}` },
        body: JSON.stringify({
          transaction_amount: Number(amount),
          description: `Doação: ${campaignTitle}`,
          payment_method_id: 'pix',
          payer: { email: email || 'doador@exemplo.com', identification: { type: cpfCnpj?.length > 11 ? 'CNPJ' : 'CPF', number: cpfCnpj } }
        })
      });
      const mpData = await mpResponse.json();
      if (!mpResponse.ok) throw new Error(mpData.message || 'Erro no Mercado Pago');
      return res.status(200).json(mpData);
    } 
    
    // Stripe
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error('Configuração de servidor ausente: STRIPE_SECRET_KEY não configurada.');
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' as any });
    const customer = await stripe.customers.create({ name: name || 'Doador', email: email || 'doador@exemplo.com' });
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'brl',
      customer: customer.id,
      payment_method_types: ['pix'],
      description: `Doação para: ${campaignTitle}`,
      payment_method_options: { pix: { expires_at: Math.floor(Date.now() / 1000) + 3600 } },
    });
    res.status(200).json({ id: paymentIntent.id, client_secret: paymentIntent.client_secret, next_action: paymentIntent.next_action });
    
  } catch (err: any) {
    console.error('API Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

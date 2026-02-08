import Stripe from 'stripe';

/**
 * Backend adaptável para Stripe, Mercado Pago ou Asaas
 * Nota: Você deve configurar STRIPE_SECRET_KEY, MERCADO_PAGO_ACCESS_TOKEN 
 * ou ASAAS_API_KEY nas variáveis de ambiente.
 */

// Fix: O erro TS2322 ocorre porque o SDK do Stripe exige uma versão específica da API
// que corresponda exatamente à versão da biblioteca instalada.
// Usamos '2025-02-24.acacia' conforme solicitado pelo erro do compilador e 'as any' para prevenir quebras futuras.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia' as any,
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { amount, name, email, campaignTitle, gateway } = req.body;

    // Lógica ASAAS
    if (gateway === 'asaas') {
      const asaasApiKey = process.env.ASAAS_API_KEY;
      
      // 1. Criar ou identificar cliente (placeholder para doação anônima)
      const customerResponse = await fetch('https://www.asaas.com/api/v3/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey || ''
        },
        body: JSON.stringify({
          name: name || 'Doador Solidário',
          email: email || 'doador@exemplo.com'
        })
      });
      const customerData = await customerResponse.json();
      const customerId = customerData.id;

      // 2. Criar Pagamento PIX
      const paymentResponse = await fetch('https://www.asaas.com/api/v3/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey || ''
        },
        body: JSON.stringify({
          customer: customerId,
          billingType: 'PIX',
          value: amount,
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // 24h
          description: `Doação: ${campaignTitle}`
        })
      });
      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) throw new Error(paymentData.errors?.[0]?.description || 'Erro no Asaas');

      // 3. Obter QR Code do PIX
      const qrCodeResponse = await fetch(`https://www.asaas.com/api/v3/payments/${paymentData.id}/pixQrCode`, {
        method: 'GET',
        headers: {
          'access_token': asaasApiKey || ''
        }
      });
      const qrCodeData = await qrCodeResponse.json();

      return res.status(200).json({
        provider: 'asaas',
        id: paymentData.id,
        pix: {
          encodedImage: qrCodeData.encodedImage,
          payload: qrCodeData.payload
        }
      });
    }

    if (gateway === 'mercadopago') {
      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          'X-Idempotency-Key': `vaquinha-${Date.now()}`
        },
        body: JSON.stringify({
          transaction_amount: Number(amount),
          description: `Doação: ${campaignTitle}`,
          payment_method_id: 'pix',
          payer: {
            email: email || 'doador@exemplo.com',
            first_name: (name || 'Doador').split(' ')[0],
            last_name: (name || '').split(' ').slice(1).join(' ') || 'Solidário',
          }
        })
      });

      const mpData = await mpResponse.json();
      if (!mpResponse.ok) throw new Error(mpData.message || 'Erro no Mercado Pago');

      return res.status(200).json(mpData);
    } 
    
    // Gateway Padrão: Stripe
    const customer = await stripe.customers.create({ name: name || 'Doador', email: email || 'doador@exemplo.com' });
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'brl',
      customer: customer.id,
      payment_method_types: ['pix'],
      description: `Doação para: ${campaignTitle}`,
      payment_method_options: {
        pix: { expires_at: expiresAt },
      },
    });

    res.status(200).json({
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      next_action: paymentIntent.next_action
    });
    
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
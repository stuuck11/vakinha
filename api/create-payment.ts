
import Stripe from 'stripe';

export default async function handler(req: any, res: any) {
  // Verificação de Status (GET)
  if (req.method === 'GET') {
    const { id, gateway } = req.query;
    
    try {
      if (gateway === 'asaas') {
        const asaasApiKey = process.env.ASAAS_API_KEY;
        const response = await fetch(`https://api.asaas.com/v3/payments/${id}`, {
          headers: { 'access_token': asaasApiKey || '' }
        });
        const data = await response.json();
        const isPaid = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(data.status);
        return res.status(200).json({ status: data.status, isPaid });
      }

      if (gateway === 'mercadopago') {
        const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
          headers: { 'Authorization': `Bearer ${mpToken}` }
        });
        const data = await response.json();
        const isPaid = data.status === 'approved';
        return res.status(200).json({ status: data.status, isPaid });
      }

      if (gateway === 'pixup') {
        const pixupKey = process.env.PIXUP_API_KEY;
        // Simulação de endpoint PixUp para consulta de status
        const response = await fetch(`https://api.pixup.com/v1/status/${id}`, {
          headers: { 'Authorization': `Bearer ${pixupKey}` }
        });
        const data = await response.json();
        const isPaid = data.status === 'paid' || data.status === 'completed';
        return res.status(200).json({ status: data.status, isPaid });
      }

      return res.status(400).json({ error: 'Gateway não suportado para verificação' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Criação de Pagamento (POST)
  if (req.method === 'POST') {
    try {
      const { amount, name, email, cpfCnpj, campaignTitle, gateway } = req.body;

      if (gateway === 'asaas') {
        const asaasApiKey = process.env.ASAAS_API_KEY;
        if (!asaasApiKey) throw new Error('ASAAS_API_KEY ausente');
        const baseUrl = 'https://api.asaas.com/v3';
        const customerResponse = await fetch(`${baseUrl}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
          body: JSON.stringify({ name, email, cpfCnpj })
        });
        const customerData = await customerResponse.json();
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
        const qrCodeResponse = await fetch(`${baseUrl}/payments/${paymentData.id}/pixQrCode`, {
          headers: { 'access_token': asaasApiKey }
        });
        const qrCodeData = await qrCodeResponse.json();
        return res.status(200).json({
          provider: 'asaas',
          id: paymentData.id,
          pix: { encodedImage: qrCodeData.encodedImage, payload: qrCodeData.payload }
        });
      }

      if (gateway === 'mercadopago') {
        const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
        const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mpToken}`,
            'X-Idempotency-Key': `v-${Date.now()}`
          },
          body: JSON.stringify({
            transaction_amount: Number(amount),
            description: `Doação: ${campaignTitle}`,
            payment_method_id: 'pix',
            payer: {
              email: email || 'doador@exemplo.com',
              identification: { type: 'CPF', number: cpfCnpj }
            }
          })
        });
        const mpData = await mpResponse.json();
        return res.status(200).json(mpData);
      }

      if (gateway === 'pixup') {
        const pixupKey = process.env.PIXUP_API_KEY;
        // Simulação de endpoint PixUp para criação de PIX
        const pixupResponse = await fetch('https://api.pixup.com/v1/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pixupKey}` },
          body: JSON.stringify({
            value: amount,
            payer_name: name,
            payer_tax_id: cpfCnpj,
            description: `Doação: ${campaignTitle}`
          })
        });
        const pixupData = await pixupResponse.json();
        return res.status(200).json({
          provider: 'pixup',
          id: pixupData.id,
          pix: { encodedImage: pixupData.qr_code_base64, payload: pixupData.copy_paste }
        });
      }

      return res.status(400).json({ error: 'Gateway inválido' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

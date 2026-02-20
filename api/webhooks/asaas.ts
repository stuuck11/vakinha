
import crypto from 'crypto';

function hash(val: string | undefined): string | undefined {
  if (!val) return undefined;
  // Remove pontos e traços do CPF antes de hashear para garantir compatibilidade com o Facebook
  const cleanVal = val.replace(/\D/g, '').trim().toLowerCase();
  return crypto.createHash('sha256').update(cleanVal).digest('hex');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const body = req.body;
    const { event, payment } = body;

    // Processa apenas eventos de pagamento recebido/confirmado
    if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
      return res.status(200).json({ status: 'ignored' });
    }

    const { id, value, externalReference, customer: customerId } = payment;

    // Se não houver metadados do pixel no externalReference, ignora
    if (!externalReference || !externalReference.includes('|||')) {
      return res.status(200).json({ status: 'no_meta' });
    }

    const [pixelId, accessToken, campaignTitle] = externalReference.split('|||');
    const asaasApiKey = process.env.ASAAS_API_KEY;

    // Busca o CPF/CNPJ do cliente no Asaas para Advanced Matching no Facebook
    let document = '';
    if (asaasApiKey && customerId) {
      try {
        const custRes = await fetch(`https://api.asaas.com/v3/customers/${customerId}`, {
          headers: { 'access_token': asaasApiKey }
        });
        if (custRes.ok) {
          const custData = await custRes.json();
          document = custData.cpfCnpj || '';
        }
      } catch (e) {
        console.error("Erro ao buscar cliente Asaas:", e);
      }
    }

    // Dispara o Purchase via CAPI
    // Usamos o CPF hasheado no campo external_id, que é um dos identificadores mais fortes do Meta
    const fbEvent = {
      event_name: 'Purchase',
      event_id: id, // Deduplicação com o navegador
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      user_data: { 
        external_id: document ? [hash(document)] : undefined 
      },
      custom_data: { 
        currency: 'BRL', 
        value: Number(value), 
        content_name: campaignTitle,
        content_type: 'product'
      }
    };

    const fbRes = await fetch(`https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [fbEvent] })
    });

    if (!fbRes.ok) {
      const fbError = await fbRes.json();
      console.error("FB CAPI Webhook Error:", fbError);
    }

    return res.status(200).json({ status: 'success', event_id: id });

  } catch (err: any) {
    console.error("Asaas Webhook Handler Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

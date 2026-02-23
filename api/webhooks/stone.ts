
import crypto from 'crypto';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

function hash(val: string | undefined): string | undefined {
  if (!val) return undefined;
  const cleanVal = val.toLowerCase().trim();
  if (cleanVal.includes('exemplo') || cleanVal.includes('test') || cleanVal === 'doador@doador.com' || !cleanVal.includes('@')) return undefined;
  return crypto.createHash('sha256').update(cleanVal).digest('hex');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(200).json({ status: 'invalid_body' });
    }

    const { type, data } = body;

    // Pagar.me v5 envia order.paid quando o pagamento é confirmado
    if (type !== 'order.paid' || data.status !== 'paid') {
      return res.status(200).json({ status: 'ignored', type, orderStatus: data?.status });
    }

    const orderId = data.id;
    const value = data.amount / 100; // Pagar.me envia em centavos
    const customer = data.customer;
    
    // Na Stone/Pagar.me, não temos externalReference direto no topo, mas podemos usar o metadata se tivéssemos enviado
    // Ou podemos tentar encontrar a campanha pelo título ou outros dados.
    // No create-payment, não enviamos metadata. Vou ajustar o create-payment para enviar o campaignId no metadata.
    const campaignId = data.metadata?.campaignId;

    if (!campaignId) {
      console.error("Webhook Stone: Ordem sem campaignId no metadata", orderId);
      return res.status(200).json({ status: 'no_reference' });
    }

    let pixelId = '';
    let accessToken = '';
    let campaignTitle = 'Doação';

    if (db && campaignId) {
      try {
        const campDoc = await getDoc(doc(db, 'campaigns', String(campaignId)));
        if (campDoc.exists()) {
          const campData = campDoc.data();
          pixelId = campData.metaPixelId || '';
          accessToken = campData.metaAccessToken || '';
          campaignTitle = campData.title || 'Doação';
        }
      } catch (e) {
        console.error("Erro Firestore Webhook Stone:", e);
      }
    }

    if (!pixelId || !accessToken) {
      return res.status(200).json({ status: 'config_missing' });
    }

    // Correspondência Avançada Meta Ads
    const nomeCompleto = String(customer?.name || '').trim();
    const partesNome = nomeCompleto.split(/\s+/);
    const firstName = partesNome[0];
    const lastName = partesNome.length > 1 ? partesNome[partesNome.length - 1] : undefined;
    const cpfLimpo = String(customer?.document || '').replace(/\D/g, '');

    const userData = {
      external_id: cpfLimpo ? [hash(cpfLimpo)] : undefined,
      fn: firstName ? [hash(firstName)] : undefined,
      ln: lastName ? [hash(lastName)] : undefined,
      ph: customer?.phones?.mobile_phone ? [hash(String(customer.phones.mobile_phone.full_number).replace(/\D/g, ''))] : undefined,
      em: customer?.email ? [hash(String(customer.email))] : undefined
    };

    const fbEvent = {
      event_name: 'Purchase',
      event_id: orderId, 
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      user_data: userData,
      custom_data: { 
        currency: 'BRL', 
        value: Number(value), 
        content_name: campaignTitle,
        content_type: 'product'
      }
    };

    await fetch(`https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [fbEvent] })
    }).catch(() => {});

    return res.status(200).json({ status: 'success', event_id: orderId });

  } catch (err: any) {
    console.error("Stone Webhook Critical Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

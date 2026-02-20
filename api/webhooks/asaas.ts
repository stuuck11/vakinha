
import crypto from 'crypto';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

function hash(val: string | undefined): string | undefined {
  if (!val) return undefined;
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

    if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
      return res.status(200).json({ status: 'ignored' });
    }

    const { id, value, externalReference, customer: customerId } = payment;

    if (!externalReference) {
      return res.status(200).json({ status: 'no_reference' });
    }

    let pixelId = '';
    let accessToken = '';
    let campaignTitle = 'Doação';

    // Lógica para recuperar as chaves (Se for o novo formato de ID ou o antigo concatenado)
    if (externalReference.includes('|||')) {
      [pixelId, accessToken, campaignTitle] = externalReference.split('|||');
    } else {
      // BUSCA NO FIRESTORE USANDO O ID CURTO
      if (db) {
        try {
          const campDoc = await getDoc(doc(db, 'campaigns', externalReference));
          if (campDoc.exists()) {
            const data = campDoc.data();
            pixelId = data.metaPixelId;
            accessToken = data.metaAccessToken;
            campaignTitle = data.title;
          }
        } catch (e) {
          console.error("Erro ao buscar campanha no Firestore:", e);
        }
      }
    }

    if (!pixelId || !accessToken) {
      return res.status(200).json({ status: 'meta_not_found' });
    }

    const asaasApiKey = process.env.ASAAS_API_KEY;
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

    const fbEvent = {
      event_name: 'Purchase',
      event_id: id,
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

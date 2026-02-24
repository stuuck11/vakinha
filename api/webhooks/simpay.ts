
import crypto from 'crypto';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
    
    // SimPay envia postback quando o status muda
    // Status PAID ou similar
    const isPaid = body.status === 'PAID' || body.status === 'paid' || body.paid === true;
    
    if (!isPaid) {
      return res.status(200).json({ status: 'ignored', simpay_status: body.status });
    }

    const transId = body.id || body.transaction_id;
    const value = body.amount;
    const payer = body.payer;

    let pixelId = '';
    let accessToken = '';
    let campaignTitle = 'Doação';

    if (db) {
      try {
        // Busca a primeira campanha ativa como fallback ou tenta identificar pelo metadata se enviado
        const q = query(collection(db, 'campaigns'), where('isActive', '==', true));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const campData = querySnapshot.docs[0].data();
          pixelId = campData.metaPixelId || '';
          accessToken = campData.metaAccessToken || '';
          campaignTitle = campData.title || 'Doação';
        }
      } catch (e) {
        console.error("Erro Firestore Webhook SimPay:", e);
      }
    }

    if (!pixelId || !accessToken) {
      return res.status(200).json({ status: 'config_missing' });
    }

    const userData = {
      external_id: payer?.document ? [hash(payer.document.replace(/\D/g, ''))] : undefined,
      em: payer?.email ? [hash(String(payer.email))] : undefined,
      fn: payer?.name ? [hash(payer.name.split(' ')[0])] : undefined
    };

    const fbEvent = {
      event_name: 'Purchase',
      event_id: transId, 
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

    return res.status(200).json({ status: 'success', trans_id: transId });

  } catch (err: any) {
    console.error("SimPay Webhook Critical Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

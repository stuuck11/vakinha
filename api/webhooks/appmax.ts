
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
    
    // Appmax envia o status no campo 'data.status' ou similar dependendo da configuração
    // Geralmente é 'pago' para PIX aprovado
    const isPaid = body.event === 'order_payment_confirmed' || body.status === 'pago';
    
    if (!isPaid) {
      return res.status(200).json({ status: 'ignored' });
    }

    const transId = body.order_id || body.id;
    const value = body.total_amount || body.amount;
    const customer = body.customer;

    let pixelId = '';
    let accessToken = '';
    let campaignTitle = 'Doação';

    if (db) {
      try {
        const q = query(collection(db, 'campaigns'), where('isActive', '==', true));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const campData = querySnapshot.docs[0].data();
          pixelId = campData.metaPixelId || '';
          accessToken = campData.metaAccessToken || '';
          campaignTitle = campData.title || 'Doação';
        }
      } catch (e) {
        console.error("Erro Firestore Webhook Appmax:", e);
      }
    }

    if (!pixelId || !accessToken) {
      return res.status(200).json({ status: 'config_missing' });
    }

    const userData = {
      external_id: customer?.cpf ? [hash(customer.cpf.replace(/\D/g, ''))] : undefined,
      em: customer?.email ? [hash(String(customer.email))] : undefined,
      fn: customer?.firstname ? [hash(customer.firstname)] : undefined
    };

    const fbEvent = {
      event_name: 'Purchase',
      event_id: String(transId), 
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
    console.error("Appmax Webhook Critical Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

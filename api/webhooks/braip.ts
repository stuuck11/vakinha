
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
  // Braip envia postback via POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const body = req.body;
    
    // Status 2 = Pago na Braip
    // Braip envia trans_status no postback
    const status = Number(body.trans_status);
    
    if (status !== 2) {
      return res.status(200).json({ status: 'ignored', braip_status: status });
    }

    const transId = body.trans_id;
    const value = body.trans_value;
    const checkoutId = body.checkout_id;
    const clientName = body.client_name;
    const clientEmail = body.client_email;
    const clientCpf = body.client_cpf;

    let pixelId = '';
    let accessToken = '';
    let campaignTitle = 'Doação';

    // Localiza a campanha pelo checkoutId
    if (db && checkoutId) {
      try {
        const q = query(collection(db, 'campaigns'), where('braipConfig.checkoutCode', '==', String(checkoutId)));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const campData = querySnapshot.docs[0].data();
          pixelId = campData.metaPixelId || '';
          accessToken = campData.metaAccessToken || '';
          campaignTitle = campData.title || 'Doação';
        }
      } catch (e) {
        console.error("Erro Firestore Webhook Braip:", e);
      }
    }

    if (!pixelId || !accessToken) {
      return res.status(200).json({ status: 'config_missing' });
    }

    // Correspondência Avançada Meta Ads
    const nomeCompleto = String(clientName || '').trim();
    const partesNome = nomeCompleto.split(/\s+/);
    const firstName = partesNome[0];
    const lastName = partesNome.length > 1 ? partesNome[partesNome.length - 1] : undefined;
    const cpfLimpo = String(clientCpf || '').replace(/\D/g, '');

    const userData = {
      external_id: cpfLimpo ? [hash(cpfLimpo)] : undefined,
      fn: firstName ? [hash(firstName)] : undefined,
      ln: lastName ? [hash(lastName)] : undefined,
      em: clientEmail ? [hash(String(clientEmail))] : undefined
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
    console.error("Braip Webhook Critical Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

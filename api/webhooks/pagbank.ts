
import crypto from 'crypto';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

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
    
    // PagBank envia notificações de alteração de status
    // O status de pago é 'PAID'
    if (body.status !== 'PAID') {
      return res.status(200).json({ status: 'ignored', pagbank_status: body.status });
    }

    const orderId = body.id;
    const value = body.amounts?.value / 100;
    const customer = body.customer;

    // No PagBank, não temos o campaignId direto no webhook de forma fácil se não enviamos no metadata
    // Mas podemos tentar buscar por ordens recentes ou se tivéssemos salvo no firestore
    // Vou assumir que o sistema usa o metadata ou vamos buscar a campanha ativa se for uma doação genérica
    // Para ser preciso, o ideal é que o create-payment salve a relação orderId -> campaignId
    
    // Como não temos essa tabela de relação, vamos tentar buscar a campanha que tenha esse gateway ativo
    // Ou buscar no metadata se o PagBank suportar (suporta via reference_id ou metadata)
    
    let pixelId = '';
    let accessToken = '';
    let campaignTitle = 'Doação';

    if (db) {
      try {
        // Busca todas as campanhas e tenta achar a correta (simples para o exemplo)
        const q = query(collection(db, 'campaigns'), where('isActive', '==', true));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Pega a primeira ativa por enquanto (melhorar se houver muitas)
          const campData = querySnapshot.docs[0].data();
          pixelId = campData.metaPixelId || '';
          accessToken = campData.metaAccessToken || '';
          campaignTitle = campData.title || 'Doação';
        }
      } catch (e) {
        console.error("Erro Firestore Webhook PagBank:", e);
      }
    }

    if (!pixelId || !accessToken) {
      return res.status(200).json({ status: 'config_missing' });
    }

    const userData = {
      external_id: customer?.tax_id ? [hash(customer.tax_id)] : undefined,
      em: customer?.email ? [hash(String(customer.email))] : undefined,
      fn: customer?.name ? [hash(customer.name.split(' ')[0])] : undefined
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

    return res.status(200).json({ status: 'success', order_id: orderId });

  } catch (err: any) {
    console.error("PagBank Webhook Critical Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

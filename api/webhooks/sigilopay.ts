
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import crypto from 'crypto';

function hash(val: string | undefined): string | undefined {
  if (!val) return undefined;
  return crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { id, status, amount, metadata, client } = req.body;

    // SigiloPay webhook event for payment confirmed
    if (status === 'paid' || status === 'completed' || status === 'OK') {
      const campaignId = metadata?.campaignId;
      const pixelId = metadata?.pixelId;
      const accessToken = metadata?.accessToken;
      const donationAmount = Number(amount); // Na nova API já vem em Reais

      // 1. Atualiza Firestore
      if (campaignId && db) {
        const campRef = doc(db, 'campaigns', campaignId);
        await updateDoc(campRef, {
          currentAmount: increment(donationAmount),
          supportersCount: increment(1)
        }).catch(err => console.error("Erro ao atualizar Firestore no Webhook:", err));
      }

      // 2. Envia para o Meta Pixel (CAPI)
      if (pixelId && accessToken) {
        const event = {
          event_name: 'Purchase',
          event_id: id || metadata?.transactionId || `pay_${Date.now()}`,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: metadata?.originUrl || '',
          user_data: { 
            em: metadata?.email ? [hash(metadata.email)] : (client?.email ? [hash(client.email)] : undefined),
            ph: client?.phone ? [hash(client.phone)] : undefined
          },
          custom_data: { 
            currency: 'BRL', 
            value: donationAmount, 
            content_name: metadata?.campaignTitle || 'Doação',
            content_type: 'product'
          }
        };

        await fetch(`https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: [event] })
        }).catch(err => console.error("Erro CAPI no Webhook:", err));
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("SigiloPay Webhook Error:", err);
    return res.status(200).json({ received: true, error: err.message }); // Retorna 200 para evitar retentativas infinitas da SigiloPay em caso de erro lógico
  }
}

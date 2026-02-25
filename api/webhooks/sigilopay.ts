
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { id, status, amount, metadata } = req.body;

    // SigiloPay webhook event for payment confirmed
    if (status === 'paid' || status === 'completed') {
      const campaignId = metadata?.campaignId;
      const donationAmount = amount / 100; // Converte de centavos para reais

      if (campaignId && db) {
        const campRef = doc(db, 'campaigns', campaignId);
        const campSnap = await getDoc(campRef);

        if (campSnap.exists()) {
          await updateDoc(campRef, {
            currentAmount: increment(donationAmount),
            supportersCount: increment(1)
          });
          console.log(`Webhook SigiloPay: Campanha ${campaignId} atualizada com R$ ${donationAmount}`);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("SigiloPay Webhook Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

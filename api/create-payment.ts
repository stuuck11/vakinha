
import Stripe from 'stripe';

// A chave secreta deve ser configurada nas variáveis de ambiente do host (ex: Vercel)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { amount, name, email, campaignTitle } = req.body;

    // 1. Criar ou localizar cliente (Necessário para PIX)
    const customer = await stripe.customers.create({
      name,
      email,
    });

    // 2. Criar Payment Intent com PIX
    // Calculamos o timestamp de expiração (1 hora a partir de agora)
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa centavos
      currency: 'brl',
      customer: customer.id,
      payment_method_types: ['pix'],
      description: `Doação para: ${campaignTitle}`,
      payment_method_options: {
        pix: {
          expires_at: expiresAt,
        },
      },
    });

    // Retorna os dados necessários para o frontend exibir o QR Code
    res.status(200).json({
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      next_action: paymentIntent.next_action
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

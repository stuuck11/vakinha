
import Stripe from 'stripe';
import crypto from 'crypto';

function hash(val: string | undefined): string | undefined {
  if (!val) return undefined;
  return crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { amount, name, email, cpfCnpj, campaignTitle, gateway, pixelId, accessToken, campaignId, originUrl } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    
    // Captura tracking cookies para CAPI
    const cookies = req.headers.cookie || '';
    const fbp = cookies.split('; ').find((row: string) => row.startsWith('_fbp='))?.split('=')[1];
    const fbc = cookies.split('; ').find((row: string) => row.startsWith('_fbc='))?.split('=')[1];

    // CAPI: Intent de Pagamento
    if (pixelId && accessToken) {
      const hashedEmail = email ? hash(email) : undefined;
      const events = [
        {
          event_name: 'InitiateCheckout',
          event_id: `init-${Date.now()}`,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: originUrl,
          user_data: { 
            client_user_agent: userAgent, 
            em: hashedEmail ? [hashedEmail] : undefined,
            fbp, fbc 
          },
          custom_data: { currency: 'BRL', value: Number(amount), content_name: campaignTitle }
        },
        {
          event_name: 'AddPaymentInfo',
          event_id: `add-${Date.now()}`,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: originUrl,
          user_data: { 
            client_user_agent: userAgent, 
            em: hashedEmail ? [hashedEmail] : undefined,
            fbp, fbc 
          },
          custom_data: { currency: 'BRL', value: Number(amount), content_name: campaignTitle }
        }
      ];
      fetch(`https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: events })
      }).catch(() => {});
    }

    if (gateway === 'sigilopay') {
      const publicKey = process.env.SIGILOPAY_PUBLIC_KEY?.trim();
      const secretKey = process.env.SIGILOPAY_SECRET_KEY?.trim();
      
      if (!publicKey || !secretKey) {
        const missing = [];
        if (!publicKey) missing.push('SIGILOPAY_PUBLIC_KEY');
        if (!secretKey) missing.push('SIGILOPAY_SECRET_KEY');
        throw new Error(`Configuração incompleta: ${missing.join(', ')} não encontrada(s) no ambiente.`);
      }

      const response = await fetch('https://app.sigilopay.com.br/api/v1/payments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-public-key': publicKey,
          'x-secret-key': secretKey
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Valor em centavos
          description: `Doação: ${campaignTitle}`,
          payment_method: 'pix',
          customer: {
            name: (name || 'Doador').trim(),
            email: (email || 'doador@exemplo.com').trim(),
            document: cpfCnpj?.replace(/\D/g, '')
          },
          postback_url: `${(process.env.APP_URL || '').trim()}/api/webhooks/sigilopay`
        })
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("SigiloPay Raw Response:", responseText);
        throw new Error(`Erro na API SigiloPay (Status ${response.status}): ${responseText}`);
      }
      
      if (!response.ok) {
        console.error("SigiloPay Error Data:", JSON.stringify(data, null, 2));
        throw new Error(`Erro SigiloPay: ${data.message || JSON.stringify(data)}`);
      }

      // SigiloPay retorna os dados do PIX em data.pix
      return res.status(200).json({ 
        provider: 'sigilopay', 
        id: data.id,
        pix: { 
          payload: data.pix?.payload || data.pix_code,
          encodedImage: data.pix?.qrcode_base64 || data.pix_qr_code 
        }
      });
    }

    return res.status(400).json({ error: 'Gateway não suportado' });

  } catch (err: any) {
    console.error("Payment API Error:", err);
    return res.status(500).json({ error: err.message || 'Erro interno no servidor' });
  }
}

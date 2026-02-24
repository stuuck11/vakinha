
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

    if (gateway === 'simpay') {
      const clientId = process.env.SIMPAY_EMAIL; // Seu e-mail da API
      const clientSecret = process.env.SIMPAY_TOKEN; // Sua senha da API
      
      if (!clientId || !clientSecret) {
        throw new Error("SIMPAY_EMAIL ou SIMPAY_TOKEN não configurados.");
      }

      // 1. Obter Token de Acesso (OAuth 2.0)
      const authRes = await fetch('https://api.somossimpay.com.br/v2/finance/auth-token/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': process.env.APP_URL || '',
          'Referer': process.env.APP_URL || ''
        },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret })
      });

      const authText = await authRes.text();
      if (!authRes.ok) {
        if (authText.includes('<!DOCTYPE html>') || authText.includes('<!DOCTYPE HTML>')) {
          throw new Error("A SimPay bloqueou a requisição (Firewall/IP Whitelist). Se o User-Agent não resolveu, você precisará de um Proxy com IP Fixo.");
        }
        throw new Error(`Erro na autenticação SimPay (${authRes.status}): ${authText.substring(0, 100)}`);
      }

      let authData;
      try {
        authData = JSON.parse(authText);
      } catch (e) {
        throw new Error("A SimPay retornou um formato inválido. Verifique se o IP da Vercel está liberado.");
      }

      const accessToken = authData.access_token;

      // 2. Gerar PIX (API v2)
      const response = await fetch('https://api.somossimpay.com.br/v2/pix/payments/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': process.env.APP_URL || '',
          'Referer': process.env.APP_URL || ''
        },
        body: JSON.stringify({
          amount: amount,
          description: `Doação: ${campaignTitle}`,
          external_id: `doacao-${Date.now()}`,
          payer: {
            name: name || 'Doador',
            document: cpfCnpj?.replace(/\D/g, ''),
            email: email || 'doador@exemplo.com'
          },
          postback_url: `${process.env.APP_URL || ''}/api/webhooks/simpay`
        })
      });

      const resText = await response.text();
      if (!response.ok) {
        throw new Error(`Erro ao gerar PIX (${response.status}): ${resText.substring(0, 100)}`);
      }

      let data = JSON.parse(resText);
      return res.status(200).json({ 
        provider: 'simpay', 
        id: data.id || data.transaction_id,
        pix: { 
          payload: data.pix_payload || data.copy_paste || data.pix_code,
          encodedImage: data.qrcode_image || data.qrcode_base64 || data.pix_qr_code
        }
      });
    }

    if (gateway === 'pagbank') {
      const pagbankToken = process.env.PAGBANK_TOKEN;
      if (!pagbankToken) throw new Error("PAGBANK_TOKEN não configurada no servidor.");

      const response = await fetch('https://api.pagseguro.com/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${pagbankToken}` 
        },
        body: JSON.stringify({
          reference_id: `doacao-${Date.now()}`,
          customer: {
            name: name || 'Doador',
            email: email || 'doador@exemplo.com',
            tax_id: cpfCnpj?.replace(/\D/g, '')
          },
          items: [{
            name: `Doação: ${campaignTitle}`,
            quantity: 1,
            unit_amount: Math.round(amount * 100)
          }],
          qr_codes: [{
            amount: { value: Math.round(amount * 100) },
            expiration_date: new Date(Date.now() + 86400000).toISOString() // 24h
          }],
          notification_urls: [`${process.env.APP_URL || ''}/api/webhooks/pagbank`]
        })
      });

      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { throw new Error(`Resposta não-JSON do PagBank: ${text.substring(0, 100)}`); }

      if (!response.ok) {
        throw new Error(data.error_messages?.[0]?.description || 'Erro no PagBank');
      }

      const qrCode = data.qr_codes?.[0];
      const copyPaste = qrCode?.links?.find((l: any) => l.rel === 'qr_code.text')?.href;
      const qrCodeImage = qrCode?.links?.find((l: any) => l.rel === 'qr_code.png')?.href;

      return res.status(200).json({ 
        provider: 'pagbank', 
        id: data.id,
        pix: { 
          payload: copyPaste,
          encodedImage: qrCodeImage 
        }
      });
    }

    if (gateway === 'braip') {
      const braipToken = process.env.BRAIP_TOKEN;
      if (!braipToken) throw new Error("BRAIP_TOKEN não configurada no servidor.");

      // Braip requer um checkoutCode que geralmente é fixo por produto/valor.
      // Se o usuário quiser valores dinâmicos, ele precisaria de múltiplos checkouts ou suporte da Braip para isso.
      const response = await fetch('https://ev.braip.com/api/v1/checkout/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: braipToken,
          checkout: req.body.braipCheckoutCode || campaignId, // Tenta pegar o código do checkout
          payment_method: 4, // 4 = PIX na Braip
          name: name || 'Doador',
          email: email || 'doador@exemplo.com',
          document: cpfCnpj,
          amount: amount // Braip aceita amount em algumas configurações de checkout aberto
        })
      });

      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { throw new Error(`Resposta não-JSON da Braip: ${text.substring(0, 100)}`); }

      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || data.error || 'Erro na Braip');
      }

      // Braip retorna os dados do PIX em data.data
      const pixData = data.data || data;
      
      return res.status(200).json({ 
        provider: 'braip', 
        id: pixData.transaction_id || pixData.id,
        pix: { 
          payload: pixData.pix_code || pixData.pix_payload,
          encodedImage: pixData.pix_qr_code || pixData.qr_code 
        }
      });
    }

    if (gateway === 'stone') {
      const stoneApiKey = process.env.STONE_API_KEY;
      if (!stoneApiKey) throw new Error("STONE_API_KEY não configurada no servidor.");

      const auth = Buffer.from(`${stoneApiKey}:`).toString('base64');
      
      const response = await fetch('https://api.pagar.me/core/v5/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Basic ${auth}` 
        },
        body: JSON.stringify({
          items: [{
            amount: Math.round(amount * 100),
            description: `Doação: ${campaignTitle}`,
            quantity: 1
          }],
          customer: {
            name: name || 'Doador',
            email: email || 'doador@exemplo.com',
            type: cpfCnpj?.length > 11 ? 'corporation' : 'individual',
            document: cpfCnpj
          },
          payments: [{
            payment_method: 'pix',
            pix: {
              expires_in: 86400 // 24 horas
            }
          }],
          metadata: {
            campaignId: campaignId || req.body.id
          }
        })
      });

      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { throw new Error(`Resposta não-JSON da Stone: ${text.substring(0, 100)}`); }

      if (!response.ok) {
        const errorMsg = data.message || (data.errors ? Object.values(data.errors).flat().join(', ') : 'Erro na Stone');
        throw new Error(errorMsg);
      }

      const pixData = data.checkouts?.[0]?.payment?.pix || data.payments?.[0]?.pix;
      // Pagar.me v5 retorna o QR Code em payments[0].pix
      const payment = data.payments?.[0];
      
      return res.status(200).json({ 
        provider: 'stone', 
        id: data.id,
        next_action: { 
          pix_display_qr_code: { 
            image_url_svg: payment?.pix?.qr_code_url, 
            data: payment?.pix?.qr_code 
          } 
        } 
      });
    }

    if (gateway === 'pixup') {
      const pixupApiKey = process.env.PIXUP_API_KEY;
      if (!pixupApiKey) throw new Error("PIXUP_API_KEY não configurada no servidor.");

      const response = await fetch('https://api.pixup.com/v1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pixupApiKey}` },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          description: `Doação: ${campaignTitle}`,
          payer: { name: name || 'Doador', email: email || 'doador@exemplo.com', document: cpfCnpj }
        })
      });
      
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { throw new Error(`Resposta não-JSON da PixUp: ${text.substring(0, 100)}`); }

      if (!response.ok) throw new Error(data.message || data.error || 'Erro na PixUp');

      return res.status(200).json({ 
        provider: 'pixup', 
        id: data.id || data.data?.id,
        next_action: { pix_display_qr_code: { image_url_svg: data.qr_code_url || data.data?.qrcode_url, data: data.pix_payload || data.data?.pix_payload } } 
      });
    }

    if (gateway === 'asaas') {
      const asaasApiKey = process.env.ASAAS_API_KEY;
      if (!asaasApiKey) throw new Error("ASAAS_API_KEY não configurada no servidor.");

      const baseUrl = 'https://api.asaas.com/v3';
      
      // O externalReference DEVE ser o ID interno da campanha (ex: camp-123...) para que o Webhook encontre no Firestore
      const externalReference = req.body.id || campaignId;

      const custRes = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
        body: JSON.stringify({ name: name || 'Doador', email: email || '', cpfCnpj })
      });
      
      const custText = await custRes.text();
      let custData;
      try { custData = JSON.parse(custText); } catch(e) { throw new Error(`Resposta não-JSON do Asaas (Clientes): ${custText.substring(0, 100)}`); }
      if (!custRes.ok) throw new Error(custData.errors?.[0]?.description || 'Erro ao criar cliente no Asaas. Verifique seu Token.');

      const payRes = await fetch(`${baseUrl}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
        body: JSON.stringify({ 
          customer: custData.id, 
          billingType: 'PIX', 
          value: amount, 
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
          description: `Doação: ${campaignTitle}`,
          externalReference: externalReference
        })
      });
      
      const payText = await payRes.text();
      let payData;
      try { payData = JSON.parse(payText); } catch(e) { throw new Error(`Resposta não-JSON do Asaas (Pagamentos): ${payText.substring(0, 100)}`); }
      if (!payRes.ok) throw new Error(payData.errors?.[0]?.description || 'Erro ao criar pagamento no Asaas.');

      const qrRes = await fetch(`${baseUrl}/payments/${payData.id}/pixQrCode`, { method: 'GET', headers: { 'access_token': asaasApiKey } });
      const qrText = await qrRes.text();
      let qrData;
      try { qrData = JSON.parse(qrText); } catch(e) { throw new Error(`Resposta não-JSON do Asaas (QR Code): ${qrText.substring(0, 100)}`); }
      if (!qrRes.ok) throw new Error('Erro ao gerar QR Code no Asaas.');

      return res.status(200).json({ provider: 'asaas', id: payData.id, pix: { encodedImage: qrData.encodedImage, payload: qrData.payload } });
    }

    if (gateway === 'mercadopago') {
      const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      if (!mpToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurada no servidor.");

      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mpToken}`, 'X-Idempotency-Key': `v-${Date.now()}` },
        body: JSON.stringify({ transaction_amount: Number(amount), description: `Doação: ${campaignTitle}`, payment_method_id: 'pix', payer: { email: email || 'doador@exemplo.com', identification: { type: cpfCnpj?.length > 11 ? 'CNPJ' : 'CPF', number: cpfCnpj } } })
      });
      
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { throw new Error(`Resposta não-JSON do Mercado Pago: ${text.substring(0, 100)}`); }
      if (!response.ok) throw new Error(data.message || 'Erro no Mercado Pago. Verifique seu Token.');

      return res.status(200).json({ id: data.id, ...data });
    }

    // Default to Stripe
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY não configurada no servidor.");
    
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' as any });
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'brl',
      payment_method_types: ['pix'],
      description: `Doação: ${campaignTitle}`,
    });
    return res.status(200).json({ id: paymentIntent.id, next_action: paymentIntent.next_action });

  } catch (err: any) {
    console.error("Payment API Error:", err);
    return res.status(500).json({ error: err.message || 'Erro interno no servidor' });
  }
}

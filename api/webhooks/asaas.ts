
import crypto from 'crypto';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

function hash(val: string | undefined): string | undefined {
  if (!val) return undefined;
  const cleanVal = val.toLowerCase().trim();
  // Filtra e-mails de placeholder do sistema para não prejudicar o match do Meta
  if (cleanVal.includes('exemplo') || cleanVal.includes('test') || cleanVal === 'doador@doador.com' || !cleanVal.includes('@')) return undefined;
  return crypto.createHash('sha256').update(cleanVal).digest('hex');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const body = req.body;
    const { event, payment } = body;

    // Asaas envia PAYMENT_CONFIRMED ou PAYMENT_RECEIVED para pagamentos aprovados
    if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
      return res.status(200).json({ status: 'ignored', event });
    }

    const { id, value, externalReference, customer: customerId } = payment;

    if (!externalReference) {
      console.error("Webhook Asaas: Pagamento sem externalReference", id);
      return res.status(200).json({ status: 'no_reference' });
    }

    let pixelId = '';
    let accessToken = '';
    let campaignTitle = 'Doação';

    // 1. Localiza a campanha no Firestore para pegar Pixel e Token
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
        console.error("Erro Firestore Webhook:", e);
      }
    }

    if (!pixelId || !accessToken) {
      console.error("Webhook Asaas: Configuração de tracking não encontrada para ref:", externalReference);
      return res.status(200).json({ status: 'config_missing' });
    }

    // 2. Correspondência Avançada Meta Ads (Foco em CPF e NOME, já que não há e-mail)
    const asaasApiKey = process.env.ASAAS_API_KEY;
    let userData: any = {};
    
    if (asaasApiKey && customerId) {
      try {
        const custRes = await fetch(`https://api.asaas.com/v3/customers/${customerId}`, {
          headers: { 'access_token': asaasApiKey }
        });
        if (custRes.ok) {
          const custData = await custRes.json();
          
          const nomeCompleto = (custData.name || '').trim();
          const partesNome = nomeCompleto.split(/\s+/);
          const firstName = partesNome[0];
          const lastName = partesNome.length > 1 ? partesNome[partesNome.length - 1] : undefined;
          
          const cpfLimpo = (custData.cpfCnpj || '').replace(/\D/g, '');

          userData = {
            // Correspondência via CPF (external_id é o campo padrão para identificadores únicos como CPF)
            external_id: cpfLimpo ? [hash(cpfLimpo)] : undefined,
            // Correspondência via Nome (Muito forte quando combinado com CPF)
            fn: firstName ? [hash(firstName)] : undefined,
            ln: lastName ? [hash(lastName)] : undefined,
            // Outros campos se disponíveis
            ph: custData.mobilePhone ? [hash(custData.mobilePhone.replace(/\D/g, ''))] : undefined,
            em: hash(custData.email) ? [hash(custData.email)] : undefined
          };
        }
      } catch (e) {
        console.error("Erro ao buscar cliente no Asaas:", e);
      }
    }

    // 3. Dispara o evento de Purchase para o Meta CAPI
    const fbEvent = {
      event_name: 'Purchase',
      event_id: id, 
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

    const fbRes = await fetch(`https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [fbEvent] })
    });

    if (!fbRes.ok) {
      const fbError = await fbRes.json();
      console.error("Erro Meta CAPI:", fbError);
      return res.status(200).json({ status: 'meta_error', details: fbError });
    }

    console.log(`Venda trackeada via CAPI (Match: CPF/Nome). Campanha: ${campaignTitle}`);
    return res.status(200).json({ status: 'success', event_id: id });

  } catch (err: any) {
    console.error("Asaas Webhook Critical Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

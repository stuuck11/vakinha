
import { DonationConfig } from '../types';

export const paymentService = {
  createPixPayment: async (amount: number, donorData: { name: string, email: string, cpfCnpj: string }, campaign: DonationConfig) => {
    const response = await fetch('/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        name: donorData.name,
        email: donorData.email,
        cpfCnpj: donorData.cpfCnpj.replace(/\D/g, ''),
        campaignTitle: campaign.title,
        gateway: campaign.gateway,
        pixelId: campaign.metaPixelId,
        accessToken: campaign.metaAccessToken,
        campaignId: campaign.campaignId,
        id: campaign.id, // Envia o ID interno (camp-...) para o externalReference do Asaas
        originUrl: window.location.href
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao criar pagamento');
    return data;
  },

  checkPaymentStatus: async (paymentId: string, gateway: string, config: DonationConfig, amount: number, email: string) => {
    try {
      const response = await fetch('/api/check-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          gateway,
          pixelId: config.metaPixelId,
          accessToken: config.metaAccessToken,
          amount,
          campaignTitle: config.title,
          email,
          originUrl: window.location.href
        })
      });
      return await response.json();
    } catch (e) {
      return { paid: false };
    }
  }
};

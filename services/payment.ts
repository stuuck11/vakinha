
import { DonationConfig } from '../types';

/**
 * Generic Payment Service - Secure Version
 */
export const paymentService = {
  createPixPayment: async (
    amount: number, 
    donorData: { name: string, email: string, cpfCnpj: string }, 
    campaign: DonationConfig
  ) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          name: donorData.name,
          email: donorData.email,
          cpfCnpj: donorData.cpfCnpj.replace(/\D/g, ''),
          campaignTitle: campaign.title,
          gateway: campaign.gateway
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao processar pagamento no servidor');
      }

      if (data.next_action?.pix_display_qr_code || 
          data.point_of_interaction?.transaction_data?.qr_code || 
          (data.provider === 'asaas' && data.pix)) {
        return data;
      }

      throw new Error('O provedor não retornou um QR Code válido.');
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      if (err.name === 'AbortError' || err.message.includes('fetch')) {
        return {
          isDemo: true,
          next_action: {
            pix_display_qr_code: {
              image_url_svg: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=ERRO_DE_CONEXAO`,
              data: 'ERRO_DE_CONEXAO_OU_TIMEOUT'
            }
          }
        };
      }

      throw err;
    }
  }
};

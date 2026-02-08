import { DonationConfig } from '../types';

/**
 * Generic Payment Service - Secure Version
 * Strictly client-to-server with NO keys in payload.
 */
export const paymentService = {
  createPixPayment: async (
    amount: number, 
    donorData: { name: string, email: string }, 
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
          campaignTitle: campaign.title,
          gateway: campaign.gateway
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Servidor indisponível' }));
        throw new Error(errorData.error || 'Falha ao processar pagamento');
      }

      const data = await response.json();

      if (data.next_action?.pix_display_qr_code || 
          data.point_of_interaction?.transaction_data?.qr_code || 
          (data.provider === 'asaas' && data.pix)) {
        return data;
      }

      throw new Error('O provedor não retornou um QR Code válido.');
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Payment Error:", err.message);

      // Erros de configuração de servidor são críticos e devem ser mostrados
      if (err.message.includes('Configuração de servidor ausente')) {
        throw err;
      }

      // Fallback visual apenas para demonstração local em caso de erro de rede
      return {
        isDemo: true,
        next_action: {
          pix_display_qr_code: {
            image_url_svg: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=ERRO_CONFIGURACAO_SERVIDOR_REVISE_ENV_VARS`,
            data: 'ERRO_DE_CONEXAO_OU_CONFIGURACAO'
          }
        }
      };
    }
  }
};
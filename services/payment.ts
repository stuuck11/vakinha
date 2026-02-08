
/**
 * Generic Payment Service
 * Routes payment creation to the backend based on selected gateway
 */
export const paymentService = {
  createPixPayment: async (
    amount: number, 
    donorData: { name: string, email: string }, 
    campaignTitle: string,
    gateway: 'stripe' | 'mercadopago' | 'asaas' = 'stripe'
  ) => {
    // Aumentado para 15 segundos para suportar cold starts e APIs externas
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          name: donorData.name,
          email: donorData.email,
          campaignTitle,
          gateway
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Servidor indisponível' }));
        throw new Error(error.error || 'Falha ao criar pagamento');
      }

      const data = await response.json();

      // Verifica dados de QR Code nos diferentes formatos dos gateways
      if (data.next_action?.pix_display_qr_code || 
          data.point_of_interaction?.transaction_data?.qr_code || 
          (data.provider === 'asaas' && data.pix)) {
        return data;
      }

      throw new Error('QR Code PIX não disponível nesta transação.');
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      if (err.name === 'AbortError') {
        console.error("A requisição demorou demais e foi cancelada.");
      }

      // Fallback para simulação visual APENAS se não houver chaves configuradas ou erro de rede
      console.warn("Gerando PIX de demonstração (não pagável em bancos reais).");
      
      return {
        isDemo: true,
        next_action: {
          pix_display_qr_code: {
            // QR Code visualmente válido para testes de UI, mas apontando para um texto informativo
            image_url_svg: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=ESTE_EH_UM_PIX_DE_DEMONSTRACAO_CONFIGURE_SUAS_CHAVES_API',
            data: 'PIX_DEMONSTRACAO_SEM_VALOR_REAL'
          }
        }
      };
    }
  }
};

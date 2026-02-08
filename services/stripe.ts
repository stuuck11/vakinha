
/**
 * Service for Stripe PIX Integration
 * Calls the local /api/create-payment endpoint
 */
export const stripeService = {
  createPixPayment: async (amount: number, donorData: { name: string, email: string }, campaignTitle: string) => {
    const response = await fetch('/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        name: donorData.name,
        email: donorData.email,
        campaignTitle
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Falha ao criar pagamento');
    }

    const data = await response.json();

    // Se o Stripe já retornar a ação do PIX
    if (data.next_action?.pix_display_qr_code) {
      return data;
    }

    // Caso precise de uma confirmação adicional (raro para fluxos diretos)
    throw new Error('QR Code PIX não disponível nesta transação.');
  }
};

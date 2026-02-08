
/**
 * Mock Service for Stripe PIX Integration
 * In a real scenario, this would call your backend which interacts with Stripe API
 */
export const stripeService = {
  createPixPayment: async (amount: number) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate Stripe PaymentIntent Response for PIX
    return {
      id: `pi_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount,
      status: 'requires_action',
      next_action: {
        pix_display_qr_code: {
          data: `00020126360014br.gov.bcb.pix0114STRIPEPIX${Date.now()}520400005303986540${amount.toFixed(2)}5802BR5913VakinhaClone6009SaoPaulo62070503***6304`,
          image_url_svg: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=STRIPE_PIX_SIMULATION_${Date.now()}`,
        }
      }
    };
  }
};

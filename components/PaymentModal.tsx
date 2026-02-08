
import React, { useState, useEffect } from 'react';
import { stripeService } from '../services/stripe';

interface PaymentModalProps {
  total: number;
  donorData: { name: string, email: string };
  campaignTitle: string;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ total, donorData, campaignTitle, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [pixData, setPixData] = useState<{qrCode: string, copyPaste: string} | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initPayment = async () => {
      try {
        const response = await stripeService.createPixPayment(total, donorData, campaignTitle);
        setPixData({
          qrCode: response.next_action.pix_display_qr_code.image_url_svg,
          copyPaste: response.next_action.pix_display_qr_code.data
        });
      } catch (err: any) {
        setError(err.message || "Erro ao gerar PIX.");
        setTimeout(onClose, 3000);
      } finally {
        setLoading(false);
      }
    };
    initPayment();
  }, [total, donorData, campaignTitle]);

  const copyToClipboard = () => {
    if (pixData) {
      navigator.clipboard.writeText(pixData.copyPaste);
      alert('Código PIX copiado!');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-up">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#24CA68] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-gray-500">Gerando seu PIX Seguro...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <p className="font-black text-red-500">{error}</p>
            <p className="text-xs text-gray-400">Retornando...</p>
          </div>
        ) : (
          <>
            <div className="p-6 text-center border-b bg-gray-50/50">
              <div className="flex justify-center mb-2">
                <div className="bg-[#24CA68]/10 px-3 py-1 rounded-full flex items-center gap-2">
                   <div className="w-2 h-2 bg-[#24CA68] rounded-full animate-pulse" />
                   <span className="text-[10px] font-black text-[#24CA68] uppercase tracking-widest">Aguardando Pagamento</span>
                </div>
              </div>
              <h2 className="text-xl font-black">Escaneie o QR Code</h2>
              <p className="text-xs text-gray-400 mt-1 font-bold uppercase tracking-tighter">Doação para {campaignTitle}</p>
            </div>

            <div className="p-8 flex flex-col items-center">
              <div className="bg-white border-8 border-gray-50 p-4 rounded-3xl mb-6 shadow-inner">
                <img 
                  src={pixData?.qrCode}
                  alt="QR Code PIX"
                  className="w-56 h-56"
                />
              </div>

              <div className="mb-6 w-full text-center space-y-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Valor Total</span>
                <div className="text-4xl font-black text-gray-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                </div>
              </div>

              <button 
                onClick={copyToClipboard}
                className="w-full bg-[#EEFFE6] border-2 border-[#24CA68]/20 py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#24CA68]/10 transition-all active:scale-95"
              >
                <span className="font-black text-sm text-[#24CA68]">Copiar Código PIX (Copia e Cola)</span>
              </button>
            </div>

            <div className="p-6 bg-gray-50 flex flex-col gap-4">
              <div className="flex items-center justify-center gap-2">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-4 opacity-40" />
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pagamento Processado via Stripe</span>
              </div>
              <button 
                onClick={onClose}
                className="w-full py-2 text-xs font-black text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

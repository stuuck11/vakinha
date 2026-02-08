
import React, { useState, useEffect } from 'react';
import { paymentService } from '../services/payment';
import { getActiveCampaign } from '../constants';

interface PaymentModalProps {
  total: number;
  donorData: { name: string, email: string };
  campaignTitle: string;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ total, donorData, campaignTitle, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [pixData, setPixData] = useState<{qrCode?: string, copyPaste: string, isDemo?: boolean} | null>(null);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const config = getActiveCampaign();

  useEffect(() => {
    const initPayment = async () => {
      try {
        const response = await paymentService.createPixPayment(total, donorData, config);
        
        if (response.isDemo) {
          setPixData({
            qrCode: response.next_action.pix_display_qr_code.image_url_svg,
            copyPaste: response.next_action.pix_display_qr_code.data,
            isDemo: true
          });
        }
        else if (response.provider === 'asaas' && response.pix) {
          setPixData({
            qrCode: `data:image/png;base64,${response.pix.encodedImage}`,
            copyPaste: response.pix.payload
          });
        }
        else if (response.next_action?.pix_display_qr_code) {
          setPixData({
            qrCode: response.next_action.pix_display_qr_code.image_url_svg,
            copyPaste: response.next_action.pix_display_qr_code.data
          });
        } 
        else if (response.point_of_interaction?.transaction_data) {
          const data = response.point_of_interaction.transaction_data;
          setPixData({
            qrCode: `data:image/png;base64,${data.qr_code_base64}`,
            copyPaste: data.qr_code
          });
        }
      } catch (err: any) {
        setError(
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
            <p className="font-black text-gray-800 text-lg mb-2">Ops! Ocorreu um problema</p>
            <p className="text-sm text-red-500 font-bold bg-red-50 py-2 px-4 rounded-lg inline-block">{err.message}</p>
            <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
              Dica: Verifique se sua conta no {config.gateway.toUpperCase()} está aprovada para receber PIX.
            </p>
          </div>
        );
      } finally {
        setLoading(false);
      }
    };
    initPayment();
  }, [total, donorData, config]);

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
          <div className="p-16 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#24CA68] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-gray-400 italic text-sm">Contatando {config.gateway.toUpperCase()}...</p>
          </div>
        ) : error ? (
          <div className="p-10 space-y-6">
            {error}
            <button onClick={onClose} className="w-full bg-gray-100 py-4 rounded-2xl font-black text-gray-500 uppercase text-xs tracking-widest hover:bg-gray-200 transition-all">Entendido, vou verificar</button>
          </div>
        ) : (
          <>
            <div className="p-6 text-center border-b bg-gray-50/50">
              <div className="flex justify-center mb-2">
                <div className="bg-[#24CA68]/10 px-3 py-1 rounded-full flex items-center gap-2">
                   <div className="w-2 h-2 bg-[#24CA68] rounded-full animate-pulse" />
                   <span className="text-[10px] font-black text-[#24CA68] uppercase tracking-widest">
                     PIX Oficial Gerado
                   </span>
                </div>
              </div>
              <h2 className="text-xl font-black">Escaneie o QR Code</h2>
              <p className="text-xs text-gray-400 mt-1 font-bold uppercase tracking-tighter">
                Sua doação vai direto para a causa
              </p>
            </div>

            <div className="p-8 flex flex-col items-center">
              <div className="bg-white border-8 border-gray-50 p-4 rounded-3xl mb-6 shadow-inner">
                {pixData?.qrCode && <img src={pixData.qrCode} alt="QR Code PIX" className="w-56 h-56" />}
              </div>

              <div className="mb-6 w-full text-center space-y-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Valor Total</span>
                <div className="text-4xl font-black text-gray-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                </div>
              </div>

              <button 
                onClick={copyToClipboard}
                className="w-full bg-[#EEFFE6] border-2 border-[#24CA68]/20 py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#24CA68]/10 transition-all active:scale-95 shadow-sm"
              >
                <span className="font-black text-sm text-[#24CA68]">Copiar Código PIX</span>
              </button>
            </div>

            <div className="p-6 bg-gray-50 flex flex-col gap-4 text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pague no app do seu banco para confirmar</span>
              <button onClick={onClose} className="w-full py-2 text-xs font-black text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest">Cancelar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

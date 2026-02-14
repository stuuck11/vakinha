
import React, { useState, useEffect, useRef } from 'react';
import { paymentService } from '../services/payment';
import { DonationConfig } from '../types';

interface PaymentModalProps {
  total: number;
  donorData: { name: string, email: string, cpfCnpj: string };
  campaignTitle: string;
  config: DonationConfig;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ total, donorData, campaignTitle, config, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [pixData, setPixData] = useState<{id?: string, qrCode?: string, copyPaste: string, isDemo?: boolean} | null>(null);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initPayment = async () => {
      try {
        const response = await paymentService.createPixPayment(total, donorData, config);
        if (!isMounted) return;

        if (response.isDemo) {
          setPixData({
            qrCode: response.next_action.pix_display_qr_code.image_url_svg,
            copyPaste: response.next_action.pix_display_qr_code.data,
            isDemo: true
          });
        }
        else if (response.provider === 'pixup' && response.pix) {
          setPixData({
            id: response.id,
            qrCode: `data:image/png;base64,${response.pix.encodedImage}`,
            copyPaste: response.pix.payload
          });
          startPolling(response.id, 'pixup');
        }
        else if (response.provider === 'asaas' && response.pix) {
          setPixData({
            id: response.id,
            qrCode: `data:image/png;base64,${response.pix.encodedImage}`,
            copyPaste: response.pix.payload
          });
          startPolling(response.id, 'asaas');
        }
        else if (response.point_of_interaction?.transaction_data) {
          const data = response.point_of_interaction.transaction_data;
          setPixData({
            id: response.id?.toString(),
            qrCode: `data:image/png;base64,${data.qr_code_base64}`,
            copyPaste: data.qr_code
          });
          startPolling(response.id.toString(), 'mercadopago');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(<div className="text-center p-4"><p className="text-red-500 font-bold">{err.message}</p></div>);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const startPolling = (id: string, gateway: string) => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/create-payment?id=${id}&gateway=${gateway}`);
          const data = await res.json();
          
          if (data.isPaid) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            handlePaymentSuccess();
          }
        } catch (e) {
          console.error("Erro ao verificar status");
        }
      }, 5000);
    };

    const handlePaymentSuccess = () => {
      setIsPaid(true);
      if ((window as any).fbq) {
        (window as any).fbq('track', 'Purchase', {
          value: total,
          currency: 'BRL',
          content_name: campaignTitle
        });
      }
    };

    initPayment();
    return () => { 
      isMounted = false; 
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

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
        
        {isPaid ? (
          <div className="p-12 text-center space-y-6 animate-slide-up">
             <div className="w-20 h-20 bg-green-100 text-[#24CA68] rounded-full flex items-center justify-center text-4xl mx-auto border-4 border-green-50 shadow-inner">
               ✓
             </div>
             <div className="space-y-2">
               <h2 className="text-2xl font-black text-gray-800">Doação Confirmada!</h2>
               <p className="text-sm text-gray-500 font-medium">Muito obrigado pela sua solidariedade. Sua contribuição já foi enviada. 💚</p>
             </div>
             <button onClick={onClose} className="w-full bg-[#24CA68] text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg">Concluir</button>
          </div>
        ) : loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#24CA68] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-gray-400 italic text-sm">Gerando PIX seguro...</p>
          </div>
        ) : error ? (
          <div className="p-10 space-y-6 text-center">
            {error}
            <button onClick={onClose} className="w-full bg-gray-100 py-4 rounded-2xl font-black text-gray-500">Voltar</button>
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
            </div>
            <div className="p-8 flex flex-col items-center">
              <div className="bg-white border-8 border-gray-50 p-4 rounded-3xl mb-6 shadow-inner">
                {pixData?.qrCode && <img src={pixData.qrCode} alt="QR Code PIX" className="w-56 h-56" />}
              </div>
              <div className="mb-6 w-full text-center space-y-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Valor Total</span>
                <div className="text-4xl font-black text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</div>
              </div>
              <button onClick={copyToClipboard} className="w-full bg-[#EEFFE6] border-2 border-[#24CA68]/20 py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#24CA68]/10 transition-all active:scale-95">
                <span className="font-black text-sm text-[#24CA68]">Copiar Código PIX</span>
              </button>
            </div>
            <div className="p-6 bg-gray-50 flex flex-col gap-4 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase">O site confirmará seu pagamento automaticamente após a transação.</p>
              <button onClick={onClose} className="w-full py-2 text-xs font-black text-gray-400 hover:text-red-500 uppercase">Cancelar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

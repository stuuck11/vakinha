
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
  const [pixData, setPixData] = useState<{id?: string, qrCode?: string, copyPaste: string} | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const initPayment = async () => {
      try {
        // Pixel: InitiateCheckout -> acionado apenas quando abrir o QR code (abrir o modal)
        if ((window as any).fbq && !(window as any).initiateCheckoutTracked) {
          (window as any).fbq('track', 'InitiateCheckout', { 
            value: Number(total), 
            currency: 'BRL', 
            content_name: campaignTitle,
            content_type: 'product'
          });
          (window as any).initiateCheckoutTracked = true;
        }

        const response = await paymentService.createPixPayment(total, donorData, config);
        if (!isMounted) return;

        if (response.provider === 'sigilopay' && response.pix) {
          setPixData({ 
            id: response.id, 
            qrCode: response.pix.encodedImage.startsWith('data:') ? response.pix.encodedImage : `data:image/png;base64,${response.pix.encodedImage}`, 
            copyPaste: response.pix.payload 
          });
        } else if (response.provider === 'abacatepay' && response.url) {
          window.location.href = response.url;
          return;
        } else {
          let id = response.id;
          let qr = '';
          let cp = '';

          if (response.provider === 'asaas' && response.pix) {
            qr = `data:image/png;base64,${response.pix.encodedImage}`;
            cp = response.pix.payload;
          } else if (response.next_action?.pix_display_qr_code) {
            qr = response.next_action.pix_display_qr_code.image_url_svg;
            cp = response.next_action.pix_display_qr_code.data;
          } else if (response.point_of_interaction?.transaction_data) {
            qr = `data:image/png;base64,${response.point_of_interaction.transaction_data.qr_code_base64}`;
            cp = response.point_of_interaction.transaction_data.qr_code;
          }

          setPixData({ id, qrCode: qr, copyPaste: cp });
        }
        
        const finalId = response.id;
        if (finalId) {
          pollingRef.current = setInterval(async () => {
            const status = await paymentService.checkPaymentStatus(finalId, config.gateway, config, total, donorData.email);
            if (status.paid) {
              setIsPaid(true);
              clearInterval(pollingRef.current);
              
              // EVENTO REAL DE COMPRA COM VALOR E TRAVA
              if ((window as any).fbq && !(window as any).purchaseTracked) {
                (window as any).fbq('track', 'Purchase', {
                  value: Number(total),
                  currency: 'BRL',
                  content_name: campaignTitle,
                  content_type: 'product'
                }, { eventID: id });
                (window as any).purchaseTracked = true;
              }
            }
          }, 5000);
        }

      } catch (err: any) {
        if (isMounted) setError(<p className="text-red-500 font-bold">{err.message}</p>);
      } finally {
        if (isMounted) setLoading(false);
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
      const textToCopy = pixData.copyPaste;
      
      // Cria elemento temporário para garantir cópia em dispositivos móveis
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      
      // Estilos para garantir que o elemento não seja visível e não quebre o layout
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      // Suporte específico para iOS
      textArea.setSelectionRange(0, 99999);
      
      let successful = false;
      try {
        successful = document.execCommand('copy');
      } catch (err) {
        successful = false;
      }
      
      document.body.removeChild(textArea);

      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else if (navigator.clipboard) {
        // Fallback para API moderna caso execCommand falhe (ex: contextos seguros)
        navigator.clipboard.writeText(textToCopy).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => {});
      }
    }
  };

  if (isPaid) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
        <div className="relative bg-white rounded-3xl w-full max-w-md p-10 text-center space-y-6 animate-slide-up shadow-2xl">
          <div className="w-24 h-24 bg-green-100 text-[#24CA68] rounded-full flex items-center justify-center text-5xl mx-auto shadow-inner animate-bounce">
            ✓
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Doação Confirmada!</h2>
            <p className="text-gray-500 font-medium leading-relaxed">Seu apoio foi recebido com sucesso. Muito obrigado por ajudar o {config.beneficiaryName}!</p>
          </div>
          <button onClick={onClose} className="w-full bg-[#24CA68] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-green-100">
            Concluir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-up">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#24CA68] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-gray-400 italic text-sm">Gerando PIX seguro...</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center space-y-6">
            <div className="text-4xl">⚠️</div>
            {error}
            <button onClick={onClose} className="w-full bg-gray-100 py-4 rounded-xl font-black text-gray-500 uppercase text-xs">Fechar</button>
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
              <div className="bg-white border-8 border-gray-50 p-4 rounded-3xl mb-6">
                {pixData?.qrCode && <img src={pixData.qrCode} alt="PIX" className="w-56 h-56" />}
              </div>
              <div className="mb-6 w-full text-center">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Total a pagar</span>
                <div className="text-4xl font-black text-gray-900">R$ {total.toFixed(2).replace('.', ',')}</div>
              </div>
              <button 
                onClick={copyToClipboard} 
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all duration-500 border-2 ${copied ? 'bg-[#24CA68] border-[#24CA68] scale-[1.02] shadow-lg shadow-green-100' : 'bg-[#EEFFE6] border-[#24CA68]/20 hover:border-[#24CA68]/40'}`}
              >
                <span className={`font-black text-sm transition-colors duration-500 ${copied ? 'text-white' : 'text-[#24CA68]'}`}>
                  {copied ? 'Código Copiado! ✓' : 'Copiar Código PIX'}
                </span>
              </button>
            </div>
            <div className="p-6 bg-gray-50 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed">
                Assim que você pagar, esta tela <br/> atualizará automaticamente.
              </p>
              <button onClick={onClose} className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500">Cancelar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

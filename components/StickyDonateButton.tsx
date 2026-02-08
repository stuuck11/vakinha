
import React from 'react';

interface StickyDonateButtonProps {
  onClick: () => void;
}

export const StickyDonateButton: React.FC<StickyDonateButtonProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-gray-100 px-4 pt-2 pb-6 flex flex-col items-center">
      
      {/* Security Badge - Nova Estilização Baseada na Imagem */}
      <div className="w-full max-w-[640px] mb-3">
        <div className="bg-gray-100/50 py-2 rounded-lg flex items-center justify-center gap-2">
           <div className="w-3.5 h-3.5 border-2 border-[#24CA68] rounded-full" />
           <span className="text-[10px] font-bold text-gray-500">Doação protegida e segura</span>
        </div>
      </div>

      {/* Botão Principal */}
      <div className="w-full max-w-[640px]">
        <button 
          onClick={onClick}
          className="w-full bg-[#24CA68] text-white py-4 rounded-lg font-black text-lg transition-transform active:scale-95"
        >
          Quero Ajudar
        </button>
      </div>
    </div>
  );
};

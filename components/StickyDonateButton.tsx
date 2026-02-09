
import React from 'react';

interface StickyDonateButtonProps {
  onClick: () => void;
}

export const StickyDonateButton: React.FC<StickyDonateButtonProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-[#EEFFE6] border-t border-gray-200 px-4 pt-4 pb-6 flex flex-col items-center">
      
      {/* Selo de Segurança Identico ao da Foto - Fundo Branco para destacar no fundo verde */}
      <div className="mb-4">
        <div className="flex items-center border border-gray-200 rounded-full px-3 py-1 bg-white shadow-sm">
           <div className="bg-[#24CA68] w-6 h-6 rounded-full flex items-center justify-center mr-2 shadow-sm">
             <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
             </svg>
           </div>
           <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Doação Protegida</span>
        </div>
      </div>

      {/* Botão Principal */}
      <div className="w-full max-w-[640px]">
        <button 
          onClick={onClick}
          className="w-full bg-[#24CA68] text-white py-4 rounded-lg font-black text-lg transition-transform active:scale-95 shadow-md"
        >
          Quero Ajudar
        </button>
      </div>
    </div>
  );
};


import React from 'react';
import { DonationConfig } from '../types';

interface HeaderProps {
  onDonateClick: () => void;
  config: DonationConfig;
}

export const Header: React.FC<HeaderProps> = ({ onDonateClick, config }) => {
  return (
    <header className="bg-white border-b sticky top-0 z-50 px-4 py-3">
      <div className="max-w-[640px] mx-auto flex items-center justify-between">
        <a 
          href="https://www.vakinha.com.br/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 cursor-pointer"
        >
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="Logo" className="h-8 object-contain" />
          ) : (
            <>
              <div className="w-7 h-7 bg-[#24CA68] rounded flex items-center justify-center text-white font-black text-xs">
                V
              </div>
              <span className="font-black text-lg tracking-tighter text-gray-800">Vakinha</span>
            </>
          )}
        </a>
        
        <button 
          onClick={onDonateClick}
          className="bg-[#24CA68] text-white px-5 py-2 rounded-full font-black text-[12px] shadow-sm active:scale-95 transition-all"
        >
          Doar Agora
        </button>
      </div>
    </header>
  );
};

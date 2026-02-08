
import React, { useState } from 'react';
import { DonationConfig } from '../types';

interface HomePageProps {
  onDonateClick: () => void;
  config: DonationConfig;
}

export const HomePage: React.FC<HomePageProps> = ({ onDonateClick, config }) => {
  const [activeTab, setActiveTab] = useState<'sobre' | 'ajudaram'>('sobre');

  const progressPercentage = Math.min((config.currentAmount / config.targetAmount) * 100, 100);

  const scrollToDescription = () => {
    const element = document.getElementById('desc-completa');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const ActionBox = () => (
    <div className="bg-[#EEFFE6] p-4 rounded-lg space-y-4">
      <button 
        onClick={onDonateClick}
        className="w-full bg-[#24CA68] text-white py-3 rounded-lg font-black text-sm tracking-wide shadow-sm active:scale-95 transition-transform"
      >
        Doar Agora
      </button>
      
      <div className="space-y-2 px-1 text-[11px] font-bold text-gray-600">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">Corações Recebidos <span className="text-[#24CA68]">💚</span></span>
          <span>{config.heartsCount}</span>
        </div>
        <div className="flex justify-between items-center border-t border-green-100 pt-2">
          <span>Apoiadores</span>
          <span>{config.supportersCount}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen pb-10">
      <div className="max-w-[640px] mx-auto overflow-hidden">
        {/* Imagem Principal */}
        {config.mainImage && (
          <div className="w-full aspect-[16/9] overflow-hidden">
            <img src={config.mainImage} alt={config.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="px-4 py-4 space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{config.category}</span>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">{config.title}</h1>
            <p className="text-[11px] font-bold text-gray-400">ID: {config.campaignId}</p>
          </div>

          <div className="space-y-2 pt-2">
            <div className="h-[3px] w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#24CA68] transition-all duration-1000" style={{ width: `${progressPercentage}%` }} />
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-1">
                <span className="font-black text-[#24CA68]">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(config.currentAmount)}
                </span>
                <span className="text-gray-400 font-medium">de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(config.targetAmount)}</span>
              </div>
              <span className="font-black text-[#24CA68] text-xs">
                {progressPercentage.toFixed(0)}% Arrecadado
              </span>
            </div>
          </div>

          <ActionBox />

          <div className="space-y-3">
            <h2 className="text-[13px] font-black text-gray-800">{config.topicTitle}</h2>
            <p className="text-[12px] text-gray-500 leading-relaxed font-medium line-clamp-3">{config.description}</p>
            <button onClick={scrollToDescription} className="text-[11px] font-bold text-gray-400 hover:text-gray-600">ver tudo</button>
            <div onClick={onDonateClick} className="w-10 h-10 bg-black rounded-xl flex items-center justify-center cursor-pointer transition-all hover:opacity-80">
               <span className="text-sm">✋</span>
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-100 pt-4">
            <button className="flex items-center gap-2 text-[11px] font-bold text-gray-800 underline decoration-gray-300">
              <img src={config.sealIcon || "https://i.ibb.co/vzV6vFv/wax-seal.png"} alt="Selo" className="w-5 h-5 object-contain" />
              Ver selos
            </button>
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Vaquinha em benefício do {config.beneficiaryName}, criada por:</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#24CA68]/10 flex items-center justify-center text-lg">💚</div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-black text-gray-800">{config.creatorName}</span>
                  <span className="text-[10px] font-bold text-gray-400">Ativo(a) desde {config.creatorSince}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100" id="desc-completa">
            <div className="flex gap-8 border-b border-gray-100 mb-6">
              <button onClick={() => setActiveTab('sobre')} className={`pb-2 text-[12px] font-black transition-all relative ${activeTab === 'sobre' ? 'text-[#24CA68]' : 'text-gray-400'}`}>
                Sobre {activeTab === 'sobre' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#24CA68]" />}
              </button>
              <button onClick={() => setActiveTab('ajudaram')} className={`pb-2 text-[12px] font-black transition-all relative ${activeTab === 'ajudaram' ? 'text-[#24CA68]' : 'text-gray-400'}`}>
                Últimas doações {activeTab === 'ajudaram' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#24CA68]" />}
              </button>
            </div>

            {activeTab === 'sobre' ? (
              <div className="space-y-6 animate-slide-up">
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-[#24CA68] font-bold text-[10px] uppercase">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Vaquinha Verificada
                  </div>
                  <h4 className="text-[13px] font-black text-gray-800">Campanha {config.title}</h4>
                  <p className="text-[12px] text-gray-500 leading-relaxed font-medium">{config.description}</p>
                </div>
                <ActionBox />
              </div>
            ) : (
              <div className="space-y-6 animate-slide-up">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#F5F5F5] rounded-xl p-6 text-center space-y-1">
                    <div className="text-xl font-black text-gray-800">{config.supportersCount}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Contribuições</div>
                  </div>
                  <div className="bg-[#F5F5F5] rounded-xl p-6 text-center space-y-1">
                    <div className="text-xl font-black text-gray-800">{config.heartsCount}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Corações</div>
                  </div>
                </div>
                <div className="space-y-4">
                  {(config.supporters || []).map((supporter) => (
                    <div key={supporter.id} className="bg-white border-b border-gray-50 pb-4 last:border-0">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-black text-gray-500 shrink-0" style={{ backgroundColor: supporter.avatarColor || '#F5F5F5' }}>{supporter.name.charAt(0)}</div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[12px] font-black text-gray-800 leading-tight">{supporter.name}</p>
                              <p className="text-[12px] font-black text-[#24CA68]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(supporter.amount)}</p>
                            </div>
                            <span className="text-[10px] font-bold text-gray-300">{supporter.time}</span>
                          </div>
                          {supporter.comment && <p className="text-[11px] font-medium text-gray-500 mt-1 italic">"{supporter.comment}"</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

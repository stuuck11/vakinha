
import React, { useState, useEffect } from 'react';
import { DonationConfig } from '../types';
import { PaymentModal } from '../components/PaymentModal';

interface ContributionPageProps {
  onBack: () => void;
  config: DonationConfig;
}

export const ContributionPage: React.FC<ContributionPageProps> = ({ onBack, config }) => {
  const [baseValue, setBaseValue] = useState<number>(0);
  const [customValue, setCustomValue] = useState<string>('');
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [upsellTotal, setUpsellTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const upsells = config.upsells
      .filter(u => selectedUpsells.includes(u.id))
      .reduce((acc, curr) => acc + curr.value, 0);
    
    const base = baseValue || parseFloat(customValue.replace('.', '').replace(',', '.')) || 0;
    setUpsellTotal(upsells);
    setTotal(base + upsells);
  }, [baseValue, customValue, selectedUpsells, config]);

  const handlePresetClick = (val: number) => {
    setBaseValue(val);
    setCustomValue(val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setError(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9,]/g, '');
    setCustomValue(val);
    setBaseValue(0);
    setError(null);
  };

  const toggleUpsell = (id: string) => {
    setSelectedUpsells(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleContribute = () => {
    if (total < config.minAmount) {
      setError(`O valor total (incluindo turbos) deve ser de no mínimo R$ ${config.minAmount.toFixed(2)}`);
      return;
    }
    setShowPayment(true);
  };

  const currentBase = baseValue || parseFloat(customValue.replace('.', '').replace(',', '.')) || 0;

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="max-w-[500px] mx-auto px-4 py-6">
        {/* Header simplificado: Apenas seta e logo com função de voltar */}
        <div className="flex items-center gap-4 mb-8">
           <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
           </button>
           <div className="cursor-pointer" onClick={onBack}>
              <img src={config.logoUrl || 'https://imgur.com/NeAZeVi.png'} alt="Logo" className="h-7 object-contain" />
           </div>
        </div>

        <div className="space-y-1 mb-8">
           <h1 className="text-xl font-black text-gray-800 tracking-tight">{config.title}</h1>
           <p className="text-xs font-bold text-gray-400">ID da Campanha: {config.campaignId}</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-black text-gray-800">Valor da contribuição</h3>
            <div className="flex border rounded-lg overflow-hidden group focus-within:border-[#24CA68] bg-white">
               <div className="bg-white border-r px-4 flex items-center justify-center font-bold text-gray-400">R$</div>
               <input 
                 type="text"
                 value={customValue}
                 onChange={handleCustomChange}
                 placeholder="0,00"
                 className="w-full py-4 px-4 text-xl font-bold focus:outline-none bg-white"
               />
            </div>
            {error && <p className="text-red-500 text-[10px] font-bold">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
             {config.presetAmounts.map(amount => (
               <button
                 key={amount}
                 onClick={() => handlePresetClick(amount)}
                 className={`relative py-3.5 border rounded-lg font-bold text-sm transition-all ${baseValue === amount ? 'border-[#24CA68] bg-[#EEFFE6]/30 text-[#24CA68]' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}
               >
                 R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 {amount === 50 && (
                   <div className="absolute -top-2.5 right-2 bg-[#FF5F5F] text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase shadow-sm">
                     Mais escolhido
                   </div>
                 )}
               </button>
             ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black text-gray-800">Forma de pagamento</h3>
            <div className="flex">
               <div className="bg-[#24CA68] text-white px-4 py-3 rounded-lg flex items-center gap-2 cursor-pointer shadow-sm">
                  <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  <span className="font-bold text-xs">Pix</span>
               </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
             <h3 className="text-sm font-black text-gray-800">Turbine sua doação</h3>
             <p className="text-[11px] font-bold text-gray-400">Ajude MUITO MAIS turbinando sua doação <span className="text-[#24CA68]">💚</span></p>
             
             <div className="grid grid-cols-3 gap-2">
                {config.upsells.map(upsell => (
                  <div 
                    key={upsell.id}
                    onClick={() => toggleUpsell(upsell.id)}
                    className={`border-2 border-dashed rounded-lg p-3 text-center transition-all cursor-pointer ${selectedUpsells.includes(upsell.id) ? 'border-[#24CA68] bg-[#EEFFE6]/20' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="text-xl mb-1">{upsell.icon}</div>
                    <p className="text-[9px] font-black text-gray-600 leading-tight mb-1">{upsell.label}</p>
                    <p className="text-[10px] font-black text-gray-400">R$ {upsell.value.toFixed(2)}</p>
                  </div>
                ))}
             </div>
          </div>

          <div className="pt-4 space-y-3">
             <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                <span>Sua Doação:</span>
                <span>R$ {currentBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
             </div>
             {upsellTotal > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-[#24CA68]">
                   <span>Turbos extras:</span>
                   <span>+ R$ {upsellTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
             )}
             <div className="flex justify-between items-center text-sm font-black text-gray-800 border-t pt-3">
                <span>Valor Total:</span>
                <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
             </div>
          </div>

          <button 
            onClick={handleContribute}
            className="w-full bg-[#24CA68] text-white py-4 rounded-lg font-black text-lg shadow-lg active:scale-95 transition-transform uppercase tracking-tight"
          >
            Finalizar Doação
          </button>

          <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-3 border border-gray-100">
             <div className="bg-[#1A1A1A] text-white p-2 rounded flex items-center gap-1.5 shrink-0">
                <div className="w-4 h-4 bg-[#24CA68] rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                </div>
                <div className="flex flex-col text-[7px] font-black leading-none uppercase">
                   <span>Selo de</span>
                   <span>Segurança</span>
                </div>
             </div>
             <p className="text-[10px] text-gray-400 font-medium">Sua transação é processada de forma segura e criptografada.</p>
          </div>
        </div>
      </div>

      {showPayment && <PaymentModal total={total} onClose={() => setShowPayment(false)} />}
    </div>
  );
};

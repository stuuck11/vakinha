
import React, { useState, useEffect } from 'react';
import { DonationConfig } from '../types';
import { PaymentModal } from '../components/PaymentModal';

export const ContributionPage: React.FC<{ onBack: () => void; config: DonationConfig }> = ({ onBack, config }) => {
  const [baseValue, setBaseValue] = useState<number>(0);
  const [customValue, setCustomValue] = useState<string>('');
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [donorData, setDonorData] = useState({ name: 'Doador Anônimo', email: 'doador@exemplo.com' });
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  // Valores calculados para exibição
  const upsellsTotal = config.upsells
    .filter(u => selectedUpsells.includes(u.id))
    .reduce((acc, curr) => acc + curr.value, 0);
  
  const donationBase = baseValue || parseFloat(customValue.replace(/\./g, '').replace(',', '.')) || 0;

  useEffect(() => {
    setTotal(donationBase + upsellsTotal);
  }, [donationBase, upsellsTotal]);

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
      setError(`O valor total deve ser de no mínimo R$ ${config.minAmount.toFixed(2)}`);
      return;
    }
    setShowPayment(true);
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="max-w-[500px] mx-auto px-4 py-6">
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
            <div className="flex border border-gray-200 rounded-xl overflow-hidden group focus-within:border-[#24CA68] bg-white transition-all">
               <div className="bg-gray-50 border-r px-5 flex items-center justify-center font-black text-gray-400">R$</div>
               <input 
                 type="text"
                 value={customValue}
                 onChange={handleCustomChange}
                 placeholder="0,00"
                 className="w-full py-5 px-4 text-2xl font-black focus:outline-none bg-white"
               />
            </div>
            {error && <p className="text-red-500 text-[11px] font-bold animate-pulse">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
             {config.presetAmounts.map(amount => (
               <button
                 key={amount}
                 onClick={() => handlePresetClick(amount)}
                 className={`relative py-4 border-2 rounded-xl font-black text-sm transition-all ${baseValue === amount ? 'border-[#24CA68] bg-[#EEFFE6]/50 text-[#24CA68]' : 'border-gray-100 text-gray-600 hover:border-gray-200 bg-white'}`}
               >
                 R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </button>
             ))}
          </div>

          <div className="space-y-4 pt-4">
             <h3 className="text-sm font-black text-gray-800">Turbine sua doação</h3>
             <div className="grid grid-cols-3 gap-2">
                {config.upsells.map(upsell => (
                  <div 
                    key={upsell.id}
                    onClick={() => toggleUpsell(upsell.id)}
                    className={`border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer ${selectedUpsells.includes(upsell.id) ? 'border-[#24CA68] bg-[#EEFFE6]/30' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                  >
                    <div className="text-xl mb-1">{upsell.icon}</div>
                    <p className="text-[9px] font-black text-gray-600 leading-tight mb-1">{upsell.label}</p>
                    <p className="text-[10px] font-black text-gray-400">R$ {upsell.value.toFixed(2)}</p>
                  </div>
                ))}
             </div>
          </div>

          <div className="pt-4 space-y-2">
             <div className="flex justify-between items-center text-sm font-black text-gray-800 border-t pt-4">
                <span>Valor Total:</span>
                <span className="text-2xl text-[#24CA68]">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
             </div>
             {upsellsTotal > 0 && (
               <div className="flex flex-col items-end gap-0.5">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                   Doação Base: {donationBase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                 </p>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                   Turbos: + {upsellsTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                 </p>
               </div>
             )}
          </div>

          <button 
            onClick={handleContribute}
            className="w-full bg-[#24CA68] text-white py-5 rounded-2xl font-black text-xl shadow-lg shadow-green-100 active:scale-95 transition-all uppercase tracking-tight"
          >
            Gerar PIX de Doação
          </button>
        </div>
      </div>

      {showPayment && <PaymentModal total={total} donorData={donorData} campaignTitle={config.title} onClose={() => setShowPayment(false)} />}
    </div>
  );
};

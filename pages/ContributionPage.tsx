
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
  const [donorData, setDonorData] = useState({ name: '', email: '' });
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
      setError(`O valor total deve ser de no mínimo R$ ${config.minAmount.toFixed(2)}`);
      return;
    }
    if (!donorData.name || !donorData.email) {
      setError('Por favor, preencha seu nome e e-mail para gerar o PIX.');
      return;
    }
    setShowPayment(true);
  };

  const currentBase = baseValue || parseFloat(customValue.replace('.', '').replace(',', '.')) || 0;

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
          {/* Seção de Dados do Doador */}
          <div className="space-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <h3 className="text-sm font-black text-gray-800">Seus Dados (Para emissão do PIX)</h3>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Nome Completo" 
                value={donorData.name}
                onChange={e => setDonorData({...donorData, name: e.target.value})}
                className="w-full p-3 rounded-xl border-2 border-white focus:border-[#24CA68] outline-none transition-all text-sm font-bold"
              />
              <input 
                type="email" 
                placeholder="E-mail" 
                value={donorData.email}
                onChange={e => setDonorData({...donorData, email: e.target.value})}
                className="w-full p-3 rounded-xl border-2 border-white focus:border-[#24CA68] outline-none transition-all text-sm font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-black text-gray-800">Valor da contribuição</h3>
            <div className="flex border-2 rounded-xl overflow-hidden group focus-within:border-[#24CA68] bg-white transition-all">
               <div className="bg-white border-r px-4 flex items-center justify-center font-bold text-gray-400">R$</div>
               <input 
                 type="text"
                 value={customValue}
                 onChange={handleCustomChange}
                 placeholder="0,00"
                 className="w-full py-4 px-4 text-xl font-bold focus:outline-none bg-white"
               />
            </div>
            {error && <p className="text-red-500 text-[10px] font-bold animate-pulse">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
             {config.presetAmounts.map(amount => (
               <button
                 key={amount}
                 onClick={() => handlePresetClick(amount)}
                 className={`relative py-3.5 border-2 rounded-xl font-bold text-sm transition-all ${baseValue === amount ? 'border-[#24CA68] bg-[#EEFFE6]/30 text-[#24CA68]' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}
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
                    className={`border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer ${selectedUpsells.includes(upsell.id) ? 'border-[#24CA68] bg-[#EEFFE6]/20' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="text-xl mb-1">{upsell.icon}</div>
                    <p className="text-[9px] font-black text-gray-600 leading-tight mb-1">{upsell.label}</p>
                    <p className="text-[10px] font-black text-gray-400">R$ {upsell.value.toFixed(2)}</p>
                  </div>
                ))}
             </div>
          </div>

          <div className="pt-4 space-y-3">
             <div className="flex justify-between items-center text-sm font-black text-gray-800 border-t pt-3">
                <span>Valor Total:</span>
                <span className="text-xl">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
             </div>
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

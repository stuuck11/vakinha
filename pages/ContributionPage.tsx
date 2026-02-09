
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
    <div className="bg-white min-h-screen pb-12">
      <div className="max-w-[640px] mx-auto px-4 py-6">
        
        {/* Header Identico ao App */}
        <div className="flex items-center gap-4 mb-6">
           <button onClick={onBack} className="text-gray-900 transition-colors">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
           <div className="flex-grow flex justify-center -ml-10">
              <img src={config.logoUrl || 'https://imgur.com/NeAZeVi.png'} alt="Logo" className="h-9 object-contain" />
           </div>
        </div>

        <div className="space-y-1 mb-8">
           <h1 className="text-[22px] font-black text-gray-800 tracking-tight leading-tight">{config.title}</h1>
           <p className="text-[12px] font-bold text-gray-400">ID: {config.campaignId}</p>
        </div>

        <div className="space-y-8">
          {/* Campo de Valor Principal */}
          <div className="space-y-3">
            <h3 className="text-base font-black text-gray-800">Valor da contribuição</h3>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-[#24CA68] focus-within:border-[#24CA68] bg-white transition-all">
               <div className="bg-gray-100/50 px-5 flex items-center justify-center font-bold text-gray-500 text-lg border-r">R$</div>
               <input 
                 type="text"
                 value={customValue}
                 onChange={handleCustomChange}
                 placeholder="0,00"
                 className="w-full py-4 px-4 text-xl font-medium focus:outline-none bg-white"
               />
            </div>
            {error && <p className="text-red-500 text-[11px] font-bold">{error}</p>}
          </div>

          {/* Grid de Valores Predefinidos */}
          <div className="grid grid-cols-2 gap-3">
             {config.presetAmounts.map(amount => (
               <button
                 key={amount}
                 onClick={() => handlePresetClick(amount)}
                 className={`relative py-4 border border-gray-300 rounded-xl font-medium text-lg transition-all ${baseValue === amount ? 'border-[#24CA68] bg-[#EEFFE6]/20 text-gray-800' : 'text-gray-700 bg-white'}`}
               >
                 {amount === 50 && (
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF5C39] text-white text-[9px] font-black px-3 py-1 rounded-full whitespace-nowrap shadow-sm uppercase tracking-wider">
                     Mais escolhido
                   </div>
                 )}
                 R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </button>
             ))}
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-3 pt-2">
             <h3 className="text-base font-black text-gray-800">Forma de pagamento</h3>
             <button className="flex items-center gap-3 bg-[#24CA68] text-white px-5 py-3 rounded-lg font-bold text-sm">
                <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
                   <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                Pix
             </button>
          </div>

          {/* Upsells (Turbos) */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
             <h3 className="text-base font-black text-gray-800">Turbine sua doação</h3>
             <p className="text-gray-500 text-sm font-medium">Ajude MUITO MAIS turbinando sua doação 💚</p>
             
             <div className="grid grid-cols-3 gap-0 border rounded-xl overflow-hidden border-gray-200">
                {config.upsells.map((upsell, idx) => (
                  <div 
                    key={upsell.id}
                    onClick={() => toggleUpsell(upsell.id)}
                    className={`p-4 text-center transition-all cursor-pointer border-r last:border-r-0 border-gray-200 ${selectedUpsells.includes(upsell.id) ? 'bg-[#EEFFE6]/40' : 'bg-white'}`}
                  >
                    <div className="text-2xl mb-3 flex justify-center">
                       {upsell.id === 'transporte' && <img src="https://em-content.zobj.net/source/apple/391/automobile_1f697.png" className="w-10" />}
                       {upsell.id === 'medicacao' && <img src="https://em-content.zobj.net/source/apple/391/pill_1f48a.png" className="w-10" />}
                       {upsell.id === 'cesta' && <img src="https://em-content.zobj.net/source/apple/391/basket_1f44c.png" className="w-10" />}
                    </div>
                    <p className="text-[11px] font-medium text-gray-700 leading-tight mb-1 h-6 flex items-center justify-center">{upsell.label}</p>
                    <p className="text-[12px] font-black text-gray-400">R$ {upsell.value.toFixed(2)}</p>
                  </div>
                ))}
             </div>
          </div>

          {/* Resumo e Botão Final */}
          <div className="pt-6 space-y-5">
             <div className="space-y-3">
               <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                  <span>Contribuição:</span>
                  <span>R$ {donationBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
               </div>
               <div className="flex justify-between items-center text-lg font-black text-gray-800">
                  <span>Total:</span>
                  <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
               </div>
             </div>

             <button 
               onClick={handleContribute}
               className="w-full bg-[#24CA68] text-white py-5 rounded-lg font-black text-xl shadow-sm active:scale-95 transition-all uppercase tracking-wide"
             >
               Contribuir
             </button>

             <p className="text-[10px] text-gray-400 text-center leading-relaxed">
               Ao clicar no botão acima você declara que é maior de 18 anos, leu e está de acordo com os <span className="underline">Termos, Taxas e Prazos</span>.
             </p>

             {/* Selo de Segurança de Checkout */}
             <div className="bg-[#F8F9FA] p-4 rounded-xl flex items-center gap-4 border border-gray-100">
                <div className="bg-[#004A26] p-3 rounded-lg flex flex-col items-center justify-center text-white shrink-0">
                   <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                   <span className="text-[7px] font-black uppercase tracking-widest text-center">Selo de Segurança</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-snug">
                   Garantimos uma <span className="font-bold">experiência segura</span> para todos os nossos doadores.
                </p>
             </div>

             <p className="text-[10px] text-gray-400 leading-normal">
               Informamos que o preenchimento do seu cadastro completo estará disponível em seu painel pessoal na plataforma após a conclusão desta doação. Importante destacar a importância da adequação do seu cadastro, informando o <span className="font-bold">nome social</span>, caso o utilize.
             </p>
          </div>
        </div>
      </div>

      {showPayment && <PaymentModal total={total} donorData={donorData} campaignTitle={config.title} onClose={() => setShowPayment(false)} />}
    </div>
  );
};

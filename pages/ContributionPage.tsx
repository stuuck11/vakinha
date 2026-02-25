
import React, { useState, useEffect } from 'react';
import { DonationConfig } from '../types';
import { PaymentModal } from '../components/PaymentModal';

export const ContributionPage: React.FC<{ onBack: () => void; config: DonationConfig }> = ({ onBack, config }) => {
  const [baseValue, setBaseValue] = useState<number>(0);
  const [customValue, setCustomValue] = useState<string>('');
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  const [total, setTotal] = useState<number>(0);
  
  const [donorData, setDonorData] = useState({ name: '', email: '', cpfCnpj: '' });
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

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

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      value = value.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
    }
    setDonorData({ ...donorData, cpfCnpj: value });
  };

  const toggleUpsell = (id: string) => {
    setSelectedUpsells(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleContribute = () => {
    if (total < config.minAmount) {
      setError(`O valor total deve ser de no mínimo R$ ${config.minAmount.toFixed(2)}`);
      return;
    }
    setError(null);

    // Pixel: AddPaymentInfo -> acionado apenas quando inserir dados de pagamento (clicar no botão)
    if ((window as any).fbq && !(window as any).addPaymentInfoTracked) {
      (window as any).fbq('track', 'AddPaymentInfo', {
        value: Number(total),
        currency: 'BRL',
        content_name: config.title,
        content_category: config.category
      });
      (window as any).addPaymentInfoTracked = true;
    }

    setShowPayment(true);
  };

  const itemsSummary = [
    `Doação (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(donationBase)})`,
    ...config.upsells
      .filter(u => selectedUpsells.includes(u.id))
      .map(u => `${u.label} (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(u.value)})`)
  ].join(' + ');

  return (
    <div className="bg-white min-h-screen pb-12">
      <div className="max-w-[640px] mx-auto px-4 py-6">
        <div className="space-y-1 mb-8">
           <h1 className="text-[22px] font-black text-gray-800 tracking-tight leading-tight">{config.title}</h1>
           <p className="text-[12px] font-bold text-gray-400">ID: {config.campaignId}</p>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-base font-black text-gray-800">Valor da contribuição</h3>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-[#24CA68] focus-within:border-[#24CA68] bg-white transition-all">
               <div className="bg-gray-100/50 px-5 flex items-center justify-center font-bold text-gray-500 text-lg border-r">R$</div>
               <input type="text" value={customValue} onChange={handleCustomChange} placeholder="0,00" className="w-full py-4 px-4 text-xl font-medium focus:outline-none bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             {config.presetAmounts.map(amount => (
               <button key={amount} onClick={() => handlePresetClick(amount)} className={`relative py-4 border border-gray-300 rounded-xl font-medium text-lg transition-all ${baseValue === amount ? 'border-[#24CA68] bg-[#EEFFE6]/20 text-gray-800' : 'text-gray-700 bg-white'}`}>
                 {amount === 50 && (<div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#FF5C39] text-white text-[7px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm uppercase tracking-wider">Mais escolhido</div>)}
                 R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </button>
             ))}
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
             <h3 className="text-base font-black text-gray-800">Turbine sua doação</h3>
             <div className="grid grid-cols-3 gap-0 border rounded-xl overflow-hidden border-gray-200">
                {config.upsells.map((upsell) => (
                  <div key={upsell.id} onClick={() => toggleUpsell(upsell.id)} className={`p-4 text-center transition-all cursor-pointer border-r last:border-r-0 border-gray-200 ${selectedUpsells.includes(upsell.id) ? 'bg-[#D1F2D1]' : 'bg-white'}`}>
                    <div className="text-2xl mb-3 flex justify-center h-12 items-center">
                       {upsell.id === 'transporte' && <img src="https://imgur.com/6o2Yh0d.png" className="h-full object-contain" alt="carro" />}
                       {upsell.id === 'medicacao' && <img src="https://imgur.com/uYJiGxX.png" className="h-full object-contain" alt="medicação" />}
                       {upsell.id === 'cesta' && <img src="https://imgur.com/SYJK8ZR.png" className="h-full object-contain" alt="cesta básica" />}
                    </div>
                    <p className="text-[11px] font-medium text-gray-700 leading-tight mb-1 h-6 flex items-center justify-center">{upsell.label}</p>
                    <p className="text-[12px] font-black text-gray-400">R$ {upsell.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                ))}
             </div>
          </div>

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
               <p className="text-[10px] text-gray-400 font-bold leading-relaxed text-right">
                 {itemsSummary}
               </p>
             </div>

             {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg">{error}</p>}

             <button onClick={handleContribute} className="w-full bg-[#24CA68] text-white py-5 rounded-lg font-black text-xl shadow-sm active:scale-95 transition-all uppercase tracking-wide">Contribuir</button>
             <p className="text-[10px] text-gray-400 text-center leading-relaxed">Ao clicar no botão acima você declara que leu e está de acordo com os <span className="underline">Termos, Taxas e Prazos</span>.</p>
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentModal total={total} donorData={donorData} campaignTitle={config.title} config={config} onClose={() => setShowPayment(false)} />
      )}
    </div>
  );
};

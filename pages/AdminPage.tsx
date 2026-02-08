
import React, { useState } from 'react';
import { DonationConfig, Supporter, PaymentGateway } from '../types';
import { saveCampaigns, getStoredCampaigns } from '../constants';

interface AdminPageProps {
  onUpdate: () => void;
  onBack: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onUpdate, onBack }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ user: '', pass: '' });
  const [campaigns, setCampaigns] = useState<DonationConfig[]>(getStoredCampaigns());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DonationConfig | null>(null);
  
  const [newSupporter, setNewSupporter] = useState<Partial<Supporter>>({
    name: '',
    amount: 0,
    comment: '',
    time: 'há instantes',
    avatarColor: '#F5F5F5'
  });
  const [editingSupporterId, setEditingSupporterId] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.user === 'stuuck' && loginData.pass === 'stuuck77') {
      setIsLoggedIn(true);
    } else {
      alert('Credenciais incorretas!');
    }
  };

  const handleCreateNew = () => {
    const newCamp: DonationConfig = {
      id: `camp-${Date.now()}`,
      campaignId: Math.floor(100000 + Math.random() * 900000).toString(),
      mainImage: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1000',
      logoUrl: 'https://imgur.com/NeAZeVi.png',
      sealIcon: 'https://imgur.com/39baGGf.png',
      category: 'Saúde / Tratamentos',
      title: 'Nova Campanha',
      subtitle: '',
      description: '',
      targetAmount: 1000,
      currentAmount: 0,
      heartsCount: 0,
      supportersCount: 0,
      creatorName: 'Admin',
      creatorSince: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      presetAmounts: [30, 50, 75, 100, 200, 500, 750, 1000],
      minAmount: 20,
      upsells: [
        { id: 'transporte', label: 'Auxílio transporte', value: 10.00, icon: '🚗' },
        { id: 'medicacao', label: 'Ajuda com medicações', value: 25.00, icon: '💊' },
        { id: 'cesta', label: 'Doar cesta básica', value: 85.00, icon: '🧺' },
      ],
      isActive: false,
      supporters: [],
      gateway: 'stripe',
      stripeConfig: { publicKey: '', isTestMode: true },
      mercadopagoConfig: { publicKey: '' },
      asaasConfig: { apiKey: '' }
    };
    setEditingId(newCamp.id);
    setFormData(newCamp);
  };

  const handleEdit = (camp: DonationConfig) => {
    setEditingId(camp.id);
    setFormData({ ...camp });
  };

  const handleSetActive = (id: string) => {
    const updated = campaigns.map(c => ({ ...c, isActive: c.id === id }));
    setCampaigns(updated);
    saveCampaigns(updated);
    onUpdate();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza?')) {
      const updated = campaigns.filter(c => c.id !== id);
      setCampaigns(updated);
      saveCampaigns(updated);
      onUpdate();
    }
  };

  const handleSaveForm = () => {
    if (!formData) return;
    
    if (formData.gateway === 'stripe') {
      if (formData.stripeConfig.isTestMode && formData.stripeConfig.publicKey.trim().startsWith('pk_live')) {
        alert("Erro Stripe: Chave de Produção em Modo de Teste.");
        return;
      }
    }

    let updated;
    const exists = campaigns.find(c => c.id === formData.id);
    if (exists) {
      updated = campaigns.map(c => c.id === formData.id ? formData : c);
    } else {
      updated = [...campaigns, formData];
    }
    setCampaigns(updated);
    saveCampaigns(updated);
    setEditingId(null);
    setFormData(null);
    onUpdate();
    alert('Configurações salvas!');
  };

  const addSupporter = () => {
    if (!formData || !newSupporter.name) return;
    const s: Supporter = {
      id: editingSupporterId || `s-${Date.now()}`,
      name: newSupporter.name || '',
      amount: newSupporter.amount || 0,
      comment: newSupporter.comment || '',
      time: newSupporter.time || 'há instantes',
      avatarColor: newSupporter.avatarColor || '#F5F5F5'
    };
    if (editingSupporterId) {
      setFormData({ ...formData, supporters: formData.supporters.map(i => i.id === editingSupporterId ? s : i) });
      setEditingSupporterId(null);
    } else {
      setFormData({ ...formData, supporters: [s, ...formData.supporters] });
    }
    setNewSupporter({ name: '', amount: 0, comment: '', time: 'há instantes', avatarColor: '#F5F5F5' });
  };

  const removeSupporter = (id: string) => {
    if (!formData) return;
    setFormData({
      ...formData,
      supporters: formData.supporters.filter(s => s.id !== id)
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md space-y-6 border border-gray-100">
          <h1 className="text-2xl font-black text-center text-gray-800 tracking-tighter">Área do Organizador</h1>
          <p className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest -mt-4">Identificação Necessária</p>
          <input type="text" placeholder="Usuário" className="w-full border p-4 rounded-xl outline-none bg-white focus:border-[#24CA68]" onChange={e => setLoginData({...loginData, user: e.target.value})} />
          <input type="password" placeholder="Senha" className="w-full border p-4 rounded-xl outline-none bg-white focus:border-[#24CA68]" onChange={e => setLoginData({...loginData, pass: e.target.value})} />
          <button className="w-full bg-[#24CA68] text-white py-4 rounded-xl font-black shadow-lg shadow-green-100 transition-transform active:scale-95">Entrar na Conta</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-gray-800 tracking-tighter">Painel Admin</h1>
        <div className="flex gap-3">
          <button onClick={onBack} className="bg-gray-100 text-gray-800 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">Ver Site</button>
          <button onClick={handleCreateNew} className="bg-[#24CA68] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-100">+ Criar Campanha</button>
        </div>
      </div>

      {editingId && formData ? (
        <div className="bg-white rounded-3xl border shadow-xl p-8 space-y-8 animate-slide-up">
          <div className="flex justify-between items-center border-b pb-4">
             <h2 className="text-xl font-black text-gray-800">Editando: {formData.title}</h2>
             <button onClick={() => setEditingId(null)} className="text-red-500 font-bold hover:underline">Fechar</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Aparência e Texto</label>
              <div className="space-y-4 p-5 bg-white rounded-2xl border border-gray-100">
                <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Título da Campanha" className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Descrição completa..." rows={4} className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                <input value={formData.mainImage} onChange={e => setFormData({...formData, mainImage: e.target.value})} placeholder="URL Imagem de Capa" className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Meta (R$)</span>
                   <input type="number" value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: parseFloat(e.target.value)})} className="w-full border p-3 rounded-lg outline-none focus:border-[#24CA68] bg-white" />
                </div>
                <div>
                   <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Arrecadado (R$)</span>
                   <input type="number" value={formData.currentAmount} onChange={e => setFormData({...formData, currentAmount: parseFloat(e.target.value)})} className="w-full border p-3 rounded-lg outline-none focus:border-[#24CA68] bg-white" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Configuração de Pagamento (PIX)</label>
              <div className="bg-[#F8FBFF] p-6 rounded-3xl border border-blue-100 space-y-5">
                 <div className="space-y-2">
                    <span className="text-[10px] font-black text-blue-900 uppercase">Provedor de Pagamento</span>
                    <select 
                      value={formData.gateway} 
                      onChange={e => setFormData({...formData, gateway: e.target.value as PaymentGateway})}
                      className="w-full p-3 rounded-xl border border-blue-200 focus:border-blue-500 outline-none font-bold text-sm bg-white"
                    >
                      <option value="stripe">Stripe (Global)</option>
                      <option value="mercadopago">Mercado Pago (Recomendado BR)</option>
                      <option value="asaas">Asaas (Brasil)</option>
                    </select>
                 </div>

                 {formData.gateway === 'stripe' ? (
                   <div className="space-y-3 animate-slide-up">
                      <div className="p-3 bg-red-50 text-[10px] font-bold text-red-600 rounded-lg">
                        ⚠️ Stripe exige ativação manual do PIX no Dashboard.
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Stripe Public Key</span>
                        <input value={formData.stripeConfig.publicKey} onChange={e => setFormData({...formData, stripeConfig: {...formData.stripeConfig, publicKey: e.target.value}})} placeholder="pk_live_..." className="w-full border p-3 rounded-lg font-mono text-xs outline-none focus:border-[#24CA68] bg-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="test" checked={formData.stripeConfig.isTestMode} onChange={e => setFormData({...formData, stripeConfig: {...formData.stripeConfig, isTestMode: e.target.checked}})} className="bg-white" />
                        <label htmlFor="test" className="text-xs font-bold text-gray-600">Modo de Teste</label>
                      </div>
                   </div>
                 ) : formData.gateway === 'asaas' ? (
                   <div className="space-y-3 animate-slide-up">
                      <div className="p-3 bg-purple-50 text-[10px] font-bold text-purple-600 rounded-lg">
                        🟣 Asaas é excelente para PIX e cobranças recorrentes.
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Asaas API Key</span>
                        <input value={formData.asaasConfig.apiKey} onChange={e => setFormData({...formData, asaasConfig: { apiKey: e.target.value }})} placeholder="$a..." className="w-full border p-3 rounded-lg font-mono text-xs outline-none focus:border-purple-500 bg-white" />
                      </div>
                   </div>
                 ) : (
                   <div className="space-y-3 animate-slide-up">
                      <div className="p-3 bg-green-50 text-[10px] font-bold text-green-600 rounded-lg">
                        ✅ Mercado Pago é mais fácil de ativar para PIX no Brasil.
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Public Key do Mercado Pago</span>
                        <input value={formData.mercadopagoConfig.publicKey} onChange={e => setFormData({...formData, mercadopagoConfig: { publicKey: e.target.value }})} placeholder="APP_USR-..." className="w-full border p-3 rounded-lg font-mono text-xs outline-none focus:border-blue-500 bg-white" />
                      </div>
                   </div>
                 )}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t">
            <h3 className="font-black text-lg mb-4 text-gray-800">Doadores Fictícios / Reais</h3>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4 mb-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input placeholder="Nome" value={newSupporter.name} onChange={e => setNewSupporter({...newSupporter, name: e.target.value})} className="w-full border p-3 rounded-lg bg-white focus:border-[#24CA68] outline-none" />
                <input type="number" placeholder="Valor" value={newSupporter.amount} onChange={e => setNewSupporter({...newSupporter, amount: parseFloat(e.target.value)})} className="w-full border p-3 rounded-lg bg-white focus:border-[#24CA68] outline-none" />
                <input placeholder="Tempo" value={newSupporter.time} onChange={e => setNewSupporter({...newSupporter, time: e.target.value})} className="w-full border p-3 rounded-lg bg-white focus:border-[#24CA68] outline-none" />
                <button onClick={addSupporter} className={`w-full py-3 rounded-lg font-bold text-white transition-all ${editingSupporterId ? 'bg-orange-500' : 'bg-[#24CA68]'}`}>
                  {editingSupporterId ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border rounded-xl divide-y">
               {formData.supporters.map(s => (
                 <div key={s.id} className="flex justify-between items-center p-4 hover:bg-gray-50 bg-white">
                   <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-800">{s.name} - R$ {s.amount.toFixed(2)}</span>
                      <span className="text-[10px] font-bold text-gray-400">{s.time}</span>
                   </div>
                   <div className="flex gap-4 text-xs font-black uppercase">
                     <button onClick={() => {setEditingSupporterId(s.id); setNewSupporter(s);}} className="text-blue-500">Editar</button>
                     <button onClick={() => removeSupporter(s.id)} className="text-red-400">Remover</button>
                   </div>
                 </div>
               ))}
            </div>
          </div>

          <button onClick={handleSaveForm} className="w-full bg-[#24CA68] text-white py-5 rounded-2xl font-black text-xl shadow-lg hover:scale-[1.01] transition-all">Salvar Todas Alterações</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campaigns.map(camp => (
            <div key={camp.id} className={`bg-white border-2 rounded-3xl p-6 space-y-4 shadow-sm ${camp.isActive ? 'border-[#24CA68]' : 'border-gray-100'}`}>
              <h3 className="font-black truncate text-gray-800">{camp.title}</h3>
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                 <span>GATEWAY: {camp.gateway.toUpperCase()}</span>
                 <span className="text-[#24CA68]">R$ {camp.currentAmount.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(camp)} className="flex-1 bg-gray-50 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors">Editar</button>
                {!camp.isActive && (
                  <button onClick={() => handleSetActive(camp.id)} className="flex-1 bg-[#24CA68] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Ativar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

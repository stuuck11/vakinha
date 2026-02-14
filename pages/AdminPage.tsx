
import React, { useState } from 'react';
import { DonationConfig, Supporter, PaymentGateway } from '../types';
import { saveCampaigns, getStoredCampaigns } from '../constants';

interface AdminPageProps {
  onUpdate: () => void;
  onBack: () => void;
  onViewCampaign?: (c: DonationConfig) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onUpdate, onBack, onViewCampaign }) => {
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

  const handleCopyLink = (camp: DonationConfig) => {
    const url = `${window.location.origin}/c/${camp.campaignId}`;
    navigator.clipboard.writeText(url);
    alert('Link de divulgação copiado!');
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
      beneficiaryName: 'Beneficiário',
      topicTitle: 'Título do Tópico',
      presetAmounts: [30, 50, 75, 100, 200, 500, 750, 1000],
      minAmount: 5,
      upsells: [
        { id: 'transporte', label: 'Auxílio transporte', value: 10.00, icon: '🚗' },
        { id: 'medicacao', label: 'Ajuda com medicações', value: 25.00, icon: '💊' },
        { id: 'cesta', label: 'Doar cesta básica', value: 85.00, icon: '🧺' },
      ],
      isActive: false,
      supporters: [],
      gateway: 'asaas',
      stripeConfig: { publicKey: '', isTestMode: true },
      mercadopagoConfig: { publicKey: '' },
      asaasConfig: { apiKey: '' },
      metaPixelId: ''
    };
    setEditingId(newCamp.id);
    setFormData(newCamp);
  };

  const handleEdit = (camp: DonationConfig) => {
    setEditingId(camp.id);
    setFormData({ ...camp });
  };

  const handleSetActive = (id: string) => {
    const updated = campaigns.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c);
    setCampaigns(updated);
    saveCampaigns(updated);
    onUpdate();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta campanha?')) {
      const updated = campaigns.filter(c => c.id !== id);
      setCampaigns(updated);
      saveCampaigns(updated);
      onUpdate();
    }
  };

  const handleSaveForm = () => {
    if (!formData) return;
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
      setFormData({ 
        ...formData, 
        supporters: formData.supporters.map(i => i.id === editingSupporterId ? s : i) 
      });
      setEditingSupporterId(null);
    } else {
      setFormData({ 
        ...formData, 
        supporters: [s, ...formData.supporters] 
      });
    }
    setNewSupporter({ name: '', amount: 0, comment: '', time: 'há instantes', avatarColor: '#F5F5F5' });
  };

  const removeSupporter = (id: string) => {
    if (!formData) return;
    setFormData({ ...formData, supporters: formData.supporters.filter(s => s.id !== id) });
  };

  const startEditSupporter = (supporter: Supporter) => {
    setEditingSupporterId(supporter.id);
    setNewSupporter({ ...supporter });
    const el = document.getElementById('supporter-form');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md space-y-6 border border-gray-100">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black text-gray-800 tracking-tighter">Área do Organizador</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">IDENTIFICAÇÃO NECESSÁRIA</p>
          </div>
          <input type="text" placeholder="Usuário" className="w-full border p-4 rounded-xl outline-none bg-white focus:border-[#24CA68]" onChange={e => setLoginData({...loginData, user: e.target.value})} />
          <input type="password" placeholder="Senha" className="w-full border p-4 rounded-xl outline-none bg-white focus:border-[#24CA68]" onChange={e => setLoginData({...loginData, pass: e.target.value})} />
          <button className="w-full bg-[#24CA68] text-white py-4 rounded-xl font-black shadow-lg transition-transform active:scale-95 uppercase tracking-widest text-xs">Entrar no Sistema</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 pb-32">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
           </button>
           <h1 className="text-3xl font-black text-gray-800 tracking-tighter">Painel de Gerenciamento</h1>
        </div>
        <button onClick={handleCreateNew} className="bg-[#24CA68] text-white px-6 py-3 rounded-xl font-bold shadow-lg">+ Nova Campanha</button>
      </div>

      {editingId && formData ? (
        <div className="bg-white rounded-3xl border shadow-xl p-8 space-y-8 animate-slide-up">
          <div className="flex justify-between items-center border-b pb-4">
             <h2 className="text-xl font-black text-gray-800">Editando: {formData.title}</h2>
             <button onClick={() => {setEditingId(null); setEditingSupporterId(null);}} className="text-red-500 font-bold hover:underline">Cancelar</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Informações Gerais</label>
              <div className="space-y-4 p-5 bg-gray-50/30 rounded-2xl border border-gray-100">
                <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Título da Campanha" className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="História..." rows={4} className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                <input value={formData.mainImage} onChange={e => setFormData({...formData, mainImage: e.target.value})} placeholder="URL da Imagem de Capa" className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Beneficiário</span>
                    <input value={formData.beneficiaryName} onChange={e => setFormData({...formData, beneficiaryName: e.target.value})} className="w-full border p-3 rounded-lg bg-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Título Tópico</span>
                    <input value={formData.topicTitle} onChange={e => setFormData({...formData, topicTitle: e.target.value})} className="w-full border p-3 rounded-lg bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Meta (R$)</span>
                    <input type="number" value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: parseFloat(e.target.value)})} className="w-full border p-3 rounded-lg bg-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Atual (R$)</span>
                    <input type="number" value={formData.currentAmount} onChange={e => setFormData({...formData, currentAmount: parseFloat(e.target.value)})} className="w-full border p-3 rounded-lg bg-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Marketing e Checkout</label>
              <div className="bg-[#FFF9F9] p-6 rounded-3xl border border-red-50 space-y-4">
                <div>
                   <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">ID do Pixel do Meta Ads</span>
                   <input 
                     value={formData.metaPixelId || ''} 
                     onChange={e => setFormData({...formData, metaPixelId: e.target.value})} 
                     placeholder="Ex: 123456789012345"
                     className="w-full border p-4 rounded-xl bg-white outline-none focus:border-red-400 font-bold" 
                   />
                </div>
              </div>

              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Configuração de Pagamento</label>
              <div className="bg-[#F8FBFF] p-6 rounded-3xl border border-blue-100 space-y-4">
                <select 
                  value={formData.gateway} 
                  onChange={e => setFormData({...formData, gateway: e.target.value as PaymentGateway})}
                  className="w-full p-4 rounded-xl border border-blue-200 font-black text-sm bg-white"
                >
                  <option value="asaas">Asaas (Recomendado)</option>
                  <option value="mercadopago">Mercado Pago</option>
                  <option value="stripe">Stripe</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t" id="supporter-form">
            <h3 className="font-black text-lg mb-4 text-gray-800">Doadores Manuais</h3>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input placeholder="Nome" value={newSupporter.name} onChange={e => setNewSupporter({...newSupporter, name: e.target.value})} className="w-full border p-3 rounded-lg bg-white" />
                <input type="number" placeholder="Valor" value={newSupporter.amount} onChange={e => setNewSupporter({...newSupporter, amount: parseFloat(e.target.value)})} className="w-full border p-3 rounded-lg bg-white" />
                <input placeholder="Tempo" value={newSupporter.time} onChange={e => setNewSupporter({...newSupporter, time: e.target.value})} className="w-full border p-3 rounded-lg bg-white" />
                <button onClick={addSupporter} className={`py-3 rounded-lg font-black uppercase text-xs text-white ${editingSupporterId ? 'bg-orange-500' : 'bg-[#24CA68]'}`}>
                  {editingSupporterId ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>

          <button onClick={handleSaveForm} className="w-full bg-[#24CA68] text-white py-5 rounded-2xl font-black text-xl shadow-lg hover:scale-[1.01] transition-all">Salvar Tudo</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map(camp => (
            <div key={camp.id} className={`bg-white border-2 rounded-3xl p-6 space-y-4 shadow-sm transition-all ${camp.isActive ? 'border-[#24CA68] ring-4 ring-green-50' : 'border-gray-100'}`}>
              <div className="flex justify-between items-start">
                <h3 className="font-black truncate text-gray-800 text-lg w-3/4">{camp.title}</h3>
                {camp.isActive && <span className="bg-[#24CA68] text-white text-[9px] font-black px-2 py-1 rounded-full uppercase">Ativa</span>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onViewCampaign?.(camp)} className="col-span-2 bg-[#EEFFE6] text-[#24CA68] py-3 rounded-xl text-[10px] font-black uppercase">Ver Site Público</button>
                <button onClick={() => handleCopyLink(camp)} className="col-span-2 bg-blue-50 text-blue-600 py-3 rounded-xl text-[10px] font-black uppercase">Copiar Link Divulgação</button>
                <button onClick={() => handleEdit(camp)} className="bg-gray-50 py-3 rounded-xl text-[10px] font-black uppercase">Configurar</button>
                <button onClick={() => handleSetActive(camp.id)} className={`py-3 rounded-xl text-[10px] font-black uppercase ${camp.isActive ? 'bg-orange-50 text-orange-600' : 'bg-[#24CA68] text-white'}`}>
                  {camp.isActive ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

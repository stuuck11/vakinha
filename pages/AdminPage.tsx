
import React, { useState } from 'react';
import { DonationConfig, Supporter } from '../types';
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
    if ((loginData.user === 'main' || loginData.user === 'admin') && (loginData.pass === 'main' || loginData.pass === 'admin')) {
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
      creatorName: 'Principal',
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
      stripeConfig: { publicKey: '', isTestMode: true }
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
    
    if (formData.stripeConfig.isTestMode && formData.stripeConfig.publicKey.trim().startsWith('pk_live')) {
      alert("Erro de Ambiente: Você ativou o 'Modo de Teste' mas inseriu uma chave de Produção (pk_live).");
      return;
    }
    if (!formData.stripeConfig.isTestMode && formData.stripeConfig.publicKey.trim().startsWith('pk_test')) {
      alert("Erro de Ambiente: Você desativou o 'Modo de Teste' (Produção) mas inseriu uma chave de Teste (pk_test).");
      return;
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
    alert('Salvo com sucesso!');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md space-y-6">
          <h1 className="text-2xl font-black text-center text-gray-800 tracking-tighter">Login Principal</h1>
          <p className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest -mt-4">Gestão da Branch Main</p>
          <input type="text" placeholder="Usuário" className="w-full border-2 p-3 rounded-xl outline-none bg-white" onChange={e => setLoginData({...loginData, user: e.target.value})} />
          <input type="password" placeholder="Senha" className="w-full border-2 p-3 rounded-xl outline-none bg-white" onChange={e => setLoginData({...loginData, pass: e.target.value})} />
          <button className="w-full bg-[#24CA68] text-white py-4 rounded-xl font-black shadow-lg shadow-green-100">Acessar Painel</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-gray-800 tracking-tighter">Painel Principal</h1>
        <div className="flex gap-3">
          <button onClick={onBack} className="bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all">Visualizar Site</button>
          <button onClick={handleCreateNew} className="bg-[#24CA68] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-100">+ Nova Campanha</button>
        </div>
      </div>

      {editingId && formData ? (
        <div className="bg-white rounded-3xl border shadow-xl p-8 space-y-8 animate-slide-up">
          <div className="flex justify-between items-center border-b pb-4">
             <h2 className="text-xl font-black text-gray-800">Editando: {formData.title}</h2>
             <button onClick={() => setEditingId(null)} className="text-red-500 font-bold hover:underline">Fechar Edição</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Identidade Visual</label>
              <div className="space-y-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400">URL LOGO</span>
                  <input value={formData.logoUrl} onChange={e => setFormData({...formData, logoUrl: e.target.value})} className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400">URL ÍCONE SELO</span>
                  <input value={formData.sealIcon} onChange={e => setFormData({...formData, sealIcon: e.target.value})} className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400">IMAGEM DE CAPA</span>
                  <input value={formData.mainImage} onChange={e => setFormData({...formData, mainImage: e.target.value})} className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                </div>
              </div>
              
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Conteúdo da Página</label>
              <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Título" className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={6} className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Configurações Técnicas (Main)</label>
              <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                 <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter block mb-1">ID DA CAMPANHA</span>
                    <input value={formData.campaignId} onChange={e => setFormData({...formData, campaignId: e.target.value})} className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                 </div>
                 <div className="border-t pt-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter block mb-1">STRIPE PUBLIC KEY</span>
                    <input value={formData.stripeConfig.publicKey} onChange={e => setFormData({...formData, stripeConfig: {...formData.stripeConfig, publicKey: e.target.value}})} className="w-full border p-3 rounded-lg bg-white font-mono text-xs outline-none focus:border-[#24CA68]" />
                 </div>
                 <div className="flex items-center gap-3 bg-white p-3 rounded-xl border">
                    <input type="checkbox" id="test-mode" checked={formData.stripeConfig.isTestMode} onChange={e => setFormData({...formData, stripeConfig: {...formData.stripeConfig, isTestMode: e.target.checked}})} className="w-4 h-4 accent-[#24CA68]" />
                    <label htmlFor="test-mode" className="text-sm font-bold text-gray-700 cursor-pointer">Modo de Teste</label>
                 </div>
              </div>
              
              <label className="block text-xs font-bold text-gray-400 mt-4 uppercase tracking-widest">Financeiro</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter block mb-1">Meta (R$)</span>
                   <input type="number" value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: parseFloat(e.target.value)})} className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                </div>
                <div>
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter block mb-1">Atual (R$)</span>
                   <input type="number" value={formData.currentAmount} onChange={e => setFormData({...formData, currentAmount: parseFloat(e.target.value)})} className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t">
            <h3 className="font-black text-lg mb-4 text-gray-800">Gerenciar Doadores</h3>
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input placeholder="Nome" value={newSupporter.name} onChange={e => setNewSupporter({...newSupporter, name: e.target.value})} className="w-full border p-2.5 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                <input type="number" placeholder="Valor" value={newSupporter.amount} onChange={e => setNewSupporter({...newSupporter, amount: parseFloat(e.target.value)})} className="w-full border p-2.5 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                <input placeholder="Tempo" value={newSupporter.time} onChange={e => setNewSupporter({...newSupporter, time: e.target.value})} className="w-full border p-2.5 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                <button onClick={addSupporter} className={`w-full py-2.5 rounded-lg font-bold text-white transition-all ${editingSupporterId ? 'bg-orange-500' : 'bg-black'}`}>
                  {editingSupporterId ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border rounded-xl divide-y bg-white">
               {formData.supporters.length === 0 ? (
                 <p className="p-8 text-center text-gray-400 text-sm italic">Nenhum doador.</p>
               ) : formData.supporters.map(s => (
                 <div key={s.id} className="flex justify-between items-center p-4 hover:bg-gray-50">
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

          <button onClick={handleSaveForm} className="w-full bg-[#24CA68] text-white py-5 rounded-2xl font-black text-xl shadow-lg hover:bg-green-600 transition-all">Salvar Alterações na Branch Main</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campaigns.map(camp => (
            <div key={camp.id} className={`bg-white border-2 rounded-3xl p-6 space-y-4 transition-all ${camp.isActive ? 'border-[#24CA68]' : 'border-gray-100'}`}>
              <h3 className="font-black truncate text-gray-800 tracking-tighter">{camp.title}</h3>
              <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-gray-400">ID: {camp.campaignId}</span>
                 <span className="text-sm font-black text-[#24CA68]">R$ {camp.currentAmount.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => handleEdit(camp)} className="flex-1 bg-gray-100 py-3 rounded-xl text-xs font-black text-gray-600 uppercase tracking-widest">Configurar</button>
                {!camp.isActive && (
                  <button onClick={() => handleSetActive(camp.id)} className="flex-1 bg-black text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest">Ativar</button>
                )}
                <button onClick={() => handleDelete(camp.id)} className="px-3 text-red-300 hover:text-red-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

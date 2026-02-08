
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
    const url = `${window.location.origin}${window.location.pathname}#c/${camp.campaignId}`;
    navigator.clipboard.writeText(url);
    alert('Link de divulgação copiado para a área de transferência!');
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
    const updated = campaigns.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c);
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
    alert('Informações da campanha salvas com sucesso!');
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
    setFormData({ ...formData, supporters: formData.supporters.filter(s => s.id !== id) });
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
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-black text-gray-800 tracking-tighter">Painel de Gerenciamento</h1>
        <div className="flex gap-3">
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
            <div className="space-y-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Informações Gerais</label>
              <div className="space-y-4 p-5 bg-gray-50/30 rounded-2xl border border-gray-100">
                <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Título da Campanha" className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="História da campanha..." rows={4} className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                <input value={formData.mainImage} onChange={e => setFormData({...formData, mainImage: e.target.value})} placeholder="URL da Imagem de Capa" className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Nome do Beneficiário</span>
                    <input value={formData.beneficiaryName} onChange={e => setFormData({...formData, beneficiaryName: e.target.value})} placeholder="Ex: Malak" className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Título do Tópico</span>
                    <input value={formData.topicTitle} onChange={e => setFormData({...formData, topicTitle: e.target.value})} placeholder="Ex: Ajude o Malak a lutar..." className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Nome do Criador</span>
                    <input value={formData.creatorName} onChange={e => setFormData({...formData, creatorName: e.target.value})} placeholder="Ex: Admin" className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Ativo desde</span>
                    <input value={formData.creatorSince} onChange={e => setFormData({...formData, creatorSince: e.target.value})} placeholder="Ex: novembro/2024" className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Qtd. Corações</span>
                    <input type="number" value={formData.heartsCount} onChange={e => setFormData({...formData, heartsCount: parseInt(e.target.value) || 0})} className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Qtd. Apoiadores</span>
                    <input type="number" value={formData.supportersCount} onChange={e => setFormData({...formData, supportersCount: parseInt(e.target.value) || 0})} className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Meta Alvo (R$)</span>
                   <input type="number" value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: parseFloat(e.target.value)})} className="w-full border p-3 rounded-lg outline-none focus:border-[#24CA68] bg-white" />
                </div>
                <div>
                   <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Valor Atual (R$)</span>
                   <input type="number" value={formData.currentAmount} onChange={e => setFormData({...formData, currentAmount: parseFloat(e.target.value)})} className="w-full border p-3 rounded-lg outline-none focus:border-[#24CA68] bg-white" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Configuração de Pagamento (Seguro)</label>
              <div className="bg-[#F8FBFF] p-6 rounded-3xl border border-blue-100 space-y-6">
                 <div className="space-y-2">
                    <span className="text-[10px] font-black text-blue-900 uppercase">Gateway Ativo para esta Campanha</span>
                    <select 
                      value={formData.gateway} 
                      onChange={e => setFormData({...formData, gateway: e.target.value as PaymentGateway})}
                      className="w-full p-4 rounded-xl border border-blue-200 focus:border-blue-500 outline-none font-black text-sm bg-white"
                    >
                      <option value="asaas">Asaas (Brasil - Recomendado)</option>
                      <option value="mercadopago">Mercado Pago (Brasil)</option>
                      <option value="stripe">Stripe (Global)</option>
                    </select>
                 </div>

                 <div className="p-5 bg-white rounded-2xl border border-blue-50 space-y-4">
                    <h4 className="text-xs font-black text-gray-700 uppercase">Segurança do Servidor</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-bold">
                      Para sua segurança, os tokens de API não são mais digitados aqui. 
                      Isso evita que sua chave secreta seja exposta publicamente.
                    </p>
                    
                    <div className="space-y-3">
                       <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className={`w-3 h-3 rounded-full ${formData.gateway === 'asaas' ? 'bg-[#24CA68]' : 'bg-gray-300'}`} />
                          <div className="flex-1">
                             <p className="text-[10px] font-black text-gray-700">ASAAS_API_KEY</p>
                             <p className="text-[9px] text-gray-400 font-bold">Variável de Ambiente no Servidor</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className={`w-3 h-3 rounded-full ${formData.gateway === 'mercadopago' ? 'bg-[#24CA68]' : 'bg-gray-300'}`} />
                          <div className="flex-1">
                             <p className="text-[10px] font-black text-gray-700">MERCADO_PAGO_ACCESS_TOKEN</p>
                             <p className="text-[9px] text-gray-400 font-bold">Variável de Ambiente no Servidor</p>
                          </div>
                       </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-xl text-[10px] text-blue-800 font-black flex items-start gap-2">
                       <span>ℹ️</span>
                       <span>Certifique-se de configurar as variáveis no painel da sua hospedagem (ex: Vercel Dashboard).</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t">
            <h3 className="font-black text-lg mb-4 text-gray-800">Doadores e Apoio</h3>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input placeholder="Nome do Doador" value={newSupporter.name} onChange={e => setNewSupporter({...newSupporter, name: e.target.value})} className="w-full border p-3 rounded-lg bg-white focus:border-[#24CA68] outline-none" />
                <input type="number" placeholder="Valor (R$)" value={newSupporter.amount} onChange={e => setNewSupporter({...newSupporter, amount: parseFloat(e.target.value)})} className="w-full border p-3 rounded-lg bg-white focus:border-[#24CA68] outline-none" />
                <input placeholder="Tempo (ex: há 2h)" value={newSupporter.time} onChange={e => setNewSupporter({...newSupporter, time: e.target.value})} className="w-full border p-3 rounded-lg bg-white focus:border-[#24CA68] outline-none" />
                <button onClick={addSupporter} className={`w-full py-3 rounded-lg font-black text-white transition-all ${editingSupporterId ? 'bg-orange-500' : 'bg-[#24CA68]'}`}>
                  {editingSupporterId ? 'Atualizar Doador' : 'Adicionar Doador'}
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border rounded-xl divide-y bg-white">
               {formData.supporters.length > 0 ? formData.supporters.map(s => (
                 <div key={s.id} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                   <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-800">{s.name} • R$ {s.amount.toFixed(2)}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{s.time}</span>
                   </div>
                   <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
                     <button onClick={() => {setEditingSupporterId(s.id); setNewSupporter(s);}} className="text-blue-500 hover:underline">Editar</button>
                     <button onClick={() => removeSupporter(s.id)} className="text-red-400 hover:underline">Excluir</button>
                   </div>
                 </div>
               )) : (
                 <p className="p-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Nenhum doador listado ainda.</p>
               )}
            </div>
          </div>

          <button onClick={handleSaveForm} className="w-full bg-[#24CA68] text-white py-5 rounded-2xl font-black text-xl shadow-lg hover:brightness-105 transition-all">Salvar Todas Alterações</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map(camp => (
            <div key={camp.id} className={`bg-white border-2 rounded-3xl p-6 space-y-4 shadow-sm transition-all ${camp.isActive ? 'border-[#24CA68] ring-4 ring-green-50' : 'border-gray-100 hover:border-gray-200'}`}>
              <div className="flex justify-between items-start">
                <h3 className="font-black truncate text-gray-800 text-lg w-3/4">{camp.title}</h3>
                {camp.isActive && <span className="bg-[#24CA68] text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">Ativa</span>}
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 bg-gray-50 p-2 rounded-lg">
                 <span>GATEWAY: {camp.gateway.toUpperCase()}</span>
                 <span className="text-[#24CA68]">ARRECADADO: R$ {camp.currentAmount.toLocaleString('pt-BR')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button onClick={() => onViewCampaign?.(camp)} className="col-span-2 bg-[#EEFFE6] text-[#24CA68] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#e4f9da] transition-colors border border-[#24CA68]/20">Visualizar Site</button>
                <button onClick={() => handleCopyLink(camp)} className="col-span-2 bg-blue-50 text-blue-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors border border-blue-200">🔗 Copiar Link de Divulgação</button>
                <button onClick={() => handleEdit(camp)} className="bg-gray-50 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors">Configurar</button>
                <button onClick={() => handleSetActive(camp.id)} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all ${camp.isActive ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-[#24CA68] text-white'}`}>
                  {camp.isActive ? 'Desativar' : 'Ativar'}
                </button>
              </div>
              <div className="flex justify-end pt-2 border-t border-gray-50">
                <button onClick={() => handleDelete(camp.id)} className="p-2 text-red-300 hover:text-red-500 transition-colors text-xs uppercase font-black tracking-widest">Excluir Campanha</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

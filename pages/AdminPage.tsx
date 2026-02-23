
import React, { useState, useEffect } from 'react';
import { DonationConfig, Supporter, PaymentGateway } from '../types';
import { saveCampaigns, getStoredCampaigns } from '../constants';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

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
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [showCloudGuide, setShowCloudGuide] = useState(false);
  
  const [newSupporter, setNewSupporter] = useState<Partial<Supporter>>({
    name: '',
    amount: 0,
    comment: '',
    time: 'há instantes',
    avatarColor: '#F5F5F5'
  });
  const [editingSupporterId, setEditingSupporterId] = useState<string | null>(null);

  useEffect(() => {
    if (db) {
      try {
        const unsub = onSnapshot(collection(db, 'campaigns'), 
          (snapshot) => {
            setIsCloudSyncing(true);
            if (!snapshot.empty) {
              const camps: DonationConfig[] = [];
              snapshot.forEach(doc => camps.push(doc.data() as DonationConfig));
              setCampaigns(camps);
              saveCampaigns(camps);
            }
          }, 
          (error) => {
            console.warn("Firestore bloqueado ou offline:", error);
            setIsCloudSyncing(false);
          }
        );
        return () => unsub();
      } catch (e) {
        setIsCloudSyncing(false);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.user === 'stuuck' && loginData.pass === 'stuuck77') {
      setIsLoggedIn(true);
    } else {
      alert('Credenciais incorretas!');
    }
  };

  const syncLocalToCloud = async () => {
    if (!db) return;
    try {
      const btn = document.getElementById('sync-btn');
      if (btn) btn.innerText = "Sincronizando...";
      for (const camp of campaigns) {
        await setDoc(doc(db, 'campaigns', camp.id), camp);
      }
      setIsCloudSyncing(true);
      alert("✅ Sincronizado com sucesso!");
      if (btn) btn.innerText = "Nuvem Ativa";
    } catch (e) {
      setShowCloudGuide(true);
    }
  };

  const handleCreateNew = () => {
    const newCamp: DonationConfig = {
      id: `camp-${Date.now()}`,
      campaignId: Math.floor(100000 + Math.random() * 900000).toString(),
      mainImage: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1000',
      logoUrl: 'https://imgur.com/iXfnbqR.png',
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
      presetAmounts: [30, 50, 100, 200],
      minAmount: 5,
      upsells: [
        { id: 'transporte', label: 'Auxílio transporte', value: 10.00, icon: '🚗' },
        { id: 'medicacao', label: 'Ajuda com medicações', value: 25.00, icon: '💊' },
        { id: 'cesta', label: 'Doar cesta básica', value: 85.00, icon: '🧺' },
      ],
      isActive: false,
      supporters: [],
      gateway: 'pagbank',
      stripeConfig: { publicKey: '', isTestMode: true },
      mercadopagoConfig: { publicKey: '' },
      asaasConfig: { apiKey: '' },
      pixupConfig: { apiKey: '' },
      stoneConfig: { apiKey: '' },
      braipConfig: { token: '', checkoutCode: '' },
      pagbankConfig: { token: '' },
      metaPixelId: '',
      metaAccessToken: ''
    };
    setEditingId(newCamp.id);
    setFormData(newCamp);
  };

  const handleEdit = (camp: DonationConfig) => {
    setEditingId(camp.id);
    setFormData({ ...camp });
  };

  const handleSaveForm = async () => {
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

    if (db && (isCloudSyncing || !exists)) {
      try {
        await setDoc(doc(db, 'campaigns', formData.id), formData);
      } catch (e) {
        console.warn("Salvando apenas localmente.");
      }
    }

    setEditingId(null);
    setFormData(null);
    onUpdate();
    alert('Configurações salvas!');
  };

  const handleSetActive = async (id: string) => {
    // Alterado para permitir múltiplas campanhas ativas ao mesmo tempo
    const updated = campaigns.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c);
    setCampaigns(updated);
    saveCampaigns(updated);
    if (db && isCloudSyncing) {
      try { 
        // Sincroniza apenas a campanha que foi alterada no Firebase para performance
        const target = updated.find(c => c.id === id);
        if (target) {
          await setDoc(doc(db, 'campaigns', target.id), target);
        }
      } catch (e) {}
    }
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir esta campanha?')) {
      const updated = campaigns.filter(c => c.id !== id);
      setCampaigns(updated);
      saveCampaigns(updated);
      if (db && isCloudSyncing) { try { await deleteDoc(doc(db, 'campaigns', id)); } catch (e) {} }
      onUpdate();
    }
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

  const startEditSupporter = (s: Supporter) => {
    setNewSupporter({ ...s });
    setEditingSupporterId(s.id);
    // Scroll suave para o formulário de doadores
    document.getElementById('doadores-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md space-y-6 border border-gray-100">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black text-gray-800 tracking-tighter">Área do Organizador</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Acesso Restrito</p>
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
      {/* Alerta de Sincronização */}
      {!isCloudSyncing && (
        <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-3xl mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
             <h3 className="font-black text-orange-800">Sincronize com o seu Firebase</h3>
             <p className="text-orange-700 text-sm">Clique abaixo para enviar suas campanhas para o banco de dados online.</p>
             <button onClick={() => setShowCloudGuide(!showCloudGuide)} className="text-[10px] font-bold text-orange-600 underline uppercase">Ver guia de regras</button>
          </div>
          <button id="sync-btn" onClick={syncLocalToCloud} className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg">Sincronizar Agora</button>
        </div>
      )}

      {showCloudGuide && (
        <div className="bg-white border-2 border-[#24CA68] p-8 rounded-3xl mb-10 animate-slide-up">
           <h3 className="font-black text-gray-800 mb-2">Configure as Regras do Firestore:</h3>
           <p className="text-xs text-gray-500 mb-4">Acesse a aba 'Regras' no seu painel Firebase e cole:</p>
           <pre className="bg-gray-100 p-4 rounded-lg text-[10px] font-mono overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
           </pre>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
           </button>
           <div>
              <h1 className="text-3xl font-black text-gray-800 tracking-tighter">Painel</h1>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isCloudSyncing ? 'text-green-500' : 'text-gray-400'}`}>
                {isCloudSyncing ? '● Sincronizado' : '○ Offline'}
              </span>
           </div>
        </div>
        <button onClick={handleCreateNew} className="bg-[#24CA68] text-white px-8 py-3 rounded-xl font-bold shadow-lg">+ Criar Campanha</button>
      </div>

      {editingId && formData ? (
        <div className="bg-white rounded-3xl border shadow-xl p-8 space-y-10 animate-slide-up">
          <div className="flex justify-between items-center border-b pb-4">
             <h2 className="text-xl font-black text-gray-800 tracking-tight">Configurando: {formData.title}</h2>
             <button onClick={() => setEditingId(null)} className="text-red-500 font-bold hover:underline">Fechar</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* COLUNA 1: GERAL */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-[#24CA68] rounded-full"></span> Informações Básicas
              </h3>
              <div className="space-y-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Título Principal</span>
                  <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Subtítulo (Opcional)</span>
                  <input value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Categoria</span>
                  <input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Descrição Completa</span>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={5} className="w-full border p-3 rounded-lg bg-white outline-none focus:border-[#24CA68]" />
                </div>
              </div>
            </div>

            {/* COLUNA 2: VISUAL E PESSOAS */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-[#24CA68] rounded-full"></span> Identidade e Criadores
              </h3>
              <div className="space-y-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">URL Imagem Capa</span>
                  <input value={formData.mainImage} onChange={e => setFormData({...formData, mainImage: e.target.value})} className="w-full border p-3 rounded-lg bg-white" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">URL Logo (Topo)</span>
                  <input value={formData.logoUrl || ''} onChange={e => setFormData({...formData, logoUrl: e.target.value})} className="w-full border p-3 rounded-lg bg-white" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Nome do Criador</span>
                  <input value={formData.creatorName} onChange={e => setFormData({...formData, creatorName: e.target.value})} className="w-full border p-3 rounded-lg bg-white" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Ativo desde (Data)</span>
                  <input value={formData.creatorSince} onChange={e => setFormData({...formData, creatorSince: e.target.value})} className="w-full border p-3 rounded-lg bg-white" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Beneficiário (Nome)</span>
                  <input value={formData.beneficiaryName} onChange={e => setFormData({...formData, beneficiaryName: e.target.value})} className="w-full border p-3 rounded-lg bg-white" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Título Tópico (Sobre)</span>
                  <input value={formData.topicTitle} onChange={e => setFormData({...formData, topicTitle: e.target.value})} className="w-full border p-3 rounded-lg bg-white" />
                </div>
              </div>
            </div>

            {/* COLUNA 3: FINANCEIRO E MARKETING */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-[#24CA68] rounded-full"></span> Financeiro e Tracking
              </h3>
              <div className="space-y-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Meta R$</span>
                    <input type="number" value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: parseFloat(e.target.value)})} className="w-full border p-3 rounded-lg bg-white" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Arrecadado R$</span>
                    <input type="number" value={formData.currentAmount} onChange={e => setFormData({...formData, currentAmount: parseFloat(e.target.value)})} className="w-full border p-3 rounded-lg bg-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Corações</span>
                    <input type="number" value={formData.heartsCount} onChange={e => setFormData({...formData, heartsCount: parseInt(e.target.value)})} className="w-full border p-3 rounded-lg bg-white" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Apoiadores</span>
                    <input type="number" value={formData.supportersCount} onChange={e => setFormData({...formData, supportersCount: parseInt(e.target.value)})} className="w-full border p-3 rounded-lg bg-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Valores Sugeridos (Separe por vírgula)</span>
                  <input 
                    value={formData.presetAmounts.join(', ')} 
                    onChange={e => setFormData({...formData, presetAmounts: e.target.value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))})} 
                    className="w-full border p-3 rounded-lg bg-white" 
                  />
                </div>
                <div className="space-y-1 border-t pt-3">
                  <span className="text-[10px] font-black text-[#24CA68] uppercase">Gateway</span>
                  <select value={formData.gateway} onChange={e => setFormData({...formData, gateway: e.target.value as PaymentGateway})} className="w-full p-3 rounded-lg border font-bold">
                    <option value="pagbank">PagBank</option>
                    <option value="braip">Braip</option>
                    <option value="pixup">PixUp</option>
                    <option value="asaas">Asaas</option>
                    <option value="stone">Stone (Pagar.me)</option>
                    <option value="mercadopago">Mercado Pago</option>
                    <option value="stripe">Stripe</option>
                  </select>
                </div>

                <div className="space-y-1 border-t pt-3">
                  <span className="text-[10px] font-black text-[#24CA68] uppercase">Braip Checkout Code</span>
                  <input value={formData.braipConfig?.checkoutCode || ''} onChange={e => setFormData({...formData, braipConfig: { ...formData.braipConfig, checkoutCode: e.target.value }})} className="w-full border p-3 rounded-lg bg-white" />
                </div>

                <div className="space-y-1 border-t pt-3">
                  <span className="text-[10px] font-black text-red-500 uppercase">Facebook Pixel ID</span>
                  <input value={formData.metaPixelId || ''} onChange={e => setFormData({...formData, metaPixelId: e.target.value})} className="w-full border p-3 rounded-lg bg-red-50/10" />
                  <span className="text-[10px] font-black text-red-500 uppercase mt-2 block">Access Token CAPI</span>
                  <input value={formData.metaAccessToken || ''} onChange={e => setFormData({...formData, metaAccessToken: e.target.value})} className="w-full border p-3 rounded-lg bg-red-50/10" />
                </div>
              </div>
            </div>
          </div>

          {/* DOADORES MANUAIS */}
          <div className="pt-8 border-t" id="doadores-form">
            <h3 className="text-sm font-black text-gray-800 mb-6 uppercase tracking-widest">Lista de Doadores Fakes / Reais</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 bg-gray-50 p-6 rounded-2xl border">
              <input placeholder="Nome" value={newSupporter.name} onChange={e => setNewSupporter({...newSupporter, name: e.target.value})} className="border p-3 rounded-lg" />
              <input type="number" placeholder="Valor" value={newSupporter.amount} onChange={e => setNewSupporter({...newSupporter, amount: parseFloat(e.target.value)})} className="border p-3 rounded-lg" />
              <input placeholder="Tempo (ex: há 2h)" value={newSupporter.time} onChange={e => setNewSupporter({...newSupporter, time: e.target.value})} className="border p-3 rounded-lg" />
              <input placeholder="Mensagem personalizada" value={newSupporter.comment} onChange={e => setNewSupporter({...newSupporter, comment: e.target.value})} className="border p-3 rounded-lg" />
              <div className="flex gap-2">
                <button onClick={addSupporter} className={`${editingSupporterId ? 'bg-[#24CA68]' : 'bg-black'} text-white rounded-lg font-bold h-[50px] flex-grow text-xs uppercase tracking-tighter`}>
                  {editingSupporterId ? 'Salvar Alteração' : 'Adicionar'}
                </button>
                {editingSupporterId && (
                   <button onClick={() => { setEditingSupporterId(null); setNewSupporter({ name: '', amount: 0, comment: '', time: 'há instantes', avatarColor: '#F5F5F5' }); }} className="bg-gray-200 text-gray-600 rounded-lg font-bold px-3 h-[50px] text-xs">X</button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData.supporters.map(s => (
                <div key={s.id} className="flex flex-col p-4 border rounded-xl bg-white shadow-sm gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-800">{s.name}</span>
                      <span className="text-[10px] font-bold text-[#24CA68]">R$ {s.amount.toFixed(2)} • {s.time}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditSupporter(s)} className="text-[#24CA68] hover:text-green-700 font-bold text-[10px] uppercase">Editar</button>
                      <button onClick={() => setFormData({...formData, supporters: formData.supporters.filter(i => i.id !== s.id)})} className="text-red-400 hover:text-red-600 font-bold text-[10px] uppercase">Remover</button>
                    </div>
                  </div>
                  {s.comment && (
                    <p className="text-[10px] text-gray-500 italic bg-gray-50 p-2 rounded-lg">"{s.comment}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-10 border-t flex justify-end gap-4">
             <button onClick={() => setEditingId(null)} className="px-8 py-4 font-bold text-gray-400 hover:text-gray-600">Cancelar</button>
             <button onClick={handleSaveForm} className="bg-[#24CA68] text-white px-16 py-4 rounded-2xl font-black shadow-xl uppercase tracking-widest text-sm active:scale-95 transition-all">Salvar Configurações</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {campaigns.map(camp => (
            <div key={camp.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${camp.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {camp.isActive ? 'Ativa no Site' : 'Inativa'}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => handleEdit(camp)} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-200">✏️</button>
                   <button onClick={() => handleDelete(camp.id)} className="p-2 bg-red-50 rounded-lg hover:bg-red-100 text-red-500">🗑️</button>
                </div>
              </div>
              <h3 className="font-black text-gray-800 text-lg mb-1 truncate">{camp.title}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-6 tracking-tighter">ID Único: {camp.campaignId}</p>
              
              <div className="bg-gray-50 p-4 rounded-2xl mb-6">
                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase mb-2">
                   <span>Arrecadação</span>
                   <span>{((camp.currentAmount / (camp.targetAmount || 1)) * 100).toFixed(0)}%</span>
                </div>
                <div className="text-xl font-black text-[#24CA68]">R$ {camp.currentAmount.toLocaleString('pt-BR')}</div>
              </div>

              <div className="space-y-2">
                <button onClick={() => handleSetActive(camp.id)} className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${camp.isActive ? 'bg-gray-100 text-gray-400' : 'bg-[#24CA68] text-white shadow-lg'}`}>
                  {camp.isActive ? 'Desativar Campanha' : 'Ativar Agora'}
                </button>
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/c/${camp.campaignId}`); alert('Link de divulgação copiado!'); }} className="bg-blue-50 text-blue-500 py-3 rounded-xl text-[10px] font-black uppercase">Link Direto</button>
                   <button onClick={() => onViewCampaign && onViewCampaign(camp)} className="bg-black text-white py-3 rounded-xl text-[10px] font-black uppercase">Ver Página</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

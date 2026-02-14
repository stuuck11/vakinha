
import React, { useState, useEffect } from 'react';
import { DonationConfig, Supporter, PaymentGateway } from '../types';
import { saveCampaigns, getStoredCampaigns } from '../constants';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, getDocs } from 'firebase/firestore';

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

  // Função para subir os dados locais para o Firebase vazio do print
  const syncLocalToCloud = async () => {
    if (!db) {
      alert("Erro: Firebase não inicializado corretamente.");
      return;
    }
    
    try {
      const btn = document.getElementById('sync-btn');
      if (btn) btn.innerText = "Sincronizando...";
      
      for (const camp of campaigns) {
        await setDoc(doc(db, 'campaigns', camp.id), camp);
      }
      
      setIsCloudSyncing(true);
      alert("✅ Sincronizado! Agora os dados aparecerão naquela tela do seu print do Firebase.");
      if (btn) btn.innerText = "Nuvem Ativa";
    } catch (e) {
      console.error(e);
      alert("❌ Erro de permissão! Você precisa ir na aba 'REGRAS' do Firebase e permitir leitura/escrita.");
      setShowCloudGuide(true);
    }
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

    if (db && isCloudSyncing) {
      try {
        await setDoc(doc(db, 'campaigns', formData.id), formData);
      } catch (e) {
        console.warn("Falha ao salvar na nuvem, salvo apenas localmente.");
      }
    }

    setEditingId(null);
    setFormData(null);
    onUpdate();
  };

  // ... (outros handlers idênticos ao anterior para manter brevidade)
  const handleEdit = (camp: DonationConfig) => { setEditingId(camp.id); setFormData({ ...camp }); };
  const handleSetActive = async (id: string) => {
    const updated = campaigns.map(c => c.id === id ? { ...c, isActive: !c.isActive } : { ...c, isActive: false });
    setCampaigns(updated);
    saveCampaigns(updated);
    if (db && isCloudSyncing) {
      try { for (const camp of updated) { await setDoc(doc(db, 'campaigns', camp.id), camp); } } catch (e) {}
    }
    onUpdate();
  };
  const handleDelete = async (id: string) => {
    if (confirm('Excluir?')) {
      const updated = campaigns.filter(c => c.id !== id);
      setCampaigns(updated);
      saveCampaigns(updated);
      if (db && isCloudSyncing) { try { await deleteDoc(doc(db, 'campaigns', id)); } catch (e) {} }
      onUpdate();
    }
  };
  const handleCreateNew = () => {
     const newCamp: DonationConfig = {
      id: `camp-${Date.now()}`,
      campaignId: Math.floor(100000 + Math.random() * 900000).toString(),
      mainImage: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1000',
      logoUrl: 'https://imgur.com/iXfnbqR.png',
      sealIcon: 'https://imgur.com/39baGGf.png',
      category: 'Saúde', title: 'Nova Campanha', subtitle: '', description: '',
      targetAmount: 1000, currentAmount: 0, heartsCount: 0, supportersCount: 0,
      creatorName: 'Admin', creatorSince: '2024', beneficiaryName: 'Beneficiário', topicTitle: 'Ajude',
      presetAmounts: [30, 50, 100], minAmount: 5, upsells: [], isActive: false, supporters: [],
      gateway: 'pixup', stripeConfig: { publicKey: '', isTestMode: true }, mercadopagoConfig: { publicKey: '' },
      asaasConfig: { apiKey: '' }, pixupConfig: { apiKey: '' }
    };
    setEditingId(newCamp.id);
    setFormData(newCamp);
  };
  const addSupporter = () => {
    if (!formData || !newSupporter.name) return;
    const s: Supporter = { id: editingSupporterId || `s-${Date.now()}`, name: newSupporter.name, amount: newSupporter.amount || 0, comment: newSupporter.comment || '', time: newSupporter.time || 'há instantes', avatarColor: '#F5F5F5' };
    if (editingSupporterId) { setFormData({ ...formData, supporters: formData.supporters.map(i => i.id === editingSupporterId ? s : i) }); setEditingSupporterId(null);
    } else { setFormData({ ...formData, supporters: [s, ...formData.supporters] }); }
    setNewSupporter({ name: '', amount: 0, comment: '', time: 'há instantes' });
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
          <button className="w-full bg-[#24CA68] text-white py-4 rounded-xl font-black shadow-lg transition-transform active:scale-95 uppercase tracking-widest text-xs">Acessar Painel</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 pb-32">
      {/* Alerta de Sincronização e Regras */}
      {!isCloudSyncing && (
        <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-3xl mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
             <h3 className="font-black text-orange-800">Sincronize com o seu Firebase (Grátis)</h3>
             <p className="text-orange-700 text-sm leading-relaxed">
               Vimos que seu banco de dados está pronto mas vazio. Clique no botão ao lado para enviar suas campanhas para a nuvem.
             </p>
             <button onClick={() => setShowCloudGuide(!showCloudGuide)} className="text-xs font-bold text-orange-600 underline">Como configurar as regras de segurança?</button>
          </div>
          <button id="sync-btn" onClick={syncLocalToCloud} className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-orange-600 transition-colors whitespace-nowrap">
            Sincronizar Agora
          </button>
        </div>
      )}

      {showCloudGuide && (
        <div className="bg-white border-2 border-[#24CA68] p-8 rounded-3xl mb-10 animate-slide-up">
           <h3 className="font-black text-gray-800 mb-4">Passo a passo para liberar o Banco de Dados Grátis:</h3>
           <ol className="text-sm text-gray-600 space-y-3 list-decimal list-inside">
             <li>No seu print do Firebase, clique na aba <strong>Regras</strong> (ao lado de 'Dados').</li>
             <li>Apague tudo o que estiver lá e cole este código:
               <pre className="bg-gray-100 p-4 rounded-lg mt-2 text-[10px] font-mono overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
               </pre>
             </li>
             <li>Clique no botão azul <strong>Publicar</strong>.</li>
             <li>Pronto! Agora clique no botão laranja de Sincronizar acima.</li>
           </ol>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
           </button>
           <div>
             <h1 className="text-3xl font-black text-gray-800 tracking-tighter">Painel de Controle</h1>
             <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isCloudSyncing ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {isCloudSyncing ? 'Conectado à Nuvem (Firebase Spark)' : 'Trabalhando Offline (Salvo no Navegador)'}
                </span>
             </div>
           </div>
        </div>
        <button onClick={handleCreateNew} className="bg-[#24CA68] text-white px-8 py-3 rounded-xl font-bold shadow-lg">+ Criar Campanha</button>
      </div>

      {editingId && formData ? (
        <div className="bg-white rounded-3xl border shadow-xl p-8 space-y-8 animate-slide-up">
          <div className="flex justify-between items-center border-b pb-4">
             <h2 className="text-xl font-black text-gray-800">Editando: {formData.title}</h2>
             <button onClick={() => setEditingId(null)} className="text-red-500 font-bold hover:underline">Fechar</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Informações da Causa</label>
              <div className="space-y-4 p-5 bg-gray-50/30 rounded-2xl border border-gray-100">
                <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Título" className="w-full border p-3 rounded-lg bg-white" />
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Descrição detalhada..." rows={6} className="w-full border p-3 rounded-lg bg-white" />
                <input value={formData.mainImage} onChange={e => setFormData({...formData, mainImage: e.target.value})} placeholder="URL da Imagem Principal" className="w-full border p-3 rounded-lg bg-white" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Meta R$</span>
                    <input type="number" value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: parseFloat(e.target.value)})} className="w-full border p-3 rounded-lg bg-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Já Arrecadado R$</span>
                    <input type="number" value={formData.currentAmount} onChange={e => setFormData({...formData, currentAmount: parseFloat(e.target.value)})} className="w-full border p-3 rounded-lg bg-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Configurações Técnicas</label>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Gateway de Pagamento</span>
                <select value={formData.gateway} onChange={e => setFormData({...formData, gateway: e.target.value as PaymentGateway})} className="w-full p-4 rounded-xl border border-gray-200 font-bold bg-gray-50">
                  <option value="pixup">PixUp</option>
                  <option value="asaas">Asaas</option>
                  <option value="mercadopago">Mercado Pago</option>
                  <option value="stripe">Stripe</option>
                </select>

                <input value={formData.metaPixelId || ''} onChange={e => setFormData({...formData, metaPixelId: e.target.value})} placeholder="ID do Pixel Facebook" className="w-full border p-3 rounded-lg" />
                <input value={formData.metaAccessToken || ''} onChange={e => setFormData({...formData, metaAccessToken: e.target.value})} placeholder="Token CAPI" className="w-full border p-3 rounded-lg" />
              </div>

              <div className="p-6 bg-[#EEFFE6] rounded-3xl border border-[#24CA68]/10">
                 <h4 className="text-xs font-black text-[#24CA68] uppercase mb-2">Simular Doadores</h4>
                 <div className="grid grid-cols-2 gap-2 mb-3">
                    <input placeholder="Nome" value={newSupporter.name} onChange={e => setNewSupporter({...newSupporter, name: e.target.value})} className="border p-2 rounded-lg text-xs" />
                    <input type="number" placeholder="Valor" value={newSupporter.amount} onChange={e => setNewSupporter({...newSupporter, amount: parseFloat(e.target.value)})} className="border p-2 rounded-lg text-xs" />
                 </div>
                 <button onClick={addSupporter} className="w-full bg-[#24CA68] text-white py-2 rounded-lg font-bold text-xs uppercase">Adicionar à Lista</button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t flex justify-end gap-4">
             <button onClick={handleSaveForm} className="bg-[#24CA68] text-white px-12 py-4 rounded-xl font-black shadow-lg uppercase text-sm active:scale-95 transition-all">Salvar Tudo</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map(camp => (
            <div key={camp.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${camp.isActive ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-400'}`}>
                  {camp.isActive ? 'Em Exibição' : 'Inativa'}
                </div>
                <div className="flex gap-2">
                   <button onClick={() => handleEdit(camp)} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100">✏️</button>
                   <button onClick={() => handleDelete(camp.id)} className="p-2 bg-red-50 rounded-lg hover:bg-red-100">🗑️</button>
                </div>
              </div>
              <h3 className="font-black text-gray-800 truncate mb-1">{camp.title}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-4">ID: {camp.campaignId}</p>
              
              <div className="bg-gray-50 p-4 rounded-xl mb-6">
                <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase mb-1">
                   <span>Arrecadado</span>
                   <span>{((camp.currentAmount / camp.targetAmount) * 100).toFixed(0)}%</span>
                </div>
                <div className="text-lg font-black text-[#24CA68]">R$ {camp.currentAmount.toFixed(2)}</div>
              </div>

              <div className="space-y-2">
                <button onClick={() => handleSetActive(camp.id)} className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${camp.isActive ? 'bg-gray-100 text-gray-500' : 'bg-[#24CA68] text-white shadow-lg shadow-green-100'}`}>
                  {camp.isActive ? 'Desativar' : 'Ativar Agora'}
                </button>
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/c/${camp.campaignId}`); alert('Link copiado!'); }} className="bg-blue-50 text-blue-500 py-3 rounded-xl text-[10px] font-black uppercase">Copiar Link</button>
                   <button onClick={() => onViewCampaign && onViewCampaign(camp)} className="bg-black text-white py-3 rounded-xl text-[10px] font-black uppercase">Visualizar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

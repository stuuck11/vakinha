
import React, { useState, useEffect } from 'react';
import { Page, DonationConfig } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ContributionPage } from './pages/ContributionPage';
import { AdminPage } from './pages/AdminPage';
import { StickyDonateButton } from './components/StickyDonateButton';
import { getActiveCampaign, getCampaignByCid, saveCampaigns } from './constants';
import { db } from './firebase';
import { collection, onSnapshot, QuerySnapshot, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

const App: React.FC = () => {
  // Inicialização imediata para evitar flicker de logos diferentes
  const getInitialConfig = () => {
    const path = window.location.pathname;
    if (path.startsWith('/c/') || path.startsWith('/p/')) {
      const cid = path.substring(3).split('?')[0];
      return getCampaignByCid(cid) || getActiveCampaign();
    }
    return getActiveCampaign();
  };

  const [currentPage, setCurrentPage] = useState<Page>(Page.Admin); 
  const [config, setConfig] = useState<DonationConfig>(getInitialConfig());
  const [allCampaigns, setAllCampaigns] = useState<DonationConfig[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Timeout de segurança para evitar tela branca infinita se o Firestore demorar
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 4000); // 4 segundos de limite para o carregamento inicial
    return () => clearTimeout(timer);
  }, []);

  // Listener em tempo real para o Firebase com tratamento de erro robusto
  useEffect(() => {
    try {
      if (!db) {
        setIsInitialLoading(false);
        return;
      }

      const unsub = onSnapshot(
        collection(db, 'campaigns'),
        (snapshot: QuerySnapshot<DocumentData>) => {
          const camps: DonationConfig[] = [];
          snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data() as any;
            
            // Migração/Correção de Logo: Se for a logo antiga ou estiver vazia, usa a nova padrão
            let currentLogo = data.logoUrl;
            if (!currentLogo || currentLogo === 'https://imgur.com/iXfnbqR.png') {
              currentLogo = 'https://i.imgur.com/RbZQZ66.png';
            }

            const campWithUpsells = { 
              ...data,
              logoUrl: currentLogo,
              upsells: data.upsells && data.upsells.length > 0 ? data.upsells : [
                { id: 'transporte', label: 'Auxílio transporte', value: 10.00, icon: '🚗' },
                { id: 'medicacao', label: 'Ajuda com medicações', value: 25.00, icon: '💊' },
                { id: 'cesta', label: 'Doar cesta básica', value: 85.00, icon: '🧺' },
              ]
            } as DonationConfig;
            camps.push(campWithUpsells);
          });
          
          if (camps.length > 0) {
            setAllCampaigns(camps);
            saveCampaigns(camps); // Sincroniza com localstorage para fallback

            // Se estivermos na home/admin, atualiza a campanha ativa
            const path = window.location.pathname;
            if (!path.startsWith('/c/') && !path.startsWith('/p/')) {
              const active = camps.find(c => c.isActive) || camps[0];
              setConfig(active);
            } else {
              // Se estiver em uma campanha específica, atualiza os dados dela se ela mudou
              const cid = path.split('/')[2];
              const current = camps.find(c => c.campaignId === cid || c.id === cid);
              if (current) setConfig(current);
            }
          }
          setIsInitialLoading(false);
        },
        (error) => {
          console.error("Erro no Firestore (Database possivelmente não criada):", error);
          console.warn("Utilizando dados do LocalStorage como fallback.");
          setIsInitialLoading(false);
        }
      );
      return () => unsub();
    } catch (e) {
      console.error("Falha ao iniciar listener do Firestore:", e);
      setIsInitialLoading(false);
    }
  }, []);

  // Inicializa o Pixel quando a config mudar e reseta travas de eventos
  useEffect(() => {
    if (config.metaPixelId && (window as any).fbq) {
      (window as any).fbq('init', config.metaPixelId);
      (window as any).fbq('track', 'PageView');
      
      // Reseta travas globais para a nova configuração/pixel
      (window as any).viewContentTracked = false;
      (window as any).initiateCheckoutTracked = false;
      (window as any).addPaymentInfoTracked = false;
      (window as any).purchaseTracked = false;
    }
  }, [config.metaPixelId]);

  useEffect(() => {
    const handleRoute = () => {
      const path = window.location.pathname;
      
      // Redirecionamento da homepage conforme solicitado
      if (path === '/' || path === '') {
        window.location.href = 'https://www.vakinha.com.br/';
        return;
      }

      if (path.startsWith('/c/')) {
        const cid = path.substring(3).split('?')[0];
        const camp = getCampaignByCid(cid);
        if (camp) {
          setConfig(camp);
          setCurrentPage(Page.Admin); 
        } else {
          pushRoute('/', true);
        }
      } 
      else if (path.startsWith('/p/')) {
        const cid = path.substring(3).split('?')[0];
        const camp = getCampaignByCid(cid);
        if (camp) {
          setConfig(camp);
          setCurrentPage(Page.Contribution);
        } else {
          pushRoute('/', true);
        }
      }
      else if (path === '/login' || path === '/admin-panel') {
        setCurrentPage(Page.Home);
      } else {
        const active = getActiveCampaign();
        setConfig(active);
        setCurrentPage(Page.Admin);
      }
      
      // PageView removido daqui para evitar duplicidade com o useEffect de config
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  const refreshConfig = () => {
    setConfig(getActiveCampaign());
  };

  const pushRoute = (path: string, replace = false) => {
    try {
      if (replace) {
        window.history.replaceState({}, '', path);
      } else {
        window.history.pushState({}, '', path);
      }
    } catch (e) {
      console.warn("Aviso de navegação", e);
    }
    window.dispatchEvent(new Event('popstate'));
    window.scrollTo(0, 0);
  };

  const navigateToDonate = () => {
    pushRoute(`/p/${config.campaignId}`);
  };

  const navigateToAdmin = () => {
    pushRoute('/login');
  };

  const handleViewCampaign = (selectedConfig: DonationConfig) => {
    setConfig(selectedConfig);
    pushRoute(`/c/${selectedConfig.campaignId}`);
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#24CA68] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD]">
      {currentPage !== Page.Home && (
        <Header onDonateClick={navigateToDonate} config={config} />
      )}
      
      <main className="flex-grow">
        {currentPage === Page.Home && (
          <AdminPage 
            onUpdate={refreshConfig} 
            onBack={() => pushRoute('/')} 
            onViewCampaign={handleViewCampaign} 
          />
        )}
        {currentPage === Page.Admin && (
          <HomePage onDonateClick={navigateToDonate} config={config} />
        )}
        {currentPage === Page.Contribution && (
          <ContributionPage 
            onBack={() => pushRoute(`/c/${config.campaignId}`)} 
            config={config} 
          />
        )}
      </main>

      {currentPage === Page.Admin && (
        <StickyDonateButton onClick={navigateToDonate} />
      )}

      {currentPage !== Page.Home && (
        <Footer onAdminClick={navigateToAdmin} />
      )}
    </div>
  );
};

export default App;

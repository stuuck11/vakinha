
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
      if (isInitialLoading) {
        console.warn("Timeout de carregamento atingido. Forçando exibição.");
        setIsInitialLoading(false);
      }
    }, 3000); // Reduzido para 3 segundos para melhor experiência mobile
    return () => clearTimeout(timer);
  }, [isInitialLoading]);

  // Listener em tempo real para o Firebase com tratamento de erro robusto
  useEffect(() => {
    let isMounted = true;
    try {
      if (!db) {
        setIsInitialLoading(false);
        return;
      }

      const unsub = onSnapshot(
        collection(db, 'campaigns'),
        (snapshot: QuerySnapshot<DocumentData>) => {
          if (!isMounted) return;
          const camps: DonationConfig[] = [];
          snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data() as any;
            
            // Migração/Correção de Logo
            let currentLogo = data.logoUrl;
            if (!currentLogo || currentLogo === 'https://imgur.com/iXfnbqR.png') {
              currentLogo = 'https://i.imgur.com/RbZQZ66.png';
            }

            const campWithUpsells = { 
              ...data,
              logoUrl: currentLogo,
              minAmount: 5,
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
            saveCampaigns(camps);

            const path = window.location.pathname;
            if (!path.startsWith('/c/') && !path.startsWith('/p/')) {
              const active = camps.find(c => c.isActive) || camps[0];
              setConfig(active);
            } else {
              const cid = path.split('/')[2];
              const current = camps.find(c => c.campaignId === cid || c.id === cid);
              if (current) setConfig(current);
            }
          }
          setIsInitialLoading(false);
        },
        (error) => {
          console.error("Erro no Firestore:", error);
          if (isMounted) setIsInitialLoading(false);
        }
      );
      return () => { isMounted = false; unsub(); };
    } catch (e) {
      console.error("Falha ao iniciar listener:", e);
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
      // AGUARDA o carregamento inicial antes de redirecionar para fora
      if ((path === '/' || path === '') && !isInitialLoading) {
        window.location.href = 'https://www.vakinha.com.br/';
        return;
      }

      if (path.startsWith('/c/')) {
        const cid = path.substring(3).split('?')[0];
        const camp = getCampaignByCid(cid);
        if (camp) {
          setConfig(camp);
          setCurrentPage(Page.Admin); 
        } else if (!isInitialLoading) {
          pushRoute('/', true);
        }
      } 
      else if (path.startsWith('/p/')) {
        const cid = path.substring(3).split('?')[0];
        const camp = getCampaignByCid(cid);
        if (camp) {
          setConfig(camp);
          setCurrentPage(Page.Contribution);
        } else if (!isInitialLoading) {
          pushRoute('/', true);
        }
      }
      else if (path === '/login' || path === '/admin-panel') {
        setCurrentPage(Page.Home);
      } else if (!isInitialLoading) {
        const active = getActiveCampaign();
        setConfig(active);
        setCurrentPage(Page.Admin);
      }
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, [isInitialLoading]);

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

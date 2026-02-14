
import React, { useState, useEffect } from 'react';
import { Page, DonationConfig } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ContributionPage } from './pages/ContributionPage';
import { AdminPage } from './pages/AdminPage';
import { StickyDonateButton } from './components/StickyDonateButton';
import { getActiveCampaign, getCampaignByCid } from './constants';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Admin); 
  const [config, setConfig] = useState<DonationConfig>(getActiveCampaign());

  // Inicializa o Pixel quando a config mudar
  useEffect(() => {
    if (config.metaPixelId && (window as any).fbq) {
      (window as any).fbq('init', config.metaPixelId);
      (window as any).fbq('track', 'PageView');
    }
  }, [config.metaPixelId]);

  useEffect(() => {
    const handleRoute = () => {
      const path = window.location.pathname;
      
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

      // Rastreia PageView em cada mudança de rota
      if ((window as any).fbq) {
        (window as any).fbq('track', 'PageView');
      }
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

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD]">
      {currentPage !== Page.Home && (
        <Header onDonateClick={navigateToDonate} />
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

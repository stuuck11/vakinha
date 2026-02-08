
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
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [config, setConfig] = useState<DonationConfig>(getActiveCampaign());

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      
      // Rotas Públicas: #c/ID (Home) ou #p/ID (Pagamento)
      if (hash.startsWith('#c/')) {
        const cid = hash.substring(3);
        const camp = getCampaignByCid(cid);
        if (camp) {
          setConfig(camp);
          setCurrentPage(Page.Admin); // Visualização Pública
        } else {
          window.location.hash = '';
        }
      } 
      else if (hash.startsWith('#p/')) {
        const cid = hash.substring(3);
        const camp = getCampaignByCid(cid);
        if (camp) {
          setConfig(camp);
          setCurrentPage(Page.Contribution);
        } else {
          window.location.hash = '';
        }
      }
      else if (hash === '#campaign') {
        // Legado / Compatibilidade
        setCurrentPage(Page.Admin);
      } else {
        // Dashboard Admin (Root)
        setCurrentPage(Page.Home);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const refreshConfig = () => {
    // No Dashboard, se houver mudança, recarrega
    if (currentPage === Page.Home) {
      setConfig(getActiveCampaign());
    }
  };

  const navigateToDonate = () => {
    window.location.hash = `#p/${config.campaignId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = () => {
    setCurrentPage(Page.Home);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.location.hash = '';
  };

  const handleViewCampaign = (selectedConfig: DonationConfig) => {
    setConfig(selectedConfig);
    window.location.hash = `#c/${selectedConfig.campaignId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD]">
      {currentPage !== Page.Home && <Header onDonateClick={navigateToDonate} />}
      
      <main className="flex-grow">
        {currentPage === Page.Home && (
          <AdminPage onUpdate={refreshConfig} onBack={navigateToHome} onViewCampaign={handleViewCampaign} />
        )}
        {currentPage === Page.Admin && (
          <HomePage onDonateClick={navigateToDonate} config={config} />
        )}
        {currentPage === Page.Contribution && (
          <ContributionPage onBack={() => {
            window.location.hash = `#c/${config.campaignId}`;
          }} config={config} />
        )}
      </main>

      {currentPage === Page.Admin && (
        <StickyDonateButton onClick={navigateToDonate} />
      )}

      {currentPage !== Page.Home && (
        <Footer onAdminClick={navigateToHome} />
      )}
    </div>
  );
};

export default App;

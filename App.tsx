import React, { useState, useEffect } from 'react';
import { Page, DonationConfig } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ContributionPage } from './pages/ContributionPage';
import { AdminPage } from './pages/AdminPage';
import { StickyDonateButton } from './components/StickyDonateButton';
import { getActiveCampaign } from './constants';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [config, setConfig] = useState<DonationConfig>(getActiveCampaign());

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#campaign') {
        setCurrentPage(Page.Admin); // Usando Page.Admin como slot para Visualização Pública
      } else {
        setCurrentPage(Page.Home); // Raiz agora é o Admin Login
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const refreshConfig = () => {
    // Mantém a config atual se já estiver visualizando uma específica
    if (currentPage !== Page.Admin) {
      setConfig(getActiveCampaign());
    }
  };

  const navigateToDonate = () => {
    setCurrentPage(Page.Contribution);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = () => {
    // Volta para o Painel Administrativo
    setCurrentPage(Page.Home);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.location.hash = '';
  };

  const handleViewCampaign = (selectedConfig: DonationConfig) => {
    setConfig(selectedConfig);
    setCurrentPage(Page.Admin);
    window.location.hash = 'campaign';
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
            window.location.hash = 'campaign';
            setCurrentPage(Page.Admin);
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

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

  const handleRoute = () => {
    const path = window.location.pathname;
    
    if (path.startsWith('/c/')) {
      const cid = path.substring(3).split('?')[0];
      const camp = getCampaignByCid(cid);
      if (camp) {
        setConfig(camp);
        setCurrentPage(Page.Admin);
      } else {
        window.history.pushState({}, '', '/');
        handleRoute();
      }
    } 
    else if (path.startsWith('/p/')) {
      const cid = path.substring(3).split('?')[0];
      const camp = getCampaignByCid(cid);
      if (camp) {
        setConfig(camp);
        setCurrentPage(Page.Contribution);
      } else {
        window.history.pushState({}, '', '/');
        handleRoute();
      }
    }
    else if (path === '/admin' || path === '/login') {
      setCurrentPage(Page.Home);
    }
    else {
      setConfig(getActiveCampaign());
      setCurrentPage(Page.Admin);
    }
  };

  useEffect(() => {
    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    handleRoute();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refreshConfig = () => {
    if (currentPage === Page.Home) {
      setConfig(getActiveCampaign());
    }
  };

  const navigateToDonate = () => {
    navigateTo(`/p/${config.campaignId}`);
  };

  const navigateToHome = () => {
    navigateTo('/admin');
  };

  const handleViewCampaign = (selectedConfig: DonationConfig) => {
    setConfig(selectedConfig);
    navigateTo(`/c/${selectedConfig.campaignId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD]">
      {currentPage !== Page.Home && <Header onDonateClick={navigateToDonate} />}
      
      <main className="flex-grow">
        {currentPage === Page.Home && (
          <AdminPage 
            onUpdate={refreshConfig} 
            onBack={() => navigateTo('/')} 
            onViewCampaign={handleViewCampaign} 
          />
        )}
        {currentPage === Page.Admin && (
          <HomePage onDonateClick={navigateToDonate} config={config} />
        )}
        {currentPage === Page.Contribution && (
          <ContributionPage onBack={() => {
            navigateTo(`/c/${config.campaignId}`);
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


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
      if (window.location.hash === '#admin') {
        setCurrentPage(Page.Admin);
      } else {
        setCurrentPage(Page.Home);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const refreshConfig = () => {
    setConfig(getActiveCampaign());
  };

  const navigateToDonate = () => {
    setCurrentPage(Page.Contribution);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = () => {
    setCurrentPage(Page.Home);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.location.hash = '';
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD]">
      {currentPage !== Page.Admin && <Header onDonateClick={navigateToDonate} />}
      
      <main className="flex-grow">
        {currentPage === Page.Home && (
          <HomePage onDonateClick={navigateToDonate} config={config} />
        )}
        {currentPage === Page.Contribution && (
          <ContributionPage onBack={navigateToHome} config={config} />
        )}
        {currentPage === Page.Admin && (
          <AdminPage onUpdate={refreshConfig} onBack={navigateToHome} />
        )}
      </main>

      {currentPage === Page.Home && (
        <StickyDonateButton onClick={navigateToDonate} />
      )}

      {currentPage !== Page.Admin && (
        <Footer onAdminClick={() => {
          window.location.hash = 'admin';
        }} />
      )}
    </div>
  );
};

export default App;
